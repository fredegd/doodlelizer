"use client"

import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, ChevronDown } from "lucide-react"
import type { Settings } from "@/lib/types"

interface VectorGenerationSettingsProps {
    settings: Settings
    onSettingsChange: (newSettings: Partial<Settings>) => void
    disabled: boolean
}

export default function VectorGenerationSettings({ settings, onSettingsChange, disabled }: VectorGenerationSettingsProps) {
    return (
        <TooltipProvider>
            <details className="group" >
                <summary className="cursor-pointer text-xl font-bold  my-6 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-medium text-gray-300">Vector Generation</h3>
                    <ChevronDown className="h-5 w-5 text-gray-300 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="space-y-4 mt-4">
                    {settings.processingMode !== "cmyk" && settings.processingMode !== "monochrome" && (
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label htmlFor="brightnessThreshold-vec-setting">Brightness Threshold: {settings.brightnessThreshold}</Label>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="h-4 w-4 text-gray-400" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">
                                            For Grayscale/Posterize modes: Pixels darker than this threshold contribute more to path generation. Lighter pixels are less likely to generate paths.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <Slider
                                id="brightnessThreshold-vec-setting"
                                min={0}
                                max={255}
                                step={1}
                                value={[settings.brightnessThreshold]}
                                onValueChange={(value) => onSettingsChange({ brightnessThreshold: value[0] })}
                                disabled={disabled}
                            />
                            <p className="text-xs text-gray-400">Controls density influence for grayscale/posterize paths.</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <Label htmlFor="continuousPaths-setting" className="flex items-center gap-2">
                            Continuous Paths
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="h-4 w-4 text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">
                                        If enabled, paths will attempt to connect across tiles, forming longer continuous lines. If disabled, each tile generates independent paths.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </Label>
                        <Switch
                            id="continuousPaths-setting"
                            checked={settings.continuousPaths}
                            onCheckedChange={(checked) => onSettingsChange({ continuousPaths: checked })}
                            disabled={disabled}
                        />
                    </div>

                    {settings.continuousPaths && (
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label htmlFor="pathDistanceThreshold-setting">
                                    Path Connection Threshold: {settings.pathDistanceThreshold}px
                                </Label>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="h-4 w-4 text-gray-400" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">
                                            Maximum distance (in pixels) to connect path segments across tiles. Lower values result in more fragmented paths, higher values connect more aggressively.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <Slider
                                id="pathDistanceThreshold-setting"
                                min={1}
                                max={50} // Adjust max as needed
                                step={1}
                                value={[settings.pathDistanceThreshold]}
                                onValueChange={(value) => onSettingsChange({ pathDistanceThreshold: value[0] })}
                                disabled={disabled}
                            />
                        </div>
                    )}
                </div>
            </details>
        </TooltipProvider>
    )
} 