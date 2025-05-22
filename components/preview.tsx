"use client"

import { useEffect, useRef, memo, useState } from "react"
import { Loader, Upload, Maximize2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import SvgDownloadOptions from "@/components/svg-download-options"
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
  svgContent,
  isProcessing,
  processedData,
}: PreviewProps) {
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const fullscreenSvgContainerRef = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (svgContent) {
      // Process SVG content to fix unit issues and ensure proper scaling
      let processedSvg = svgContent;

      // Remove or fix problematic width/height with mm units
      processedSvg = processedSvg.replace(/(width|height)="([^"]*?\s*mm)"/g, '');

      // Add styling to ensure SVGs are properly scaled and have rounded corners
      const enhancedSvgContent = processedSvg.replace('<svg ', '<svg style="shape-rendering: geometricPrecision; stroke-linejoin: round; stroke-linecap: round; max-width: 100%; max-height: 75vh; width: auto; height: auto;" ');

      if (svgContainerRef.current) {
        svgContainerRef.current.innerHTML = enhancedSvgContent;
      }

      if (fullscreenSvgContainerRef.current && fullscreen) {
        try {
          // Create a safer version of the SVG for fullscreen mode
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(processedSvg, 'image/svg+xml');
          const svgElement = svgDoc.documentElement;

          // Remove problematic attributes if they still exist
          svgElement.removeAttribute('width');
          svgElement.removeAttribute('height');

          // Apply styles directly to the SVG element
          svgElement.setAttribute('style', 'shape-rendering: geometricPrecision; stroke-linejoin: round; stroke-linecap: round; max-width: 90%; max-height: 90%;');

          // Clear container and append the new SVG
          fullscreenSvgContainerRef.current.innerHTML = '';
          fullscreenSvgContainerRef.current.appendChild(svgElement);
          fullscreenSvgContainerRef.current.style.backgroundColor = '#f1f1f1     ';
        } catch (error) {
          console.error('Error rendering fullscreen SVG:', error);
        }
      }
    }
  }, [svgContent, fullscreen])

  return (
    <>

      {fullscreen && svgContent && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <Button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 h-10 w-10 p-0 rounded-full bg-gray-800 hover:bg-gray-700"
            size="sm"
            title="Close fullscreen"
          >
            <X className="h-5 w-5" />
          </Button>

          <div
            ref={fullscreenSvgContainerRef}
            className="w-full h-full flex items-center justify-center  p-8 overflow-y-scroll"
          >
          </div>
        </div>
      )}
      <div className="relative h-full">
        <div className="space-y-4 sticky top-12 max-h-screen  flex flex-col ">
          <div className="bg-gray-800 rounded-lg p-4 flex-1 relative">
            <div className="absolute top-2 right-2 z-10">
              {svgContent && (
                <SvgDownloadOptions
                  svgContent={svgContent}
                  colorGroups={processedData?.colorGroups}
                  isProcessing={isProcessing}
                />
              )}
            </div>
            <h3 className="text-lg font-medium  text-center">Vector Output</h3>
            {processedData && (
              <div className="mb-2 text-center text-xs text-gray-400">
                {processedData.width} ×{" "}
                {processedData.height} tiles
              </div>
            )}
            <div className="flex items-center justify-center">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center">
                  <Loader className="h-10 w-10 text-primary animate-spin mb-2" />
                  <p className="text-gray-400">Processing image...</p>
                </div>
              ) : svgContent ? (
                <div className="relative w-full">
                  <div ref={svgContainerRef} className="w-full flex items-center justify-center bg-[#f1f1f1] max-h-[75vh]" >
                  </div>
                  <Button
                    onClick={() => setFullscreen(true)}
                    className="absolute bottom-2 right-2 h-8 w-8 p-0 rounded-full bg-gray-700 hover:bg-gray-600"
                    size="sm"
                    title="Fullscreen view"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-gray-400">Vector preview will appear here</p>
              )}
            </div>
          </div>
        </div>
      </div>


    </>
  )
})

// Export the thumbnail component for use in page.tsx
export const ImageThumbnail = memo(function ImageThumbnail({
  originalImage,
  processedData,
  onNewImageUpload
}: {
  originalImage: string
  processedData: ImageData | null
  onNewImageUpload: () => void
}) {
  return (
    <div className="bg-gray-800/40 rounded-lg md:p-4 relative">
      <h3 className="text-lg font-medium mb-2 text-center">Original Image</h3>
      <div className="flex flex-col items-center justify-center">
        <img
          src={originalImage || "/placeholder.svg"}
          alt="Original"
          className="max-w-full max-h-[18vh] object-contain"
        />
        {processedData && (
          <div className="mt-2 text-center text-xs text-gray-400">
            Original: {processedData.originalWidth} × {processedData.originalHeight} px
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 absolute bottom-4 ">
        <Button
          onClick={onNewImageUpload}
          className="h-8 w-8 p-0 rounded-full bg-gray-700 hover:bg-gray-600"
          // variant="ghost"
          size="sm"
          title="Upload new image"
        >
          <Upload className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})

export default Preview
