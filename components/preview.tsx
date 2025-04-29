"use client"

import { useEffect, useRef, memo } from "react"
import { Loader, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ImageData } from "@/lib/types"

interface PreviewProps {
  originalImage: string
  svgContent: string | null
  isProcessing: boolean
  processedData: ImageData | null
  onNewImageUpload: () => void
}

// Use memo to prevent unnecessary re-renders
const Preview = memo(function Preview({
  originalImage,
  svgContent,
  isProcessing,
  processedData,
  onNewImageUpload
}: PreviewProps) {
  const svgContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (svgContent && svgContainerRef.current) {
      svgContainerRef.current.innerHTML = svgContent
    }
  }, [svgContent])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 relative">
        <div className="bg-gray-800 rounded-lg p-4">
          <Button
            onClick={onNewImageUpload}
            className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
            variant="outline"
            size="sm"
            title="Upload new image"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-medium mb-2 text-center">Original Image</h3>
          <div className="flex items-center justify-center h-64 overflow-hidden">
            <img
              src={originalImage || "/placeholder.svg"}
              alt="Original"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          {processedData && (
            <div className="mt-2 text-center text-xs text-gray-400">
              Original: {processedData.originalWidth} × {processedData.originalHeight} px
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-4 sticky top-0 ">
          <h3 className="text-lg font-medium mb-2 text-center">Vector Output</h3>
          <div className="flex items-center justify-center   overflow-hidden">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center">
                <Loader className="h-10 w-10 text-primary animate-spin mb-2" />
                <p className="text-gray-400">Processing image...</p>
              </div>
            ) : svgContent ? (
              <div ref={svgContainerRef} className="w-full h-full flex items-center justify-center"></div>
            ) : (
              <p className="text-gray-400">Vector preview will appear here</p>
            )}
          </div>
          {processedData && (
            <div className="mt-2 text-center text-xs text-gray-400">
              Resized: {processedData.resizedWidth} × {processedData.resizedHeight} px ({processedData.width} ×{" "}
              {processedData.height} tiles)
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default Preview
