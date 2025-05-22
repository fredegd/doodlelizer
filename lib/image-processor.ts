import type { Settings, ImageData } from "./types";

import { processGrayscale } from "./processors/grayscale-processor";
import { processPosterize } from "./processors/posterize-processor";
import { processCMYK } from "./processors/cmyk-processor";
import { processMonochrome } from "./processors/monochrome-processor";
import { calculateResizeDimensions } from "./utils/dimension-utils";
import {
  generateSVG as generateSvgFromImageData,
  extractColorGroupSVG,
  extractAllColorGroups,
} from "./utils/svg-utils";
import { calculateHueAndBrightness } from "./converters/color-converters";

// Process image to extract pixel data
export async function processImage(
  imageDataUrl: string,
  settings: Settings
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        // Calculate resize dimensions based on column and row counts
        const {
          resizedWidth,
          resizedHeight,
          columnsCount,
          rowsCount,
          gridSizeX,
          gridSizeY,
          outputWidth,
          outputHeight,
        } = calculateResizeDimensions(
          img.width,
          img.height,
          settings.columnsCount,
          settings.rowsCount
        );

        // Update the settings with the calculated grid sizes
        settings.gridSizeX = gridSizeX;
        settings.gridSizeY = gridSizeY;

        // Create canvas to resize and extract pixel data
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Set canvas to the resized dimensions
        canvas.width = resizedWidth;
        canvas.height = resizedHeight;

        // Draw image to canvas at resized dimensions
        ctx.drawImage(img, 0, 0, resizedWidth, resizedHeight);
        //maintaint the stroke width
        ctx.lineWidth = 1;

        // Calculate grid dimensions using the columnsCount and rowsCount
        const gridWidth = columnsCount;
        const gridHeight = rowsCount;

        // Create a second canvas for the grid-based sampling
        const gridCanvas = document.createElement("canvas");
        const gridCtx = gridCanvas.getContext("2d");

        if (!gridCtx) {
          reject(new Error("Could not get grid canvas context"));
          return;
        }

        gridCanvas.width = gridWidth;
        gridCanvas.height = gridHeight;

        // Draw resized image to grid canvas
        gridCtx.drawImage(canvas, 0, 0, gridWidth, gridHeight);

        // Get pixel data
        const imageData = gridCtx.getImageData(0, 0, gridWidth, gridHeight);
        const pixels = [];

        // Process each pixel
        for (let y = 0; y < gridHeight; y++) {
          for (let x = 0; x < gridWidth; x++) {
            const i = (y * gridWidth + x) * 4;

            // Get RGB values
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            const aVal = imageData.data[i + 3]; // Original alpha value (0-255)

            // If the pixel is fully transparent, skip it entirely
            if (aVal === 0) {
              continue; // Move to the next pixel
            }

            const alphaNormalized = aVal / 255.0;

            // Calculate brightness (weighted RGB for human perception, multiplied by alpha)
            let brightness = Math.round(
              (r * 0.299 + g * 0.587 + b * 0.114) * alphaNormalized
            );

            // Only include pixels that meet the threshold for non-CMYK modes
            if (
              settings.processingMode === "cmyk" ||
              brightness <= settings.brightnessThreshold
            ) {
              pixels.push({
                x,
                y,
                brightness,
                r,
                g,
                b,
                a: aVal, // Store original alpha (0-255)
              });
            }
          }
        }

        // Create the base image data
        const processedImageData: ImageData = {
          width: gridWidth,
          height: gridHeight,
          pixels,
          originalWidth: img.width,
          originalHeight: img.height,
          resizedWidth,
          resizedHeight,
          outputWidth,
          outputHeight,
          columnsCount,
          rowsCount,
          tileWidth: outputWidth / columnsCount,
          tileHeight: outputHeight / rowsCount,
          colorGroups: {}, // Initialize colorGroups, will be populated by processors
        };

        // Process the image according to the selected mode
        // Use setTimeout to prevent UI blocking
        setTimeout(() => {
          try {
            switch (settings.processingMode) {
              case "grayscale":
                processedImageData.colorGroups = processGrayscale(
                  processedImageData,
                  settings
                );
                break;
              case "posterize":
                processedImageData.colorGroups = processPosterize(
                  processedImageData,
                  settings
                );
                break;
              case "cmyk":
                processedImageData.colorGroups = processCMYK(
                  processedImageData,
                  settings
                );
                break;
              case "monochrome":
                processedImageData.colorGroups = processMonochrome(
                  processedImageData,
                  settings
                );
                break;
            }
            resolve(processedImageData);
          } catch (error) {
            reject(error);
          }
        }, 0);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = imageDataUrl;
  });
}

// Export the generateSVG function
export const generateSVG = generateSvgFromImageData;

// Re-export wichtiger Funktionen für externe Nutzung
export {
  extractColorGroupSVG,
  extractAllColorGroups,
  processGrayscale,
  processPosterize,
  processCMYK,
  processMonochrome,
  calculateHueAndBrightness,
};
