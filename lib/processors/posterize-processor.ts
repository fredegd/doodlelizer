import type { ColorGroup, ImageData, PixelData, Settings } from "../types";
import {
  findNearestCentroid,
  kMeansClustering,
  calculateContextAwareDensity,
} from "../utils/math-utils";
import {
  calculateHueAndBrightness,
  rgbToHex,
} from "../converters/color-converters";

// Process image in posterize mode
export function processPosterize(
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

  // Collect all unique colors
  const uniqueColors: [number, number, number][] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = pixelGrid[y][x];
      if (pixel) {
        const colorExists = uniqueColors.some(
          (c) => c[0] === pixel.r && c[1] === pixel.g && c[2] === pixel.b
        );
        if (!colorExists) {
          uniqueColors.push([pixel.r, pixel.g, pixel.b]);
        }
      }
    }
  }

  // If we have more colors than allowed, perform k-means clustering
  const centroids = kMeansClustering(uniqueColors, colorsAmt);

  // Group pixels by color
  const colorGroups: Record<string, ColorGroup> = {};

  // Initialize color groups
  centroids.forEach((centroid, index) => {
    const [r, g, b] = centroid;
    const colorKey = `color-${r}-${g}-${b}`;
    const hexColor = rgbToHex(r, g, b);

    colorGroups[colorKey] = {
      color: hexColor,
      displayName: `Color ${index + 1}`,
      points: [],
    };
  });

  // Assign pixels to nearest centroid
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = pixelGrid[y][x];
      if (!pixel) continue;

      // Find nearest centroid
      const nearestCentroid = findNearestCentroid(
        [pixel.r, pixel.g, pixel.b],
        centroids
      );
      const [r, g, b] = nearestCentroid;
      const colorKey = `color-${r}-${g}-${b}`;

      // Calculate brightness for density
      const brightness = r * 0.299 + g * 0.587 + b * 0.114;
      const normalizedBrightness = (255 - brightness) / 255;

      // Use the new context-aware function
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

  // Sort color groups by hue and brightness
  return calculateHueAndBrightness(colorGroups);
}
