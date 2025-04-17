"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, FileText } from "lucide-react"

export interface FileUploadProps {
  id: string
  label: string
  accept?: string
  maxSize?: number // Maximum file size in MB
  multiple?: boolean
  onChange: (files: File[]) => void
  value?: File[]
}

// Use default export so that dynamic import works without extra .then calls.
export default function FileUpload({
  id,
  label,
  accept = ".pdf,.doc,.docx",
  maxSize = 5,
  multiple = false,
  onChange,
  value = [],
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>(value)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const oversizedFiles = selectedFiles.filter((file) => file.size > maxSize * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed the maximum size of ${maxSize}MB`)
      return
    }
    const newFiles = multiple ? [...files, ...selectedFiles] : selectedFiles
    setFiles(newFiles)
    onChange(newFiles)
    setError(null)
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
    onChange(newFiles)
  }

  const triggerFileInput = () => {
    inputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-col gap-2">
        <div
          className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={triggerFileInput}
        >
          <Upload className="mx-auto h-6 w-6 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
          <p className="text-xs text-gray-400 mt-1">
            {multiple ? "Files" : "File"} should be {accept.split(",").join(", ")} (Max: {maxSize}MB)
          </p>
          <Input
            ref={inputRef}
            id={id}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        {files.length > 0 && (
          <div className="space-y-2 mt-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                  <span className="text-xs text-gray-500 ml-2">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRemoveFile(index)} className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
