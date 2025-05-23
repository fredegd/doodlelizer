"use client"

import { useState, useEffect, useRef } from "react"
import ImageUploader from "@/components/image-uploader"
import RandomImageLoader from "@/components/random-image-loader"
import Preview, { ImageThumbnail } from "@/components/preview"
import SettingsPanel from "@/components/settings-panel"
import { DEFAULT_CURVE_CONTROLS } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { processImage, generateSVG } from "@/lib/image-processor"
import type { ImageData, Settings } from "@/lib/types"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>("https://upload.wikimedia.org/wikipedia/commons/b/bd/La_Gioconda%2C_Leonardo_Da_Vinci.jpg")
  const [processedData, setProcessedData] = useState<ImageData | null>(null)
  const [svgContent, setSvgContent] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSettingsPanelVisible, setIsSettingsPanelVisible] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [settings, setSettings] = useState<Settings>({
    gridSize: 10,
    gridSizeX: 10,
    gridSizeY: 10,
    brightnessThreshold: 255,
    minDensity: 2,
    maxDensity: 5,
    rowsCount: 10,
    columnsCount: 10,
    continuousPaths: true,
    curvedPaths: false,
    pathDistanceThreshold: 10,
    processingMode: "posterize",
    colorsAmt: 5,
    monochromeColor: "#000000",
    visiblePaths: {},
    curveControls: DEFAULT_CURVE_CONTROLS,
  })
  const [showRandomImageLoader, setShowRandomImageLoader] = useState(false)

  // Process image when it's uploaded or settings change (excluding curveControls and visiblePaths)
  useEffect(() => {
    if (originalImage && settings) {
      const { curveControls, visiblePaths, ...processingSettingsForEffect } = settings;
      // console.log("Processing image due to settings change (excluding curves/visibility):");
      handleProcessImage(processingSettingsForEffect as Settings) // Cast as Settings, though it's partial
    }
  }, [
    originalImage,
    settings.gridSize,
    settings.gridSizeX,
    settings.gridSizeY,
    settings.brightnessThreshold,
    settings.minDensity,
    settings.maxDensity,
    settings.rowsCount,
    settings.columnsCount,
    settings.continuousPaths,
    settings.pathDistanceThreshold,
    settings.processingMode,
    settings.colorsAmt,
    settings.monochromeColor,
    // curveControls and visiblePaths are intentionally excluded here to prevent re-processing
    // Their changes are handled by the other useEffect hooks that only regenerate SVG
  ])

  // Handle visibility changes separately (SVG regeneration only)
  useEffect(() => {
    if (processedData && originalImage && !isProcessing) {
      // console.log("Regenerating SVG due to visiblePaths change");
      const svg = generateSVG(processedData, { ...settings })
      setSvgContent(svg)
    }
  }, [settings.visiblePaths, processedData, originalImage, isProcessing])

  // Handle curve control changes and curvedPaths toggle separately (SVG regeneration only)
  useEffect(() => {
    if (processedData && originalImage && !isProcessing) {
      // console.log("Regenerating SVG due to curveControls or curvedPaths change");
      const svg = generateSVG(processedData, { ...settings })
      setSvgContent(svg)
    }
  }, [
    settings.curveControls,
    settings.curvedPaths,
    processedData,
    originalImage,
    isProcessing
  ])

  const handleManualImageUpload = (imageDataUrl: string) => {
    setOriginalImage(imageDataUrl)
    // setIsSettingsPanelVisible(true)
    setShowRandomImageLoader(false)
  }

  const handleImageSelectedFromRandomLoader = (imageUrl: string) => {
    setOriginalImage(imageUrl)
    // setIsSettingsPanelVisible(true)
    setShowRandomImageLoader(false)
  }

  const handleCancelRandomImageLoad = () => {
    setShowRandomImageLoader(false)
  }

  const handleNewImageUpload = () => {
    setIsSettingsPanelVisible(false)
    setProcessedData(null)
    setSvgContent(null)
    setShowRandomImageLoader(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Check if file is an image
      if (!file.type.match("image.*")) {
        alert("Please select an image file")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === "string") {
          handleManualImageUpload(e.target.result)
          // Clear the input value so the same file can be selected again
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProcessImage = async (processingSettings: Settings) => {
    if (!originalImage) return

    setIsProcessing(true)
    try {
      // Process the image to get pixel data
      const imageData = await processImage(originalImage, processingSettings)

      // Initialize visibility for all color groups
      if (imageData.colorGroups) {
        const newVisiblePaths: Record<string, boolean> = {}
        Object.keys(imageData.colorGroups).forEach((colorKey) => {
          newVisiblePaths[colorKey] =
            settings.visiblePaths[colorKey] !== undefined ? settings.visiblePaths[colorKey] : true
        })

        // Only update settings if the visible paths have changed
        if (JSON.stringify(newVisiblePaths) !== JSON.stringify(settings.visiblePaths)) {
          setSettings((prev) => ({
            ...prev,
            visiblePaths: newVisiblePaths,
          }))
        }
      }

      setProcessedData(imageData)

      // Generate SVG from the processed data
      const svg = generateSVG(imageData, { ...processingSettings, visiblePaths: settings.visiblePaths })
      setSvgContent(svg)
    } catch (error) {
      console.error("Error processing image:", error)
      // Handle error state here
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSettingsChange = (newSettingsPatch: Partial<Settings>) => {
    // If processing mode changes, reset visiblePaths
    if (newSettingsPatch.processingMode && newSettingsPatch.processingMode !== settings.processingMode) {
      newSettingsPatch.visiblePaths = {}
    }

    setSettings(prevSettings => ({ ...prevSettings, ...newSettingsPatch }));

    // If colorGroups were part of the update patch, update processedData directly
    // This ensures that changes from PathVisibilitySettings' color picker are reflected.
    if (newSettingsPatch.colorGroups) {
      setProcessedData(prevProcessedData => {
        if (!prevProcessedData) {
          // This shouldn't ideally occur if colorGroups are being changed,
          // as processedData should exist. Log a warning if it does.
          console.warn("Attempted to update colorGroups on null processedData in handleSettingsChange.");
          return prevProcessedData; // or null
        }
        return {
          ...prevProcessedData,
          colorGroups: newSettingsPatch.colorGroups, // Apply the updated color groups
        };
      });
    }
  }

  const handleCurveControlsChange = (newCurveControls: Partial<typeof settings.curveControls>) => {
    setSettings((prev) => ({
      ...prev,
      curveControls: {
        ...prev.curveControls,
        ...newCurveControls
      }
    }))
  }

  const toggleSettingsPanel = () => {
    setIsSettingsPanelVisible(prev => !prev)
  }

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 md:p-4 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 h-12 text-center flex justify-between items-center fixed top-0 left-0 right-0 z-50 bg-gray-900/70 backdrop-blur rounded-lg md:p-4 p-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Squigglify</h1>
          {originalImage && !showRandomImageLoader && !isSettingsPanelVisible && (

            <Button
              // variant="ghost"
              size="icon"
              onClick={toggleSettingsPanel}
              aria-label="Toggle settings panel"
              className="h-8 w-8 p-0 rounded-full bg-gray-700 hover:bg-gray-600 lg:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-menu">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </Button>

          )}
        </header>

        {/* Hidden file input for new image upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Overlay for mobile when settings panel is open */}
        {originalImage && isSettingsPanelVisible && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={toggleSettingsPanel}
            aria-hidden="true"
          />
        )}

        <div className={`grid grid-cols-1 ${(originalImage && !showRandomImageLoader) ? 'lg:grid-cols-4' : ''} gap-6 relative`}>
          <div className={`${(originalImage && !showRandomImageLoader) ? 'lg:col-span-3' : 'col-span-1'} h-full relative`}>
            {showRandomImageLoader && (
              <div className="space-y-8">
                <RandomImageLoader
                  onImageSelected={handleImageSelectedFromRandomLoader}
                  onCancel={handleCancelRandomImageLoad}
                />
                <div className="text-center my-4 pt-4 border-t border-gray-700">
                  <p className="text-gray-400 text-sm mb-2">Alternatively, upload your own image:</p>
                  <ImageUploader onImageUpload={handleManualImageUpload} />
                </div>
              </div>
            )}

            {!showRandomImageLoader && !originalImage && (
              <ImageUploader onImageUpload={handleManualImageUpload} />
            )}

            {!showRandomImageLoader && originalImage && (
              <>
                <Preview
                  originalImage={originalImage!}
                  svgContent={svgContent}
                  isProcessing={isProcessing}
                  processedData={processedData}
                  onNewImageUpload={handleNewImageUpload}
                />
              </>
            )}
          </div>

          {/* Settings panel and its associated close button */}
          {!showRandomImageLoader && originalImage && (<>
            <div className={`
              ${isSettingsPanelVisible ? 'block' : 'hidden lg:block'}
              ${isSettingsPanelVisible ? 'fixed right-0 top-0 bottom-0 w-full  z-50  overflow-y-auto md:p-4 p-8 lg:shadow-lg lg:shadow-black/50 transition-all duration-300 ease-in-out     bg-gray-800/70 backdrop-blur rounded-lg' : ''}
              lg:static lg:z-auto lg:overflow-visible lg:p-0 lg:space-y-6 lg:w-auto lg:shadow-none no-scrollbar
            `}
            >

              <div className="space-y-6 pb-20 md:pb-0 md:mt-0 mt-8">
                {/* Add image thumbnail preview above settings panel */}
                {originalImage && (
                  <ImageThumbnail
                    originalImage={originalImage}
                    processedData={processedData}
                    onNewImageUpload={handleNewImageUpload}
                  />
                )}
                <TooltipProvider>
                  <SettingsPanel
                    settings={settings}
                    onSettingsChange={handleSettingsChange}
                    disabled={!originalImage || isProcessing}
                    curveControls={settings.curveControls}
                    onCurveControlsChange={handleCurveControlsChange}
                    processedData={processedData}
                  />
                </TooltipProvider>
              </div>
            </div>
            {/* Close button - only visible on mobile, moved outside panel scroll for correct fixed behavior */}
            {isSettingsPanelVisible && (
              <div className="fixed top-4 right-4 z-[51] lg:hidden">
                <Button
                  // variant="ghost"
                  size="icon"
                  onClick={toggleSettingsPanel}
                  aria-label="Close settings panel"
                  className="h-8 w-8 p-0 rounded-full bg-gray-700 hover:bg-gray-600"

                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-x">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </Button>
              </div>
            )}
          </>)}
        </div>
      </div>
    </main>
  )
}
