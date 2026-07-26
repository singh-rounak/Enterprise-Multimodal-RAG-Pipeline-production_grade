import { useState, useEffect } from 'react'
import { UploadArea } from './components/UploadArea'
import { ChatInterface } from './components/ChatInterface'
import { DocumentList } from './components/DocumentList'
import { HealthIndicator } from './components/HealthIndicator'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ToastProvider } from './components/Toast'
import { api } from './lib/api'
import type { Document, HealthResponse } from './types'

function App() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat')

  const fetchHealth = async () => {
    try {
      const res = await api.get<HealthResponse>('/health')
      setHealth(res.data)
    } catch {
      setHealth({ status: 'degraded', embedding_model: '', vector_store_healthy: false, llm_model: '', llm_healthy: false })
    }
  }

  const fetchDocuments = async () => {
    try {
      const res = await api.get<Document[]>('/documents')
      setDocuments(res.data)
    } catch {
      setDocuments([])
    }
  }

  const handleUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Document uploaded and indexed successfully')
      await fetchDocuments()
      await fetchHealth()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Upload failed')
    }
  }

  const handleDeleteDocument = async (filename: string) => {
    try {
      await api.delete(`/documents/${filename}`)
      toast.success('Document deleted')
      await fetchDocuments()
      await fetchHealth()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Delete failed')
    }
  }

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchHealth(), fetchDocuments()])
      setIsLoading(false)
    }
    init()
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-pulse-soft">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading VectorMind...</p>
        </div>
      </div>
    )
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <Header health={health} activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 flex flex-col max-w-6xl w-full mx-auto px-4 py-8">
          {activeTab === 'chat' ? (
            <ChatInterface onDocumentsChange={fetchDocuments} />
          ) : (
            <DocumentList 
              documents={documents} 
              onUpload={handleUpload}
              onDelete={handleDeleteDocument}
              health={health}
            />
          )}
        </main>

        <Footer health={health} />
      </div>
    </ToastProvider>
  )
}

export default App