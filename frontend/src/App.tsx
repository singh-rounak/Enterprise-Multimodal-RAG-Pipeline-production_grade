import { useState, useEffect } from 'react'
import { ChatInterface } from './components/ChatInterface'
import { DocumentList } from './components/DocumentList'
import { DocumentUploader } from './components/DocumentUploader'
import { CitationInspector } from './components/CitationInspector'
import { ToastProvider } from './components/Toast'
import { getHealth } from './api'
import type { HealthResponse, Citation } from './types/api'
import { FolderKanban, PanelLeftClose, PanelLeftOpen } from 'lucide-react'


function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)

  const fetchHealth = async () => {
    try {
      const data = await getHealth()
      setHealth(data)
    } catch {
      setHealth({
        status: 'degraded',
        embedding_model: 'MiniLM-L6-v2',
        vector_store_healthy: false,
        llm_model: 'phi3:mini',
        llm_healthy: false,
      })
    }
  }

  useEffect(() => {
    const init = async () => {
      await fetchHealth()
      setIsLoading(false)
    }
    init()
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Initializing VectorMind Workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <ToastProvider>
      <div className="h-screen bg-background flex flex-col overflow-hidden text-foreground">
        {/* Header Bar */}
        <header className="border-b border-border bg-card/95 backdrop-blur h-14 shrink-0 px-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={sidebarOpen ? 'Collapse Documents Sidebar' : 'Expand Documents Sidebar'}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                VectorMind
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-mono font-bold text-primary">
                v2.0 Enterprise RAG
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-muted/60 border border-border">
              <span
                className={`w-2 h-2 rounded-full ${
                  health?.status === 'ok' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-muted-foreground">
                Qdrant: <strong className="text-foreground">{health?.vector_store_healthy ? 'Connected' : 'Offline'}</strong>
              </span>
              <span className="text-border">|</span>
              <span className="text-muted-foreground">
                Ollama: <strong className="text-foreground">{health?.llm_healthy ? 'Ready' : 'Offline'}</strong>
              </span>
            </div>
          </div>
        </header>

        {/* Main Workspace Layout */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Sidebar: Knowledge Base Document Manager */}
          <aside
            className={`border-r border-border bg-card/40 flex flex-col transition-all duration-300 z-20 ${
              sidebarOpen ? 'w-80 sm:w-96 translate-x-0' : 'w-0 -translate-x-full overflow-hidden border-none'
            }`}
          >
            <div className="p-3 border-b border-border/80 flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Knowledge Base</h2>
              </div>
            </div>

            <div className="p-3 border-b border-border/80">
              <DocumentUploader />
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <DocumentList />
            </div>
          </aside>

          {/* Center Area: Real-Time Streaming Chat */}
          <main className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
            <ChatInterface onSelectCitation={(cit) => setSelectedCitation(cit)} />
          </main>

          {/* Right Drawer: Citation Inspector */}
          <CitationInspector citation={selectedCitation} onClose={() => setSelectedCitation(null)} />
        </div>
      </div>
    </ToastProvider>
  )
}

export default App