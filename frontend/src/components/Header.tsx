import { cn } from '../lib/utils'
import { Brain, Database, Server, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import type { HealthResponse } from '../types'

interface HeaderProps {
  health: HealthResponse | null
  activeTab: 'chat' | 'documents'
  setActiveTab: (tab: 'chat' | 'documents') => void
}

export function Header({ health, activeTab, setActiveTab }: HeaderProps) {
  const statusColor = health?.status === 'ok' ? 'text-green-500' : 'text-yellow-500'
  const statusIcon = health?.status === 'ok' ? CheckCircle : AlertTriangle

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">VectorMind</h1>
              <p className="text-xs text-muted-foreground">Enterprise Multimodal RAG Pipeline</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-muted p-1 rounded-lg" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'chat'}
              onClick={() => setActiveTab('chat')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === 'chat'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Chat
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'documents'}
              onClick={() => setActiveTab('documents')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === 'documents'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Documents
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-xs font-medium">
              <statusIcon className={cn('w-3 h-3', statusColor)} />
              <span className={cn(statusColor)}>
                {health?.status === 'ok' ? 'System Healthy' : 'Degraded'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                {health?.vector_store_healthy ? 'Qdrant' : 'Qdrant ⚠'}
              </span>
              <span className="flex items-center gap-1">
                <Server className="w-3 h-3" />
                {health?.llm_healthy ? 'Ollama' : 'Ollama ⚠'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}