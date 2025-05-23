"use client"

import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { RotateCcw, Info, ChevronDown } from "lucide-react"
import type { Settings, CurveControlSettings, ImageData as ProcessedDataType } from "@/lib/types"
import { DEFAULT_CURVE_CONTROLS } from "@/lib/types"
import { useMemo } from "react"

import ProcessingModeSettings from "./settings/processing-mode-settings"
import ImageTilingSettings from "./settings/image-tiling-settings"
import PathDensitySettings from "./settings/path-density-settings"
import VectorGenerationSettings from "./settings/vector-generation-settings"
import CurveStyleSettings from "./settings/curve-style-settings"
import PathVisibilitySettings from "./settings/path-visibility-settings"

interface SettingsPanelProps {
  settings: Settings
  onSettingsChange: (newSettings: Partial<Settings>) => void
  disabled: boolean
  curveControls: CurveControlSettings
  onCurveControlsChange: (newControls: Partial<CurveControlSettings>) => void
  processedData: ProcessedDataType | null
}

export default function SettingsPanel({
  settings,
  onSettingsChange,
  disabled,
  curveControls,
  onCurveControlsChange,
  processedData
}: SettingsPanelProps) {
  const calculatedDensity = useMemo(() => {
    const MAX_DIMENSION = 560;
    let outputWidth = MAX_DIMENSION;
    let tileWidth = Math.floor(outputWidth / settings.columnsCount);
    tileWidth = tileWidth % 2 === 0 ? tileWidth : tileWidth - 1;
    return tileWidth * 2;
  }, [settings.columnsCount]);

  const resetAdvancedCurveControlsToDefaults = () => {
    onCurveControlsChange(DEFAULT_CURVE_CONTROLS);
  };

  return (
    <div className="space-y-6 px-4 py-2 ">


      <ImageTilingSettings
        settings={settings}
        onSettingsChange={onSettingsChange}
        disabled={disabled}
      />

      <Separator className="bg-gray-700" />

      <PathDensitySettings
        settings={settings}
        onSettingsChange={onSettingsChange}
        disabled={disabled}
        calculatedDensity={calculatedDensity}
      />

      <Separator className="bg-gray-700" />

      <VectorGenerationSettings
        settings={settings}
        onSettingsChange={onSettingsChange}
        disabled={disabled}
      />

      <Separator className="bg-gray-700" />

      <CurveStyleSettings
        settings={settings}
        onSettingsChange={onSettingsChange}
        curveControls={curveControls}
        onCurveControlsChange={onCurveControlsChange}
        disabled={disabled}
      />

      <>
        <Separator className="bg-gray-700" />
        <details className="group" >
          <summary className="cursor-pointer text-sm font-bold mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2">Advanced Path Shape Controls</h3>
            <ChevronDown className="h-5 w-5 text-gray-300 transition-transform duration-200 group-open:rotate-180" />
          </summary>

          <div className="space-y-4 mt-4  text-gray-300 px-4">
            {settings.curvedPaths && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Label htmlFor="junctionContinuityFactor-panel">
                    Curve Smoothness: {curveControls.junctionContinuityFactor.toFixed(2)}
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-300" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Controls how smooth the curves are between points (higher values create smoother curves)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Slider
                  id="junctionContinuityFactor-panel"
                  min={0.01}
                  max={0.50}
                  step={0.01}
                  value={[curveControls.junctionContinuityFactor]}
                  onValueChange={(value) => onCurveControlsChange({ junctionContinuityFactor: value[0] })}
                  disabled={disabled}
                />
              </div>
            )}

            {settings.curvedPaths && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Label htmlFor="handleRotationAngle-panel">
                    Handle Rotation: {curveControls.handleRotationAngle?.toFixed(0)}°
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-300" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Adjusts the rotation of control point handles at each vertex (in degrees).
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Slider
                  id="handleRotationAngle-panel"
                  min={-90}
                  max={90}
                  step={1}
                  value={[curveControls.handleRotationAngle || 0]}
                  onValueChange={(value) => onCurveControlsChange({ handleRotationAngle: value[0] })}
                  disabled={disabled}
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex gap-2">
                <Label htmlFor="lowerKnotXShift-panel">
                  Lower Knot X Shift: {curveControls.lowerKnotXShift?.toFixed(2)}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-300" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Shifts the X-coordinate of the lower knot points in each tile. Min/Max is based on tile width.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Slider
                id="lowerKnotXShift-panel"
                min={-settings.gridSizeX / 2}
                max={settings.gridSizeX / 2}
                step={0.1}
                value={[curveControls.lowerKnotXShift || 0]}
                onValueChange={(value) => onCurveControlsChange({ lowerKnotXShift: value[0] })}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Label htmlFor="upperKnotShiftFactor-panel">
                  Upper Knot Shift: {((curveControls.upperKnotShiftFactor || 0) * 100).toFixed(0)}%
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-300" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Adjusts the magnitude of random displacement for upper knot points. 0% means no shift, 100% applies the full pre-calculated random shift.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Slider
                id="upperKnotShiftFactor-panel"
                min={0}
                max={1}
                step={0.01}
                value={[curveControls.upperKnotShiftFactor || 0]}
                onValueChange={(value) => onCurveControlsChange({ upperKnotShiftFactor: value[0] })}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Label htmlFor="disorganizeFactor-panel">
                  Disorganize: {((curveControls.disorganizeFactor || 0) * 100).toFixed(0)}%
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-300" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Adjusts the magnitude of random displacement for each point in a path. 0% means no shift, 100% applies a full random shift.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Slider
                id="disorganizeFactor-panel"
                min={0}
                max={1}
                step={0.01}
                value={[curveControls.disorganizeFactor || 0]}
                onValueChange={(value) => onCurveControlsChange({ disorganizeFactor: value[0] })}
                disabled={disabled}
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAdvancedCurveControlsToDefaults}
                disabled={disabled}
                className="text-xs h-7"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </details>
      </>

      <Separator className="bg-gray-700" />

      {processedData?.colorGroups && Object.keys(processedData.colorGroups).length > 0 && (
        <PathVisibilitySettings
          colorGroups={processedData.colorGroups}
          visiblePaths={settings.visiblePaths}
          onSettingsChange={onSettingsChange}
          disabled={disabled}
          processingMode={settings.processingMode}
          settings={settings}
        />
      )}

      <Separator className="bg-gray-700" />

      <ProcessingModeSettings
        settings={settings}
        onSettingsChange={onSettingsChange}
        disabled={disabled}
      />

    </div>
  )
}
