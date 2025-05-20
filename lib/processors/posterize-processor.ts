import type {
  ColorGroup,
  ImageData,
  PixelData,
  Settings,
  PathPoint,
} from "../types";
import {
  findNearestCentroid,
  kMeansClustering,
  calculateContextAwareDensity,
} from "../utils/math-utils";
import {
  calculateHueAndBrightness as calculateHueAndBrightnessForGroup,
  rgbToHex,
} from "../converters/color-converters";

// Process image in posterize mode
export function processPosterize(
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
  const { colorsAmt, minDensity, maxDensity } = settings;

  // Create a 2D grid to store pixel data for easier access
  const pixelGrid: (PixelData | null)[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(null));

  // Fill the grid with pixel data
  pixels.forEach((pixel) => {
    pixelGrid[pixel.y][pixel.x] = pixel;
  });

  // Collect all unique colors for k-means
  const uniqueColorsForKMeans: [number, number, number][] = [];
  pixels.forEach((pixel) => {
    // Check if color already exists to avoid duplicates for k-means
    if (
      !uniqueColorsForKMeans.some(
        (c) => c[0] === pixel.r && c[1] === pixel.g && c[2] === pixel.b
      )
    ) {
      uniqueColorsForKMeans.push([pixel.r, pixel.g, pixel.b]);
    }
  });

  const centroids = kMeansClustering(uniqueColorsForKMeans, colorsAmt);
  const colorGroups: Record<string, ColorGroup> = {};

  centroids.forEach((centroid, index) => {
    const [r, g, b] = centroid;
    const hexColor = rgbToHex(r, g, b);
    // Calculate hue and brightness for the centroid color
    let hue = 0;
    let brightness = 0;
    // Temporarily create a dummy ColorGroup to use calculateHueAndBrightnessForGroup
    // This is a bit of a workaround as calculateHueAndBrightnessForGroup expects a Record<string, ColorGroup>
    const tempGroupForHueCalc: Record<string, ColorGroup> = {
      [hexColor]: {
        color: hexColor,
        displayName: "",
        points: [],
        hue: 0,
        brightness: 0,
      },
    };
    const calculatedGroup =
      calculateHueAndBrightnessForGroup(tempGroupForHueCalc);
    if (calculatedGroup[hexColor]) {
      hue = calculatedGroup[hexColor].hue;
      brightness = calculatedGroup[hexColor].brightness;
    }

    colorGroups[hexColor] = {
      color: hexColor,
      displayName: `Color ${index + 1}`,
      points: [],
      hue, // Initialize hue
      brightness, // Initialize brightness
    };
  });

  pixels.forEach((pixel) => {
    const nearestCentroid = findNearestCentroid(
      [pixel.r, pixel.g, pixel.b],
      centroids
    );
    const [r, g, b] = nearestCentroid;
    const hexColor = rgbToHex(r, g, b);

    const normalizedBrightness = pixel.brightness / 255;
    let density = Math.round(
      minDensity + (1 - normalizedBrightness) * (maxDensity - minDensity)
    );
    density = Math.max(0, Math.min(maxDensity, density));

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

    if (colorGroups[hexColor]) {
      colorGroups[hexColor].points.push(pathPoint);
    }
  });

  return colorGroups;
}
