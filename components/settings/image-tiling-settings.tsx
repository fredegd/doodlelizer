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
            <summary className="cursor-pointer text-xl font-bold  my-6 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-medium text-gray-300">Image Tiling</h3>
                <ChevronDown className="h-5 w-5 text-gray-300 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="space-y-4 mt-4">
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label htmlFor="columnsCount-setting">Columns: {settings.columnsCount}</Label>
                    </div>
                    <Slider
                        id="columnsCount-setting"
                        min={1}
                        max={180}
                        step={1}
                        value={[settings.columnsCount]}
                        onValueChange={(value) => onSettingsChange({ columnsCount: value[0] })}
                        disabled={disabled}
                    />
                    <p className="text-xs text-gray-400">Number of horizontal tiles</p>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label htmlFor="rowsCount-setting">Rows: {settings.rowsCount}</Label>
                    </div>
                    <Slider
                        id="rowsCount-setting"
                        min={1}
                        max={200}
                        step={1}
                        value={[settings.rowsCount]}
                        onValueChange={(value) => onSettingsChange({ rowsCount: value[0] })}
                        disabled={disabled}
                    />
                    <p className="text-xs text-gray-400">Number of vertical tiles</p>
                </div>
            </div>
        </details>
    )
} 