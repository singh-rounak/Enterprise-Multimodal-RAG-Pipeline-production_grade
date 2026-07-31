import { X, FileText, Bookmark, Target, ShieldCheck } from 'lucide-react'
import type { Citation } from '../types/api'

interface CitationInspectorProps {
  citation: Citation | null
  onClose: () => void
}

export function CitationInspector({ citation, onClose }: CitationInspectorProps) {
  if (!citation) return null

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-slide-left">
      {/* Drawer Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Source Provenance Inspector</h3>
            <p className="text-[11px] text-muted-foreground">Document Context & Grounding Metadata</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Source File Badge & Info */}
        <div className="p-3.5 bg-muted/40 border border-border/80 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source Document</span>
            <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-mono font-bold">
              PAGE {citation.page || 1}
            </span>
          </div>
          <div className="text-sm font-bold text-foreground truncate flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">{citation.source_file}</span>
          </div>
        </div>

        {/* Vector Score Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/30 border border-border rounded-xl flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-blue-500" /> Vector Score
            </span>
            <span className="text-lg font-mono font-bold text-foreground">
              {(citation.score * 100).toFixed(1)}%
            </span>
          </div>

          <div className="p-3 bg-muted/30 border border-border rounded-xl flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Chunk Index
            </span>
            <span className="text-lg font-mono font-bold text-foreground">
              #{citation.chunk_index ?? 0}
            </span>
          </div>
        </div>

        {/* Extracted Excerpt */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Retrieved Text Excerpt
          </h4>
          <div className="p-4 bg-background border border-border/80 rounded-xl text-xs font-mono leading-relaxed text-foreground/90 whitespace-pre-wrap max-h-[300px] overflow-y-auto shadow-inner">
            {citation.snippet}
          </div>
        </div>
      </div>

      {/* Drawer Footer */}
      <div className="p-4 border-t border-border bg-muted/20 text-center">
        <button
          onClick={onClose}
          className="w-full py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-xl text-xs font-medium transition-all shadow-sm"
        >
          Close Inspector
        </button>
      </div>
    </div>
  )
}
