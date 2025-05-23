"use client"

import { useEffect, useRef, memo } from "react"
import { Loader, Upload } from "lucide-react"
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

  useEffect(() => {
    if (svgContent) {
      // Process SVG content to fix unit issues and ensure proper scaling
      let processedSvg = svgContent;

      // Remove or fix problematic width/height with mm units
      processedSvg = processedSvg.replace(/(width|height)=\"([^\"]*?\\s*mm)\"/g, '');

      // Add styling to ensure SVGs are properly scaled and have rounded corners
      const enhancedSvgContent = processedSvg.replace('<svg ', '<svg style="shape-rendering: geometricPrecision; stroke-linejoin: round; stroke-linecap: round; max-width: 100%; max-height: 75vh; width: auto; height: auto;" ');

      if (svgContainerRef.current) {
        svgContainerRef.current.innerHTML = enhancedSvgContent;
      }
    }
  }, [svgContent])

  return (
    <>
      <div className="relative h-full">
        <div className="space-y-4 sticky top-0 max-h-screen  flex flex-col ">
          <div className="flex-1 lg:w-full  border border-gray-700 rounded-2xl overflow-hidden p-2 relative">
            <h3 className="text-lg font-medium  text-center mb-2">Vector Output</h3>
            <div className=" absolute top-2 lg:right-2 right-4  ">
              {svgContent && (
                <SvgDownloadOptions
                  svgContent={svgContent}
                  colorGroups={processedData?.colorGroups}
                  isProcessing={isProcessing}
                />
              )}
            </div>

            <div className="flex items-center justify-center">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center">
                  <Loader className="h-10 w-10 text-primary animate-spin mb-2" />
                  <p className="text-gray-300">Processing image...</p>
                </div>
              ) : svgContent ? (
                <div className="relative w-full">
                  <div ref={svgContainerRef} className="w-full flex items-center justify-center bg-[#f1f1f1] max-h-[75vh] overflow-auto rounded-lg" >
                  </div>
                  {/* TODO add a slider to zoom in and out */}
                </div>
              ) : (
                <p className="text-gray-300">Vector preview will appear here</p>
              )}
            </div>
            {processedData && (
              <div className="mb-2 text-center text-xs text-gray-300">
                {processedData.width} ×{" "}
                {processedData.height} tiles
              </div>
            )}
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
  onNewImageUpload,
  svgContentPreview
}: {
  originalImage: string
  processedData: ImageData | null
  onNewImageUpload: () => void
  svgContentPreview?: string | null
}) {
  const svgPreviewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (svgContentPreview && svgPreviewContainerRef.current) {
      // Basic styling for the mini SVG preview
      let processedMiniSvg = svgContentPreview.replace(/(width|height)=\"([^\"]*?\\s*mm)\"/g, '');
      processedMiniSvg = processedMiniSvg.replace(
        '<svg ',
        '<svg style="max-width: 100%; max-height: 100%; width: auto; height: auto; shape-rendering: geometricPrecision;" '
      );
      svgPreviewContainerRef.current.innerHTML = processedMiniSvg;
    }
  }, [svgContentPreview]);

  return (
    <div className="bg-gray-800 rounded-lg   sticky top-0 z-50  pt-12 lg:pt-0">
      <div className="flex flex-row gap-4 items-start p-4 lg:px-0 lg:pt-0">
        {/* Original Image Section */}
        <div className="flex-1 lg:w-full  border border-gray-700 rounded-2xl overflow-hidden p-2 relative">
          <h3 className="text-base md:text-lg font-medium mb-1 md:mb-2 text-center">Original</h3>
          <div className="  absolute top-2 right-2  ">
            <Button
              onClick={onNewImageUpload}
              className="h-7 w-7 md:h-8 md:w-8 p-0 rounded-full bg-gray-700/30 hover:bg-gray-600"
              size="sm"
              title="Upload new image"
            >
              <Upload className="h-3.5 md:h-4 w-3.5 md:w-4" />
            </Button>
          </div>
          <div className="flex flex-col lg:w-full  max-h-40 items-center justify-center aspect-square bg-[#f1f1f1] rounded-xl mx-auto relative">
            <img
              src={originalImage || "/placeholder.svg"}
              alt="Original"
              className="max-w-full max-h-full object-contain p-1"
            />

          </div>
          {processedData && (
            <div className="mt-1 text-center text-xs text-gray-300">
              {processedData.originalWidth} × {processedData.originalHeight} px
            </div>
          )}

        </div>

        {/* Mini SVG Preview Section (only on mobile/when svgContentPreview is present) */}
        {svgContentPreview && (
          <div className="flex-1  lg:hidden border border-gray-700 rounded-2xl overflow-hidden p-2 relative ">
            <h3 className="text-base md:text-lg font-medium mb-1 md:mb-2 text-center">Preview</h3>
            <div ref={svgPreviewContainerRef} className="aspect-square bg-[#f1f1f1] rounded-lg overflow-hidden flex items-center justify-center max-h-40  mx-auto">
              {/* Mini SVG will be injected here */}
            </div>
            {/* Optional: Add tile info for preview if needed */}
            {processedData && (
              <div className="mt-1 text-center text-xs text-gray-300">
                {processedData.width} × {processedData.height} tiles
              </div>
            )}
          </div>
        )}
      </div>


    </div>
  )
})

export default Preview
