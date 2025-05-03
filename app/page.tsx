"use client"

import { useState, useEffect, useRef } from "react"
import ImageUploader from "@/components/image-uploader"
import Preview from "@/components/preview"
import SettingsPanel from "@/components/settings-panel"
import PathVisibilityControls from "@/components/path-visibility-controls"
import SvgDownloadOptions from "@/components/svg-download-options"
import { Button } from "@/components/ui/button"
import { processImage, generateSVG } from "@/lib/image-processor"
import type { ImageData, Settings } from "@/lib/types"

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedData, setProcessedData] = useState<ImageData | null>(null)
  const [svgContent, setSvgContent] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
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
    invert: false,
    continuousPaths: true,
    pathDistanceThreshold: 10,
    processingMode: "posterize",
    colorsAmt: 5,
    monochromeColor: "#000000",
    visiblePaths: {},
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
    settings.invert,
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

  const handleImageUpload = (imageDataUrl: string) => {
    setOriginalImage(imageDataUrl)
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

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Image to SVG Vector Converter</h1>
          <p className="text-gray-400">
            Upload an image to convert it into a vector representation based on pixel brightness
          </p>
        </header>

        {/* Hidden file input for new image upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {!originalImage ? (
              <ImageUploader onImageUpload={handleImageUpload} />
            ) : (
              <Preview
                originalImage={originalImage}
                svgContent={svgContent}
                isProcessing={isProcessing}
                processedData={processedData}
                onNewImageUpload={handleNewImageUpload}
              />
            )}
          </div>

          <div className="space-y-6">
            <SettingsPanel
              settings={settings}
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

            {svgContent && (
              <SvgDownloadOptions
                svgContent={svgContent}
                colorGroups={processedData?.colorGroups}
                isProcessing={isProcessing}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
