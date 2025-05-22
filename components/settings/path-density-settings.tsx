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
                <summary className="cursor-pointer text-xl font-bold  my-6 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-medium text-gray-300">
                        Path Density
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">
                                    Density controls how many zigzags appear in each tile. Darker pixels have more zigzags, creating a denser pattern.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </h3>
                    <ChevronDown className="h-5 w-5 text-gray-300 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="text-xs text-gray-400 mb-3">
                    (auto-adjusted to tile width: {calculatedDensity / 2}px)
                </p>
                <div className="space-y-4 mt-4">
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
                </div>
            </details>
        </TooltipProvider>
    )
} 