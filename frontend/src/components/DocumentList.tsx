import { useState, useEffect } from 'react'
import { 
  FileText, 
  Database, 
  Trash2, 
  Loader2, 
  Sparkles,
} from 'lucide-react'
import { formatFileSize, formatDate } from '../lib/utils'
import { DocumentUploader } from './DocumentUploader'
import { getDocuments, deleteDocument } from '../api'

interface Document {
  filename: string
  chunks: number
  size: number
  uploadedAt: string
}

export function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showUploader, setShowUploader] = useState(false)

  const fetchDocuments = async () => {
    try {
      const docs = await getDocuments()
      setDocuments(docs)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleDelete = async (filename: string) => {
    if (!confirm(`Delete "${filename}" and all its chunks?`)) return
    
    setDeleting(filename)
    try {
      await deleteDocument(filename)
      setDocuments((prev) => prev.filter((d) => d.filename !== filename))
    } catch (error) {
      alert('Failed to delete document')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-40 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Upload Document
          </h2>
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="text-sm text-primary hover:underline"
          >
            {showUploader ? 'Hide' : 'Show'} Uploader
          </button>
        </div>
        {showUploader && (
          <DocumentUploader
            onUploadComplete={() => {
              setShowUploader(false)
              fetchDocuments()
            }}
          />
        )}
      </div>

      {/* Document List */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Indexed Documents
            <span className="text-sm font-normal text-muted-foreground">
              ({documents.length})
            </span>
          </h2>
        </div>

        {documents.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No documents indexed yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Upload a PDF, TXT, or MD file to get started
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {documents.map((doc) => (
              <DocumentRow
                key={doc.filename}
                doc={doc}
                onDelete={handleDelete}
                deleting={deleting === doc.filename}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface DocumentRowProps {
  doc: Document
  onDelete: (filename: string) => void
  deleting: boolean
}

function DocumentRow({ doc, onDelete, deleting }: DocumentRowProps) {
  return (
    <div className="p-4 hover:bg-muted/30 transition-colors group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{doc.filename}</p>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              {doc.chunks} chunks
            </span>
            <span className="flex items-center gap-1">
              {formatFileSize(doc.size)}
            </span>
            <span className="flex items-center gap-1">
              {formatDate(doc.uploadedAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDelete(doc.filename)}
            disabled={deleting}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors disabled:opacity-50"
            aria-label="Delete document"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}