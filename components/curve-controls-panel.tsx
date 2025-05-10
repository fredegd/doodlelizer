"use client"

import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { RotateCcw, Info } from "lucide-react"
import type { CurveControlSettings, Settings } from "@/lib/types"
import { Switch } from "@/components/ui/switch"
import Image from "next/image"

interface CurveControlsPanelProps {
    settings: Settings
    curveControls: CurveControlSettings
    onCurveControlsChange: (newControls: Partial<CurveControlSettings>) => void
    onSettingsChange: (newSettings: Partial<Settings>) => void
    disabled: boolean
}

// Default values for the curve controls
export const DEFAULT_CURVE_CONTROLS: CurveControlSettings = {
    junctionContinuityFactor: 0.1,     // Default smoothness factor for curves
    tileHeightScale: 0.95,             // Default tile height scale (1.0 = 100% of original height)
}

export default function CurveControlsPanel({
    settings,
    curveControls,
    onCurveControlsChange,
    onSettingsChange,
    disabled
}: CurveControlsPanelProps) {
    const resetToDefaults = () => {
        onCurveControlsChange(DEFAULT_CURVE_CONTROLS)
    }

    return (
        <TooltipProvider>
            <div className="bg-gray-800/70 backdrop-blur rounded-lg p-6">

                <div className="flex w-full justify-between">
                    <h3 className="text-sm font-medium mb-3 text-gray-300">Matrix: </h3>
                    <div className="flex items-center gap-2 mb-4">
                        <Image
                            src="/squared-paths.svg"
                            alt="Squared paths"
                            width={24}
                            height={24}
                            className={`w-6 h-6 transition-all duration-200 ${settings.curvedPaths ? 'opacity-50' : 'opacity-100'} hover:opacity-100 [filter:invert(1)_brightness(0.8)] hover:[filter:invert(1)_brightness(1)_sepia(1)_saturate(5)_hue-rotate(170deg)]`}
                        />
                        <Switch
                            id="curvedPaths"
                            checked={settings.curvedPaths}
                            onCheckedChange={(checked) => onSettingsChange({ curvedPaths: checked })}
                            disabled={disabled}
                        />
                        <Image
                            src="/curved-paths.svg"
                            alt="Curved paths"
                            width={24}
                            height={24}
                            className={`w-6 h-6 transition-all duration-200 ${!settings.curvedPaths ? 'opacity-50' : 'opacity-100'} hover:opacity-100 [filter:invert(1)_brightness(0.8)] hover:[filter:invert(1)_brightness(1)_sepia(1)_saturate(5)_hue-rotate(170deg)]`}
                        />
                    </div>
                </div>

                <details open >
                    <summary className="cursor-pointer text-xl font-bold mb-4 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-sm font-medium  text-gray-300">
                            {settings.curvedPaths ? "Curved" : "Square"} Paths
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
                        </h3>
                    </summary>

                    <div className=" flex flex-col gap-4 ">
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Label htmlFor="tileHeightScale">
                                    Tile Height: {(curveControls.tileHeightScale * 100).toFixed(0)}%
                                </Label>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="h-4 w-4 text-gray-400" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">
                                            Adjusts the vertical height of pattern tiles (lower values create flatter patterns)
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
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
                        </div>
                        {settings.curvedPaths && (
                            <div className=" flex flex-col gap-4 space-y-4 mt-4">
                                <div className="space-y-2">
                                    <div className="flex gap-2  ">
                                        <Label htmlFor="junctionContinuityFactor">
                                            Curve Smoothness: {curveControls.junctionContinuityFactor.toFixed(2)}
                                        </Label>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Info className="h-4 w-4 text-gray-400" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs">
                                                    Controls how smooth the curves are between points (higher values create smoother curves)
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
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
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    resetToDefaults();
                                }}
                                disabled={disabled}
                                className="text-xs justify-self-end"
                            >
                                <RotateCcw className="h-3 w-3 mr-1" />

                            </Button>
                        </div>
                    </div>
                </details>
            </div>
        </TooltipProvider>
    )
} 