"use client"

import React from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { ColorGroup, ProcessingMode, Settings } from "@/lib/types"
import { ChevronDown } from "lucide-react"

interface PathVisibilitySettingsProps {
    colorGroups: Record<string, ColorGroup> | undefined
    visiblePaths: Record<string, boolean>
    onSettingsChange: (newSettings: Partial<Settings>) => void
    disabled: boolean
    processingMode: ProcessingMode
}

const PathVisibilitySettings = React.memo(function PathVisibilitySettings({
    colorGroups,
    visiblePaths,
    onSettingsChange,
    disabled,
    processingMode,
}: PathVisibilitySettingsProps) {

    const handleVisibilityChange = (colorKey: string, visible: boolean) => {
        const newVisiblePaths = {
            ...visiblePaths,
            [colorKey]: visible,
        };
        onSettingsChange({ visiblePaths: newVisiblePaths });
    };

    const sortedColorGroups = React.useMemo(() => {
        if (!colorGroups) return [];
        const entries = Object.entries(colorGroups);
        if (processingMode === "posterize") {
            return entries.sort(([, a]: [string, ColorGroup], [, b]: [string, ColorGroup]) => a.hue - b.hue);
        } else if (processingMode === "grayscale") {
            return entries.sort(([, a]: [string, ColorGroup], [, b]: [string, ColorGroup]) => a.brightness - b.brightness);
        }
        return entries;
    }, [colorGroups, processingMode]);

    const allVisible = React.useMemo(() => {
        if (!colorGroups || Object.keys(colorGroups).length === 0) return false;
        return Object.keys(colorGroups).every((key) => visiblePaths[key] !== false);
    }, [colorGroups, visiblePaths]);

    const handleToggleAll = React.useCallback(() => {
        if (!colorGroups) return;
        const newVisibility = !allVisible;
        const newVisiblePaths: Record<string, boolean> = { ...visiblePaths };
        Object.keys(colorGroups).forEach((key) => {
            newVisiblePaths[key] = newVisibility;
        });
        onSettingsChange({ visiblePaths: newVisiblePaths });
    }, [colorGroups, onSettingsChange, allVisible, visiblePaths]);

    if (!colorGroups || Object.keys(colorGroups).length === 0) {
        return null;
    }

    return (
        <details className="group" >
            <summary className="cursor-pointer text-xl font-bold  my-6 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    Path Visibility
                </h3>
                <ChevronDown className="h-5 w-5 text-gray-300 transition-transform duration-200 group-open:rotate-180" />
            </summary>

            <div className="space-y-3 mt-4">
                <div className="w-full flex justify-end">
                    <button className="text-sm text-gray-400 hover:text-white disabled:opacity-50" onClick={handleToggleAll} disabled={disabled || Object.keys(colorGroups).length === 0}>
                        {allVisible ? "Hide All" : "Show All"}
                    </button>
                </div>
                {sortedColorGroups.map(([colorKey, group]: [string, ColorGroup]) => (
                    <div key={colorKey} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded" style={{ backgroundColor: group.color }} />
                            <Label htmlFor={`visibility-${colorKey}-setting`} className="cursor-pointer">
                                {group.displayName}
                            </Label>
                        </div>
                        <Switch
                            id={`visibility-${colorKey}-setting`}
                            checked={visiblePaths[colorKey] !== false}
                            onCheckedChange={(checked) => handleVisibilityChange(colorKey, checked)}
                            disabled={disabled}
                        />
                    </div>
                ))}
            </div>
        </details>
    )
})

export default PathVisibilitySettings; 