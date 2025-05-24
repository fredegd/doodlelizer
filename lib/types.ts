export type ProcessingMode = "grayscale" | "posterize" | "cmyk" | "monochrome";

export interface CurveControlSettings {
  // Simplified curve control parameters for the new implementation
  junctionContinuityFactor: number; // Controls the smoothness of curves (used as smoothness param)
  tileHeightScale: number; // Scale factor for tile height (0-1)
  strokeWidth: number; // Add strokeWidth property
  handleRotationAngle?: number; // Optional: Default handle rotation angle in degrees
  lowerKnotXShift?: number; // Optional: Shifts the X coordinate of lower knot points
  upperKnotShiftFactor?: number; // Optional: Factor to apply random X/Y shift to upper knot points (0-1)
  disorganizeFactor?: number; // Optional: Factor to apply random X/Y shift to each point in a path (0-1)
}

export interface Settings {
  gridSize: number;
  gridSizeX: number;
  gridSizeY: number;
  brightnessThreshold: number;
  minDensity: number;
  maxDensity: number;
  rowsCount: number;
  columnsCount: number;
  continuousPaths: boolean;
  curvedPaths: boolean;
  pathDistanceThreshold: number;
  processingMode: ProcessingMode;
  colorsAmt: number;
  monochromeColor: string;
  visiblePaths: Record<string, boolean>;
  curveControls: CurveControlSettings;
  colorGroups?: Record<string, ColorGroup>;
}

// Default values for the curve controls
export const DEFAULT_CURVE_CONTROLS: CurveControlSettings = {
  junctionContinuityFactor: 0.1, // Default smoothness factor for curves
  tileHeightScale: 0.95, // Default tile height scale (1.0 = 100% of original height)
  strokeWidth: 1, // Default stroke width
  handleRotationAngle: 0, // Default handle rotation angle in degrees
  lowerKnotXShift: 0, // Default X shift for lower knot points
  upperKnotShiftFactor: 0, // Default factor for upper knot random shift
  disorganizeFactor: 0, // Default factor for the new disorganize effect
};

export interface PixelData {
  x: number;
  y: number;
  brightness: number;
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface ImageData {
  width: number;
  height: number;
  pixels: PixelData[];
  originalWidth: number;
  originalHeight: number;
  resizedWidth: number;
  resizedHeight: number;
  outputWidth: number;
  outputHeight: number;
  columnsCount: number;
  rowsCount: number;
  tileWidth: number;
  tileHeight: number;
  colorGroups?: Record<string, ColorGroup>;
}

export interface PathPoint {
  x: number;
  y: number;
  width: number;
  height: number;
  density: number;
  row: number;
  direction: number;
  randomUpperKnotShiftX?: number; // Pre-calculated random X shift for upper knots
  randomUpperKnotShiftY?: number; // Pre-calculated random Y shift for upper knots
}

export interface ColorGroup {
  color: string;
  displayName: string;
  points: PathPoint[];
  pathData?: string;
  hue: number; // Farbton für die Sortierung im "posterize"-Modus
  brightness: number; // Helligkeit für die Sortierung im "grayscale"-Modus
}

export interface CMYKValues {
  cyan: number;
  magenta: number;
  yellow: number;
  black: number;
}
