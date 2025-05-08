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
  const { curvedPaths, curveControls } = settings;

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
  let lastTangentX = 0; // Track the last tangent direction X component
  let lastTangentY = 0; // Track the last tangent direction Y component

  // Process each point in order
  for (let i = 0; i < points.length; i++) {
    const point = points[i];

    // Variables to track incoming tangent for this segment
    let incomingTangentX = 0;
    let incomingTangentY = 0;

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
        svgContent += `<path d="${pathData}" stroke="${color}" fill="none" stroke-width="1" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />\n`;
        pathData = "";
      }

      // Start a new path
      pathData = `M ${point.x} ${point.y} `;
      firstPoint = false;
      // Reset tangent tracking for new paths
      lastTangentX = 0;
      lastTangentY = 0;
    } else if (lastPoint && curvedPaths && !needNewPath) {
      // Add a smooth connection between tiles using a Bézier curve
      // Only add if we have curved paths enabled and a valid last point
      const distX = point.x - lastPoint.x;
      const distY = point.y - lastPoint.y;

      // Use the tangent direction modifiers to adjust the tangent direction
      // This allows for fine-tuning the junction curve shape
      let tangentX = lastTangentX + curveControls.junctionTangentDirectionX;
      let tangentY = lastTangentY + curveControls.junctionTangentDirectionY;

      // Apply continuity factor to balance between original tangent and optimal new direction
      // Higher values preserve the original tangent more strictly
      const continuityFactor = curveControls.junctionContinuityFactor;
      const idealTangentX = distX > 0 ? 1 : -1;
      const idealTangentY = distY > 0 ? 1 : -1;

      // Blend between ideal tangent and current tangent based on continuity factor
      tangentX =
        tangentX * continuityFactor + idealTangentX * (1 - continuityFactor);
      tangentY =
        tangentY * continuityFactor + idealTangentY * (1 - continuityFactor);

      // Determine if this is primarily a horizontal or vertical junction
      // to apply the appropriate smoothing factor
      const isHorizontalJunction = Math.abs(distX) > Math.abs(distY);
      const smoothingFactor = isHorizontalJunction
        ? curveControls.horizontalJunctionSmoothing
        : curveControls.verticalJunctionSmoothing;

      // ENHANCED BÉZIER CURVE MATHEMATICS FOR PERFECT TANGENT CONTINUITY

      // Normalize tangent vectors for better mathematical handling
      const tangentMagnitude = Math.sqrt(
        tangentX * tangentX + tangentY * tangentY
      );
      if (tangentMagnitude > 0) {
        tangentX = tangentX / tangentMagnitude;
        tangentY = tangentY / tangentMagnitude;
      }

      // Calculate the optimal distance along the tangent for control points
      // This is critical for maintaining C1 continuity (matching both position and tangent direction)
      const junctionLength = Math.sqrt(distX * distX + distY * distY);

      // For smooth Bézier curves, a common rule is using 1/3 of the distance for control points
      // Here we allow the scale factors to adjust this proportion
      const firstCtrlDistance =
        junctionLength *
        curveControls.junctionFirstControlScale *
        smoothingFactor;
      const secondCtrlDistance =
        junctionLength *
        curveControls.junctionSecondControlScale *
        smoothingFactor;

      // Project the first control point along the exit tangent direction from last point
      const ctrl1X = lastPoint.x + tangentX * firstCtrlDistance;
      const ctrl1Y = lastPoint.y + tangentY * firstCtrlDistance;

      // For the second control point, we need to use the negative incoming tangent at the next point
      // This ensures the curve arrives at the next point with the correct tangent direction

      // Calculate the incoming tangent direction at the next point
      // For perfect C1 continuity, we want this to align with the first segment of the next tile
      incomingTangentX = -distX / junctionLength; // Default to direction opposite of path
      incomingTangentY = -distY / junctionLength;

      // Adjust the incoming tangent based on the next tile's expected direction
      // This is a sophisticated calculation that ensures the curve flows naturally into the next tile

      // For vertical segments, the incoming tangent should ideally be vertical (0,±1)
      // For horizontal segments, the incoming tangent should ideally be horizontal (±1,0)
      // We blend between these based on the continuity factor

      // Calculate ideal incoming tangent based on next segment's primary direction
      let idealIncomingTangentX = 0;
      let idealIncomingTangentY = 0;

      // Determine the primary direction of the next segment
      if (i + 1 < points.length) {
        const nextPoint = points[i + 1];
        const nextDistX = nextPoint.x - point.x;
        const nextDistY = nextPoint.y - point.y;
        const isPrimaryHorizontal = Math.abs(nextDistX) > Math.abs(nextDistY);

        if (isPrimaryHorizontal) {
          idealIncomingTangentX = nextDistX > 0 ? 1 : -1;
          idealIncomingTangentY = 0;
        } else {
          idealIncomingTangentX = 0;
          idealIncomingTangentY = nextDistY > 0 ? 1 : -1;
        }
      }

      // Blend between default and ideal incoming tangent
      incomingTangentX =
        incomingTangentX * (1 - continuityFactor) +
        idealIncomingTangentX * continuityFactor;
      incomingTangentY =
        incomingTangentY * (1 - continuityFactor) +
        idealIncomingTangentY * continuityFactor;

      // Normalize the incoming tangent
      const incomingTangentMagnitude = Math.sqrt(
        incomingTangentX * incomingTangentX +
          incomingTangentY * incomingTangentY
      );
      if (incomingTangentMagnitude > 0) {
        incomingTangentX = incomingTangentX / incomingTangentMagnitude;
        incomingTangentY = incomingTangentY / incomingTangentMagnitude;
      }

      // Project the second control point along the incoming tangent direction toward the next point
      const ctrl2X = point.x + incomingTangentX * secondCtrlDistance;
      const ctrl2Y = point.y + incomingTangentY * secondCtrlDistance;

      // Use a cubic Bézier curve to smoothly connect the tiles with perfect tangent continuity
      pathData += `C ${ctrl1X},${ctrl1Y} ${ctrl2X},${ctrl2Y} ${point.x},${point.y} `;
    }

    // Generate path data for this tile
    const { pathSegment, exitTangentX, exitTangentY } =
      createTilePathDataWithTangent(
        point.x,
        point.y,
        point.width,
        point.height,
        point.density,
        point.direction,
        pathData.length === 0, // isFirst is true only if pathData is empty
        curvedPaths, // Parameter für geschwungene Pfade
        incomingTangentX || lastTangentX, // Pass the calculated incoming tangent if available
        incomingTangentY || lastTangentY, // Otherwise use the last tangent
        curveControls // Pass curve controls to the function
      );

    if (pathSegment) {
      pathData += pathSegment;
      // Update the last tangent for connecting to the next tile
      lastTangentX = exitTangentX;
      lastTangentY = exitTangentY;
    }

    // Update the last point
    lastPoint = point;
  }

  // Add the final path to SVG content if it's not empty
  if (pathData) {
    svgContent += `<path d="${pathData}" stroke="${color}" fill="none" stroke-width="1" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />\n`;
  }

  return svgContent;
}

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
  curveControls?: CurveControlSettings // Added curve control settings parameter
): { pathSegment: string; exitTangentX: number; exitTangentY: number } {
  if (density <= 0)
    return { pathSegment: "", exitTangentX: 0, exitTangentY: 0 };

  // Use default values if curve controls are not provided
  const controls = curveControls || {
    verticalCurveOffsetX: 0.5,
    verticalCurveFirstPointY: 0.3,
    verticalCurveSecondPointY: 0.7,
    horizontalCurveOffsetX: 0.4,
    horizontalCurveOffsetY: 0.15,
    horizontalCurveFirstPointX: 0.35,
    horizontalCurveSecondPointX: 0.35,
    junctionFirstControlScale: 0.4,
    junctionSecondControlScale: 0.3,
    junctionTangentDirectionX: 0.0,
    junctionTangentDirectionY: 0.0,
    horizontalJunctionSmoothing: 0.5,
    verticalJunctionSmoothing: 0.5,
    junctionContinuityFactor: 0.7,
    tileHeightScale: 1.0,
  };

  // Apply tile height scaling
  const scaledHeight = height * controls.tileHeightScale;

  let pathData = "";
  let exitTangentX = 0;
  let exitTangentY = 0;

  // If this is the first point in the path, start with a move command
  if (isFirst) {
    pathData = `M ${x} ${y} `;
  }

  if (useCurvedPaths) {
    // Enhanced implementation with perfect tangential continuity between all segments

    // Calculate the step width based on density
    const step = width / density;

    // Keep track of current position
    let currentX = x;
    let currentY = y;
    let isDown = true;

    // Normalize incoming tangent if provided
    if (incomingTangentX !== 0 || incomingTangentY !== 0) {
      const magnitude = Math.sqrt(
        incomingTangentX * incomingTangentX +
          incomingTangentY * incomingTangentY
      );
      if (magnitude > 0) {
        incomingTangentX /= magnitude;
        incomingTangentY /= magnitude;
      }
    }

    // For each segment in the zigzag pattern
    for (let i = 0; i < density; i++) {
      // Next X position for this segment
      const nextX = x + (i + 1) * step * direction;

      if (isDown) {
        // VERTICAL SEGMENT (DOWN)
        // Calculate optimal control points for smooth curve with perfect tangent continuity

        // For the first segment in the tile, use the incoming tangent if available
        let tangentStartX, tangentStartY;
        if (i === 0 && (incomingTangentX !== 0 || incomingTangentY !== 0)) {
          tangentStartX = incomingTangentX;
          tangentStartY = incomingTangentY;
        } else {
          // Default tangent for start of downward segment is horizontal with desired direction
          tangentStartX = direction;
          tangentStartY = 0;
        }

        // End tangent for downward segment is pointing horizontally
        const tangentEndX = direction;
        const tangentEndY = 0;

        // First control point - extend from current point along incoming tangent
        const ctrl1X =
          currentX +
          tangentStartX * scaledHeight * controls.verticalCurveFirstPointY;
        const ctrl1Y =
          currentY +
          tangentStartY * scaledHeight * controls.verticalCurveFirstPointY;

        // Second control point - approach endpoint from the desired exit tangent direction
        const endX = currentX;
        const endY = currentY + scaledHeight;
        const ctrl2X =
          endX -
          tangentEndX * scaledHeight * controls.verticalCurveSecondPointY;
        const ctrl2Y =
          endY -
          tangentEndY * scaledHeight * controls.verticalCurveSecondPointY;

        // Add the cubic Bézier curve
        pathData += `C ${ctrl1X},${ctrl1Y} ${ctrl2X},${ctrl2Y} ${endX},${endY} `;

        // Update position for next segment
        currentY = endY;

        // Set the exit tangent to pass to the next segment
        exitTangentX = tangentEndX;
        exitTangentY = tangentEndY;
      } else {
        // VERTICAL SEGMENT (UP)
        // Calculate optimal control points for smooth curve with perfect tangent continuity

        // Start tangent for upward segment is pointing horizontally
        const tangentStartX = direction;
        const tangentStartY = 0;

        // End tangent for upward segment is also horizontal
        const tangentEndX = direction;
        const tangentEndY = 0;

        // First control point - extend from current point along start tangent
        const ctrl1X =
          currentX +
          tangentStartX * scaledHeight * controls.verticalCurveFirstPointY;
        const ctrl1Y =
          currentY +
          tangentStartY * scaledHeight * controls.verticalCurveFirstPointY;

        // Second control point - approach endpoint from the desired exit tangent direction
        const endX = currentX;
        const endY = currentY - scaledHeight;
        const ctrl2X =
          endX -
          tangentEndX * scaledHeight * controls.verticalCurveSecondPointY;
        const ctrl2Y =
          endY -
          tangentEndY * scaledHeight * controls.verticalCurveSecondPointY;

        // Add the cubic Bézier curve
        pathData += `C ${ctrl1X},${ctrl1Y} ${ctrl2X},${ctrl2Y} ${endX},${endY} `;

        // Update position for next segment
        currentY = endY;

        // Set the exit tangent to pass to the next segment
        exitTangentX = tangentEndX;
        exitTangentY = tangentEndY;
      }

      // If this is not the last segment, add a horizontal curve
      if (i < density - 1) {
        // HORIZONTAL SEGMENT
        // Calculate optimal control points for a smooth horizontal curve

        // Calculate horizontal distance to next segment point
        const horizontalDist = nextX - currentX;

        // Start tangent for horizontal segment
        // Should match exit tangent of previous vertical segment for continuity
        let tangentStartX = exitTangentX;
        let tangentStartY = exitTangentY;

        // End tangent for horizontal segment needs to prepare for next vertical segment
        // For perfect tangential continuity, the end tangent should be vertical
        const tangentEndX = 0;
        const tangentEndY = isDown ? -1 : 1; // Points up if we're going down next, and vice versa

        // First control point - extend from current point along start tangent
        // Use one-third rule for cubic Bézier - but allow adjustment through control parameters
        const hCtrl1X =
          currentX + horizontalDist * controls.horizontalCurveFirstPointX;
        const hCtrl1Y =
          currentY +
          ((isDown ? -1 : 1) *
            scaledHeight *
            controls.horizontalCurveOffsetY *
            Math.abs(horizontalDist)) /
            width;

        // Second control point - approach endpoint from the desired exit tangent direction
        const hCtrl2X =
          nextX - horizontalDist * controls.horizontalCurveSecondPointX;
        const hCtrl2Y =
          currentY +
          ((isDown ? -1 : 1) *
            scaledHeight *
            controls.horizontalCurveOffsetY *
            Math.abs(horizontalDist)) /
            width;

        // Add the cubic Bézier curve
        pathData += `C ${hCtrl1X},${hCtrl1Y} ${hCtrl2X},${hCtrl2Y} ${nextX},${currentY} `;

        // Update position for next segment
        currentX = nextX;

        // Set the exit tangent to pass to the next segment
        exitTangentX = tangentEndX;
        exitTangentY = tangentEndY;
      }

      // Toggle direction for next segment
      isDown = !isDown;
    }
  } else {
    // Original straight line implementation - also apply height scaling
    const step = width / density;

    for (let i = 0; i < density; i++) {
      const currentX = x + i * step * direction;
      const nextX = x + (i + 1) * step * direction;

      if (i % 2 === 0) {
        // Vertikales Segment (abwärts)
        pathData += `L ${currentX} ${y + scaledHeight} `;

        // Wenn nicht das letzte Segment, füge horizontales Segment hinzu
        if (i < density - 1) {
          pathData += `L ${nextX} ${y + scaledHeight} `;
        } else if (density % 2 === 1) {
          // Falls dies das letzte Segment ist und die Dichte ungerade
          pathData += `L ${nextX} ${y + scaledHeight} `;
        }

        // Set exit tangent for straight lines
        exitTangentX = direction;
        exitTangentY = 0;
      } else {
        // Vertikales Segment (aufwärts)
        pathData += `L ${currentX} ${y} `;

        // Wenn nicht das letzte Segment, füge horizontales Segment hinzu
        if (i < density - 1) {
          pathData += `L ${nextX} ${y} `;
        } else if (density % 2 === 0) {
          // Falls dies das letzte Segment ist und die Dichte gerade
          pathData += `L ${nextX} ${y} `;
        }

        // Set exit tangent for straight lines
        exitTangentX = direction;
        exitTangentY = 0;
      }
    }
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
    svgContent += generateSerpentinePath(
      point.x,
      point.y,
      point.width,
      point.height,
      point.density,
      point.direction,
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

  // Use default values if curve controls are not provided
  const controls = curveControls || {
    verticalCurveOffsetX: 0.5,
    verticalCurveFirstPointY: 0.3,
    verticalCurveSecondPointY: 0.7,
    horizontalCurveOffsetX: 0.4,
    horizontalCurveOffsetY: 0.15,
    horizontalCurveFirstPointX: 0.35,
    horizontalCurveSecondPointX: 0.35,
    junctionFirstControlScale: 0.4,
    junctionSecondControlScale: 0.3,
    junctionTangentDirectionX: 0.0,
    junctionTangentDirectionY: 0.0,
    horizontalJunctionSmoothing: 0.5,
    verticalJunctionSmoothing: 0.5,
    junctionContinuityFactor: 0.7,
    tileHeightScale: 1.0,
  };

  // Apply tile height scaling
  const scaledHeight = height * controls.tileHeightScale;

  // Begin the path
  let pathData = `<path d="`;

  if (useCurvedPaths) {
    // Improved implementation using smooth bezier curves

    // Start with a move to the top-left corner
    pathData += `M ${x},${y} `;

    // Calculate the step width based on density
    const step = width / density;

    // Keep track of current position
    let currentX = x;
    let currentY = y;
    let isDown = true;

    // For each segment in the zigzag pattern
    for (let i = 0; i < density; i++) {
      // Next X position for this segment
      const nextX = x + (i + 1) * step * direction;

      if (isDown) {
        // Calculate control points for smooth S-curve going down
        const ctrlOffsetX = step * controls.verticalCurveOffsetX * direction;

        // First control point extends horizontally with slight curve
        const ctrl1X = currentX + ctrlOffsetX * 0.2;
        const ctrl1Y =
          currentY + scaledHeight * controls.verticalCurveFirstPointY;

        // Second control point approaches from below
        const ctrl2X = currentX + ctrlOffsetX * 0.1;
        const ctrl2Y =
          currentY + scaledHeight * controls.verticalCurveSecondPointY;

        // End point is directly below
        const endX = currentX;
        const endY = currentY + scaledHeight;

        // Add the bezier curve
        pathData += `C ${ctrl1X},${ctrl1Y} ${ctrl2X},${ctrl2Y} ${endX},${endY} `;

        // Update current position
        currentY = endY;
      } else {
        // Calculate control points for smooth S-curve going up
        const ctrlOffsetX = step * controls.verticalCurveOffsetX * direction;

        // First control point extends horizontally with slight curve
        const ctrl1X = currentX - ctrlOffsetX * 0.2;
        const ctrl1Y =
          currentY - scaledHeight * controls.verticalCurveFirstPointY;

        // Second control point approaches from above
        const ctrl2X = currentX - ctrlOffsetX * 0.1;
        const ctrl2Y =
          currentY - scaledHeight * controls.verticalCurveSecondPointY;

        // End point is directly above
        const endX = currentX;
        const endY = currentY - scaledHeight;

        // Add the bezier curve
        pathData += `C ${ctrl1X},${ctrl1Y} ${ctrl2X},${ctrl2Y} ${endX},${endY} `;

        // Update current position
        currentY = endY;
      }

      // If this is not the last segment, add a horizontal curve
      if (i < density - 1) {
        // Calculate horizontal distance to next segment point
        const horizontalDist = nextX - currentX;

        // Enhanced horizontal curve with better tangent continuity using specific control points
        // First control point - use specific horizontal offset value
        const hCtrl1X =
          currentX + horizontalDist * controls.horizontalCurveFirstPointX;
        const hCtrl1Y =
          currentY +
          (isDown ? -1 : 1) * scaledHeight * controls.horizontalCurveOffsetY;

        // Second control point - use specific horizontal offset value
        const hCtrl2X =
          nextX - horizontalDist * controls.horizontalCurveSecondPointX;
        const hCtrl2Y =
          currentY +
          (isDown ? -1 : 1) * scaledHeight * controls.horizontalCurveOffsetY;

        // Add the horizontal bezier curve
        pathData += `C ${hCtrl1X},${hCtrl1Y} ${hCtrl2X},${hCtrl2Y} ${nextX},${currentY} `;

        // Update current position
        currentX = nextX;
      }

      // Toggle direction for next segment
      isDown = !isDown;
    }
  } else {
    // Original implementation with straight lines
    // Initialize with position in the top left corner
    pathData += `M ${x} ${y}`;
    const step = width / density;

    // For each segment in the zigzag pattern
    for (let i = 0; i < density; i++) {
      const currentX = x + i * step * direction;
      const nextX = x + (i + 1) * step * direction;

      if (i % 2 === 0) {
        // Vertikales Segment (abwärts)
        pathData += ` L ${currentX} ${y + scaledHeight}`;

        // Wenn nicht das letzte Segment, füge horizontales Segment hinzu
        if (i < density - 1) {
          pathData += ` L ${nextX} ${y + scaledHeight}`;
        } else if (density % 2 === 1) {
          // Falls dies das letzte Segment ist und die Dichte ungerade
          pathData += ` L ${nextX} ${y + scaledHeight}`;
        }
      } else {
        // Vertikales Segment (aufwärts)
        pathData += ` L ${currentX} ${y}`;

        // Wenn nicht das letzte Segment, füge horizontales Segment hinzu
        if (i < density - 1) {
          pathData += ` L ${nextX} ${y}`;
        } else if (density % 2 === 0) {
          // Falls dies das letzte Segment ist und die Dichte gerade
          pathData += ` L ${nextX} ${y}`;
        }
      }
    }
  }

  // Close the path and add style properties
  pathData += `" stroke="${color}" fill="none" stroke-width="1" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />\n`;

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
