"use client"

import { useEffect, useRef } from "react"
import P5 from "p5"
import type { ImageData, Settings, PathPoint } from "./types"

interface P5RendererProps {
  imageData: ImageData
  settings: Settings
}

export default function P5Renderer({ imageData, settings }: P5RendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5Instance = useRef<P5 | null>(null)

  useEffect(() => {
    if (!containerRef.current || !imageData) return

    // Clean up previous instance
    if (p5Instance.current) {
      p5Instance.current.remove()
    }

    // Create new p5 instance
    p5Instance.current = new P5((p: P5) => {
      p.setup = () => {
        // Create canvas with the same dimensions as the grid
        const canvas = p.createCanvas(imageData.width * settings.gridSizeX, imageData.height * settings.gridSizeY)
        canvas.parent(containerRef.current!)
        p.background(settings.processingMode === "cmyk" || settings.processingMode === "monochrome" ? 255 : settings.invert ? 255 : 0)
        p.noFill()
        p.strokeWeight(0.1)
      }

      // Only draw once
      p.draw = () => {
        // Clear the canvas
        p.clear()
        // Draw paths for each color group
        if (imageData.colorGroups) {
          Object.entries(imageData.colorGroups).forEach(([colorKey, group]) => {
            // Skip if this path is not visible
            if (settings.visiblePaths[colorKey] === false) return

            // Set stroke color
            p.strokeWeight(0.1)
            p.stroke(group.color)

            if (settings.continuousPaths) {
              // Draw continuous path for this color group
              drawContinuousPath(p, group.points, settings)
            } else {
              // Draw individual paths for this color group
              drawIndividualPaths(p, group.points)
            }
          })
        }

        // No need to loop
        p.noLoop()
      }
    })

    // Cleanup function
    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove()
      }
    }
  }, [imageData, settings])

  return <div ref={containerRef} className="w-full h-full" />
}

// Draw continuous path for a color group
function drawContinuousPath(p: P5, points: PathPoint[], settings: Settings) {
  // Sort points by row, then by column (accounting for row direction)
  const sortedPoints = [...points].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row
    // Sort by column, accounting for row direction
    return a.row % 2 === 0 ? a.x - b.x : b.x - a.x
  })

  let firstPoint = true
  let lastPoint = null

  // Process each point in order
  for (let i = 0; i < sortedPoints.length; i++) {
    const point = sortedPoints[i]

    // Skip zero-density points
    if (point.density <= 0) continue

    // If this is the first point or we need to start a new path due to distance threshold
    if (firstPoint ||
      (lastPoint && calculateDistance(lastPoint.x, lastPoint.y, point.x, point.y) > settings.pathDistanceThreshold)) {

      // End the previous path if there was one
      if (!firstPoint) {
        p.endShape()
      }

      // Start a new path
      p.beginShape()
      p.vertex(point.x, point.y)
      firstPoint = false
    } else {
      // Otherwise, draw a line to it
      p.vertex(point.x, point.y)
    }

    // Draw the zigzag pattern for this tile
    drawTileZigzag(p, point.x, point.y, point.width, point.height, point.density, point.direction)

    // Update the last point
    lastPoint = point
  }

  // Close the last path
  if (!firstPoint) {
    p.endShape()
  }
}

// Calculate Euclidean distance between two points
function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

// Draw individual paths for each tile
function drawIndividualPaths(p: P5, points: PathPoint[]) {
  points.forEach((point) => {
    p.beginShape()
    p.vertex(point.x, point.y)

    // Draw the zigzag pattern for this tile
    drawTileZigzag(p, point.x, point.y, point.width, point.height, point.density, point.direction)

    p.endShape()
  })
}

// Draw a zigzag pattern for a single tile
function drawTileZigzag(
  p: P5,
  x: number,
  y: number,
  width: number,
  height: number,
  density: number,
  direction: number,
) {
  const step = width / density

  // Create zigzag pattern based on density
  for (let d = 0; d < density; d++) {
    const offset = d * step
    const nextOffset = (d + 1) * step

    // Toggle between top and bottom lines for the zigzag
    if (d % 2 === 0) {
      // Draw horizontal line along the top
      p.vertex(x + offset * direction, y)
      p.vertex(x + nextOffset * direction, y)
    } else {
      // Draw horizontal line along the bottom
      p.vertex(x + offset * direction, y + height)
      p.vertex(x + nextOffset * direction, y + height)
    }

    // Add vertical connecting line if not the last segment
    if (d < density - 1) {
      if (d % 2 === 0) {
        // Connect from top to bottom
        p.vertex(x + nextOffset * direction, y)
        p.vertex(x + nextOffset * direction, y + height)
      } else {
        // Connect from bottom to top
        p.vertex(x + nextOffset * direction, y + height)
        p.vertex(x + nextOffset * direction, y)
      }
    }
  }
}
