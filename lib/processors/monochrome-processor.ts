import type {
  Settings,
  ImageData,
  ColorGroup,
  PathPoint,
  PixelData,
} from "../types";
import { calculateContextAwareDensity } from "../utils/math-utils";
import {
  hexToRgb,
  calculateHueAndBrightness as calculateHueAndBrightnessForGroup,
} from "../converters/color-converters";

// Process image in monochrome mode
export function processMonochrome(
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
  const { minDensity, maxDensity, monochromeColor } = settings;

  // Create a 2D grid to store pixel data for easier access
  const pixelGrid: (PixelData | null)[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(null));

  // Fill the grid with pixel data
  pixels.forEach((pixel) => {
    pixelGrid[pixel.y][pixel.x] = pixel;
  });

  // Calculate hue and brightness for the selected monochrome color
  // This requires converting hex to RGB first if monochromeColor is hex
  let monoHue = 0;
  let monoBrightness = 0;
  if (monochromeColor.startsWith("#")) {
    const tempGroupForHueCalc: Record<string, ColorGroup> = {
      mono: {
        color: monochromeColor,
        displayName: "",
        points: [],
        hue: 0,
        brightness: 0,
      },
    };
    const calculatedGroup =
      calculateHueAndBrightnessForGroup(tempGroupForHueCalc);
    if (calculatedGroup.mono) {
      monoHue = calculatedGroup.mono.hue;
      monoBrightness = calculatedGroup.mono.brightness;
    }
  } else {
    // If it's a named color or other format, this might need more robust parsing
    // For simplicity, using defaults if RGB conversion isn't straightforward
    monoBrightness =
      monochromeColor === "black" || monochromeColor === "#000000" ? 0 : 255;
  }

  const colorGroups: Record<string, ColorGroup> = {
    monochrome: {
      color: monochromeColor,
      displayName: "Monochrome",
      points: [],
      hue: monoHue,
      brightness: monoBrightness,
    },
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = pixelGrid[y][x];
      if (!pixel) continue;

      const normalizedBrightness = (255 - pixel.brightness) / 255; // Darker pixels = higher density
      let density = Math.round(
        minDensity + normalizedBrightness * (maxDensity - minDensity)
      );
      density = Math.max(0, Math.min(maxDensity, density));

      if (density > 0) {
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
        colorGroups.monochrome.points.push(pathPoint);
      }
    }
  }
  return colorGroups;
}
