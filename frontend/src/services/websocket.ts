import { EventEmitter } from 'events'

export type WebSocketEvent =
  | { type: 'document.uploaded'; data: { id: string; name: string; size: number } }
  | { type: 'document.processed'; data: { id: string; status: 'ready' | 'error' } }
  | { type: 'case.updated'; data: { id: string; changes: any } }
  | { type: 'ai.processing'; data: { caseId: string; progress: number; message: string } }
  | { type: 'ai.completed'; data: { caseId: string; result: any } }
  | { type: 'system.notification'; data: { level: 'info' | 'warning' | 'error'; message: string } }

class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatTimer: NodeJS.Timeout | null = null

  constructor() {
    super()
    // Only connect in browser environment
    if (typeof window !== 'undefined') {
      this.connect()
    }
  }

  private connect() {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') + '/ws'
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
        this.emit('connected')
        this.startHeartbeat()
      }

      this.ws.onmessage = event => {
        try {
          const message: WebSocketEvent = JSON.parse(event.data)
          this.emit(message.type, message.data)
          this.emit('message', message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onerror = error => {
        console.error('WebSocket error:', error)
        this.emit('error', error)
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.emit('disconnected')
        this.stopHeartbeat()
        this.scheduleReconnect()
      }
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      this.emit('reconnect.failed')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000) // Send ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  public send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, message not sent:', message)
    }
  }

  public close() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
    }
  }

  public getState(): 'connecting' | 'connected' | 'disconnected' {
    if (!this.ws) return 'disconnected'
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'connected'
      default:
        return 'disconnected'
    }
  }
}

// Export singleton instance - lazy initialization to avoid SSR issues
let wsServiceInstance: WebSocketService | null = null

export const wsService = (() => {
  if (typeof window !== 'undefined' && !wsServiceInstance) {
    wsServiceInstance = new WebSocketService()
  }
  return wsServiceInstance || ({
    on: () => {},
    off: () => {},
    send: () => {},
    close: () => {},
    getState: () => 'disconnected' as const
  } as any)
})()

// React hook for WebSocket
import { useEffect, useState } from 'react'

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(wsService.getState() === 'connected')

  useEffect(() => {
    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)

    wsService.on('connected', handleConnect)
    wsService.on('disconnected', handleDisconnect)

    return () => {
      wsService.off('connected', handleConnect)
      wsService.off('disconnected', handleDisconnect)
    }
  }, [])

  return {
    isConnected,
    on: (event: string, handler: (...args: any[]) => void) => {
      wsService.on(event, handler)
      return () => wsService.off(event, handler)
    },
    send: (message: any) => wsService.send(message),
    service: wsService
  }
}
