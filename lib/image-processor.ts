import type {
  Settings,
  ImageData,
  PixelData,
  ColorGroup,
  CMYKValues,
} from "./types";

// Process image to extract pixel data
export async function processImage(
  imageDataUrl: string,
  settings: Settings
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        // Calculate resize dimensions based on column and row counts
        const {
          resizedWidth,
          resizedHeight,
          columnsCount,
          rowsCount,
          gridSizeX,
          gridSizeY,
          outputWidth,
          outputHeight,
        } = calculateResizeDimensions(
          img.width,
          img.height,
          settings.columnsCount,
          settings.rowsCount
        );

        // Update the settings with the calculated grid sizes
        settings.gridSizeX = gridSizeX;
        settings.gridSizeY = gridSizeY;

        // Create canvas to resize and extract pixel data
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Set canvas to the resized dimensions
        canvas.width = resizedWidth;
        canvas.height = resizedHeight;

        // Draw image to canvas at resized dimensions
        ctx.drawImage(img, 0, 0, resizedWidth, resizedHeight);

        // Calculate grid dimensions using the columnsCount and rowsCount
        const gridWidth = columnsCount;
        const gridHeight = rowsCount;

        // Calculate tile dimensions
        const tileWidth = outputWidth / columnsCount;
        const tileHeight = outputHeight / rowsCount;

        // Create a second canvas for the grid-based sampling
        const gridCanvas = document.createElement("canvas");
        const gridCtx = gridCanvas.getContext("2d");

        if (!gridCtx) {
          reject(new Error("Could not get grid canvas context"));
          return;
        }

        gridCanvas.width = gridWidth;
        gridCanvas.height = gridHeight;

        // Draw resized image to grid canvas
        gridCtx.drawImage(canvas, 0, 0, gridWidth, gridHeight);

        // Get pixel data
        const imageData = gridCtx.getImageData(0, 0, gridWidth, gridHeight);
        const pixels: PixelData[] = [];

        // Process each pixel
        for (let y = 0; y < gridHeight; y++) {
          for (let x = 0; x < gridWidth; x++) {
            const i = (y * gridWidth + x) * 4;

            // Get RGB values
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            const a = imageData.data[i + 3] / 255;

            // Calculate brightness (weighted RGB for human perception)
            let brightness = Math.round(
              (r * 0.299 + g * 0.587 + b * 0.114) * a
            );

            // Apply invert if needed
            if (settings.invert) {
              brightness = 255 - brightness;
            }

            // Only include pixels that meet the threshold for non-CMYK modes
            if (
              settings.processingMode === "cmyk" ||
              (settings.invert
                ? brightness >= settings.brightnessThreshold
                : brightness <= settings.brightnessThreshold)
            ) {
              pixels.push({
                x,
                y,
                brightness,
                r,
                g,
                b,
                a: Math.round(a * 255),
              });
            }
          }
        }

        // Create the base image data
        const processedImageData: ImageData = {
          width: gridWidth,
          height: gridHeight,
          pixels,
          originalWidth: img.width,
          originalHeight: img.height,
          resizedWidth,
          resizedHeight,
          outputWidth,
          outputHeight,
          columnsCount,
          rowsCount,
          tileWidth,
          tileHeight,
        };

        // Process the image according to the selected mode
        // Use setTimeout to prevent UI blocking
        setTimeout(() => {
          try {
            switch (settings.processingMode) {
              case "grayscale":
                processedImageData.colorGroups = processGrayscale(
                  processedImageData,
                  settings
                );
                break;
              case "posterize":
                processedImageData.colorGroups = processPosterize(
                  processedImageData,
                  settings
                );
                break;
              case "cmyk":
                processedImageData.colorGroups = processCMYK(
                  processedImageData,
                  settings
                );
                break;
              case "monochrome":
                processedImageData.colorGroups = processMonochrome(
                  processedImageData,
                  settings
                );
                break;
            }
            resolve(processedImageData);
          } catch (error) {
            reject(error);
          }
        }, 0);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = imageDataUrl;
  });
}

