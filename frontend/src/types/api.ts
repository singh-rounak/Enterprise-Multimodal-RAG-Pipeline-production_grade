export interface Citation {
  source_file: string
  page?: number
  chunk_index?: number
  score: number
  snippet: string
}

export interface UploadResponse {
  message: string
  chunks: number
}

export interface HealthResponse {
  status: string
  embedding_model: string
  vector_store_healthy: boolean
  llm_model: string
  llm_healthy: boolean
}

export interface Document {
  filename: string
  chunks: number
  size: number
  uploadedAt: string
}

export interface ChatResponse {
  answer: string
  citations?: Citation[]
}