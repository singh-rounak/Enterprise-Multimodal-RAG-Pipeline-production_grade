import type { UploadResponse, HealthResponse, Document, ChatResponse, Citation } from './types/api'

export type { UploadResponse, HealthResponse, Document, ChatResponse, Citation }

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || `HTTP error ${response.status}`)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

export async function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health')
}

export async function uploadDocument(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch {
          reject(new Error('Invalid response'))
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText)
          reject(new Error(error.detail || 'Upload failed'))
        } catch {
          reject(new Error('Upload failed'))
        }
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error')))
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

    xhr.open('POST', `${API_BASE}/upload`)
    xhr.send(formData)
  })
}

export async function chat(question: string): Promise<ChatResponse> {
  return request('/chat', {
    method: 'POST',
    body: JSON.stringify({ question }),
  })
}

export async function streamChat(
  question: string,
  callbacks: {
    onCitations?: (citations: Citation[]) => void
    onToken?: (token: string) => void
    onDone?: () => void
    onError?: (err: Error) => void
  }
): Promise<void> {
  const url = `${API_BASE}/chat/stream`
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    })

    if (!response.ok) {
      throw new Error(`Streaming failed (${response.status})`)
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported on response.')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6)
          try {
            const data = JSON.parse(jsonStr)
            if (data.event === 'citations' && callbacks.onCitations) {
              callbacks.onCitations(data.citations)
            } else if (data.event === 'token' && callbacks.onToken) {
              callbacks.onToken(data.content)
            } else if (data.event === 'done' && callbacks.onDone) {
              callbacks.onDone()
            }
          } catch (e) {
            console.error('Failed to parse SSE payload', e)
          }
        }
      }
    }
    if (callbacks.onDone) callbacks.onDone()
  } catch (err: any) {
    if (callbacks.onError) callbacks.onError(err)
  }
}

export async function getDocuments(): Promise<Document[]> {
  return request<{ documents: Document[] }>('/documents').then(r => r.documents)
}

export async function deleteDocument(filename: string): Promise<void> {
  return request(`/documents/${filename}`, { method: 'DELETE' })
}