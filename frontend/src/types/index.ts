export interface Document {
  filename: string
  extension: string
  chunks: number
  size: number
  uploadedAt: string
}

export interface ChatRequest {
  question: string
}

export interface ChatResponse {
  answer: string
}

export interface HealthResponse {
  status: 'ok' | 'degraded'
  embedding_model: string
  vector_store_healthy: boolean
  llm_model: string
  llm_healthy: boolean
}

export interface UploadResponse {
  message: string
  chunks: number
}