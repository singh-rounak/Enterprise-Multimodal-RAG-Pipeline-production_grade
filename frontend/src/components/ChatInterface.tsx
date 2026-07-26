import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { cn } from '../lib/utils'
import { Send, Bot, MessageSquare, Loader2, Copy, AlertCircle, Sparkles } from 'lucide-react'
import { api } from '../lib/api'
import type { ChatResponse } from '../types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {
  onDocumentsChange?: () => void
}

export const ChatInterface = forwardRef<HTMLDivElement, ChatInterfaceProps>(({ onDocumentsChange }, ref) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }))

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const question = input.trim()
    if (!question || loading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const response = await api.post<ChatResponse>('/chat', { question })
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.data.answer,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err: any) {
      setError(err.message || 'Failed to get response')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Sparkles className="w-16 h-16 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Welcome to VectorMind</h3>
            <p className="text-sm text-center max-w-xs">
              Upload a document first, then ask questions about its content.
              I'll search through your documents and provide grounded answers.
            </p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-3 animate-fade-in',
              msg.role === 'user' && 'flex-row-reverse'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {msg.role === 'user' ? (
                <MessageSquare className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div
              className={cn(
                'max-w-[75%] px-4 py-2.5 rounded-2xl',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-muted rounded-bl-none'
              )}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity group">
                <span className="text-xs text-muted-foreground">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => copyToClipboard(msg.content)}
                    className="p-1 hover:bg-background/50 rounded transition-colors"
                    aria-label="Copy message"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="px-4 py-2.5 bg-muted rounded-2xl rounded-bl-none">
              <div className="flex gap-1">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <Loader2 className="w-4 h-4 text-primary animate-spin" style={{ animationDelay: '100ms' }} />
                <Loader2 className="w-4 h-4 text-primary animate-spin" style={{ animationDelay: '200ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 mb-4 rounded-xl flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-background">
        <div className="relative max-w-4xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={autoResize}
            placeholder="Ask a question about your documents..."
            className="w-full min-h-[48px] max-h-[150px] px-4 py-3 pr-12 bg-muted border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            disabled={loading}
            rows={1}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={cn(
              'absolute right-2 bottom-2 p-2 rounded-lg transition-colors',
              'flex items-center justify-center',
              loading
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : input.trim()
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
            aria-label="Send message"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Press <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono">Enter</kbd> to send •
          <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono">Shift+Enter</kbd> for new line
        </p>
      </form>
    </div>
  )
})

ChatInterface.displayName = 'ChatInterface'