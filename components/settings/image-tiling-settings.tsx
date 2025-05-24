"use client"

import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { ChevronDown } from "lucide-react"
import type { Settings } from "@/lib/types"

interface ImageTilingSettingsProps {
    settings: Settings
    onSettingsChange: (newSettings: Partial<Settings>) => void
    disabled: boolean
}

export default function ImageTilingSettings({ settings, onSettingsChange, disabled }: ImageTilingSettingsProps) {
    return (
        <details className="group" >
            <summary className="cursor-pointer text-md font-bold  my-6 flex items-center justify-between ">
                <h3 className="flex items-center gap-2">Image Tiling</h3>
                <ChevronDown className="h-5 w-5 text-gray-300 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="flex flex-col gap-8 mt-4 text-gray-300 lg:px-4 px-8">
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label htmlFor="columnsCount-setting">Columns: {settings.columnsCount}</Label>
                    </div>
                    <Slider
                        id="columnsCount-setting"
                        min={1}
                        max={128}
                        step={1}
                        value={[settings.columnsCount]}
                        onValueChange={(value) => onSettingsChange({ columnsCount: value[0] })}
                        disabled={disabled}
                    />
                    <p className="text-xs text-gray-300">Number of horizontal tiles</p>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label htmlFor="rowsCount-setting">Rows: {settings.rowsCount}</Label>
                    </div>
                    <Slider
                        id="rowsCount-setting"
                        min={1}
                        max={128}
                        step={1}
                        value={[settings.rowsCount]}
                        onValueChange={(value) => onSettingsChange({ rowsCount: value[0] })}
                        disabled={disabled}
                    />
                    <p className="text-xs text-gray-300">Number of vertical tiles</p>
                </div>
            </div>
        </details>
    )
} 