"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import p5 from "p5"
import P5SVG from "p5.js-svg/"

import { debounce } from "lodash"
import ControlPanel from "./ControlPanel"
import ColorToggles from "./ColorToggles"

interface DoodleCanvasProps {
  onImageLoad?: (img: p5.Image) => void
}

const defaultImageURL =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Incense_in_Vietnam.jpg/2560px-Incense_in_Vietnam.jpg"

const DoodleCanvas: React.FC<DoodleCanvasProps> = ({ onImageLoad }) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const p5InstanceRef = useRef<p5 | null>(null)
  const svgGraphicsRef = useRef<p5.Graphics | null>(null)
  const processedImgRef = useRef<p5.Image | null>(null)
  const colorVisibilityRef = useRef<Map<string, boolean>>(new Map())
  const [img, setImg] = useState<p5.Image | null>(null)
  const [colorVisibility, setColorVisibility] = useState<Map<string, boolean>>(new Map())
  const uniqueColorsRef = useRef<Map<string, any>>(new Map())
  const [uniqueColors, setUniqueColors] = useState<Map<string, any>>(new Map())

  // State variables for exporting SVG
  const exportData = useRef(false)
  // State variables
  const [controls, setControls] = useState({
    tileX: 4,
    tileY: 4,
    posterize: true,
    grayLayers: false,
    cmykMode: false,
    monochrome: false,
    maxColors: 5,
    maxDensity: 4,
    minDensity: 1,
  })

  // Debounced redraw
  const debouncedRedraw = useRef(
    debounce(() => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.redraw()
        console.log("yooooo  redrooow")
      }
    }, 150),
  )

  const resetState = useCallback(
    (p: p5) => {
      if (!img) return

      uniqueColorsRef.current.clear()
      colorVisibilityRef.current.clear()
      const newProcessedImg = img.get()
      newProcessedImg.resize(controls.tileX, controls.tileY)
      newProcessedImg.loadPixels()
      newProcessedImg.updatePixels()
      processedImgRef.current = newProcessedImg

      // Use ref instead of state directly
      // const currentVisibility = new Map(colorVisibilityRef.current);
      const currentVisibility = colorVisibility
      // CMYK Mode processing
      if (controls.cmykMode) {
        const cmykPaths = convertToCMYK(newProcessedImg)
        ;["cyan", "magenta", "yellow", "black"].forEach((channel) => {
          uniqueColorsRef.current.set(channel, {
            color:
              channel === "black"
                ? p.color(0)
                : p.color(
                    channel === "cyan" ? 0 : 255,
                    channel === "magenta" ? 0 : 255,
                    channel === "yellow" ? 0 : 255,
                  ),
            values: cmykPaths[channel],
          })
          currentVisibility.set(channel, currentVisibility.get(channel) ?? true)
        })
      } else {
        if (controls.grayLayers) convertToGrayLayers(newProcessedImg, p)
        if (controls.posterize) posterizeImage(newProcessedImg, p)

        // Collect unique colors
        for (let j = 0; j < controls.tileY; j++) {
          for (let i = 0; i < controls.tileX; i++) {
            const index = j % 2 === 0 ? j * controls.tileX + i : (j + 1) * controls.tileX - i - 1
            const r = newProcessedImg.pixels[index * 4]
            const g = newProcessedImg.pixels[index * 4 + 1]
            const b = newProcessedImg.pixels[index * 4 + 2]
            const colorKey = `${r},${g},${b}`

            if (!uniqueColorsRef.current.has(colorKey)) {
              uniqueColorsRef.current.set(colorKey, {
                color: p.color(r, g, b),
              })
              currentVisibility.set(colorKey, currentVisibility.get(colorKey) ?? true)
            }
          }
        }
      }

      colorVisibilityRef.current = currentVisibility
      console.log(currentVisibility)
      setColorVisibility(new Map(currentVisibility))
      setUniqueColors(new Map(uniqueColorsRef.current))
      p.redraw()
    },
    [controls, img],
  )

  // Toggle color visibility
  const toggleColorVisibility = useCallback((colorKey: string) => {
    setColorVisibility((prev) => {
      const newMap = new Map(prev)
      console.log(newMap.get(colorKey))
      newMap.set(colorKey, !newMap.get(colorKey))
      // colorVisibilityRef.current = newMap;
      return newMap
    })

    if (p5InstanceRef.current) {
      p5InstanceRef.current.redraw()
    }
  }, [])

  // Sketch setup
  const sketch = useCallback(
    (p: p5) => {
      p.preload = async () => {
        if (!img) {
          const loadedImg = await new Promise<p5.Image>((resolve) => {
            p.loadImage(defaultImageURL, resolve)
          })
          loadedImg.resize(426, 600)
          setImg(loadedImg)
          processedImgRef.current = loadedImg // Store directly in processedImgRef
        }
      }
      p.setup = () => {
        const canvas = p.createCanvas(426, 600, p5.SVG)
        console.log("SVG-Renderer verfügbar?", P5SVG !== undefined)

        canvas.parent(canvasRef.current!)
        svgGraphicsRef.current = p.createGraphics(426, 600, p.SVG)
        p5InstanceRef.current = p
        p.noLoop()
      }

      p.draw = () => {
        p.clear()
        if (processedImgRef.current && svgGraphicsRef.current) {
          drawGraphicOutput(p, svgGraphicsRef.current)
          p.image(svgGraphicsRef.current, 0, 0)
          p.image(processedImgRef.current, 0, 0, 100, 100)
        }
      }
    },
    [controls, img], // Include `img` in dependencies to ensure the correct image is used
  )

  // Initialize p5 once
  useEffect(() => {
    if (!canvasRef.current) return
    const p5Inst = new p5(sketch, canvasRef.current)
    processedImgRef.current = null
    uniqueColorsRef.current.clear()
    return () => p5Inst.remove()
  }, [sketch])

  // Control changes handler
  useEffect(() => {
    debouncedRedraw.current()
    colorVisibilityRef.current = colorVisibility
  }, [controls, colorVisibility])

  // File upload handler
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file && p5InstanceRef.current) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string
          p5InstanceRef.current?.loadImage(dataUrl, (loadedImg) => {
            loadedImg.resize(426, 600)
            setImg(loadedImg) // Update img state
            processedImgRef.current = loadedImg // Update processedImgRef
            resetState(p5InstanceRef.current!) // Reset state with the new image
            p5InstanceRef.current?.redraw() // Redraw the canvas immediately
            if (onImageLoad) onImageLoad(loadedImg)
          })
        }
        reader.readAsDataURL(file)
      }
    },
    [onImageLoad, resetState],
  )

  useEffect(() => {
    if (p5InstanceRef.current && img) {
      processedImgRef.current = img // Ensure processedImgRef is updated
      resetState(p5InstanceRef.current) // Reset state when img changes
      p5InstanceRef.current.redraw() // Redraw the canvas
    }
  }, [img, resetState])

  const convertToCMYK = (imgToProcess: p5.Image) => {
    const pixelCount = imgToProcess.pixels.length / 4
    const cmykPaths = {
      cyan: new Uint8Array(pixelCount),
      magenta: new Uint8Array(pixelCount),
      yellow: new Uint8Array(pixelCount),
      black: new Uint8Array(pixelCount),
    }

    for (let i = 0, j = 0; i < imgToProcess.pixels.length; i += 4, j++) {
      const r = imgToProcess.pixels[i] / 255
      const g = imgToProcess.pixels[i + 1] / 255
      const b = imgToProcess.pixels[i + 2] / 255

      const k = Math.round((1 - Math.max(r, g, b)) * 255)
      cmykPaths.black[j] = k

      if (k === 255) {
        cmykPaths.cyan[j] = cmykPaths.magenta[j] = cmykPaths.yellow[j] = 0
      } else {
        const ik = 1 / (1 - k / 255)
        cmykPaths.cyan[j] = Math.round((1 - r - k / 255) * ik * 255)
        cmykPaths.magenta[j] = Math.round((1 - g - k / 255) * ik * 255)
        cmykPaths.yellow[j] = Math.round((1 - b - k / 255) * ik * 255)
      }
    }

    return cmykPaths
  }

  const convertToGrayLayers = (imgToProcess: p5.Image, p: p5) => {
    // Convert to grayscale
    for (let i = 0; i < imgToProcess.pixels.length; i += 4) {
      const gray =
        imgToProcess.pixels[i] * 0.299 + imgToProcess.pixels[i + 1] * 0.587 + imgToProcess.pixels[i + 2] * 0.114
      imgToProcess.pixels[i] = gray
      imgToProcess.pixels[i + 1] = gray
      imgToProcess.pixels[i + 2] = gray
    }

    // Find brightness range
    let minBright = 255,
      maxBright = 0
    for (let i = 0; i < imgToProcess.pixels.length; i += 4) {
      minBright = Math.min(minBright, imgToProcess.pixels[i])
      maxBright = Math.max(maxBright, imgToProcess.pixels[i])
    }

    // Create gray levels
    const grayLevels = []
    for (let i = 0; i < controls.maxColors; i++) {
      grayLevels.push(Math.round(p.map(i, 0, controls.maxColors - 1, minBright, maxBright)))
    }

    // Map to nearest gray
    for (let i = 0; i < imgToProcess.pixels.length; i += 4) {
      const nearestGray = grayLevels.reduce((prev, curr) => {
        return Math.abs(curr - imgToProcess.pixels[i]) < Math.abs(prev - imgToProcess.pixels[i]) ? curr : prev
      })
      imgToProcess.pixels[i] = nearestGray
      imgToProcess.pixels[i + 1] = nearestGray
      imgToProcess.pixels[i + 2] = nearestGray
    }

    imgToProcess.updatePixels()
  }

  const posterizeImage = (imgToProcess: p5.Image, p: p5) => {
    // Collect all unique colors
    const colors = new Set()
    for (let i = 0; i < imgToProcess.pixels.length; i += 4) {
      const r = imgToProcess.pixels[i]
      const g = imgToProcess.pixels[i + 1]
      const b = imgToProcess.pixels[i + 2]
      colors.add(`${r},${g},${b}`)
    }

    // If we have more colors than allowed, perform k-means clustering
    if (colors.size > controls.maxColors) {
      const colorArray = Array.from(colors).map((c) => (c as string).split(",").map(Number))
      const centroids = kMeansClustering(colorArray, controls.maxColors)

      // Replace each pixel with its nearest centroid
      for (let i = 0; i < imgToProcess.pixels.length; i += 4) {
        const r = imgToProcess.pixels[i]
        const g = imgToProcess.pixels[i + 1]
        const b = imgToProcess.pixels[i + 2]

        const nearestCentroid = findNearestCentroid([r, g, b], centroids)

        imgToProcess.pixels[i] = nearestCentroid[0]
        imgToProcess.pixels[i + 1] = nearestCentroid[1]
        imgToProcess.pixels[i + 2] = nearestCentroid[2]
      }

      imgToProcess.updatePixels()
    }
  }

  const kMeansClustering = (colors: number[][], k: number) => {
    let centroids = colors.slice(0, k)
    let oldCentroids = new Array(k).fill(null)
    let iterations = 0
    const maxIterations = 20

    while (iterations < maxIterations && !centroidsEqual(centroids, oldCentroids)) {
      oldCentroids = centroids.map((c) => [...c])

      const clusters = new Array(k).fill(null).map(() => [])
      colors.forEach((color) => {
        const nearestIndex = findNearestCentroidIndex(color, centroids)
        clusters[nearestIndex].push(color)
      })

      centroids = clusters.map((cluster) => {
        if (cluster.length === 0) return centroids[0]
        return averageColor(cluster)
      })

      iterations++
    }

    return centroids
  }

  const findNearestCentroidIndex = (color: number[], centroids: number[][]) => {
    let minDist = Number.POSITIVE_INFINITY
    let nearestIndex = 0

    centroids.forEach((centroid, i) => {
      const dist = colorDistance(color, centroid)
      if (dist < minDist) {
        minDist = dist
        nearestIndex = i
      }
    })

    return nearestIndex
  }

  const findNearestCentroid = (color: number[], centroids: number[][]) => {
    return centroids[findNearestCentroidIndex(color, centroids)]
  }

  const colorDistance = (c1: number[], c2: number[]) => {
    const lab1 = rgb2lab(c1)
    const lab2 = rgb2lab(c2)
    return Math.sqrt(Math.pow(lab1[0] - lab2[0], 2) + Math.pow(lab1[1] - lab2[1], 2) + Math.pow(lab1[2] - lab2[2], 2))
  }

  const rgb2lab = (rgb: number[]) => {
    let r = rgb[0] / 255
    let g = rgb[1] / 255
    let b = rgb[2] / 255

    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92

    const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100
    const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100
    const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100

    const x1 = x / 95.047
    const y1 = y / 100.0
    const z1 = z / 108.883

    const x2 = x1 > 0.008856 ? Math.pow(x1, 1 / 3) : 7.787 * x1 + 16 / 116
    const y2 = y1 > 0.008856 ? Math.pow(y1, 1 / 3) : 7.787 * y1 + 16 / 116
    const z2 = z1 > 0.008856 ? Math.pow(z1, 1 / 3) : 7.787 * z1 + 16 / 116

    return [116 * y2 - 16, 500 * (x2 - y2), 200 * (y2 - z2)]
  }

  const averageColor = (colors: number[][]) => {
    const sum = [0, 0, 0]
    colors.forEach((color) => {
      sum[0] += color[0]
      sum[1] += color[1]
      sum[2] += color[2]
    })
    return sum.map((v) => Math.round(v / colors.length))
  }

  const centroidsEqual = (c1: number[][], c2: (number[] | null)[]) => {
    if (!c1[0] || !c2[0]) return false
    return c1.every((cent, i) => cent.every((v, j) => v === (c2[i] as number[])[j]))
  }

  const drawGraphicOutput = (p: p5, graphics: p5.Graphics) => {
    if (!graphics || !processedImgRef.current) return

    graphics.clear()
    graphics.push()
    graphics.translate(p.width * 0.05, p.height * 0.05)
    graphics.scale(0.9)
    graphics.strokeWeight(1)
    graphics.noFill()
    const w = 426 / controls.tileX
    const h = 600 / controls.tileY

    if (controls.cmykMode) {
      // CMYK Mode: Process each channel separately
      const rowPoints = new Array(controls.tileY)
      for (let j = 0; j < controls.tileY; j++) {
        rowPoints[j] = new Array(controls.tileX)
        for (let i = 0; i < controls.tileX; i++) {
          rowPoints[j][i] = {
            x: j % 2 === 0 ? i * w : w * controls.tileX - i * w,
            y: j % 2 === 0 ? j * h : j * h + h,
          }
        }
      }
      ;["cyan", "magenta", "yellow", "black"].forEach((channel) => {
        const channelData = uniqueColorsRef.current.get(channel)
        if (channelData && colorVisibilityRef.current.get(channel)) {
          const pathPoints: { x: number; y: number }[] = []

          for (let j = 0; j < controls.tileY; j++) {
            for (let i = 0; i < controls.tileX; i++) {
              const index = j % 2 === 0 ? j * controls.tileX + i : (j + 1) * controls.tileX - i - 1
              const value = channelData.values[index]
              const point = rowPoints[j][i]

              const density = Math.round(p.map(value, 0, 255, controls.minDensity, controls.maxDensity))

              for (let d = 0; d < density; d++) {
                const offset = d * (w / density)
                if (j % 2 === 0) {
                  if (d % 2 === 0) {
                    pathPoints.push(
                      { x: point.x + offset, y: point.y },
                      { x: point.x + offset + w / density, y: point.y },
                    )
                  } else {
                    pathPoints.push(
                      { x: point.x + offset, y: point.y + h },
                      { x: point.x + offset + w / density, y: point.y + h },
                    )
                  }
                } else {
                  if (d % 2 === 0) {
                    pathPoints.push(
                      { x: point.x - offset, y: point.y },
                      { x: point.x - offset - w / density, y: point.y },
                    )
                  } else {
                    pathPoints.push(
                      { x: point.x - offset, y: point.y - h },
                      { x: point.x - offset - w / density, y: point.y - h },
                    )
                  }
                }
              }
            }
          }

          // Batch render points for the current channel
          graphics.push()
          graphics.stroke(channelData.color)
          graphics.beginShape()
          pathPoints.forEach((point) => graphics.vertex(point.x, point.y))
          graphics.endShape()
          graphics.pop()
        }
      })
    } else {
      // Non-CMYK Mode: Process unique colors
      const allPoints: {
        x: number
        y: number
        direction: number
        yflip: number
        row: number
        h: number
        color: p5.Color
      }[] = []

      processedImgRef.current.loadPixels()
      for (let j = 0; j < controls.tileY; j++) {
        for (let i = 0; i < controls.tileX; i++) {
          const index = j % 2 === 0 ? j * controls.tileX + i : (j + 1) * controls.tileX - i * 1
          const r = processedImgRef.current.pixels[index * 4]
          const g = processedImgRef.current.pixels[index * 4 + 1]
          const b = processedImgRef.current.pixels[index * 4 + 2]
          const colorKey = `${r},${g},${b}`
          if (uniqueColorsRef.current.has(colorKey) && colorVisibilityRef.current.get(colorKey)) {
            const x = j % 2 === 0 ? i * w : w * controls.tileX - i * w
            const y = j % 2 === 0 ? j * h : j * h + h

            const flip = () => {
              if (j % 2 === 0) {
                return i % 2 === 0 ? 0 : 1
              } else {
                return i % 2 === 0 ? 1 : 0
              }
            }
            allPoints.push({
              x: x,
              y: y,
              direction: j % 2 === 0 ? 1 : -1,
              yflip: flip(),
              row: j,
              h: j % 2 === 0 ? h : -h,
              color: uniqueColorsRef.current.get(colorKey).color,
            })
          }
        }
      }

      // Batch render points for all colors
      let currentColor: p5.Color | null = null
      graphics.beginShape()

      // Start with the first point
      // graphics.vertex(allPoints[0].x, allPoints[0].y);
      allPoints.forEach((point) => {
        if (currentColor !== point.color) {
          graphics.endShape()
          currentColor = point.color
          graphics.stroke(currentColor)
          graphics.beginShape()
          // Start new path at current point
          graphics.vertex(point.x, point.y)
        }

        const density = Math.round(
          p.map(p.pow(p.brightness(point.color), 1), 0, 150, controls.maxDensity, controls.minDensity),
        )

        for (let d = 0; d < density; d++) {
          const offset = d * (w / density)
          if (density % 2 === 0) {
            if (d % 2 !== 0) {
              graphics.vertex(point.x + offset * point.direction, point.y)
              graphics.vertex(point.x + (offset + w / density) * point.direction, point.y)
            } else {
              graphics.vertex(point.x + offset * point.direction, point.y + point.h)
              graphics.vertex(point.x + (offset + w / density) * point.direction, point.y + point.h)
            }
          } else {
            if (controls.tileY % 2 === 0) {
              if (point.row % 2 === 0) {
                if (d % 2 !== 0) {
                  graphics.vertex(point.x + offset * point.direction, point.y + point.yflip * point.h)
                  graphics.vertex(point.x + (offset + w / density) * point.direction, point.y + point.yflip * point.h)
                } else {
                  graphics.vertex(point.x + offset * point.direction, point.y + point.h - point.yflip * point.h)
                  graphics.vertex(
                    point.x + (offset + w / density) * point.direction,
                    point.y + point.h - point.yflip * point.h,
                  )
                }
              } else {
                if (d % 2 !== 0) {
                  graphics.vertex(point.x + offset * point.direction, point.y + point.h - point.yflip * point.h)
                  graphics.vertex(
                    point.x + (offset + w / density) * point.direction,
                    point.y + point.h - point.yflip * point.h,
                  )
                } else {
                  graphics.vertex(point.x + offset * point.direction, point.y + point.yflip * point.h)
                  graphics.vertex(point.x + (offset + w / density) * point.direction, point.y + point.yflip * point.h)
                }
              }
            } else {
              if (d % 2 !== 0) {
                graphics.vertex(point.x + offset * point.direction, point.y + point.yflip * point.h)
                graphics.vertex(point.x + (offset + w / density) * point.direction, point.y + point.yflip * point.h)
              } else {
                graphics.vertex(point.x + offset * point.direction, point.y + point.h - point.yflip * point.h)
                graphics.vertex(
                  point.x + (offset + w / density) * point.direction,
                  point.y + point.h - point.yflip * point.h,
                )
              }
            }
          }
        }
      })
      graphics.endShape()
    }

    graphics.pop()

    if (exportData.current) {
      if (P5SVG !== undefined && svgGraphicsRef.current) {
        console.log("Speichere SVG...")
        svgGraphicsRef.current.save("output.svg")
      } else {
        console.error("SVG-Renderer nicht initialisiert")
      }
      exportData.current = false
    }
  }

  // const saveSVG = () => {
  //   if (!p5InstanceRef.current || !svgGraphicsRef.current) return;

  //   // SVG neu zeichnen für den Export
  //   svgGraphicsRef.current.clear();
  //   drawGraphicOutput(p5InstanceRef.current, svgGraphicsRef.current);
  //   svgGraphicsRef.current.save("output.svg");
  // };

  return (
    <div className="flex  items-center gap-4">
      <div ref={canvasRef} />
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Controls</h2>
        <ControlPanel
          controls={controls}
          setControls={setControls}
          p5Instance={p5InstanceRef.current}
          resetState={resetState}
        />
        <ColorToggles colorVisibility={colorVisibility} toggleColorVisibility={toggleColorVisibility} />

        <input type="file" accept="image/*" onChange={handleFileUpload} className="mb-4" />
        <button
          onClick={() => {
            exportData.current = true
            console.log(exportData.current)
            console.log("Exporting SVG...")
            p5InstanceRef.current?.redraw()
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Export SVG
        </button>
      </div>
    </div>
  )
}

export default DoodleCanvas
