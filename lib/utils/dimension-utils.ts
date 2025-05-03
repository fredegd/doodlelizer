// Calculate resize dimensions based on aspect ratio with fixed output dimensions
export function calculateResizeDimensions(
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
