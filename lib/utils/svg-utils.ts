import { calculateDistance } from "./math-utils";
import type {
  ColorGroup,
  ImageData,
  Settings,
  CurveControlSettings,
} from "../types";

// Generate SVG from processed image data
export function generateSVG(imageData: ImageData, settings: Settings): string {
  const { outputWidth, outputHeight, colorGroups } = imageData;
  const { continuousPaths, visiblePaths } = settings;

  const widthInMM = Math.round(outputWidth / 3.759);
  const heightInMM = Math.round(outputHeight / 3.759);
  // Set SVG dimensions to the calculated output dimensions
  const svgWidth = outputWidth;
  const svgHeight = outputHeight;

  // Start SVG content with additional shape-rendering attribute to ensure smooth corners
  let svgContent = `<svg width="${widthInMM} mm" height="${heightInMM} mm" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" style="stroke-linejoin: round; stroke-linecap: round;">
  `;

  // Generate paths for each color group
  if (colorGroups) {
    Object.entries(colorGroups).forEach(([colorKey, group], index) => {
      // Skip if this path is not visible
      if (visiblePaths[colorKey] === false) return;
      // Create a group with id and custom data attributes for easier post-processing
      svgContent += `<g id="color-group-${colorKey}" data-color="${
        group.color
      }" data-name="${group.displayName}" data-index="${index + 1}">\n`;

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
  const { curvedPaths, curveControls } = settings;

  // Sort points by row, then by column (accounting for row direction)
  points.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    // Sort by column, accounting for row direction
    return a.row % 2 === 0 ? a.x - b.x : b.x - a.x;
  });

  let svgContent = "";

  // Generate vertices array from the points
  let pathVertices: { x: number; y: number }[] = [];

  // Process each point to generate all the vertices for the continuous path
  for (let i = 0; i < points.length; i++) {
    const point = points[i];

    // Skip zero-density points
    if (point.density <= 0) continue;

    // Check if we need to start a new path due to distance threshold
    const lastPoint =
      pathVertices.length > 0 ? pathVertices[pathVertices.length - 1] : null;
    const needNewPath =
      lastPoint &&
      calculateDistance(lastPoint.x, lastPoint.y, point.x, point.y) >
        settings.pathDistanceThreshold;

    if (needNewPath && pathVertices.length > 0) {
      // Create path from accumulated vertices
      svgContent += createPathFromVertices(
        pathVertices,
        color,
        curvedPaths,
        curveControls
      );
      // Reset vertices array for next path
      pathVertices = [];
    }

    // Add vertices for this point/tile
    const tileVertices = createTileVertices(
      point.x,
      point.y,
      point.width,
      point.height * (curveControls?.tileHeightScale || 1.0),
      point.density,
      point.direction
    );

    // If this is not the first point in the current path and we have vertices,
    // we may need to adjust the first vertex of this tile for smoother connection
    if (pathVertices.length > 0 && !needNewPath) {
      // The first tile vertex replaces the last vertex of the accumulated path
      // to ensure a continuous path without jumps
      pathVertices.pop(); // Remove last vertex from previous tile
    }

    // Add all vertices from this tile
    pathVertices = [...pathVertices, ...tileVertices];
  }

  // Add the final path to SVG content if there are vertices left
  if (pathVertices.length > 0) {
    svgContent += createPathFromVertices(
      pathVertices,
      color,
      curvedPaths,
      curveControls
    );
  }

  return svgContent;
}

// Create all vertices for a tile based on its properties
function createTileVertices(
  x: number,
  y: number,
  width: number,
  height: number,
  density: number,
  direction: number
): { x: number; y: number }[] {
  if (density <= 0) return [];

  const vertices: { x: number; y: number }[] = [];
  const step = width / density;

  // Start with the first point
  vertices.push({ x, y });

  // For each segment of the zigzag
  for (let i = 0; i < density; i++) {
    const currentX = x + i * step * direction;
    const nextX = x + (i + 1) * step * direction;

    if (i % 2 === 0) {
      // Vertical segment down
      vertices.push({ x: currentX, y: y + height });

      // Horizontal segment if not the last one
      if (i < density - 1) {
        vertices.push({ x: nextX, y: y + height });
      } else if (density % 2 === 1) {
        // Last segment with odd density
        vertices.push({ x: nextX, y: y + height });
      }
    } else {
      // Vertical segment up
      vertices.push({ x: currentX, y });

      // Horizontal segment if not the last one
      if (i < density - 1) {
        vertices.push({ x: nextX, y });
      } else if (density % 2 === 0) {
        // Last segment with even density
        vertices.push({ x: nextX, y });
      }
    }
  }

  return vertices;
}

// Create a path from an array of vertices, applying the curved path algorithm from example.tsx
function createPathFromVertices(
  vertices: { x: number; y: number }[],
  color: string,
  useCurvedPaths: boolean,
  curveControls?: CurveControlSettings
): string {
  if (vertices.length === 0) return "";

  let pathData = "";
  const smoothness = curveControls?.junctionContinuityFactor || 0.1;
  const handleRotationAngle = curveControls?.handleRotationAngle || 0; // Degrees

  if (useCurvedPaths) {
    // Use the curve algorithm
    pathData = convertToCurvePath(vertices, smoothness, handleRotationAngle);
  } else {
    // Use straight lines
    pathData = convertToLinePath(vertices);
  }

  return `<path d="${pathData}" stroke="${color}" fill="none" stroke-width="1" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />\n`;
}

// Straight line path conversion (from example.tsx)
function convertToLinePath(points: { x: number; y: number }[]): string {
  return points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");
}

// Curved path conversion (from example.tsx)
function convertToCurvePath(
  points: { x: number; y: number }[],
  smoothness = 0.1,
  handleRotationAngle = 0 // New parameter in degrees
): string {
  if (points.length < 2) return "";

  // Convert angle to radians for Math functions
  const rotationRad = (handleRotationAngle * Math.PI) / 180;
  const cosA = Math.cos(rotationRad);
  const sinA = Math.sin(rotationRad);

  // Start with the first point
  let path = `M ${points[0].x} ${points[0].y}`;

  // Calculate control points for each actual vertex
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];

    // For the first point, use itself as the "previous" point
    const previous = i > 0 ? points[i - 1] : current;

    // For the last point pair, the "next next" point is the last point itself
    const nextNext = i < points.length - 2 ? points[i + 2] : next;

    // Calculate direction vectors
    const v1 = {
      x: next.x - previous.x,
      y: next.y - previous.y,
    };

    const v2 = {
      x: nextNext.x - current.x,
      y: nextNext.y - current.y,
    };

    // Calculate control point distances
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    // Normalize vectors and scale by smoothness
    const distance1 = Math.min(len1 * smoothness, len1 / 2);
    const distance2 = Math.min(len2 * smoothness, len2 / 2);

    // Calculate original handle vectors
    let handleVec1_x = (v1.x / len1) * distance1;
    let handleVec1_y = (v1.y / len1) * distance1;

    let handleVec2_x = -(v2.x / len2) * distance2; // Points from next towards cp2
    let handleVec2_y = -(v2.y / len2) * distance2;

    // Rotate handle vectors if rotation angle is not zero
    if (handleRotationAngle !== 0) {
      const rotated_cp1_dx = handleVec1_x * cosA - handleVec1_y * sinA;
      const rotated_cp1_dy = handleVec1_x * sinA + handleVec1_y * cosA;
      handleVec1_x = rotated_cp1_dx;
      handleVec1_y = rotated_cp1_dy;

      const rotated_cp2_dx = handleVec2_x * cosA - handleVec2_y * sinA;
      const rotated_cp2_dy = handleVec2_x * sinA + handleVec2_y * cosA;
      handleVec2_x = rotated_cp2_dx;
      handleVec2_y = rotated_cp2_dy;
    }

    // Calculate control points based on (possibly rotated) handle vectors
    const cp1 = {
      x: current.x + handleVec1_x,
      y: current.y + handleVec1_y,
    };

    const cp2 = {
      x: next.x + handleVec2_x, // Add rotated vector to 'next'
      y: next.y + handleVec2_y,
    };

    // Add the curve segment
    path += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${next.x} ${next.y}`;
  }

  return path;
}

// The following are existing functions that can remain unchanged as they'll be gradually
// replaced with the new implementation or kept for compatibility

// Create path data for a single tile in a continuous path, now with tangent information
export function createTilePathDataWithTangent(
  x: number,
  y: number,
  width: number,
  height: number,
  density: number,
  direction: number,
  isFirst: boolean,
  useCurvedPaths: boolean = false,
  incomingTangentX: number = 0,
  incomingTangentY: number = 0,
  curveControls?: CurveControlSettings
): { pathSegment: string; exitTangentX: number; exitTangentY: number } {
  if (density <= 0)
    return { pathSegment: "", exitTangentX: 0, exitTangentY: 0 };

  // Use default values if curve controls are not provided
  const tileHeightScale = curveControls?.tileHeightScale || 1.0;

  // Apply tile height scaling
  const scaledHeight = height * tileHeightScale;

  let pathData = "";
  let exitTangentX = 0;
  let exitTangentY = 0;

  // If this is the first point in the path, start with a move command
  if (isFirst) {
    pathData = `M ${x} ${y} `;
  }

  // For both curved and straight paths, we'll now generate vertices and create paths
  // This function is kept for backward compatibility
  const vertices = createTileVertices(
    x,
    y,
    width,
    scaledHeight,
    density,
    direction
  );

  // Convert vertices to paths based on the curved mode
  if (useCurvedPaths) {
    // For curved paths, we'll use the smoothness parameter if provided
    const smoothness = curveControls?.junctionContinuityFactor || 0.1;

    // Create a curved path from the vertices
    // First move to the starting position if it's the first point
    if (!isFirst) {
      // Skip the first vertex since we're already at that position
      vertices.shift();
    }

    // If there are vertices, create the curved path
    if (vertices.length > 0) {
      // Generate the curved path data
      const curvedPath = convertToCurvePath(
        vertices,
        smoothness,
        curveControls?.handleRotationAngle || 0
      );

      // Remove the initial M command if this is not the first point
      pathData += isFirst
        ? curvedPath
        : curvedPath.replace(/^M [0-9.]+ [0-9.]+ /, "");

      // Set exit tangent based on the last segment direction
      if (vertices.length >= 2) {
        const lastVertex = vertices[vertices.length - 1];
        const secondLastVertex = vertices[vertices.length - 2];

        // Calculate exit tangent direction as a unit vector
        const dx = lastVertex.x - secondLastVertex.x;
        const dy = lastVertex.y - secondLastVertex.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len > 0) {
          exitTangentX = dx / len;
          exitTangentY = dy / len;
        }
      }
    }
  } else {
    // For straight paths, simply connect the vertices with lines
    for (let i = 0; i < vertices.length; i++) {
      if (i === 0 && isFirst) {
        // First vertex, use a move command if this is the first point
        pathData += `M ${vertices[i].x} ${vertices[i].y} `;
      } else {
        // All other vertices use line commands
        pathData += `L ${vertices[i].x} ${vertices[i].y} `;
      }
    }

    // Set exit tangent for straight lines
    exitTangentX = direction;
    exitTangentY = 0;
  }

  return { pathSegment: pathData, exitTangentX, exitTangentY };
}

// Create path data for a single tile in a continuous path (legacy function)
export function createTilePathData(
  x: number,
  y: number,
  width: number,
  height: number,
  density: number,
  direction: number,
  isFirst: boolean,
  useCurvedPaths: boolean = false,
  curveControls?: CurveControlSettings // Add optional curve controls parameter
): string {
  // Call the enhanced function and return just the path segment
  return createTilePathDataWithTangent(
    x,
    y,
    width,
    height,
    density,
    direction,
    isFirst,
    useCurvedPaths,
    0,
    0,
    curveControls
  ).pathSegment;
}

// Generate individual paths for a color group
export function generateIndividualPaths(
  colorGroup: ColorGroup,
  settings: Settings
): string {
  const { color, points } = colorGroup;
  const { curvedPaths, curveControls } = settings;
  // No need for a nested g element since we're already in a color group
  let svgContent = "";

  // Add each path segment
  points.forEach((point) => {
    // Skip zero-density points
    if (point.density <= 0) return;

    // Generate vertices for this tile
    const vertices = createTileVertices(
      point.x,
      point.y,
      point.width,
      point.height * (curveControls?.tileHeightScale || 1.0),
      point.density,
      point.direction
    );

    // Create path from vertices
    svgContent += createPathFromVertices(
      vertices,
      color,
      curvedPaths,
      curveControls
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
  color: string,
  useCurvedPaths: boolean = false,
  curveControls?: CurveControlSettings // Add optional curve controls parameter
): string {
  if (density <= 0) return "";

  // Generate vertices for this tile
  const vertices = createTileVertices(
    x,
    y,
    width,
    height * (curveControls?.tileHeightScale || 1.0),
    density,
    direction
  );

  // Create path from vertices
  return createPathFromVertices(vertices, color, useCurvedPaths, curveControls);
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
      console.error(`Color group with ID 'color-group-${colorKey}' not found`);
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
    newSvg.setAttribute("shape-rendering", "geometricPrecision");
    newSvg.setAttribute(
      "style",
      "stroke-linejoin: round; stroke-linecap: round;"
    );

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

    if (colorGroups.length === 0) {
      console.error("No color groups found in SVG content");
      return {};
    }

    console.log(`Found ${colorGroups.length} color groups`);

    // Process each color group
    colorGroups.forEach((group) => {
      const id = group.id;
      if (!id.startsWith("color-group-")) {
        console.warn(`Skipping group with invalid ID format: ${id}`);
        return;
      }

      const colorKey = id.replace("color-group-", "");
      console.log(`Extracting color group: ${colorKey}`);

      const extractedSvg = extractColorGroupSVG(svgContent, colorKey);

      if (extractedSvg) {
        result[colorKey] = extractedSvg;
        console.log(`Successfully extracted SVG for color key: ${colorKey}`);
      } else {
        console.error(`Failed to extract SVG for color key: ${colorKey}`);
      }
    });

    console.log(`Extracted ${Object.keys(result).length} color groups`);
    return result;
  } catch (error) {
    console.error("Error extracting all color groups:", error);
    return {};
  }
}
