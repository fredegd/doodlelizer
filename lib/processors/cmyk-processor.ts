import type { ColorGroup, ImageData, PixelData, Settings } from "../types";
import { calculateContextAwareDensity } from "../utils/math-utils";
import { rgbToCMYK } from "../converters/color-converters";

// Process image in CMYK mode
export function processCMYK(
  imageData: ImageData,
  settings: Settings
): Record<string, ColorGroup> {
  const { pixels, width, height } = imageData;
  const { gridSizeX, gridSizeY, minDensity, maxDensity } = settings;

  // Create a 2D grid to store pixel data for easier access
  const pixelGrid: (PixelData | null)[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(null));

  // Fill the grid with pixel data
  pixels.forEach((pixel) => {
    pixelGrid[pixel.y][pixel.x] = pixel;
  });

  // Initialize color groups for CMYK channels
  const colorGroups: Record<string, ColorGroup> = {
    cyan: {
      color: "#00FFFF",
      displayName: "Cyan",
      points: [],
    },
    magenta: {
      color: "#FF00FF",
      displayName: "Magenta",
      points: [],
    },
    yellow: {
      color: "#FFFF00",
      displayName: "Yellow",
      points: [],
    },
    black: {
      color: "#000000",
      displayName: "Black",
      points: [],
    },
  };

  // Process each pixel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = pixelGrid[y][x];
      if (!pixel) continue;

      // Convert RGB to CMYK
      const cmyk = rgbToCMYK(pixel.r, pixel.g, pixel.b);

      // Process each CMYK channel
      Object.entries(cmyk).forEach(([channel, value]) => {
        if (value > 0) {
          // Calculate density based on channel value with context awareness
          const normalizedValue = value / 255;

          // Verwenden der neuen kontextbewussten Funktion
          const density = calculateContextAwareDensity(
            pixelGrid,
            x,
            y,
            minDensity,
            maxDensity,
            normalizedValue
          );

          // Determine direction based on row
          const direction = y % 2 === 0 ? 1 : -1;

          // Add point to color group
          colorGroups[channel].points.push({
            x: y % 2 === 0 ? x * gridSizeX : (x + 1) * gridSizeX,
            y: y * gridSizeY,
            width: gridSizeX,
            height: gridSizeY,
            density,
            row: y,
            direction,
          });
        }
      });
    }
  }

  return colorGroups;
}
// Note: The CMYK color space is often used in printing, and the conversion from RGB to CMYK can be complex.
// The above implementation is a simplified version and may not cover all edge cases.
// In a real-world scenario, you might want to use a library or a more robust algorithm for the conversion.
// Additionally, the color representation in CMYK can vary based on the printing process and the inks used.
// This implementation assumes a basic conversion and may need adjustments based on specific requirements.
