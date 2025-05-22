"use client"

import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, ChevronDown } from "lucide-react"
import type { Settings, ProcessingMode } from "@/lib/types"

interface ProcessingModeSettingsProps {
    settings: Settings
    onSettingsChange: (newSettings: Partial<Settings>) => void
    disabled: boolean
}

export default function ProcessingModeSettings({ settings, onSettingsChange, disabled }: ProcessingModeSettingsProps) {
    const handleProcessingModeChange = (value: ProcessingMode) => {
        onSettingsChange({ processingMode: value })
    }

    return (
        <TooltipProvider>
            <details className="group" >
                <summary className="cursor-pointer text-xl font-bold  my-6 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-medium text-gray-300">Processing Mode</h3>
                    <ChevronDown className="h-5 w-5 text-gray-300 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <RadioGroup
                    value={settings.processingMode}
                    onValueChange={(value) => handleProcessingModeChange(value as ProcessingMode)}
                    className="space-y-2"
                    disabled={disabled}
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="monochrome" id="monochrome-setting" />
                        <Label htmlFor="monochrome-setting" className="cursor-pointer">
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
                        <RadioGroupItem value="grayscale" id="grayscale-setting" />
                        <Label htmlFor="grayscale-setting" className="cursor-pointer">
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
                        <RadioGroupItem value="posterize" id="posterize-setting" />
                        <Label htmlFor="posterize-setting" className="cursor-pointer">
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
                        <RadioGroupItem value="cmyk" id="cmyk-setting" />
                        <Label htmlFor="cmyk-setting" className="cursor-pointer">
                            CMYK (Beta)
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
                            <Label htmlFor="colorsAmt-setting">
                                {settings.processingMode === "grayscale" ? "Gray Levels" : "Color Levels"}: {settings.colorsAmt}
                            </Label>
                        </div>
                        <Slider
                            id="colorsAmt-setting"
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
                            <Label htmlFor="monochromeColor-setting">Path Color</Label>
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-6 h-6 rounded border border-gray-600"
                                    style={{ backgroundColor: settings.monochromeColor }}
                                />
                                <input
                                    id="monochromeColor-input" // Changed ID to avoid conflict
                                    type="color"
                                    value={settings.monochromeColor}
                                    onChange={(e) => onSettingsChange({ monochromeColor: e.target.value })}
                                    disabled={disabled}
                                    className="w-0 h-0 opacity-0 absolute"
                                />
                                <button
                                    className="text-xs text-gray-400 hover:text-white"
                                    onClick={() => document.getElementById('monochromeColor-input')?.click()} // Updated to new ID
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
            </details>
        </TooltipProvider>
    )
} 