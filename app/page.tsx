"use client"

import { useState, useEffect, useRef } from "react"
import ImageUploader from "@/components/image-uploader"
import Preview, { ImageThumbnail } from "@/components/preview"
import SettingsPanel from "@/components/settings-panel"
import PathVisibilityControls from "@/components/path-visibility-controls"
import CurveControlsPanel, { DEFAULT_CURVE_CONTROLS } from "@/components/curve-controls-panel"
import { Button } from "@/components/ui/button"
import { processImage, generateSVG } from "@/lib/image-processor"
import type { ImageData, Settings } from "@/lib/types"

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
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
    curvedPaths: false, // Standardmäßig gerade Pfade verwenden
    pathDistanceThreshold: 10,
    processingMode: "posterize",
    colorsAmt: 5,
    monochromeColor: "#000000",
    visiblePaths: {},
    curveControls: DEFAULT_CURVE_CONTROLS, // Initialize with default curve controls
  })

  // Process image when it's uploaded or settings change
  useEffect(() => {
    if (originalImage && settings) {
      // Create a copy of settings without visiblePaths to prevent infinite loops
      const processingSettings = { ...settings }
      handleProcessImage(processingSettings)
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
  ])

  // Handle visibility changes separately to avoid unnecessary reprocessing
  useEffect(() => {
    if (processedData && originalImage && !isProcessing) {
      // Only regenerate SVG when visibility changes, not reprocessing the whole image
      const svg = generateSVG(processedData, { ...settings })
      setSvgContent(svg)
    }
  }, [settings.visiblePaths, processedData, originalImage, isProcessing])

  // Handle curve control changes separately
  useEffect(() => {
    if (processedData && originalImage && !isProcessing) {
      // Regenerate SVG when curve controls change or curved paths setting changes
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

  const handleImageUpload = (imageDataUrl: string) => {
    setOriginalImage(imageDataUrl)
    setIsSettingsPanelVisible(true)
  }

  const handleNewImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
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
          setOriginalImage(e.target.result)
          setIsSettingsPanelVisible(true)
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

  const handleSettingsChange = (newSettings: Partial<Settings>) => {
    // If processing mode changes, reset visiblePaths
    if (newSettings.processingMode && newSettings.processingMode !== settings.processingMode) {
      newSettings.visiblePaths = {}
    }

    setSettings({ ...settings, ...newSettings })
  }

  const handlePathVisibilityChange = (colorKey: string, visible: boolean) => {
    setSettings((prev) => ({
      ...prev,
      visiblePaths: {
        ...prev.visiblePaths,
        [colorKey]: visible,
      },
    }))
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
    setIsSettingsPanelVisible(prev => !prev);
  }

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center flex justify-between items-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Image Doodlelizer</h1> {/* Hamburger menu button for mobile - only visible when an image is present */}
          {originalImage && !isSettingsPanelVisible && (
            <div className="mb-4 flex lg:hidden justify-end">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleSettingsPanel}
                aria-label="Toggle settings panel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-menu">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </Button>
            </div>
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

        <div className={`grid grid-cols-1 ${originalImage ? 'lg:grid-cols-4' : ''} gap-6`}>
          <div className="lg:col-span-3 relative h-full">
            {!originalImage ? (
              <ImageUploader onImageUpload={handleImageUpload} />
            ) : (
              <>
                <Preview
                  originalImage={originalImage}
                  svgContent={svgContent}
                  isProcessing={isProcessing}
                  processedData={processedData}
                  onNewImageUpload={handleNewImageUpload}
                />
              </>
            )}
          </div>




          {originalImage && (
            <div className={`
              ${isSettingsPanelVisible ? 'block' : 'hidden lg:block'}
              ${isSettingsPanelVisible ? 'fixed right-0 top-0 bottom-0 w-[70%] z-50  overflow-y-auto p-4 lg:shadow-lg lg:shadow-black/50 transition-all duration-300 ease-in-out' : ''}
              lg:static lg:z-auto lg:overflow-visible lg:p-0 lg:space-y-6 lg:w-auto lg:shadow-none
            `}>
              {/* Close button - only visible on mobile */}
              {isSettingsPanelVisible && (
                <div className="flex items-center justify-end mb-4 lg:hidden border-b border-gray-700 pb-3">

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleSettingsPanel}
                    aria-label="Close settings panel"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-x">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </Button>
                </div>
              )}

              <div className="space-y-6 pb-20 md:pb-0">
                {/* Add image thumbnail preview above settings panel */}
                {originalImage && (
                  <ImageThumbnail
                    originalImage={originalImage}
                    processedData={processedData}
                    onNewImageUpload={handleNewImageUpload}
                  />
                )}

                <SettingsPanel
                  settings={settings}
                  onSettingsChange={handleSettingsChange}
                  disabled={!originalImage || isProcessing}
                />

                <CurveControlsPanel
                  settings={settings}
                  curveControls={settings.curveControls}
                  onCurveControlsChange={handleCurveControlsChange}
                  onSettingsChange={handleSettingsChange}
                  disabled={!originalImage || isProcessing}
                />

                {processedData?.colorGroups && Object.keys(processedData.colorGroups).length > 0 && (
                  <PathVisibilityControls
                    colorGroups={processedData.colorGroups}
                    visiblePaths={settings.visiblePaths}
                    onVisibilityChange={handlePathVisibilityChange}
                    disabled={isProcessing}
                  />
                )}


              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}
