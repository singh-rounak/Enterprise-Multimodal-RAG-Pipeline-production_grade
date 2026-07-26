import { cn, getStatusColor } from '../lib/utils'
import { CheckCircle, AlertTriangle, Database, Server, Cpu, HardDrive } from 'lucide-react'
import type { HealthResponse } from '../types'

interface HealthIndicatorProps {
  health: HealthResponse | null
  compact?: boolean
}

export function HealthIndicator({ health, compact = false }: HealthIndicatorProps) {
  if (!health) return null

  const status = health.status
  const isHealthy = status === 'ok'

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', getStatusColor(status))}>
        {isHealthy ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
        <span className="text-sm font-medium capitalize">{status}</span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className={cn('p-4 rounded-xl border', getStatusColor(status))}>
        <div className="flex items-center gap-2 mb-2">
          {isHealthy ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="font-semibold text-sm">System Status</span>
        </div>
        <p className="text-lg font-bold capitalize">{status}</p>
      </div>

      <div className="p-4 rounded-xl border bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">Vector Store</span>
        </div>
        <div className="flex items-center gap-2">
          {health.vector_store_healthy ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          )}
          <span className={health.vector_store_healthy ? 'text-green-600' : 'text-red-600'}>
            {health.vector_store_healthy ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="p-4 rounded-xl border bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Server className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">LLM Service</span>
        </div>
        <div className="flex items-center gap-2">
          {health.llm_healthy ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          )}
          <span className={health.llm_healthy ? 'text-green-600' : 'text-red-600'}>
            {health.llm_healthy ? 'Ready' : 'Unavailable'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{health.llm_model}</p>
      </div>

      <div className="p-4 rounded-xl border bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">Embeddings</span>
        </div>
        <p className="font-mono text-sm text-foreground">{health.embedding_model}</p>
        <p className="text-xs text-muted-foreground mt-1">384 dimensions</p>
      </div>
    </div>
  )
}