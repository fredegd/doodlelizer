import type { PixelData } from "../types";

// K-means clustering für Farbreduktion
export function kMeansClustering(
  colors: [number, number, number][],
  k: number
): [number, number, number][] {
  // Limit the number of colors to process for performance
  const maxColorsToProcess = 10000;
  let colorsToProcess = colors;

  if (colors.length > maxColorsToProcess) {
    // Sample colors if there are too many
    colorsToProcess = [];
    const step = Math.floor(colors.length / maxColorsToProcess);
    for (let i = 0; i < colors.length; i += step) {
      colorsToProcess.push(colors[i]);
    }
  }

  // Initialize centroids with random colors from the input
  let centroids: [number, number, number][] = [];
  const colorsCopy = [...colorsToProcess];

  // Select initial centroids randomly
  for (let i = 0; i < k; i++) {
    if (colorsCopy.length === 0) break;
    const randomIndex = Math.floor(Math.random() * colorsCopy.length);
    centroids.push(colorsCopy[randomIndex]);
    colorsCopy.splice(randomIndex, 1);
  }

  // If we couldn't get enough centroids, duplicate the last one
  while (centroids.length < k) {
    centroids.push([...centroids[centroids.length - 1]]);
  }

  let oldCentroids: [number, number, number][] = [];
  let iterations = 0;
  const maxIterations = 10; // Reduced from 20 for performance

  while (
    iterations < maxIterations &&
    !centroidsEqual(centroids, oldCentroids)
  ) {
    oldCentroids = centroids.map((c) => [...c] as [number, number, number]);

    // Assign colors to clusters
    const clusters: [number, number, number][][] = Array(k)
      .fill(null)
      .map(() => []);
    colorsToProcess.forEach((color) => {
      const nearestIndex = findNearestCentroidIndex(color, centroids);
      clusters[nearestIndex].push(color);
    });

    // Update centroids
    centroids = clusters.map((cluster, i) => {
      if (cluster.length === 0) return oldCentroids[i];
      return averageColor(cluster);
    });

    iterations++;
  }

  // Round the centroids to integers
  return centroids.map(
    (c) =>
      [Math.round(c[0]), Math.round(c[1]), Math.round(c[2])] as [
        number,
        number,
        number
      ]
  );
}

// Find the nearest centroid index for a color
export function findNearestCentroidIndex(
  color: [number, number, number],
  centroids: [number, number, number][]
): number {
  let minDist = Number.POSITIVE_INFINITY;
  let nearestIndex = 0;

  centroids.forEach((centroid, i) => {
    const dist = colorDistance(color, centroid);
    if (dist < minDist) {
      minDist = dist;
      nearestIndex = i;
    }
  });

  return nearestIndex;
}

// Find the nearest centroid for a color
export function findNearestCentroid(
  color: [number, number, number],
  centroids: [number, number, number][]
): [number, number, number] {
  return centroids[findNearestCentroidIndex(color, centroids)];
}

// Calculate the distance between two colors
export function colorDistance(
  c1: [number, number, number],
  c2: [number, number, number]
): number {
  // Simple Euclidean distance in RGB space
  return Math.sqrt(
    Math.pow(c1[0] - c2[0], 2) +
      Math.pow(c1[1] - c2[1], 2) +
      Math.pow(c1[2] - c2[2], 2)
  );
}

// Calculate the average color of a cluster
export function averageColor(
  colors: [number, number, number][]
): [number, number, number] {
  const sum = [0, 0, 0];
  colors.forEach((color) => {
    sum[0] += color[0];
    sum[1] += color[1];
    sum[2] += color[2];
  });
  return [
    sum[0] / colors.length,
    sum[1] / colors.length,
    sum[2] / colors.length,
  ] as [number, number, number];
}

// Check if two sets of centroids are equal
export function centroidsEqual(
  c1: [number, number, number][],
  c2: [number, number, number][]
): boolean {
  if (c1.length !== c2.length) return false;
  return c1.every(
    (cent, i) =>
      Math.abs(cent[0] - c2[i][0]) < 1 &&
      Math.abs(cent[1] - c2[i][1]) < 1 &&
      Math.abs(cent[2] - c2[i][2]) < 1
  );
}

// Calculate Euclidean distance between two points
export function calculateDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Helper function to ensure density is either 0 or an even number
export function ensureEvenDensity(density: number): number {
  if (density <= 0) return 0;
  return density % 2 === 0 ? density : density - 1;
}

// Calculate density with awareness of neighboring tiles
// This function helps smooth transitions between adjacent tiles with different colors
export function calculateContextAwareDensity(
  pixelGrid: (PixelData | null)[][],
  x: number,
  y: number,
  minDensity: number,
  maxDensity: number,
  normalizedValue: number // Value between 0 and 1, usually derived from brightness
): number {
  const height = pixelGrid.length;
  const width = pixelGrid[0].length;

  // Base density calculation for current tile
  const baseDensity = Math.round(
    minDensity + normalizedValue * (maxDensity - minDensity)
  );

  // If edge tile or no context awareness needed, return base density
  if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) {
    return baseDensity;
  }

  // Get neighboring pixels
  const neighbors = [
    pixelGrid[y - 1][x], // top
    pixelGrid[y + 1][x], // bottom
    pixelGrid[y][x - 1], // left
    pixelGrid[y][x + 1], // right
  ].filter((n) => n !== null);

  // If we don't have enough neighbors for context, return base density
  if (neighbors.length < 2) {
    return baseDensity;
  }

  // Calculate average brightness of neighbors
  const avgNeighborBrightness =
    neighbors.reduce((sum, pixel) => sum + (pixel ? pixel.brightness : 0), 0) /
    neighbors.length;

  // Get current pixel
  const currentPixel = pixelGrid[y][x];
  if (!currentPixel) return baseDensity;

  // Calculate brightness difference between current pixel and neighbors
  const brightnessDiff = Math.abs(
    currentPixel.brightness - avgNeighborBrightness
  );

  // If brightness difference is significant, adjust density
  if (brightnessDiff > 50) {
    // threshold can be adjusted
    // Smooth density value based on neighbors
    const smoothingFactor = Math.min(brightnessDiff / 255, 0.5); // max 50% smoothing
    const neighborNormalizedValue = (255 - avgNeighborBrightness) / 255;
    const neighborBaseDensity = Math.round(
      minDensity + neighborNormalizedValue * (maxDensity - minDensity)
    );

    // Weighted average of current density and neighbor density
    const smoothedDensity = Math.round(
      baseDensity * (1 - smoothingFactor) +
        neighborBaseDensity * smoothingFactor
    );

    return smoothedDensity;
  }

  return baseDensity;
}
