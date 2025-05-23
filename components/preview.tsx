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
  const [zoomLevel, setZoomLevel] = useState(0.55);

  useEffect(() => {
    if (svgContent) {
      let processedSvgString = svgContent;
      processedSvgString = processedSvgString.replace(/(width|height)=\"([^\"]*?\\s*mm)\"/g, '');

      const parser = new DOMParser();

      // Main preview SVG
      if (svgContainerRef.current) {
        try {
          const svgDoc = parser.parseFromString(processedSvgString, 'image/svg+xml');
          const svgElement = svgDoc.documentElement;

          svgElement.removeAttribute('width');
          svgElement.removeAttribute('height');
          svgElement.style.cssText = `shape-rendering: geometricPrecision; stroke-linejoin: round; stroke-linecap: round; display: block; max-width: 100%; max-height: 100%; width: auto; height: auto; transform: scale(${zoomLevel}); transform-origin: center center;`;

          svgContainerRef.current.innerHTML = ''; // Clear previous content
          svgContainerRef.current.appendChild(svgElement);
        } catch (error) {
          console.error('Error rendering main preview SVG:', error);
          svgContainerRef.current.innerHTML = '<p class="text-red-500">Error rendering SVG</p>';
        }
      }
    } else {
      if (svgContainerRef.current) {
        svgContainerRef.current.innerHTML = '';
      }
    }
  }, [svgContent, zoomLevel]);

  return (
    <>
      <div className="relative h-full">
        <div className="space-y-4 sticky top-0 max-h-screen  flex flex-col ">
          <div className="bg-gray-800 rounded-lg p-4 flex-1 relative">
            <div className="absolute top-4 right-4 z-10">
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
              <div className="mb-2 text-center text-xs text-gray-300">
                {processedData.width} ×{" "}
                {processedData.height} tiles
              </div>
            )}
            <div className="flex items-center justify-center">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center">
                  <Loader className="h-10 w-10 text-primary animate-spin mb-2" />
                  <p className="text-gray-300">Processing image...</p>
                </div>
              ) : svgContent ? (
                <div className="relative w-full">
                  <div ref={svgContainerRef} className="w-full flex items-center justify-center bg-[#f1f1f1] max-h-[75vh] object-cover overflow-auto touch-auto rounded-lg no-scrollbar" >
                  </div>
                  {/* Zoom Slider */}
                  <div className="mt-3 px-1">
                    <input
                      type="range"
                      min="0.5"
                      max="5"
                      step="0.05"
                      value={zoomLevel}
                      onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      title={`Zoom: ${zoomLevel.toFixed(2)}x`}
                    />
                    <div className="text-center text-xs text-gray-400 mt-1">{zoomLevel.toFixed(2)}x Zoom</div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-300">Vector preview will appear here</p>
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
    <div className="bg-gray-800 rounded-lg  md:p-4 sticky top-0 z-50  p-4 pt-12 lg:pt-0">
      <div className="flex flex-row gap-2 items-start">
        {/* Original Image Section */}
        <div className="flex-1 lg:w-full w-1/2 relative">
          <h3 className="text-base md:text-lg font-medium mb-1 md:mb-2 text-center">Original</h3>
          <div className="flex flex-col w-full  max-h-40 items-center justify-center aspect-square bg-[#f1f1f1] rounded overflow-hidden">
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
          <div className="flex justify-end gap-2 absolute bottom-2 right-2 md:bottom-4 md:right-4">
            <Button
              onClick={onNewImageUpload}
              className="h-7 w-7 md:h-8 md:w-8 p-0 rounded-full bg-gray-700 hover:bg-gray-600"
              size="sm"
              title="Upload new image"
            >
              <Upload className="h-3.5 md:h-4 w-3.5 md:w-4" />
            </Button>
          </div>
        </div>

        {/* Mini SVG Preview Section (only on mobile/when svgContentPreview is present) */}
        {svgContentPreview && (
          <div className="flex-1 w-1/2 lg:hidden">
            <h3 className="text-base md:text-lg font-medium mb-1 md:mb-2 text-center">Preview</h3>
            <div ref={svgPreviewContainerRef} className="aspect-square bg-[#f1f1f1] rounded overflow-hidden flex items-center justify-center max-h-40 w-full">
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
