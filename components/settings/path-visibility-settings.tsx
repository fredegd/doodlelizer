"use client"

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import type { ColorGroup, ProcessingMode, Settings } from "@/lib/types"
import { ChevronDown } from "lucide-react"

interface PathVisibilitySettingsProps {
    colorGroups: Record<string, ColorGroup> | undefined
    visiblePaths: Record<string, boolean>
    onSettingsChange: (newSettings: Partial<Settings>) => void
    disabled: boolean
    processingMode: ProcessingMode
    settings: Settings
}

const PathVisibilitySettings = React.memo(function PathVisibilitySettings({
    colorGroups,
    visiblePaths,
    onSettingsChange,
    disabled,
    processingMode,
    settings,
}: PathVisibilitySettingsProps) {
    const [activeColorPickerKey, setActiveColorPickerKey] = useState<string | null>(null);
    const colorInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        // Diagnostic log to observe changes in the colorGroups prop
        console.log("PathVisibilitySettings: colorGroups prop updated or component re-rendered. Current colorGroups:", colorGroups);
    }, [colorGroups]);

    // Effect to programmatically click the color input when it becomes active
    useEffect(() => {
        if (activeColorPickerKey && colorInputRef.current) {
            // autoFocus should handle focusing, this ensures the picker dialog opens.
            colorInputRef.current.click();
        }
    }, [activeColorPickerKey]); // Re-run when the active picker key changes

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

    const handleColorChange = (colorKey: string, newColor: string) => {
        if (!colorGroups) return;
        const updatedColorGroups = {
            ...colorGroups,
            [colorKey]: {
                ...colorGroups[colorKey],
                color: newColor,
            },
        };
        onSettingsChange({ colorGroups: updatedColorGroups });
        // We might want to keep the picker open if the user is still adjusting,
        // but for now, let's close it on change for simplicity with onChange.
        // If using onInput + a separate confirm button, this would be different.
        // setActiveColorPickerKey(null); // Optionally close picker on every change
    };

    if (!colorGroups || Object.keys(colorGroups).length === 0) {
        return null;
    }

    return (
        <details className="group" >
            <summary className="cursor-pointer text-xl font-bold  my-6 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    Colors and Visibility
                </h3>
                <ChevronDown className="h-5 w-5 text-gray-300 transition-transform duration-200 group-open:rotate-180" />
            </summary>

            <div className="space-y-4 mt-4">


                {sortedColorGroups.map(([colorKey, group]: [string, ColorGroup]) => (
                    <div key={colorKey} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {activeColorPickerKey === colorKey ? (
                                <input
                                    ref={colorInputRef}
                                    id={`color-picker-${colorKey}`}
                                    type="color"
                                    value={group.color}
                                    onChange={(e) => handleColorChange(colorKey, e.target.value)}
                                    onBlur={() => setActiveColorPickerKey(null)}
                                    className="w-8 h-8 p-0 border rounded cursor-pointer" // Adjusted styling
                                    autoFocus
                                    disabled={disabled}
                                />
                            ) : (
                                <button
                                    id={`color-picker-${colorKey}-setting`}
                                    className="w-6 h-6 rounded border-none p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ backgroundColor: group.color }}
                                    onClick={() => !disabled && setActiveColorPickerKey(colorKey)}
                                    disabled={disabled}
                                    aria-label={`Change color for ${group.displayName || 'group'}`}
                                />
                            )}
                            <Label htmlFor={`color-picker-${colorKey}-setting`} className="cursor-pointer">
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
                <div className="w-full flex justify-end">
                    <button className="text-sm text-gray-400 hover:text-white disabled:opacity-50" onClick={handleToggleAll} disabled={disabled || Object.keys(colorGroups).length === 0}>
                        {allVisible ? "Hide All" : "Show All"}
                    </button>
                </div>
                {(processingMode === "grayscale" || processingMode === "posterize") && (
                    <div className="mb-4 space-y-2 ">

                        <div className="flex justify-between mt-8">
                            <Label htmlFor="colorsAmt-visibility-setting">
                                {processingMode === "grayscale" ? "Gray Levels" : "Color Levels"}: {settings.colorsAmt}
                            </Label>
                        </div>
                        <Slider
                            id="colorsAmt-visibility-setting"
                            min={2}
                            max={10}
                            step={1}
                            value={[settings.colorsAmt]}
                            onValueChange={(value) => onSettingsChange({ colorsAmt: value[0] })}
                            disabled={disabled}
                        />
                        <p className="text-xs text-gray-400">
                            {processingMode === "grayscale"
                                ? "Number of grayscale levels"
                                : "Number of colors in the palette"}
                        </p>
                    </div>
                )}
            </div>
        </details>
    )
})

export default PathVisibilitySettings; 