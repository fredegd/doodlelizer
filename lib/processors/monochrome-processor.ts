import type { ColorGroup, ImageData, PixelData, Settings } from "../types";
import {
  ensureEvenDensity,
  calculateContextAwareDensity,
} from "../utils/math-utils";
import {
  hexToRgb,
  calculateHue,
  calculateBrightness,
} from "../converters/color-converters";

// Process image in monochrome mode
export function processMonochrome(
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

  // Initialize a single color group for monochrome
  const colorGroups: Record<string, ColorGroup> = {
    monochrome: {
      color: settings.monochromeColor, // Use the selected color
      displayName: "Monochrome",
      points: [],
    },
  };

  // Process each pixel in the grid
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = pixelGrid[y][x];
      if (!pixel) continue;

      // Calculate density based on brightness with context awareness
      // Note: For monochrome, darker pixels have higher density
      const normalizedBrightness = (255 - pixel.brightness) / 255;

      // Verwenden der neuen kontextbewussten Funktion
      const density = calculateContextAwareDensity(
        pixelGrid,
        x,
        y,
        minDensity,
        maxDensity,
        normalizedBrightness
      );

      // Determine direction based on row
      const direction = y % 2 === 0 ? 1 : -1;

      // Add point to the monochrome color group
      colorGroups.monochrome.points.push({
        x: y % 2 === 0 ? x * gridSizeX : (x + 1) * gridSizeX,
        y: y * gridSizeY,
        width: gridSizeX,
        height: gridSizeY,
        density,
        row: y,
        direction,
      });
    }
  }

  return colorGroups;
}
