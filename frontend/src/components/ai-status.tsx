'use client'

import { useState, useEffect } from 'react'
import { Zap, AlertCircle } from 'lucide-react'

export default function AIStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [modelInfo, setModelInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAIStatus()
    const interval = setInterval(checkAIStatus, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const checkAIStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health/ai`)
      if (response.ok) {
        const data = await response.json()
        setModelInfo(data)
        setStatus('online')
        setError(null)
      } else {
        setStatus('offline')
        setError('AI service not responding')
      }
    } catch (err) {
      setStatus('offline')
      setError('Cannot connect to AI service')
    }
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">AI System Status</h3>
        <Zap className="h-5 w-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Connection</span>
          <div className="flex items-center gap-2">
            {status === 'checking' ? (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-sm text-yellow-400">Checking...</span>
              </>
            ) : status === 'online' ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-green-400">Connected</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-sm text-red-400">Offline</span>
              </>
            )}
          </div>
        </div>

        {/* Model Info */}
        {modelInfo && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Model</span>
              <span className="text-sm">{modelInfo.model || 'Mixtral 8x7B'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">GPU</span>
              <span className="text-sm">
                {modelInfo.gpu_enabled ? modelInfo.gpu_name || 'GPU Enabled' : 'CPU Mode'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">GPU Temperature</span>
              <span className="text-sm">{modelInfo.gpu_temperature || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">GPU Usage</span>
              <span className="text-sm">{modelInfo.gpu_usage || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Model Size</span>
              <span className="text-sm">{modelInfo.model_size || 'N/A'}</span>
            </div>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 space-y-2">
          <button onClick={checkAIStatus} className="w-full btn-secondary text-sm">
            Refresh Status
          </button>
          {status === 'offline' && (
            <div className="text-xs text-gray-500 text-center">
              Make sure Ollama is running: <code className="bg-gray-800 px-1 rounded">ollama serve</code>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
