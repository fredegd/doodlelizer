export type ProcessingMode = "grayscale" | "posterize" | "cmyk" | "monochrome";

export interface CurveControlSettings {
  // Vertical curve control parameters
  verticalCurveOffsetX: number; // Horizontal offset factor for control points in vertical curves
  verticalCurveFirstPointY: number; // Vertical position factor for first control point in vertical curves
  verticalCurveSecondPointY: number; // Vertical position factor for second control point in vertical curves

  // Horizontal curve control parameters
  horizontalCurveOffsetX: number; // Horizontal offset factor for control points in horizontal curves
  horizontalCurveOffsetY: number; // Vertical offset factor for control points in horizontal curves
  horizontalCurveFirstPointX: number; // Specific horizontal offset for first control point (0-1)
  horizontalCurveSecondPointX: number; // Specific horizontal offset for second control point (0-1)

  // Tile junction control parameters
  junctionFirstControlScale: number; // Scale factor for first control point at tile junctions (0-1)
  junctionSecondControlScale: number; // Scale factor for second control point at tile junctions (0-1)

  // Enhanced junction tangent control parameters
  junctionTangentDirectionX: number; // Modifier for tangent direction X component at junctions (-4 to 4)
  junctionTangentDirectionY: number; // Modifier for tangent direction Y component at junctions (-4 to 4)
  horizontalJunctionSmoothing: number; // Smoothness factor for horizontal tile transitions
  verticalJunctionSmoothing: number; // Smoothness factor for vertical tile transitions
  junctionContinuityFactor: number; // Controls how strictly the tangent continuity is preserved at junctions

  // Tile size parameters
  tileHeightScale: number; // Scale factor for tile height (0-1)
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
  curvedPaths: boolean; // Option für geschwungene statt eckiger Pfade
  pathDistanceThreshold: number;
  processingMode: ProcessingMode;
  colorsAmt: number;
  monochromeColor: string;
  visiblePaths: Record<string, boolean>;
  curveControls: CurveControlSettings; // Added curve control settings
}

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
