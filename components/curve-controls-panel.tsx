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
    verticalCurveOffsetX: -0.78,
    verticalCurveFirstPointY: 0.11,
    verticalCurveSecondPointY: 0.11,
    horizontalCurveOffsetX: 0.4,
    horizontalCurveOffsetY: -0.08,
    horizontalCurveFirstPointX: 0.1, // Default value for specific first control point
    horizontalCurveSecondPointX: 0.1, // Default value for specific second control point
    junctionFirstControlScale: 0.99,   // Default scale for junction first control point
    junctionSecondControlScale: 0.0,   // Default scale for junction second control point

    // New enhanced junction tangent control parameters
    junctionTangentDirectionX: 0.09,    // Default modifier for tangent direction X (0 = no modification)
    junctionTangentDirectionY: -0.03,    // Default modifier for tangent direction Y (0 = no modification)
    horizontalJunctionSmoothing: 1.0,  // Default smoothness for horizontal junctions
    verticalJunctionSmoothing: 1.0,    // Default smoothness for vertical junctions
    junctionContinuityFactor: 1.0,     // Default tangent continuity preservation factor

    // Tile size parameters
    tileHeightScale: 0.95,              // Default tile height scale (1.0 = 100% of original height)
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
                                Tile Size Controls
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="h-4 w-4 text-gray-400" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">
                                            Adjust the size parameters of the pattern tiles
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </h3>

                            <div className="space-y-4 mt-4">
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

                        <Separator className="bg-gray-700" />

                        <div>
                            <h3 className="text-sm font-medium mb-3 text-gray-300 flex items-center gap-2">
                                Vertical Curve Controls
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="h-4 w-4 text-gray-400" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">
                                            Adjust the control points for vertical S-curves (up and down movements)
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </h3>

                            <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="verticalCurveOffsetX">
                                            Horizontal Offset: {curveControls.verticalCurveOffsetX.toFixed(2)}
                                        </Label>
                                    </div>
                                    <Slider
                                        id="verticalCurveOffsetX"
                                        min={-2.0}
                                        max={2.0}
                                        step={0.01}
                                        value={[curveControls.verticalCurveOffsetX]}
                                        onValueChange={(value) => onCurveControlsChange({ verticalCurveOffsetX: value[0] })}
                                        disabled={disabled}
                                    />
                                    <p className="text-xs text-gray-400">Controls horizontal extension of curve control points</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="verticalCurveFirstPointY">
                                            First Control Point Y: {curveControls.verticalCurveFirstPointY.toFixed(2)}
                                        </Label>
                                    </div>
                                    <Slider
                                        id="verticalCurveFirstPointY"
                                        min={-2.0}
                                        max={2.0}
                                        step={0.01}
                                        value={[curveControls.verticalCurveFirstPointY]}
                                        onValueChange={(value) => onCurveControlsChange({ verticalCurveFirstPointY: value[0] })}
                                        disabled={disabled}
                                    />
                                    <p className="text-xs text-gray-400">Vertical position of first control point (lower = sharper initial curve)</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="verticalCurveSecondPointY">
                                            Second Control Point Y: {curveControls.verticalCurveSecondPointY.toFixed(2)}
                                        </Label>
                                    </div>
                                    <Slider
                                        id="verticalCurveSecondPointY"
                                        min={-2.0}
                                        max={2.0}
                                        step={0.01}
                                        value={[curveControls.verticalCurveSecondPointY]}
                                        onValueChange={(value) => onCurveControlsChange({ verticalCurveSecondPointY: value[0] })}
                                        disabled={disabled}
                                    />
                                    <p className="text-xs text-gray-400">Vertical position of second control point (higher = sharper ending curve)</p>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-gray-700" />

                        <div>
                            <h3 className="text-sm font-medium mb-3 text-gray-300 flex items-center gap-2">
                                Horizontal Curve Controls
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="h-4 w-4 text-gray-400" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">
                                            Adjust the control points for horizontal curves (connecting adjacent vertical segments)
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </h3>

                            <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="horizontalCurveOffsetX">
                                            Horizontal Offset: {curveControls.horizontalCurveOffsetX.toFixed(2)}
                                        </Label>
                                    </div>
                                    <Slider
                                        id="horizontalCurveOffsetX"
                                        min={-2.0}
                                        max={2.0}
                                        step={0.01}
                                        value={[curveControls.horizontalCurveOffsetX]}
                                        onValueChange={(value) => onCurveControlsChange({ horizontalCurveOffsetX: value[0] })}
                                        disabled={disabled}
                                    />
                                    <p className="text-xs text-gray-400">How far control points extend horizontally (higher = smoother curves)</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="horizontalCurveOffsetY">
                                            Vertical Offset: {curveControls.horizontalCurveOffsetY.toFixed(2)}
                                        </Label>
                                    </div>
                                    <Slider
                                        id="horizontalCurveOffsetY"
                                        min={-2.0}
                                        max={2.0}
                                        step={0.01}
                                        value={[curveControls.horizontalCurveOffsetY]}
                                        onValueChange={(value) => onCurveControlsChange({ horizontalCurveOffsetY: value[0] })}
                                        disabled={disabled}
                                    />
                                    <p className="text-xs text-gray-400">Vertical extension of control points (higher = more pronounced curves)</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="horizontalCurveFirstPointX">
                                            First Control Point X: {curveControls.horizontalCurveFirstPointX.toFixed(2)}
                                        </Label>
                                    </div>
                                    <Slider
                                        id="horizontalCurveFirstPointX"
                                        min={0.1}
                                        max={0.9}
                                        step={0.01}
                                        value={[curveControls.horizontalCurveFirstPointX]}
                                        onValueChange={(value) => onCurveControlsChange({ horizontalCurveFirstPointX: value[0] })}
                                        disabled={disabled}
                                    />
                                    <p className="text-xs text-gray-400">Position of first control point relative to segment length</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="horizontalCurveSecondPointX">
                                            Second Control Point X: {curveControls.horizontalCurveSecondPointX.toFixed(2)}
                                        </Label>
                                    </div>
                                    <Slider
                                        id="horizontalCurveSecondPointX"
                                        min={0.1}
                                        max={0.9}
                                        step={0.01}
                                        value={[curveControls.horizontalCurveSecondPointX]}
                                        onValueChange={(value) => onCurveControlsChange({ horizontalCurveSecondPointX: value[0] })}
                                        disabled={disabled}
                                    />
                                    <p className="text-xs text-gray-400">Position of second control point relative to segment length</p>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-gray-700" />

                        <div>
                            <h3 className="text-sm font-medium mb-3 text-gray-300 flex items-center gap-2">
                                Tile Junction Controls
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="h-4 w-4 text-gray-400" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">
                                            Adjust the smoothness of connections between different tiles
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </h3>

                            <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="junctionFirstControlScale">
                                            First Control Scale: {curveControls.junctionFirstControlScale.toFixed(2)}
                                        </Label>
                                    </div>
                                    <Slider
                                        id="junctionFirstControlScale"
                                        min={-2.0}
                                        max={2.0}
                                        step={0.01}
                                        value={[curveControls.junctionFirstControlScale]}
                                        onValueChange={(value) => onCurveControlsChange({ junctionFirstControlScale: value[0] })}
                                        disabled={disabled}
                                    />
                                    <p className="text-xs text-gray-400">Influence of first control point at tile junctions (higher = extends further)</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="junctionSecondControlScale">
                                            Second Control Scale: {curveControls.junctionSecondControlScale.toFixed(2)}
                                        </Label>
                                    </div>
                                    <Slider
                                        id="junctionSecondControlScale"
                                        min={-2.0}
                                        max={2.0}
                                        step={0.01}
                                        value={[curveControls.junctionSecondControlScale]}
                                        onValueChange={(value) => onCurveControlsChange({ junctionSecondControlScale: value[0] })}
                                        disabled={disabled}
                                    />
                                    <p className="text-xs text-gray-400">Influence of second control point at tile junctions (higher = extends further)</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="junctionTangentDirectionX">
                                            Tangent Direction X: {curveControls.junctionTangentDirectionX.toFixed(2)}
                                        </Label>
                                    </div>
                                    <Slider
                                        id="junctionTangentDirectionX"
                                        min={-1.0}
                                        max={1.0}
                                        step={0.01}
                                        value={[curveControls.junctionTangentDirectionX]}
                                        onValueChange={(value) => onCurveControlsChange({ junctionTangentDirectionX: value[0] })}
                                        disabled={disabled}
                                    />
                                    <p className="text-xs text-gray-400">Modify the X component of tangent direction at junctions</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="junctionTangentDirectionY">
                                            Tangent Direction Y: {curveControls.junctionTangentDirectionY.toFixed(2)}
                                        </Label>
                                    </div>
                                    <Slider
                                        id="junctionTangentDirectionY"
                                        min={-1.0}
                                        max={1.0}
                                        step={0.01}
                                        value={[curveControls.junctionTangentDirectionY]}
                                        onValueChange={(value) => onCurveControlsChange({ junctionTangentDirectionY: value[0] })}
                                        disabled={disabled}
                                    />
                                    <p className="text-xs text-gray-400">Modify the Y component of tangent direction at junctions</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="horizontalJunctionSmoothing">
                                            Horizontal Junction Smoothing: {curveControls.horizontalJunctionSmoothing.toFixed(2)}
                                        </Label>
                                    </div>
                                    <Slider
                                        id="horizontalJunctionSmoothing"
                                        min={0.0}
                                        max={1.0}
                                        step={0.01}
                                        value={[curveControls.horizontalJunctionSmoothing]}
                                        onValueChange={(value) => onCurveControlsChange({ horizontalJunctionSmoothing: value[0] })}
                                        disabled={disabled}
                                    />
                                    <p className="text-xs text-gray-400">Adjust smoothness of horizontal tile transitions (1 = smoothest)</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="verticalJunctionSmoothing">
                                            Vertical Junction Smoothing: {curveControls.verticalJunctionSmoothing.toFixed(2)}
                                        </Label>
                                    </div>
                                    <Slider
                                        id="verticalJunctionSmoothing"
                                        min={0.0}
                                        max={1.0}
                                        step={0.01}
                                        value={[curveControls.verticalJunctionSmoothing]}
                                        onValueChange={(value) => onCurveControlsChange({ verticalJunctionSmoothing: value[0] })}
                                        disabled={disabled}
                                    />
                                    <p className="text-xs text-gray-400">Adjust smoothness of vertical tile transitions (1 = smoothest)</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="junctionContinuityFactor">
                                            Tangent Continuity: {curveControls.junctionContinuityFactor.toFixed(2)}
                                        </Label>
                                    </div>
                                    <Slider
                                        id="junctionContinuityFactor"
                                        min={0.0}
                                        max={1.0}
                                        step={0.01}
                                        value={[curveControls.junctionContinuityFactor]}
                                        onValueChange={(value) => onCurveControlsChange({ junctionContinuityFactor: value[0] })}
                                        disabled={disabled}
                                    />
                                    <p className="text-xs text-gray-400">How strictly tangent continuity is preserved at junctions (1 = strict)</p>
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-gray-400 mt-3 p-2 border border-gray-700 rounded bg-gray-900">
                            <p>Changes will be immediately visible in the preview. Adjust the sliders to find the perfect balance between smooth curves and proper path shape.</p>
                        </div>
                    </div>
                </details>
            </div>
        </TooltipProvider>
    )
} 