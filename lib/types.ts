export type ProcessingMode = "grayscale" | "posterize" | "cmyk" | "monochrome";

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
