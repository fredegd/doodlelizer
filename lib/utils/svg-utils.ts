import { calculateDistance } from "./math-utils";
import type { ColorGroup, ImageData, Settings } from "../types";

// Generate SVG from processed image data
export function generateSVG(imageData: ImageData, settings: Settings): string {
  const { outputWidth, outputHeight, colorGroups } = imageData;
  const { continuousPaths, visiblePaths } = settings;

  const widthInMM = Math.round(outputWidth / 3.759);
  const heightInMM = Math.round(outputHeight / 3.759);
  // Set SVG dimensions to the calculated output dimensions
  const svgWidth = outputWidth;
  const svgHeight = outputHeight;

  // Start SVG content
  let svgContent = `<svg width="${widthInMM} mm" height="${heightInMM} mm" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
  `;

  // Generate paths for each color group
  if (colorGroups) {
    Object.entries(colorGroups).forEach(([colorKey, group], index) => {
      // Skip if this path is not visible
      if (visiblePaths[colorKey] === false) return;
      // Create a group with id and custom data attributes for easier post-processing
      svgContent += `<g id="${index + 1}color-group-${colorKey}" data-color="${
        group.color
      }" data-name="${group.displayName}">\n`;

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
export function generateContinuousPath(
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
        svgContent += `<path d="${pathData}" stroke="${color}" fill="none" stroke-width="1" vector-effect="non-scaling-stroke" />\n`;
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
    svgContent += `<path d="${pathData}" stroke="${color}" fill="none" stroke-width="1" vector-effect="non-scaling-stroke" />\n`;
  }

  return svgContent;
}

// Create path data for a single tile in a continuous path
export function createTilePathData(
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
    // Otherwise, draw a line to the start of this tile (if we're not already there)
    pathData = `L ${x} ${y} `;
  }

  // For each segment in the zigzag pattern
  for (let i = 0; i < density; i++) {
    const currentX = x + i * step * direction;
    const nextX = x + (i + 1) * step * direction;

    if (i % 2 === 0) {
      // Vertical segment (downward)
      pathData += `L ${currentX} ${y + height} `;

      // If not the last segment, add horizontal segment
      if (i < density - 1) {
        pathData += `L ${nextX} ${y + height} `;
      } else if (density % 2 === 1) {
        // If this is the last segment and density is odd,
        // add final horizontal segment to the right edge
        pathData += `L ${nextX} ${y + height} `;
      }
    } else {
      // Vertical segment (upward)
      pathData += `L ${currentX} ${y} `;

      // If not the last segment, add horizontal segment
      if (i < density - 1) {
        pathData += `L ${nextX} ${y} `;
      } else if (density % 2 === 0) {
        // If this is the last segment and density is even,
        // add final horizontal segment to the right edge
        pathData += `L ${nextX} ${y} `;
      }
    }
  }

  return pathData;
}

// Generate individual paths for a color group
export function generateIndividualPaths(
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
export function generateSerpentinePath(
  x: number,
  y: number,
  width: number,
  height: number,
  density: number,
  direction: number,
  color: string
): string {
  if (density <= 0) return "";

  let pathData = `<path d="`;

  const step = width / density;

  // Initialize with position at top left corner
  pathData += `M ${x} ${y}`;

  // For each segment in the zigzag pattern
  for (let i = 0; i < density; i++) {
    const currentX = x + i * step * direction;
    const nextX = x + (i + 1) * step * direction;

    if (i % 2 === 0) {
      // Vertical segment (downward)
      pathData += ` L ${currentX} ${y + height}`;

      // If not the last segment, add horizontal segment
      if (i < density - 1) {
        pathData += ` L ${nextX} ${y + height}`;
      } else if (density % 2 === 1) {
        // If this is the last segment and density is odd,
        // add final horizontal segment to the right edge
        pathData += ` L ${nextX} ${y + height}`;
      }
    } else {
      // Vertical segment (upward)
      pathData += ` L ${currentX} ${y}`;

      // If not the last segment, add horizontal segment
      if (i < density - 1) {
        pathData += ` L ${nextX} ${y}`;
      } else if (density % 2 === 0) {
        // If this is the last segment and density is even,
        // add final horizontal segment to the right edge
        pathData += ` L ${nextX} ${y}`;
      }
    }
  }

  // Close path and add style
  pathData += `" stroke="${color}" fill="none" stroke-width="1" vector-effect="non-scaling-stroke" />\n`;

  return pathData;
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
