import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An error occurred'
    return Promise.reject({ ...error, message })
  }
)

export const uploadDocument = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const chat = (question: string) => api.post('/chat', { question })

export const getHealth = () => api.get('/health')

export const getDocuments = () => api.get('/documents')

export const deleteDocument = (filename: string) => api.delete(`/documents/${filename}`)