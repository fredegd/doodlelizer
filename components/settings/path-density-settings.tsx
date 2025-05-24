"use client"

import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, ChevronDown } from "lucide-react"
import type { Settings } from "@/lib/types"

interface PathDensitySettingsProps {
    settings: Settings
    onSettingsChange: (newSettings: Partial<Settings>) => void
    disabled: boolean
    calculatedDensity: number // Add this prop
}

export default function PathDensitySettings({ settings, onSettingsChange, disabled, calculatedDensity }: PathDensitySettingsProps) {
    return (
        <TooltipProvider>
            <details className="group" >
                <summary className="cursor-pointer my-6 text-md font-bold flex items-center justify-between">
                    <h3 className="flex items-center gap-2">
                        Path Density
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-gray-300" />
                            </TooltipTrigger>
                            *
                            <TooltipContent>
                                <p className="max-w-xs">
                                    <span>
                                        Density controls how how often the serpentine path repeats for each tile.
                                    </span>
                                    <br />

                                    <span>
                                        Darker pixels have more zigzags, creating a denser pattern.
                                    </span>
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </h3>
                    <ChevronDown className="h-5 w-5 text-gray-300 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="flex flex-col gap-8 mt-4 text-gray-300 lg:px-4 px-8">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="minDensity-setting">Min Density: {settings.minDensity}</Label>
                        </div>
                        <Slider
                            id="minDensity-setting"
                            min={0}
                            max={calculatedDensity} // Use calculatedDensity here
                            step={1}
                            value={[settings.minDensity]}
                            onValueChange={(value) => onSettingsChange({ minDensity: value[0] })}
                            disabled={disabled}
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="maxDensity-setting">Max Density: {settings.maxDensity}</Label>
                        </div>
                        <Slider
                            id="maxDensity-setting"
                            min={0}
                            max={calculatedDensity} // Use calculatedDensity here
                            step={1}
                            value={[settings.maxDensity]}
                            onValueChange={(value) => onSettingsChange({ maxDensity: value[0] })}
                            disabled={disabled}
                        />
                    </div>
                    <p className="text-xs pl-4">
                        * auto-adjusted to tile width: {calculatedDensity / 2}px
                    </p>
                </div>
            </details>
        </TooltipProvider>
    )
} 