import { cn } from '../lib/utils'
import { Github, Linkedin, Twitter, BookOpen, Terminal, Database, Zap } from 'lucide-react'
import type { HealthResponse } from '../types'

interface FooterProps {
  health: HealthResponse | null
}

export function Footer({ health }: FooterProps) {
  const features = [
    { icon: Database, label: 'Vector Search', desc: 'Qdrant HNSW' },
    { icon: Zap, label: 'Hybrid Retrieval', desc: 'Dense + Sparse + RRF' },
    { icon: BookOpen, label: 'Reranking', desc: 'Cross-Encoder' },
    { icon: Terminal, label: 'Local LLM', desc: 'Ollama (phi3:mini)' },
  ]

  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <Terminal className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">VectorMind</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Production-grade, 100% local, multimodal RAG pipeline with semantic chunking,
              hybrid retrieval, and cross-encoder reranking. Zero cloud dependencies.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">Architecture</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <f.icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                  <div>
                    <span className="font-medium text-foreground">{f.label}</span>
                    <p className="text-xs">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">Tech Stack</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>FastAPI + Uvicorn</li>
              <li>Qdrant Vector DB</li>
              <li>Sentence Transformers</li>
              <li>LangChain Text Splitters</li>
              <li>Ollama (Local LLM)</li>
              <li>Docker Compose</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">Connect</h4>
            <div className="flex gap-3">
              <a href="https://github.com/singh-rounak" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com/in/singh-rounak" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://twitter.com/singh_rounak" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>Built by Rounak Singh • Enterprise RAG Pipeline • 2026</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {health?.status === 'ok' ? 'All Systems Operational' : 'Degraded'}
            </span>
            <span>v{health?.embedding_model?.split('/').pop() || '2.0.0'}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}