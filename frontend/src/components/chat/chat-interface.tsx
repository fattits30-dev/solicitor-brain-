'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Send, 
  Paperclip, 
  Search, 
  FileText, 
  Camera, 
  Folder, 
  Bot, 
  User, 
  Mic, 
  MicOff,
  Volume2,
  Copy,
  Brain,
  Image as ImageIcon
} from 'lucide-react'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  attachments?: Array<{
    name: string
    type: string
    url?: string
  }>
  actions?: Array<{
    type: 'search' | 'analyze' | 'create' | 'scan'
    status: 'pending' | 'complete' | 'error'
    result?: any
  }>
}

export default function ChatInterface() {
  const searchParams = useSearchParams()
  const isVoiceMode = searchParams.get('voice') === 'true'
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize with real document awareness
  useEffect(() => {
    loadRealDocuments()
  }, [])

  // Setup voice mode if enabled
  useEffect(() => {
    if (isVoiceMode) {
      const msg: Message = {
        id: 'voice-welcome',
        role: 'assistant',
        content: '🎤 Voice mode is active! Click the microphone button to start dictating. I can help you with:\n\n• Legal document dictation\n• Case note transcription\n• Voice commands for document analysis\n• Hands-free case review\n\nSpeak naturally - I\'ll format your dictation appropriately for legal documents.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, msg])
    }
  }, [isVoiceMode])

  const loadRealDocuments = async () => {
    try {
      // Scan for real documents
      const response = await fetch('http://localhost:8000/api/real-cases/scan')
      const data = await response.json()
      
      let documentInfo = 'No documents found yet.'
      if (data.success && data.documents && data.documents.length > 0) {
        const categories = data.documents.reduce((acc: any, doc: any) => {
          acc[doc.category] = (acc[doc.category] || 0) + 1
          return acc
        }, {})
        
        documentInfo = `I've found **${data.count} documents** in your system:\n`
        Object.entries(categories).forEach(([category, count]) => {
          const docCount = count as number
          documentInfo += `• ${docCount} ${category} document${docCount > 1 ? 's' : ''}\n`
        })
      }
      
      const welcomeMessage: Message = {
        id: '1',
        role: 'assistant',
        content: `Welcome to Solicitor Brain! I'm your AI legal assistant with advanced capabilities:

🎤 **Voice Mode**: Click the microphone to dictate documents or discuss cases
📸 **OCR**: Drop images or PDFs here for instant text extraction
📁 **Document Analysis**: I can analyze your legal documents and extract key information
🔍 **Case Search**: Search through your case files and precedents
✍️ **Document Drafting**: Create legal documents from templates

${documentInfo}

How can I assist you today? You can speak, type, or drag and drop files.`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    } catch (error) {
      console.error('Failed to scan documents:', error)
      const welcomeMessage: Message = {
        id: '1',
        role: 'assistant',
        content: `Welcome to Solicitor Brain! I'm ready to assist with your legal work.

You can:
• Use voice dictation (click the microphone)
• Drop documents here for OCR and analysis
• Ask questions about UK law
• Draft legal documents

How can I help you today?`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }

  const handleSend = async () => {
    if (!input.trim() && attachedFiles.length === 0) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
      attachments: attachedFiles.map(f => ({
        name: f.name,
        type: f.type
      }))
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Process attached files first
    if (attachedFiles.length > 0) {
      for (const file of attachedFiles) {
        if (file.type.startsWith('image/')) {
          await processImageWithOCR(file)
        } else if (file.type === 'application/pdf') {
          await processPDF(file)
        }
      }
    }

    setAttachedFiles([])

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input,
          context: messages.slice(-5).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        actions: data.actions
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I encountered an error. Please check your connection and try again.',
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const processImageWithOCR = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch('http://localhost:8000/api/ocr/extract-text', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        const ocrMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `📸 **OCR Results for ${file.name}**:\n\n"${result.text}"\n\n**Confidence**: ${result.confidence?.toFixed(1)}%\n**Word Count**: ${result.word_count}\n\nWould you like me to analyze this document for legal issues or key information?`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, ocrMessage])
      }
    } catch (error) {
      console.error('OCR error:', error)
    }
  }

  const processPDF = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch('http://localhost:8000/api/ocr/extract-pdf', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        const pdfMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `📄 **PDF Analysis for "${file.name}"**\n\n**Pages**: ${result.total_pages}\n\n**Preview**:\n${result.full_text.substring(0, 500)}...\n\nI can help you:\n- Extract specific sections\n- Search for key terms\n- Analyze legal implications\n- Summarize the document\n\nWhat would you like me to do with this document?`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, pdfMessage])
      }
    } catch (error) {
      console.error('PDF processing error:', error)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      
      recorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' })
        await processVoiceRecording(audioBlob)
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      console.error('Recording error:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  const processVoiceRecording = async (audioBlob: Blob) => {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.wav')
    
    try {
      const response = await fetch('http://localhost:8000/api/voice/transcribe-legal', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        setInput(result.formatted_text || result.text)
      }
    } catch (error) {
      console.error('Voice processing error:', error)
    }
  }

  const speakText = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-GB'
    utterance.rate = 0.9
    speechSynthesis.speak(utterance)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setAttachedFiles(files)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    setAttachedFiles(prev => [...prev, ...files])
  }

  const quickActions = [
    { icon: Search, label: 'Search Cases', action: 'Search for cases related to ' },
    { icon: FileText, label: 'Analyze Document', action: 'Analyze this document for key legal points: ' },
    { icon: Camera, label: 'Extract Text', action: 'Extract and analyze text from image ' },
    { icon: Folder, label: 'Organize', action: 'Help me organize my case files' },
    { icon: Brain, label: 'Legal Research', action: 'Research UK law regarding ' }
  ]

  return (
    <div 
      className="flex flex-col h-full bg-gray-950"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Voice Mode Indicator */}
      {isVoiceMode && (
        <div className="bg-blue-900/20 border-b border-blue-800 px-6 py-2">
          <div className="flex items-center justify-center gap-2">
            <Mic className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-blue-400">Voice Mode Active - Click microphone to speak</span>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map(message => (
            <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              )}

              <div className={`max-w-2xl ${message.role === 'user' ? 'order-1' : 'order-2'}`}>
                <div
                  className={`rounded-lg px-4 py-3 ${
                    message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-100'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm opacity-80">
                          {file.type.startsWith('image/') ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                          <span>{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-700/50">
                      <button
                        onClick={() => navigator.clipboard.writeText(message.content)}
                        className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                        title="Copy"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => speakText(message.content)}
                        className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                        title="Read aloud"
                      >
                        <Volume2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1 px-1">
                  {message.timestamp.toLocaleTimeString('en-GB')}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 order-2">
                  <User className="h-5 w-5 text-gray-300" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="bg-gray-800 rounded-lg px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-gray-800 px-6 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 mb-3 overflow-x-auto">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => setInput(action.action)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors whitespace-nowrap"
              >
                <action.icon className="h-4 w-4" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {attachedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-lg text-sm">
                  {file.type.startsWith('image/') ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                  <span>{file.name}</span>
                  <button
                    onClick={() => setAttachedFiles(files => files.filter((_, i) => i !== idx))}
                    className="text-gray-400 hover:text-gray-200"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.tiff,.bmp"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title="Attach files"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 rounded-lg transition-colors ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
              title={isRecording ? 'Stop recording' : 'Start voice recording'}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={isRecording ? "Recording... Click mic to stop" : "Ask about cases, analyze documents, or use voice..."}
              className="flex-1 bg-gray-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400"
              disabled={isRecording}
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && attachedFiles.length === 0) || isRecording}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="h-5 w-5" />
              <span>Send</span>
            </button>
          </div>
          
          <div className="mt-2 text-xs text-gray-500 text-center">
            Drag & drop files • Press Ctrl+K for commands • {isRecording ? 'Recording...' : 'Click mic for voice'}
          </div>
        </div>
      </div>
    </div>
  )
}