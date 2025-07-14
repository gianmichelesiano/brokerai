"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, File } from "lucide-react"

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onFileSelect?: (file: File | null) => void
  acceptedTypes?: string[]
  maxSize?: number // in MB
  showPreview?: boolean
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ className, onFileSelect, acceptedTypes = [], maxSize = 50, showPreview = true, ...props }, ref) => {
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
    const [dragActive, setDragActive] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleFileSelect = (file: File | null) => {
      if (file) {
        // Validate file type
        if (acceptedTypes.length > 0) {
          const fileExtension = file.name.split('.').pop()?.toLowerCase()
          if (!acceptedTypes.includes(fileExtension || '')) {
            alert(`Tipo file non supportato. Tipi consentiti: ${acceptedTypes.join(', ')}`)
            return
          }
        }

        // Validate file size
        const fileSizeMB = file.size / (1024 * 1024)
        if (fileSizeMB > maxSize) {
          alert(`File troppo grande. Dimensione massima: ${maxSize}MB`)
          return
        }
      }

      setSelectedFile(file)
      onFileSelect?.(file)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null
      handleFileSelect(file)
    }

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true)
      } else if (e.type === "dragleave") {
        setDragActive(false)
      }
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0])
      }
    }

    const clearFile = () => {
      setSelectedFile(null)
      onFileSelect?.(null)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }

    const openFileDialog = () => {
      inputRef.current?.click()
    }

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          onChange={handleInputChange}
          className="hidden"
          accept={acceptedTypes.map(type => `.${type}`).join(',')}
          {...props}
        />
        
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
            className
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          {selectedFile ? (
            <div className="space-y-2">
              <File className="h-8 w-8 mx-auto text-primary" />
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Clicca per selezionare o trascina qui il file
                </p>
                <p className="text-xs text-muted-foreground">
                  {acceptedTypes.length > 0 && `Formati supportati: ${acceptedTypes.join(', ')}`}
                  {maxSize && ` • Max ${maxSize}MB`}
                </p>
              </div>
            </div>
          )}
        </div>

        {selectedFile && showPreview && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <File className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                clearFile()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    )
  }
)

FileInput.displayName = "FileInput"

export { FileInput }
