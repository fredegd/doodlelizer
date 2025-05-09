"use client"

import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { RotateCcw, Info } from "lucide-react"
import type { CurveControlSettings } from "@/lib/types"

interface CurveControlsPanelProps {
    curveControls: CurveControlSettings
    onCurveControlsChange: (newControls: Partial<CurveControlSettings>) => void
    disabled: boolean
}

// Default values for the curve controls
export const DEFAULT_CURVE_CONTROLS: CurveControlSettings = {
    junctionContinuityFactor: 0.1,     // Default smoothness factor for curves
    tileHeightScale: 0.95,             // Default tile height scale (1.0 = 100% of original height)
}

export default function CurveControlsPanel({
    curveControls,
    onCurveControlsChange,
    disabled
}: CurveControlsPanelProps) {
    const resetToDefaults = () => {
        onCurveControlsChange(DEFAULT_CURVE_CONTROLS)
    }

    return (
        <TooltipProvider>
            <div className="bg-gray-800 rounded-lg p-6">
                <details open>
                    <summary className="cursor-pointer text-xl font-bold mb-4 flex items-center justify-between">
                        <span>Curve Controls</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.preventDefault();
                                resetToDefaults();
                            }}
                            disabled={disabled}
                            className="text-xs"
                        >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reset
                        </Button>
                    </summary>

                    <div className="space-y-6 mt-4">
                        <div>
                            <h3 className="text-sm font-medium mb-3 text-gray-300 flex items-center gap-2">
                                Curve Settings
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="h-4 w-4 text-gray-400" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">
                                            Adjust the curve smoothness and tile height
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </h3>

                            <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="junctionContinuityFactor">
                                            Curve Smoothness: {curveControls.junctionContinuityFactor.toFixed(2)}
                                        </Label>
                                    </div>
                                    <Slider
                                        id="junctionContinuityFactor"
                                        min={0.01}
                                        max={0.50}
                                        step={0.01}
                                        value={[curveControls.junctionContinuityFactor]}
                                        onValueChange={(value) => onCurveControlsChange({ junctionContinuityFactor: value[0] })}
                                        disabled={disabled}
                                    />
                                    <p className="text-xs text-gray-400">Controls how smooth the curves are between points (higher values create smoother curves)</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="tileHeightScale">
                                            Tile Height: {(curveControls.tileHeightScale * 100).toFixed(0)}%
                                        </Label>
                                    </div>
                                    <Slider
                                        id="tileHeightScale"
                                        min={0.1}
                                        max={1.0}
                                        step={0.01}
                                        value={[curveControls.tileHeightScale]}
                                        onValueChange={(value) => onCurveControlsChange({ tileHeightScale: value[0] })}
                                        disabled={disabled}
                                    />
                                    <p className="text-xs text-gray-400">Adjusts the vertical height of pattern tiles (lower values create flatter patterns)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </details>
            </div>
        </TooltipProvider>
    )
} 