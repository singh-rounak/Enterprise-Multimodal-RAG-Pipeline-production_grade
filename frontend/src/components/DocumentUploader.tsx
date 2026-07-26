import { useState, useCallback } from 'react'
import { Upload, FileText, CheckCircle, XCircle, Loader2, AlertCircle, FileType } from 'lucide-react'
import { cn, formatFileSize } from '../lib/utils'
import { uploadDocument, type UploadResponse } from '../api'

interface DocumentUploaderProps {
  onUploadComplete?: (response: UploadResponse) => void
}

const ACCEPTED_TYPES = ['.pdf', '.txt', '.md']
const MAX_SIZE = 25 * 1024 * 1024 // 25MB

export function DocumentUploader({ onUploadComplete }: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<UploadResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (f: File): string | null => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED_TYPES.includes(ext)) {
      return `Unsupported file type. Accepted: ${ACCEPTED_TYPES.join(', ')}`
    }
    if (f.size > MAX_SIZE) {
      return `File too large. Max size: ${MAX_SIZE / 1024 / 1024}MB`
    }
    return null
  }

  const handleFileSelect = (f: File) => {
    const err = validateFile(f)
    if (err) {
      setError(err)
      return
    }
    setFile(f)
    setError(null)
    setResult(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const upload = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const response = await uploadDocument(file, (p) => setProgress(p))
      setResult(response)
      onUploadComplete?.(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setResult(null)
    setError(null)
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (!file && !result) {
    return (
      <div
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
          'border-border hover:border-primary/50 bg-muted/30'
        )}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />
        <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-foreground mb-1">
          Drag & drop a document or click to browse
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          PDF, TXT, MD • Max 25MB
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Choose File
        </button>
      </div>
    )
  }

  if (file && !uploading && !result) {
    return (
      <div className="border border-border rounded-xl p-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <FileType className="w-10 h-10 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
          </div>
          <button
            onClick={removeFile}
            className="text-muted-foreground hover:text-red-500 transition-colors"
            aria-label="Remove file"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> {error}
          </p>
        )}
        <button
          onClick={upload}
          className="mt-4 w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Upload & Index Document
        </button>
      </div>
    )
  }

  if (uploading) {
    return (
      <div className="border border-border rounded-xl p-4 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <div>
            <p className="font-medium">Processing Document</p>
            <p className="text-sm text-muted-foreground">
              Extracting text, chunking, embedding & indexing...
            </p>
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2 text-center">
          {progress}%
        </p>
      </div>
    )
  }

  if (result) {
    return (
      <div className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-xl p-4 animate-slide-up">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-green-800 dark:text-green-200">
              Document Indexed Successfully
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              {result.chunks} chunks created and stored in vector database
            </p>
          </div>
          <button
            onClick={removeFile}
            className="text-green-500 hover:text-green-700 transition-colors"
            aria-label="Upload another document"
          >
            <Upload className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  return null
}