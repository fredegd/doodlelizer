"use client"

import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Info } from "lucide-react"
import type { Settings, ProcessingMode } from "@/lib/types"
import { useMemo } from "react"

interface SettingsPanelProps {
  settings: Settings
  onSettingsChange: (newSettings: Partial<Settings>) => void
  disabled: boolean
}

export default function SettingsPanel({ settings, onSettingsChange, disabled }: SettingsPanelProps) {
  const handleProcessingModeChange = (value: ProcessingMode) => {
    onSettingsChange({ processingMode: value })
  }

  // Berechne die Max Density basierend auf der Kachelbreite
  const calculatedDensity = useMemo(() => {
    const MAX_DIMENSION = 560; // Feste maximale Dimension wie in image-processor.ts
    // Berechne die Ausgabebreite basierend auf dem festen MAX_DIMENSION
    let outputWidth = MAX_DIMENSION;

    // Berechne die Kachelbreite
    let tileWidth = Math.floor(outputWidth / settings.columnsCount);
    tileWidth = tileWidth % 2 === 0 ? tileWidth : tileWidth - 1;
    // Gib die berechnete Kachelbreite als maxDensity zurück
    return tileWidth * 2;
  }, [settings.columnsCount]);

  return (
    <TooltipProvider>
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Settings</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-3 text-gray-300">Processing Mode</h3>
            <RadioGroup
              value={settings.processingMode}
              onValueChange={(value) => handleProcessingModeChange(value as ProcessingMode)}
              className="space-y-2"
              disabled={disabled}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monochrome" id="monochrome" />
                <Label htmlFor="monochrome" className="cursor-pointer">
                  Monochrome
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Creates a single-color path with density based on brightness</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="grayscale" id="grayscale" />
                <Label htmlFor="grayscale" className="cursor-pointer">
                  Grayscale
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Converts image to grayscale levels</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="posterize" id="posterize" />
                <Label htmlFor="posterize" className="cursor-pointer">
                  Posterize
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Reduces image to limited color palette</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cmyk" id="cmyk" />
                <Label htmlFor="cmyk" className="cursor-pointer">
                  CMYK
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Separates image into Cyan, Magenta, Yellow, and Black channels</p>
                  </TooltipContent>
                </Tooltip>
              </div>

            </RadioGroup>

            {(settings.processingMode === "grayscale" || settings.processingMode === "posterize") && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="colorsAmt">
                    {settings.processingMode === "grayscale" ? "Gray Levels" : "Colors"}: {settings.colorsAmt}
                  </Label>
                </div>
                <Slider
                  id="colorsAmt"
                  min={2}
                  max={10}
                  step={1}
                  value={[settings.colorsAmt]}
                  onValueChange={(value) => onSettingsChange({ colorsAmt: value[0] })}
                  disabled={disabled}
                />
                <p className="text-xs text-gray-400">
                  {settings.processingMode === "grayscale"
                    ? "Number of grayscale levels"
                    : "Number of colors in the palette"}
                </p>
              </div>
            )}

            {settings.processingMode === "monochrome" && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="monochromeColor">Path Color</Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-600"
                      style={{ backgroundColor: settings.monochromeColor }}
                    />
                    <input
                      id="monochromeColor"
                      type="color"
                      value={settings.monochromeColor}
                      onChange={(e) => onSettingsChange({ monochromeColor: e.target.value })}
                      disabled={disabled}
                      className="w-0 h-0 opacity-0 absolute"
                    />
                    <button
                      className="text-xs text-gray-400 hover:text-white"
                      onClick={() => document.getElementById('monochromeColor')?.click()}
                      disabled={disabled}
                    >
                      Change
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Color for the monochrome path
                </p>
              </div>
            )}
          </div>

          <Separator className="bg-gray-700" />

          <div>
            <h3 className="text-sm font-medium mb-3 text-gray-300">Image Tiling</h3>
            <div className="space-y-2 mb-2 text-xs text-gray-400">
              <p>The output vector will maintain a fixed width/height of 560px based on aspect ratio.</p>
              <p>Grid sizes are automatically calculated to maintain proper scaling.</p>
            </div>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="columnsCount">Columns: {settings.columnsCount}</Label>
                </div>
                <Slider
                  id="columnsCount"
                  min={1}
                  max={200}
                  step={1}
                  value={[settings.columnsCount]}
                  onValueChange={(value) => onSettingsChange({ columnsCount: value[0] })}
                  disabled={disabled}
                />
                <p className="text-xs text-gray-400">Number of horizontal tiles</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="rowsCount">Rows: {settings.rowsCount}</Label>
                </div>
                <Slider
                  id="rowsCount"
                  min={1}
                  max={200}
                  step={1}
                  value={[settings.rowsCount]}
                  onValueChange={(value) => onSettingsChange({ rowsCount: value[0] })}
                  disabled={disabled}
                />
                <p className="text-xs text-gray-400">Number of vertical tiles</p>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          <div>
            <h3 className="text-sm font-medium mb-3 text-gray-300">Vector Generation</h3>
            <div className="space-y-4">
              {settings.processingMode !== "cmyk" && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="brightnessThreshold">Brightness Threshold: {settings.brightnessThreshold}</Label>
                  </div>
                  <Slider
                    id="brightnessThreshold"
                    min={0}
                    max={255}
                    step={1}
                    value={[settings.brightnessThreshold]}
                    onValueChange={(value) => onSettingsChange({ brightnessThreshold: value[0] })}
                    disabled={disabled}
                  />
                  <p className="text-xs text-gray-400">Determines which pixels are included in the output</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="continuousPaths" className="flex items-center gap-2">
                  Continuous Paths
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        When enabled, creates a single continuous path per color. When disabled, creates separate paths
                        for each tile.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Switch
                  id="continuousPaths"
                  checked={settings.continuousPaths}
                  onCheckedChange={(checked) => onSettingsChange({ continuousPaths: checked })}
                  disabled={disabled}
                />
              </div>

              <div className="flex items-center justify-between mt-3">
                <Label htmlFor="curvedPaths" className="flex items-center gap-2">
                  Curved Paths
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        When enabled, creates smooth, curved paths. When disabled, uses straight lines with sharp corners.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Switch
                  id="curvedPaths"
                  checked={settings.curvedPaths}
                  onCheckedChange={(checked) => onSettingsChange({ curvedPaths: checked })}
                  disabled={disabled}
                />
              </div>

              {settings.continuousPaths && (
                <div className="space-y-2 mt-3 ml-4">
                  <div className="flex justify-between">
                    <Label htmlFor="pathDistanceThreshold" className="flex items-center gap-2">
                      Path Distance Threshold: {settings.pathDistanceThreshold}
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            When distance between two points exceeds this threshold, the path breaks and starts a new one with the same color.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                  </div>
                  <Slider
                    id="pathDistanceThreshold"
                    min={1}
                    max={200}
                    step={1}
                    value={[settings.pathDistanceThreshold]}
                    onValueChange={(value) => onSettingsChange({ pathDistanceThreshold: value[0] })}
                    disabled={disabled}
                  />
                  <p className="text-xs text-gray-400">Higher values allow longer connections between points</p>
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-gray-700" />

          <div>
            <h3 className="flex items-center gap-2 text-sm font-medium mb-3 text-gray-300">
              Serpentine Path
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Density controls how many zigzags appear in each tile. Darker pixels have more zigzags, creating a
                    denser pattern.
                  </p>
                </TooltipContent>
              </Tooltip>
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="minDensity">Min Density: {settings.minDensity}</Label>
                </div>
                <Slider
                  id="minDensity"
                  min={0}
                  max={calculatedDensity}
                  step={1}
                  value={[Math.min(settings.minDensity, calculatedDensity)]}
                  onValueChange={(value) => onSettingsChange({ minDensity: value[0] })}
                  disabled={disabled}
                />
                <p className="text-xs text-gray-400">Minimum zigzag density for bright areas (auto-adjusted to tile width: {calculatedDensity / 2}px)
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="maxDensity">Max Density: {settings.maxDensity}</Label>
                </div>
                <Slider
                  id="maxDensity"
                  min={2}
                  max={calculatedDensity}
                  step={1}
                  value={[Math.min(settings.maxDensity, calculatedDensity)]}
                  onValueChange={(value) => onSettingsChange({ maxDensity: value[0] })}
                  disabled={disabled}
                />
                <p className="text-xs text-gray-400">
                  Maximum zigzag density for dark areas (auto-adjusted to tile width: {calculatedDensity / 2}px)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
