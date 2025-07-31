'use client'

import { useState, useEffect } from 'react'
import { 
  Pause, 
  Play, 
  RefreshCw, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Brain,
  Activity,
  Zap,
  Terminal,
  Cpu,
  Timer,
  AlertTriangle,
  TrendingUp,
  Shield,
  Eye,
  Settings,
  Info,
  Clock,
  Database,
  Server
} from 'lucide-react'
import { api } from '@/services/api'

interface AIStatus {
  status: string
  current_task: string | null
  total_files: number
  processed_files: number
  errors: number
  processing_rate: number
  logs: Array<{
    time: string
    message: string
    type: string
  }>
  progress: number
  cpu_usage?: number
  memory_usage?: number
  queue_size?: number
  avg_processing_time?: number
}

export default function AIMonitorPage() {
  const [aiStatus, setAiStatus] = useState<AIStatus>({
    status: 'idle',
    current_task: null,
    total_files: 0,
    processed_files: 0,
    errors: 0,
    processing_rate: 0,
    logs: [],
    progress: 0,
    cpu_usage: 45,
    memory_usage: 62,
    queue_size: 0,
    avg_processing_time: 2.4
  })
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    // Fetch initial status
    fetchStatus()

    // Setup WebSocket connection
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
    const websocket = new WebSocket(`${wsUrl}/api/ai-monitor/ws`)
    
    websocket.onopen = () => {
      console.log('Connected to AI monitor')
    }
    
    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === 'state_update') {
        setAiStatus(message.data)
      }
    }
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
    
    return () => {
      websocket.close()
    }
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await api.getAIStatus()
      if (response.data) {
        setAiStatus(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch AI status:', error)
    }
  }

  const startProcessing = async () => {
    const response = await api.startAIProcessing()
    if (response.data) {
      fetchStatus()
    }
  }

  const pauseProcessing = async () => {
    const response = await api.pauseAIProcessing()
    if (response.data) {
      fetchStatus()
    }
  }

  const resumeProcessing = async () => {
    const response = await api.resumeAIProcessing()
    if (response.data) {
      fetchStatus()
    }
  }

  const stopProcessing = async () => {
    const response = await api.stopAIProcessing()
    if (response.data) {
      fetchStatus()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'text-emerald-400'
      case 'paused': return 'text-amber-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-emerald-500'
      case 'paused': return 'bg-amber-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="h-screen w-full bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-400" />
                AI Processing Monitor
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">Real-time AI case processing insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchStatus}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Settings className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Controls & Stats */}
        <div className="w-80 border-r border-white/5 flex flex-col">
          {/* Status Card */}
          <div className="p-4 border-b border-white/5">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusBg(aiStatus.status)} ${
                    aiStatus.status === 'processing' ? 'animate-pulse' : ''
                  }`} />
                  <span className={`text-sm font-medium capitalize ${getStatusColor(aiStatus.status)}`}>
                    {aiStatus.status}
                  </span>
                </div>
                <Shield className="h-4 w-4 text-gray-500" />
              </div>
              
              {aiStatus.current_task && (
                <div className="text-xs text-gray-400 mb-3">
                  Processing: <span className="text-gray-300">{aiStatus.current_task}</span>
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex gap-2">
                {aiStatus.status === 'idle' && (
                  <button
                    onClick={startProcessing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Start
                  </button>
                )}
                {aiStatus.status === 'processing' && (
                  <>
                    <button
                      onClick={pauseProcessing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Pause className="h-3.5 w-3.5" />
                      Pause
                    </button>
                    <button
                      onClick={stopProcessing}
                      className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-sm font-medium"
                    >
                      Stop
                    </button>
                  </>
                )}
                {aiStatus.status === 'paused' && (
                  <>
                    <button
                      onClick={resumeProcessing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Resume
                    </button>
                    <button
                      onClick={stopProcessing}
                      className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-sm font-medium"
                    >
                      Stop
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="p-4 border-b border-white/5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Processing Progress</span>
              <span className="text-xs text-gray-500">{Math.round(aiStatus.progress)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                style={{ width: `${aiStatus.progress}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500">
              <span>{aiStatus.processed_files} processed</span>
              <span>{aiStatus.total_files - aiStatus.processed_files} remaining</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <FileText className="h-4 w-4 text-blue-400" />
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                </div>
                <div className="text-lg font-semibold text-white">{aiStatus.total_files}</div>
                <div className="text-[10px] text-gray-500">Total Files</div>
              </div>

              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400">+{aiStatus.processed_files}</span>
                </div>
                <div className="text-lg font-semibold text-white">{aiStatus.processed_files}</div>
                <div className="text-[10px] text-gray-500">Processed</div>
              </div>

              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <Activity className="h-3 w-3 text-amber-400" />
                </div>
                <div className="text-lg font-semibold text-white">{aiStatus.processing_rate.toFixed(1)}</div>
                <div className="text-[10px] text-gray-500">Files/min</div>
              </div>

              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  {aiStatus.errors > 0 && (
                    <span className="text-[10px] text-red-400">Alert</span>
                  )}
                </div>
                <div className="text-lg font-semibold text-white">{aiStatus.errors}</div>
                <div className="text-[10px] text-gray-500">Errors</div>
              </div>
            </div>

            {/* System Resources */}
            <div className="bg-white/5 rounded-lg p-3">
              <h3 className="text-xs font-medium text-gray-400 mb-3">System Resources</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Cpu className="h-3 w-3" />
                      CPU Usage
                    </span>
                    <span className="text-[10px] text-gray-400">{aiStatus.cpu_usage || 0}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        (aiStatus.cpu_usage || 0) > 80 ? 'bg-red-500' : 
                        (aiStatus.cpu_usage || 0) > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${aiStatus.cpu_usage || 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      Memory
                    </span>
                    <span className="text-[10px] text-gray-400">{aiStatus.memory_usage || 0}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        (aiStatus.memory_usage || 0) > 80 ? 'bg-red-500' : 
                        (aiStatus.memory_usage || 0) > 60 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${aiStatus.memory_usage || 0}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      Avg. Time
                    </span>
                    <span className="text-gray-400">{aiStatus.avg_processing_time?.toFixed(1) || 0}s</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] mt-1">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Server className="h-3 w-3" />
                      Queue Size
                    </span>
                    <span className="text-gray-400">{aiStatus.queue_size || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Logs */}
        <div className="flex-1 flex flex-col">
          {/* Log Header */}
          <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="h-4 w-4 text-purple-400" />
              <h2 className="text-sm font-medium text-white">AI Processing Log</h2>
              <span className="text-xs text-gray-500">Real-time insights</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors flex items-center gap-1.5 ${
                  autoScroll 
                    ? 'bg-purple-600/20 text-purple-300' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Activity className="h-3 w-3" />
                Auto-scroll
              </button>
              <button className="p-1.5 hover:bg-white/5 rounded transition-colors">
                <Eye className="h-3.5 w-3.5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Log Content */}
          <div className="flex-1 bg-black/30 p-4 overflow-hidden">
            <div className="h-full bg-black/50 rounded-lg border border-white/5 p-4 overflow-y-auto font-mono text-xs">
              {aiStatus.logs.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Terminal className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No logs yet</p>
                    <p className="text-xs text-gray-500 mt-1">Processing logs will appear here</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {aiStatus.logs.map((log, index) => (
                    <div key={index} className="flex gap-3 py-0.5 hover:bg-white/[0.02] px-2 -mx-2 rounded">
                      <span className="text-gray-600 select-none">{log.time}</span>
                      <div className="flex items-start gap-2 flex-1">
                        {log.type === 'success' && <CheckCircle className="h-3 w-3 text-emerald-400 mt-0.5" />}
                        {log.type === 'error' && <AlertCircle className="h-3 w-3 text-red-400 mt-0.5" />}
                        {log.type === 'warning' && <AlertTriangle className="h-3 w-3 text-amber-400 mt-0.5" />}
                        {log.type === 'info' && <Info className="h-3 w-3 text-blue-400 mt-0.5" />}
                        <span
                          className={`leading-relaxed ${
                            log.type === 'success' ? 'text-emerald-400' :
                            log.type === 'error' ? 'text-red-400' :
                            log.type === 'warning' ? 'text-amber-400' :
                            log.type === 'info' ? 'text-blue-400' :
                            'text-gray-300'
                          }`}
                        >
                          {log.message}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Log Stats Bar */}
          <div className="px-6 py-3 bg-black/30 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-gray-500">
                {aiStatus.logs.length} entries
              </span>
              <span className="text-gray-500">•</span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-gray-500">
                  {aiStatus.logs.filter(l => l.type === 'success').length} success
                </span>
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span className="text-gray-500">
                  {aiStatus.logs.filter(l => l.type === 'error').length} errors
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}