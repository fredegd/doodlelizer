"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Download, ChevronDown, Layers } from "lucide-react"
import type { ColorGroup } from "@/lib/types"
import { extractColorGroupSVG, extractAllColorGroups } from "@/lib/image-processor"

interface SvgDownloadOptionsProps {
    svgContent: string | null
    colorGroups?: Record<string, ColorGroup>
    isProcessing: boolean
}

export default function SvgDownloadOptions({
    svgContent,
    colorGroups,
    isProcessing
}: SvgDownloadOptionsProps) {
    const [isDownloading, setIsDownloading] = useState(false)

    // Handler for downloading the complete SVG
    const handleDownloadFull = () => {
        if (!svgContent) return
        downloadSvgFile(svgContent, "vector-image.svg")
    }

    // Handler for downloading a specific color group
    const handleDownloadColorGroup = (colorKey: string, displayName: string) => {
        if (!svgContent) return

        setIsDownloading(true)
        try {
            const extractedSvg = extractColorGroupSVG(svgContent, colorKey)
            if (extractedSvg) {
                // Create a sanitized filename from the display name
                const filename = `vector-image-${displayName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.svg`
                downloadSvgFile(extractedSvg, filename)
            }
        } catch (error) {
            console.error("Error downloading color group:", error)
        } finally {
            setIsDownloading(false)
        }
    }

    // Handler for downloading all color groups as a ZIP file
    const handleDownloadAllSeparately = async () => {
        if (!svgContent || !colorGroups) return

        setIsDownloading(true)

        try {
            // Dynamic import of JSZip
            const JSZip = (await import('jszip')).default
            const zip = new JSZip()

            // Extract all color groups
            const extractedGroups = extractAllColorGroups(svgContent)

            // Add each SVG to the ZIP file
            Object.entries(extractedGroups).forEach(([colorKey, groupSvg]) => {
                const displayName = colorGroups[colorKey]?.displayName || colorKey
                const filename = `${displayName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.svg`
                zip.file(filename, groupSvg)
            })

            // Generate the ZIP file
            const content = await zip.generateAsync({ type: "blob" })

            // Download the ZIP file
            const url = URL.createObjectURL(content)
            const a = document.createElement("a")
            a.href = url
            a.download = "vector-image-layers.zip"
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Error creating ZIP file:", error)
            alert("Failed to create ZIP file. Please try again.")
        } finally {
            setIsDownloading(false)
        }
    }

    // Helper function to download an SVG file
    const downloadSvgFile = (content: string, filename: string) => {
        const blob = new Blob([content], { type: "image/svg+xml" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // Don't show anything if there's no SVG content
    if (!svgContent) return null

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className="w-full py-6 text-lg" disabled={isProcessing || isDownloading}>
                    <Download className="mr-2 h-5 w-5" />
                    Download SVG
                    <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Download Options</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleDownloadFull}>
                    Download Complete SVG
                </DropdownMenuItem>

                {colorGroups && Object.keys(colorGroups).length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Individual Color Groups</DropdownMenuLabel>

                        <DropdownMenuItem onClick={handleDownloadAllSeparately}>
                            <Layers className="mr-2 h-4 w-4" />
                            All Groups as ZIP
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {Object.entries(colorGroups).map(([colorKey, group]) => (
                            <DropdownMenuItem
                                key={colorKey}
                                onClick={() => handleDownloadColorGroup(colorKey, group.displayName)}
                            >
                                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: group.color }} />
                                {group.displayName}
                            </DropdownMenuItem>
                        ))}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
} 