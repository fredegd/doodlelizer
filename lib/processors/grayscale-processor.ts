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
  const { minDensity, maxDensity } = settings;
  const colorGroups: Record<string, ColorGroup> = {};

  pixels.forEach((pixel) => {
    // Normalize brightness to 0-255 and create a grayscale color key
    const grayValue = Math.round(pixel.brightness);
    const colorKey = `rgb(${grayValue},${grayValue},${grayValue})`;

    if (!colorGroups[colorKey]) {
      colorGroups[colorKey] = {
        color: colorKey,
        displayName: `Gray ${Math.round((grayValue / 255) * 100)}%`,
        points: [],
        hue: 0,
        brightness: grayValue,
      };
    }

    // Calculate density
    const normalizedValue = pixel.brightness / 255;
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
