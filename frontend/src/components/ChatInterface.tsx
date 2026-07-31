import { useState, useRef, useEffect } from 'react'
import { cn } from '../lib/utils'
import { Send, Bot, MessageSquare, Loader2, Copy, AlertCircle, Sparkles, FileText, Check, ExternalLink } from 'lucide-react'
import { streamChat } from '../api'
import type { Citation } from '../types/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  timestamp: Date
  isStreaming?: boolean
}

interface ChatInterfaceProps {
  onSelectCitation?: (citation: Citation) => void
}

export function ChatInterface({ onSelectCitation }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handlePromptClick = (promptText: string) => {
    setInput(promptText)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

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

    const assistantId = crypto.randomUUID()
    const initialAssistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      citations: [],
      timestamp: new Date(),
      isStreaming: true,
    }

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage])
    setInput('')
    setLoading(true)
    setError(null)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      await streamChat(question, {
        onCitations: (citations) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, citations } : msg
            )
          )
        },
        onToken: (token) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: msg.content + token }
                : msg
            )
          )
        },
        onDone: () => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, isStreaming: false } : msg
            )
          )
          setLoading(false)
        },
        onError: (err) => {
          setError(err.message || 'Stream connection error')
          setLoading(false)
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, isStreaming: false } : msg
            )
          )
        },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to stream response')
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/20 to-purple-500/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">VectorMind Enterprise RAG</h3>
            <p className="text-sm text-center max-w-md text-muted-foreground mb-6">
              Upload PDF, Text, or Markdown documents to build your grounded knowledge base. Ask questions with real-time token streaming and citation provenance.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full">
              {[
                'Summarize key insights from the uploaded documents',
                'What are the core technical requirements listed?',
                'Find all references to security and compliance',
                'Extract key dates and milestones mentioned',
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePromptClick(prompt)}
                  className="p-3 text-left border border-border/60 hover:border-primary/50 bg-card hover:bg-accent/40 rounded-xl transition-all text-xs text-foreground/80 flex items-start gap-2 group shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-3 animate-fade-in group',
              msg.role === 'user' && 'flex-row-reverse'
            )}
          >
            <div
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted border border-border text-foreground'
              )}
            >
              {msg.role === 'user' ? (
                <MessageSquare className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4 text-primary" />
              )}
            </div>

            <div
              className={cn(
                'max-w-[82%] flex flex-col gap-2',
                msg.role === 'user' ? 'items-end' : 'items-start'
              )}
            >
              <div
                className={cn(
                  'px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed border',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground border-primary rounded-br-none'
                    : 'bg-card text-card-foreground border-border/80 rounded-bl-none'
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content || (msg.isStreaming && 'Generating analysis...')}</p>

                {msg.isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />
                )}
              </div>

              {/* Citations Badges Bar */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 self-center mr-1">
                    <FileText className="w-3 h-3" /> Sources:
                  </span>
                  {msg.citations.map((cit, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => onSelectCitation && onSelectCitation(cit)}
                      className="px-2.5 py-1 rounded-md bg-muted/80 hover:bg-primary/10 hover:border-primary/40 border border-border text-[11px] font-medium text-foreground flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <span className="w-4 h-4 rounded bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
                        {cIdx + 1}
                      </span>
                      <span className="truncate max-w-[120px]">{cit.source_file}</span>
                      <span className="text-muted-foreground font-mono text-[10px]">p.{cit.page || 1}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground opacity-80">
                <span>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.role === 'assistant' && msg.content && (
                  <button
                    onClick={() => copyToClipboard(msg.id, msg.content)}
                    className="hover:text-foreground p-0.5 rounded transition-colors flex items-center gap-1"
                    title="Copy message"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center justify-between animate-slide-up text-destructive text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="hover:opacity-80">
            ✕
          </button>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-card/50 backdrop-blur">
        <div className="relative max-w-4xl mx-auto flex items-end gap-2 bg-background border border-border/80 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary rounded-2xl p-2 shadow-sm transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your uploaded knowledge base..."
            className="w-full min-h-[44px] max-h-[150px] px-3 py-2 bg-transparent border-none resize-none focus:outline-none text-sm text-foreground placeholder:text-muted-foreground"
            disabled={loading}
            rows={1}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={cn(
              'h-10 w-10 rounded-xl transition-all shrink-0 flex items-center justify-center font-medium shadow-sm',
              loading || !input.trim()
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:opacity-90 active:scale-95'
            )}
            aria-label="Send query"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-2 font-mono">
          Press <kbd className="px-1 py-0.5 bg-muted border border-border rounded text-[10px]">Enter</kbd> to send &nbsp;•&nbsp;
          <kbd className="px-1 py-0.5 bg-muted border border-border rounded text-[10px]">Shift+Enter</kbd> for line breaks
        </p>
      </form>
    </div>
  )
}