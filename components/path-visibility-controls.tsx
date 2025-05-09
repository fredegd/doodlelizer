"use client"

import React from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { ColorGroup, ProcessingMode } from "@/lib/types"

interface PathVisibilityControlsProps {
  colorGroups: Record<string, ColorGroup>
  visiblePaths: Record<string, boolean>
  onVisibilityChange: (colorKey: string, visible: boolean) => void
  disabled: boolean
  processingMode?: ProcessingMode
}

const PathVisibilityControls = React.memo(function PathVisibilityControls({
  colorGroups,
  visiblePaths,
  onVisibilityChange,
  disabled,
  processingMode,
}: PathVisibilityControlsProps) {
  const sortedColorGroups = React.useMemo(() => {
    const entries = Object.entries(colorGroups)
    if (processingMode === "posterize") {
      return entries.sort(([, a], [, b]) => a.hue - b.hue)
    } else if (processingMode === "grayscale") {
      return entries.sort(([, a], [, b]) => a.brightness - b.brightness)
    }
    return entries
  }, [colorGroups, processingMode])

  const allVisible =
    Object.keys(colorGroups).length > 0 && Object.keys(colorGroups).every((key) => visiblePaths[key] !== false)

  const handleToggleAll = React.useCallback(() => {
    // Toggle all paths
    Object.keys(colorGroups).forEach((key) => {
      onVisibilityChange(key, !allVisible)
    })
  }, [colorGroups, onVisibilityChange, allVisible])

  return (
    <div className="bg-gray-800/70 backdrop-blur rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Path Visibility</h2>
        <button className="text-sm text-gray-400 hover:text-white" onClick={handleToggleAll} disabled={disabled}>
          {allVisible ? "Hide All" : "Show All"}
        </button>
      </div>

      <div className="space-y-3">
        {sortedColorGroups.map(([colorKey, group]) => (
          <div key={colorKey} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: group.color }} />
              <Label htmlFor={`visibility-${colorKey}`} className="cursor-pointer">
                {group.displayName}
              </Label>
            </div>
            <Switch
              id={`visibility-${colorKey}`}
              checked={visiblePaths[colorKey] !== false}
              onCheckedChange={(checked) => onVisibilityChange(colorKey, checked)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </div>
  )
})

export default PathVisibilityControls