// Process image in grayscale mode
function processGrayscale(
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
      const density = Math.round(
        minDensity + normalizedBrightness * (maxDensity - minDensity)
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

// Process image in posterize mode
function processPosterize(
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
      const density = Math.round(
        minDensity + normalizedBrightness * (maxDensity - minDensity)
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

// Process image in CMYK mode
function processCMYK(
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
          // Calculate density based on channel value
          const normalizedValue = value / 255;
          const density = Math.round(
            minDensity + normalizedValue * (maxDensity - minDensity)
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

// Convert RGB to CMYK
function rgbToCMYK(r: number, g: number, b: number): CMYKValues {
  // Normalize RGB values
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  // Calculate black key
  const k = 1 - Math.max(rn, gn, bn);

  // Calculate CMY
  let c = 0,
    m = 0,
    y = 0;

  if (k < 1) {
    const ik = 1 / (1 - k);
    c = (1 - rn - k) * ik;
    m = (1 - gn - k) * ik;
    y = (1 - bn - k) * ik;
  }

  // Convert to 0-255 range
  return {
    cyan: Math.round(c * 255),
    magenta: Math.round(m * 255),
    yellow: Math.round(y * 255),
    black: Math.round(k * 255),
  };
}

// Calculate resize dimensions based on aspect ratio with fixed output dimensions
function calculateResizeDimensions(
  originalWidth: number,
  originalHeight: number,
  columnsCount: number,
  rowsCount: number
) {
  const aspectRatio = originalWidth / originalHeight;
  let outputWidth, outputHeight;
  const MAX_DIMENSION = 560; // Fixed maximum dimension

  // Determine if image is portrait, landscape, or square
  if (aspectRatio < 1) {
    // Portrait mode: fix width to 560px
    outputWidth = MAX_DIMENSION;
    outputHeight = Math.round(MAX_DIMENSION / aspectRatio);
  } else if (aspectRatio > 1) {
    // Landscape mode: fix height to 560px
    outputHeight = MAX_DIMENSION;
    outputWidth = Math.round(MAX_DIMENSION * aspectRatio);
  } else {
    // Square: both dimensions 560px
    outputWidth = MAX_DIMENSION;
    outputHeight = MAX_DIMENSION;
  }

  // Calculate resized dimensions for image processing
  const resizedWidth = columnsCount;
  const resizedHeight = rowsCount;

  // Calculate grid sizes based on output dimensions and column/row counts
  const gridSizeX = outputWidth / columnsCount;
  const gridSizeY = outputHeight / rowsCount;

  return {
    resizedWidth,
    resizedHeight,
    columnsCount,
    rowsCount,
    gridSizeX,
    gridSizeY,
    outputWidth,
    outputHeight,
  };
}

// Generate SVG from processed image data
export function generateSVG(imageData: ImageData, settings: Settings): string {
  const {
    width,
    height,
    originalWidth,
    originalHeight,
    resizedWidth,
    resizedHeight,
    outputWidth,
    outputHeight,
    colorGroups,
  } = imageData;
  const {
    gridSizeX,
    gridSizeY,
    invert,
    continuousPaths,
    processingMode,
    visiblePaths,
  } = settings;

  // Set SVG dimensions to the calculated output dimensions
  const svgWidth = outputWidth;
  const svgHeight = outputHeight;

  // Start SVG content
  let svgContent = `<svg width="100%" height="100%" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
  <metadata>
    <originalWidth>${originalWidth}</originalWidth>
    <originalHeight>${originalHeight}</originalHeight>
    <resizedWidth>${resizedWidth}</resizedWidth>
    <resizedHeight>${resizedHeight}</resizedHeight>
    <outputWidth>${outputWidth}</outputWidth>
    <outputHeight>${outputHeight}</outputHeight>
    <gridSizeX>${gridSizeX}</gridSizeX>
    <gridSizeY>${gridSizeY}</gridSizeY>
    <processingMode>${processingMode}</processingMode>
    <continuousPaths>${continuousPaths}</continuousPaths>
  </metadata>
  `;

  // Generate paths for each color group
  if (colorGroups) {
    Object.entries(colorGroups).forEach(([colorKey, group]) => {
      // Skip if this path is not visible
      if (visiblePaths[colorKey] === false) return;

      // Create a group with id and custom data attributes for easier post-processing
      svgContent += `<g id="color-group-${colorKey}" data-color="${group.color}" data-name="${group.displayName}">\n`;

      if (continuousPaths) {
        // Generate continuous path for this color group
        svgContent += generateContinuousPath(group, settings);
      } else {
        // Generate individual paths for this color group
        svgContent += generateIndividualPaths(group, settings);
      }

      // Close the color group
      svgContent += `</g>\n`;
    });
  }

  // Close SVG
  svgContent += `</svg>`;

  return svgContent;
}

// Generate continuous path for a color group
function generateContinuousPath(
  colorGroup: ColorGroup,
  settings: Settings
): string {
  const { color, points } = colorGroup;

  // Sort points by row, then by column (accounting for row direction)
  points.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    // Sort by column, accounting for row direction
    return a.row % 2 === 0 ? a.x - b.x : b.x - a.x;
  });

  let svgContent = "";
  let pathData = "";
  let firstPoint = true;
  let lastPoint = null;

  // Process each point in order
  for (let i = 0; i < points.length; i++) {
    const point = points[i];

    // Skip zero-density points
    if (point.density <= 0) continue;

    // Check if we need to start a new path due to distance threshold
    const needNewPath =
      lastPoint &&
      calculateDistance(lastPoint.x, lastPoint.y, point.x, point.y) >
        settings.pathDistanceThreshold;

    // If this is the first point or we need a new path due to distance
    if (firstPoint || needNewPath) {
      // If we have existing path data, add it to the SVG content
      if (pathData && !firstPoint) {
        svgContent += `<path d="${pathData}" stroke="${color}" fill="none" stroke-width="1" />\n`;
        pathData = "";
      }

      // Start a new path
      pathData = `M ${point.x} ${point.y} `;
      firstPoint = false;
    }

    // Generate path data for this tile
    const tilePathData = createTilePathData(
      point.x,
      point.y,
      point.width,
      point.height,
      point.density,
      point.direction,
      pathData.length === 0 // isFirst is true only if pathData is empty
    );

    if (tilePathData) {
      pathData += tilePathData;
    }

    // Update the last point
    lastPoint = point;
  }

  // Add the final path to SVG content if it's not empty
  if (pathData) {
    svgContent += `<path d="${pathData}" stroke="${color}" fill="none" stroke-width="1" />\n`;
  }

  return svgContent;
}

// Calculate Euclidean distance between two points
function calculateDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Generate individual paths for a color group
function generateIndividualPaths(
  colorGroup: ColorGroup,
  settings: Settings
): string {
  const { color, points } = colorGroup;
  // No need for a nested g element since we're already in a color group
  let svgContent = "";

  // Add each path segment
  points.forEach((point) => {
    svgContent += generateSerpentinePath(
      point.x,
      point.y,
      point.width,
      point.height,
      point.density,
      point.direction,
      color
    );
  });

  return svgContent;
}

// Generate a serpentine path for a single tile
function generateSerpentinePath(
  x: number,
  y: number,
  width: number,
  height: number,
  density: number,
  direction: number,
  color: string
): string {
  let pathData = `<path d="`;

  // Start at the corner of the tile
  pathData += `M ${x} ${y}`;

  // Create zigzag pattern based on density
  for (let d = 0; d < density; d++) {
    const offset = d * (width / density);
    const nextOffset = (d + 1) * (width / density);

    // Toggle between top and bottom lines for the zigzag
    if (d % 2 === 0) {
      // Draw horizontal line along the top
      pathData += ` L ${x + offset * direction} ${y}`;
      pathData += ` L ${x + nextOffset * direction} ${y}`;
    } else {
      // Draw horizontal line along the bottom
      pathData += ` L ${x + offset * direction} ${y + height}`;
      pathData += ` L ${x + nextOffset * direction} ${y + height}`;
    }

    // Add vertical connecting line if not the last segment
    if (d < density - 1) {
      if (d % 2 === 0) {
        // Connect from top to bottom
        pathData += ` L ${x + nextOffset * direction} ${y}`;
        pathData += ` L ${x + nextOffset * direction} ${y + height}`;
      } else {
        // Connect from bottom to top
        pathData += ` L ${x + nextOffset * direction} ${y + height}`;
        pathData += ` L ${x + nextOffset * direction} ${y}`;
      }
    }
  }

  // Close the path and add stroke attributes
  pathData += `" stroke="${color}" fill="none" stroke-width="1" />\n`;

  return pathData;
}

// Create path data for a single tile in a continuous path
function createTilePathData(
  x: number,
  y: number,
  width: number,
  height: number,
  density: number,
  direction: number,
  isFirst: boolean
): string {
  if (density <= 0) return "";

  let pathData = "";
  const step = width / density;

  // If this is the first point in the path, start with a move command
  if (isFirst) {
    pathData = `M ${x} ${y} `;
  } else {
    // Otherwise, draw a line to the start of this tile
    pathData = `L ${x} ${y} `;
  }

  // Generate zigzag pattern within this tile
  for (let d = 0; d < density; d++) {
    const offset = d * step;
    const nextOffset = (d + 1) * step;

    // Toggle between top and bottom lines for the zigzag
    if (d % 2 === 0) {
      // Draw horizontal line along the top
      pathData += `L ${x + offset * direction} ${y} `;
      pathData += `L ${x + nextOffset * direction} ${y} `;
    } else {
      // Draw horizontal line along the bottom
      pathData += `L ${x + offset * direction} ${y + height} `;
      pathData += `L ${x + nextOffset * direction} ${y + height} `;
    }

    // Add vertical connecting line if not the last segment
    if (d < density - 1) {
      if (d % 2 === 0) {
        // Connect from top to bottom
        pathData += `L ${x + nextOffset * direction} ${y} `;
        pathData += `L ${x + nextOffset * direction} ${y + height} `;
      } else {
        // Connect from bottom to top
        pathData += `L ${x + nextOffset * direction} ${y + height} `;
        pathData += `L ${x + nextOffset * direction} ${y} `;
      }
    }
  }

  return pathData;
}

// K-means clustering for color reduction
function kMeansClustering(
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
function findNearestCentroidIndex(
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
function findNearestCentroid(
  color: [number, number, number],
  centroids: [number, number, number][]
): [number, number, number] {
  return centroids[findNearestCentroidIndex(color, centroids)];
}

// Calculate the distance between two colors
function colorDistance(
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
function averageColor(
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
function centroidsEqual(
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

// Convert RGB to hex color
function rgbToHex(r: number, g: number, b: number): string {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

// Convert a single color component to hex
function componentToHex(c: number): string {
  const hex = Math.round(c).toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

// Process image in monochrome mode
function processMonochrome(
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

      // Calculate density based on brightness
      // Note: For monochrome, darker pixels have higher density
      const normalizedBrightness = (255 - pixel.brightness) / 255;
      const density = Math.round(
        minDensity + normalizedBrightness * (maxDensity - minDensity)
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

// Extract a single color group as its own SVG
export function extractColorGroupSVG(
  svgContent: string,
  colorKey: string
): string | null {
  try {
    // Create a DOM parser to parse the SVG string
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");

    // Find the specified color group
    const colorGroup = svgDoc.getElementById(`color-group-${colorKey}`);
    if (!colorGroup) {
      return null;
    }

    // Get the original SVG properties
    const originalSvg = svgDoc.documentElement;
    const width = originalSvg.getAttribute("width") || "100%";
    const height = originalSvg.getAttribute("height") || "100%";
    const viewBox = originalSvg.getAttribute("viewBox") || "";

    // Get metadata
    const metadata = originalSvg.querySelector("metadata")?.cloneNode(true);

    // Get background
    const rect = originalSvg.querySelector("rect")?.cloneNode(true);

    // Create a new SVG document with the same dimensions
    const newSvgDoc = document.implementation.createDocument(
      "http://www.w3.org/2000/svg",
      "svg",
      null
    );

    const newSvg = newSvgDoc.documentElement;
    newSvg.setAttribute("width", width);
    newSvg.setAttribute("height", height);
    newSvg.setAttribute("viewBox", viewBox);
    newSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    // Add metadata if it exists
    if (metadata) {
      newSvg.appendChild(metadata);
    }

    // Add background if it exists
    if (rect) {
      newSvg.appendChild(rect);
    }

    // Clone the color group and add it to the new SVG
    const clonedGroup = colorGroup.cloneNode(true);
    newSvg.appendChild(clonedGroup);

    // Serialize the new SVG document to a string
    const serializer = new XMLSerializer();
    return serializer.serializeToString(newSvg);
  } catch (error) {
    console.error("Error extracting color group:", error);
    return null;
  }
}

// Extract all color groups as separate SVGs
export function extractAllColorGroups(
  svgContent: string
): Record<string, string> {
  try {
    // Create a DOM parser to parse the SVG string
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");

    // Find all color groups
    const colorGroups = svgDoc.querySelectorAll('[id^="color-group-"]');
    const result: Record<string, string> = {};

    // Process each color group
    colorGroups.forEach((group) => {
      const id = group.id;
      const colorKey = id.replace("color-group-", "");
      const extractedSvg = extractColorGroupSVG(svgContent, colorKey);

      if (extractedSvg) {
        result[colorKey] = extractedSvg;
      }
    });

    return result;
  } catch (error) {
    console.error("Error extracting all color groups:", error);
    return {};
  }
}
