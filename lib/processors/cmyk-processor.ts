import type {
  Settings,
  ImageData,
  ColorGroup,
  PathPoint,
  PixelData,
} from "../types";
import { calculateContextAwareDensity } from "../utils/math-utils";
import { rgbToCMYK } from "../converters/color-converters";

// Process image in CMYK mode
export function processCMYK(
  imageData: ImageData,
  settings: Settings
): Record<string, ColorGroup> {
  const {
    pixels,
    width,
    height,
    tileWidth: gridSizeX,
    tileHeight: gridSizeY,
  } = imageData;
  const { minDensity, maxDensity } = settings;

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
      hue: 180,
      brightness: 255,
    },
    magenta: {
      color: "#FF00FF",
      displayName: "Magenta",
      points: [],
      hue: 300,
      brightness: 255,
    },
    yellow: {
      color: "#FFFF00",
      displayName: "Yellow",
      points: [],
      hue: 60,
      brightness: 255,
    },
    black: {
      color: "#000000",
      displayName: "Black",
      points: [],
      hue: 0,
      brightness: 0,
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
          const normalizedValue = value / 255;
          let density = Math.round(
            minDensity + normalizedValue * (maxDensity - minDensity)
          );
          density = Math.max(0, Math.min(maxDensity, density));

          if (density === 0) return;

          const pathPointX =
            pixel.y % 2 === 0
              ? pixel.x * gridSizeX
              : pixel.x * gridSizeX + gridSizeX; // Start from right edge for odd rows

          const pathPoint: PathPoint = {
            x: pathPointX,
            y: pixel.y * gridSizeY,
            width: gridSizeX,
            height: gridSizeY,
            density,
            row: pixel.y,
            direction: pixel.y % 2 === 0 ? 1 : -1,
            randomUpperKnotShiftX:
              (Math.random() - 0.5) * (gridSizeX + gridSizeY),
            randomUpperKnotShiftY:
              (Math.random() - 0.5) * (gridSizeX + gridSizeY),
          };

          if (colorGroups[channel]) {
            colorGroups[channel].points.push(pathPoint);
          }
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
