import type {
  ColorGroup,
  ImageData,
  PixelData,
  Settings,
  PathPoint,
} from "../types";
import { calculateContextAwareDensity } from "../utils/math-utils";
import { rgbToHex } from "../converters/color-converters";

// Process image in grayscale mode
export function processGrayscale(
  imageData: ImageData,
  settings: Settings
): Record<string, ColorGroup> {
  const { pixels, tileWidth: gridSizeX, tileHeight: gridSizeY } = imageData;
  const { minDensity, maxDensity, colorsAmt } = settings;
  const colorGroups: Record<string, ColorGroup> = {};

  // Determine the step for quantization based on colorsAmt
  // Avoid division by zero if colorsAmt is 1; handle it as a single gray level (e.g., 128 or based on average)
  // Or, more practically, ensure colorsAmt is at least 2 if quantization is meaningful.
  // For simplicity, if colorsAmt is 1, all non-transparent pixels will map to a single gray.
  // If colorsAmt is 2 or more, it creates distinct levels.
  const numLevels = Math.max(1, colorsAmt); // Ensure at least 1 level
  const step = numLevels > 1 ? 255 / (numLevels - 1) : 255; // If 1 level, step is effectively 255 (maps all to one extreme or requires specific handling)

  pixels.forEach((pixel) => {
    const originalBrightness = pixel.brightness; // This is a value from 0-255

    // Quantize the brightness
    let quantizedGrayValue;
    if (numLevels === 1) {
      // If only one level, map all pixels to a mid-gray or based on average (here, mid-gray 128)
      // Or, consider if a single level should represent black/white thresholding based on brightness
      quantizedGrayValue = 128; // Or could be 0 or 255 depending on desired effect for 1 level
    } else {
      quantizedGrayValue = Math.round(
        Math.round(originalBrightness / step) * step
      );
    }
    quantizedGrayValue = Math.min(255, Math.max(0, quantizedGrayValue)); // Clamp to 0-255

    const colorKey = `rgb(${quantizedGrayValue},${quantizedGrayValue},${quantizedGrayValue})`;

    if (!colorGroups[colorKey]) {
      colorGroups[colorKey] = {
        color: colorKey,
        displayName: `Gray ${Math.round((quantizedGrayValue / 255) * 100)}%`,
        points: [],
        hue: 0,
        brightness: quantizedGrayValue, // Store the quantized brightness
      };
    }

    // Calculate density based on original brightness for smoother transitions
    const normalizedValue = originalBrightness / 255;
    let density = Math.round(
      minDensity + (1 - normalizedValue) * (maxDensity - minDensity)
    );
    density = Math.max(0, Math.min(maxDensity, density)); // Clamp density

    // Skip if density is zero
    if (density === 0) return;

    const pathPointX =
      pixel.y % 2 === 0 ? pixel.x * gridSizeX : pixel.x * gridSizeX + gridSizeX; // Start from right edge for odd rows

    const pathPoint: PathPoint = {
      x: pathPointX,
      y: pixel.y * gridSizeY,
      width: gridSizeX,
      height: gridSizeY,
      density,
      row: pixel.y,
      direction: pixel.y % 2 === 0 ? 1 : -1,
      randomUpperKnotShiftX: (Math.random() - 0.5) * (gridSizeX + gridSizeY),
      randomUpperKnotShiftY: (Math.random() - 0.5) * (gridSizeX + gridSizeY),
    };

    colorGroups[colorKey].points.push(pathPoint);
  });

  return colorGroups;
}
