import type { UploadResponse, HealthResponse, Document, ChatResponse } from './types/api'

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

export async function getDocuments(): Promise<Document[]> {
  return request<{ documents: Document[] }>('/documents').then(r => r.documents)
}

export async function deleteDocument(filename: string): Promise<void> {
  return request(`/documents/${filename}`, { method: 'DELETE' })
}