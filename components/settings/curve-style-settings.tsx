"use client"

import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, ChevronDown } from "lucide-react"
import type { Settings, CurveControlSettings } from "@/lib/types"
import Image from "next/image"

interface CurveStyleSettingsProps {
    settings: Settings
    onSettingsChange: (newSettings: Partial<Settings>) => void
    curveControls: CurveControlSettings
    onCurveControlsChange: (newControls: Partial<CurveControlSettings>) => void
    disabled: boolean
}

export default function CurveStyleSettings({
    settings,
    onSettingsChange,
    curveControls,
    onCurveControlsChange,
    disabled,
}: CurveStyleSettingsProps) {
    return (
        <TooltipProvider>
            <details className="group" >



                <summary className="cursor-pointer text-sm font-bold mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2">
                        {settings.curvedPaths ? "Curved" : "Square"} Paths
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-gray-300" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">
                                    When enabled, creates smooth, curved paths. When disabled, uses straight lines with sharp corners.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </h3>
                    <ChevronDown className="h-5 w-5 text-gray-300 transition-transform duration-200 group-open:rotate-180" />
                </summary>

                <div className="flex w-full justify-between text-gray-300 px-4">
                    <h3 className="text-sm font-medium mb-3">Matrix: </h3>
                    <div className="flex items-center gap-2 mb-4">
                        <Image
                            src="/squared-paths.svg"
                            alt="Squared paths"
                            width={24}
                            height={24}
                            className={`w-6 h-6 transition-all duration-200 ${settings.curvedPaths ? 'opacity-50' : 'opacity-100'} hover:opacity-100 [filter:invert(1)_brightness(0.8)] hover:[filter:invert(1)_brightness(1)_sepia(1)_saturate(5)_hue-rotate(170deg)]`}
                        />
                        <Switch
                            id="curvedPaths-setting"
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
                <div className="space-y-4 text-gray-300">
                    <div className="flex gap-2">
                        <Label htmlFor="tileHeightScale-setting">
                            Tile Height: {(curveControls.tileHeightScale * 100).toFixed(0)}%
                        </Label>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-gray-300" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">
                                    Adjusts the vertical height of pattern tiles (lower values create flatter patterns)
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <Slider
                        id="tileHeightScale-setting"
                        min={0.1}
                        max={1.0}
                        step={0.01}
                        value={[curveControls.tileHeightScale]}
                        onValueChange={(value) => onCurveControlsChange({ tileHeightScale: value[0] })}
                        disabled={disabled}
                    />
                </div>
            </details>
        </TooltipProvider>
    )
} 