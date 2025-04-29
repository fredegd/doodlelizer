"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageUploaderProps {
  onImageUpload: (imageDataUrl: string) => void
}

export default function ImageUploader({ onImageUpload }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    // Check if file is an image
    if (!file.type.match("image.*")) {
      alert("Please select an image file")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === "string") {
        onImageUpload(e.target.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center h-96 transition-colors ${
        isDragging ? "border-primary bg-primary/10" : "border-gray-700 hover:border-gray-500"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input type="file" ref={fileInputRef} onChange={handleFileInput} accept="image/*" className="hidden" />

      <div className="text-center">
        <div className="mb-4 bg-gray-800 p-4 rounded-full inline-block">
          {isDragging ? (
            <Upload className="h-10 w-10 text-primary" />
          ) : (
            <ImageIcon className="h-10 w-10 text-gray-400" />
          )}
        </div>
        <h3 className="text-xl font-medium mb-2">{isDragging ? "Drop your image here" : "Upload an image"}</h3>
        <p className="text-gray-400 mb-4">Drag and drop or click to browse</p>
        <Button onClick={handleButtonClick} variant="outline">
          Select Image
        </Button>
      </div>
    </div>
  )
}
