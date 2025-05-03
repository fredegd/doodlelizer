import type { ColorGroup, ImageData, PixelData, Settings } from "../types";
import { ensureEvenDensity } from "../utils/math-utils";
import { rgbToHex } from "../converters/color-converters";

// Process image in grayscale mode
export function processGrayscale(
  imageData: ImageData,
  settings: Settings
): Record<string, ColorGroup> {
  const { pixels, width, height } = imageData;
  const { colorsAmt, gridSizeX, gridSizeY, minDensity, maxDensity } = settings;

  // Create a 2D grid to store pixel data for easier access
  const pixelGrid: (PixelData | null)[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(null));

  // Fill the grid with pixel data
  pixels.forEach((pixel) => {
    pixelGrid[pixel.y][pixel.x] = pixel;
  });

  // Find brightness range
  let minBright = 255,
    maxBright = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = pixelGrid[y][x];
      if (pixel) {
        minBright = Math.min(minBright, pixel.brightness);
        maxBright = Math.max(maxBright, pixel.brightness);
      }
    }
  }

  // Create gray levels
  const grayLevels: number[] = [];
  for (let i = 0; i < colorsAmt; i++) {
    grayLevels.push(
      Math.round(minBright + (i / (colorsAmt - 1)) * (maxBright - minBright))
    );
  }

  // Group pixels by gray level
  const colorGroups: Record<string, ColorGroup> = {};

  // Initialize color groups
  grayLevels.forEach((level, index) => {
    const grayValue = Math.round(level);
    const colorKey = `gray-${grayValue}`;
    const hexColor = rgbToHex(grayValue, grayValue, grayValue);

    colorGroups[colorKey] = {
      color: hexColor,
      displayName: `Gray ${index + 1} (${grayValue})`,
      points: [],
    };
  });

  // Assign pixels to nearest gray level
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = pixelGrid[y][x];
      if (!pixel) continue;

      // Find nearest gray level
      const nearestGray = grayLevels.reduce((prev, curr) => {
        return Math.abs(curr - pixel.brightness) <
          Math.abs(prev - pixel.brightness)
          ? curr
          : prev;
      });

      const grayValue = Math.round(nearestGray);
      const colorKey = `gray-${grayValue}`;

      // Calculate density based on brightness
      const normalizedBrightness = (255 - grayValue) / 255;
      const density = ensureEvenDensity(
        Math.round(
          minDensity + normalizedBrightness * (maxDensity - minDensity)
        )
      );

      // Determine direction based on row
      const direction = y % 2 === 0 ? 1 : -1;

      // Add point to color group
      colorGroups[colorKey].points.push({
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
