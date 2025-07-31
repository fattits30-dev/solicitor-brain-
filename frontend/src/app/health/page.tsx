'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Activity,
  Shield,
  Cpu,
  Database,
  Zap,
  Globe,
  Server,
  Clock,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Terminal,
  Gauge,
  Info,
  Wifi,
  HardDrive,
  MemoryStick,
  Network
} from 'lucide-react'

interface HealthCheck {
  name: string
  endpoint: string
  status: 'checking' | 'healthy' | 'error' | 'not-found'
  message?: string
  responseTime?: number
}

interface SystemMetrics {
  cpu: number
  memory: number
  disk: number
  network: number
  uptime: string
  requests: number
  errors: number
  avgResponseTime: number
}

export default function HealthCheckPage() {
  const [checks, setChecks] = useState<HealthCheck[]>([
    { name: 'Backend API', endpoint: '/health', status: 'checking' },
    { name: 'Dashboard API', endpoint: '/api/dashboard', status: 'checking' },
    { name: 'Cases API', endpoint: '/api/cases', status: 'checking' },
    { name: 'Documents API', endpoint: '/api/documents', status: 'checking' },
    { name: 'Chat API', endpoint: '/api/chat', status: 'checking' },
    { name: 'AI Monitor API', endpoint: '/api/ai-monitor', status: 'checking' },
    { name: 'WebSocket', endpoint: '/ws', status: 'checking' },
  ])
  const [isChecking, setIsChecking] = useState(false)
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 45,
    memory: 62,
    disk: 24,
    network: 78,
    uptime: '15d 3h 24m',
    requests: 12543,
    errors: 23,
    avgResponseTime: 124
  })
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h')

  const checkEndpoint = async (check: HealthCheck): Promise<HealthCheck> => {
    const startTime = Date.now()
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${check.endpoint}`)
      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        return { ...check, status: 'healthy', responseTime, message: `Response: ${response.status}` }
      } else if (response.status === 404) {
        return { ...check, status: 'not-found', responseTime, message: 'Endpoint not found' }
      } else {
        return { ...check, status: 'error', responseTime, message: `Error: ${response.status}` }
      }
    } catch (error) {
      return { 
        ...check, 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Connection failed',
        responseTime: Date.now() - startTime
      }
    }
  }

  const runHealthChecks = async () => {
    setIsChecking(true)
    const results = await Promise.all(
      checks.map(check => checkEndpoint(check))
    )
    setChecks(results)
    setIsChecking(false)
  }

  useEffect(() => {
    runHealthChecks()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />
      case 'not-found':
        return <AlertCircle className="h-4 w-4 text-amber-400" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-500 border-t-transparent animate-spin" />
    }
  }

  const getStatusColor = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
      case 'error':
        return 'bg-red-500/10 border-red-500/20 text-red-400'
      case 'not-found':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400'
      default:
        return 'bg-gray-500/10 border-gray-500/20 text-gray-400'
    }
  }

  const getMetricColor = (value: number, thresholds: { warning: number, danger: number }) => {
    if (value >= thresholds.danger) return 'text-red-400'
    if (value >= thresholds.warning) return 'text-amber-400'
    return 'text-emerald-400'
  }

  const healthyCount = checks.filter(c => c.status === 'healthy').length
  const errorCount = checks.filter(c => c.status === 'error').length
  const overallHealth = errorCount === 0 ? 'healthy' : errorCount > 2 ? 'critical' : 'degraded'

  return (
    <div className="h-screen w-full bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                System Health
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">Monitor system status and performance</p>
            </div>
            <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${
              overallHealth === 'healthy' ? 'bg-emerald-600/20 text-emerald-300' :
              overallHealth === 'critical' ? 'bg-red-600/20 text-red-300' :
              'bg-amber-600/20 text-amber-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                overallHealth === 'healthy' ? 'bg-emerald-400' :
                overallHealth === 'critical' ? 'bg-red-400' :
                'bg-amber-400'
              } animate-pulse`} />
              <span className="text-xs font-medium capitalize">{overallHealth}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              {['1h', '24h', '7d', '30d'].map(range => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-3 py-1 text-xs rounded transition-all ${
                    selectedTimeRange === range
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <button
              onClick={runHealthChecks}
              disabled={isChecking}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Checking...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="px-6 py-4 bg-black/30 border-b border-white/5">
        <div className="grid grid-cols-4 gap-4">
          {/* CPU Usage */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-medium text-gray-400">CPU Usage</span>
              </div>
              <span className={`text-lg font-semibold ${getMetricColor(systemMetrics.cpu, { warning: 70, danger: 85 })}`}>
                {systemMetrics.cpu}%
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  systemMetrics.cpu >= 85 ? 'bg-red-500' :
                  systemMetrics.cpu >= 70 ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${systemMetrics.cpu}%` }}
              />
            </div>
          </div>

          {/* Memory Usage */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MemoryStick className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-medium text-gray-400">Memory</span>
              </div>
              <span className={`text-lg font-semibold ${getMetricColor(systemMetrics.memory, { warning: 70, danger: 85 })}`}>
                {systemMetrics.memory}%
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  systemMetrics.memory >= 85 ? 'bg-red-500' :
                  systemMetrics.memory >= 70 ? 'bg-amber-500' :
                  'bg-purple-500'
                }`}
                style={{ width: `${systemMetrics.memory}%` }}
              />
            </div>
          </div>

          {/* Disk Usage */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-medium text-gray-400">Disk</span>
              </div>
              <span className={`text-lg font-semibold ${getMetricColor(systemMetrics.disk, { warning: 70, danger: 85 })}`}>
                {systemMetrics.disk}%
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  systemMetrics.disk >= 85 ? 'bg-red-500' :
                  systemMetrics.disk >= 70 ? 'bg-amber-500' :
                  'bg-cyan-500'
                }`}
                style={{ width: `${systemMetrics.disk}%` }}
              />
            </div>
          </div>

          {/* Network */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-medium text-gray-400">Network</span>
              </div>
              <span className="text-lg font-semibold text-emerald-400">{systemMetrics.network}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${systemMetrics.network}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-xs text-gray-500">Uptime</div>
              <div className="text-sm font-medium text-white">{systemMetrics.uptime}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-xs text-gray-500">Total Requests</div>
              <div className="text-sm font-medium text-white">{systemMetrics.requests.toLocaleString()}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-xs text-gray-500">Errors (24h)</div>
              <div className="text-sm font-medium text-red-400">{systemMetrics.errors}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Gauge className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-xs text-gray-500">Avg Response</div>
              <div className="text-sm font-medium text-white">{systemMetrics.avgResponseTime}ms</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Endpoints List */}
        <div className="flex-1 px-6 py-4 overflow-y-auto">
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Server className="h-4 w-4 text-gray-400" />
            Service Endpoints
          </h2>
          <div className="space-y-2">
            {checks.map((check) => (
              <div
                key={check.endpoint}
                className={`border rounded-lg p-4 transition-all ${getStatusColor(check.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <h3 className="font-medium text-white">{check.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">{check.endpoint}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-4">
                      {check.responseTime !== undefined && (
                        <div>
                          <div className="text-sm font-medium text-white">{check.responseTime}ms</div>
                          <div className="text-[10px] text-gray-500">Response Time</div>
                        </div>
                      )}
                      <div className="text-right">
                        <div className={`text-xs font-medium capitalize ${
                          check.status === 'healthy' ? 'text-emerald-400' :
                          check.status === 'error' ? 'text-red-400' :
                          check.status === 'not-found' ? 'text-amber-400' :
                          'text-gray-400'
                        }`}>
                          {check.status === 'not-found' ? 'Not Found' : check.status}
                        </div>
                        {check.message && (
                          <div className="text-[10px] text-gray-500">{check.message}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Diagnosis */}
        <div className="w-80 border-l border-white/5 p-4 flex flex-col">
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Terminal className="h-4 w-4 text-gray-400" />
            System Diagnosis
          </h2>
          
          <div className="flex-1 space-y-3">
            {/* Overall Status */}
            <div className={`rounded-lg p-4 ${
              checks.every(c => c.status === 'healthy') 
                ? 'bg-emerald-500/10 border border-emerald-500/20' 
                : 'bg-red-500/10 border border-red-500/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {checks.every(c => c.status === 'healthy') ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">All Systems Operational</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-medium text-red-400">System Issues Detected</span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {healthyCount} of {checks.length} services are healthy
              </p>
            </div>

            {/* Connection Status */}
            {checks.some(c => c.status === 'error' && c.message?.includes('Connection failed')) && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wifi className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">Backend Unreachable</span>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  Unable to connect to the backend server
                </p>
                <div className="bg-black/30 rounded p-2">
                  <p className="text-[10px] text-gray-400 mb-1">Run backend with:</p>
                  <code className="text-[10px] text-emerald-400 font-mono">
                    ./scripts/start_services.sh
                  </code>
                </div>
              </div>
            )}

            {/* Missing Endpoints */}
            {checks.some(c => c.status === 'not-found') && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">Missing Endpoints</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  {checks.filter(c => c.status === 'not-found').length} endpoints need implementation
                </p>
                <div className="space-y-1">
                  {checks.filter(c => c.status === 'not-found').map(check => (
                    <div key={check.endpoint} className="text-[10px] text-gray-500 font-mono">
                      {check.endpoint}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Insights */}
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-white">Performance</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Avg Response Time</span>
                  <span className={`font-medium ${
                    systemMetrics.avgResponseTime < 200 ? 'text-emerald-400' :
                    systemMetrics.avgResponseTime < 500 ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {systemMetrics.avgResponseTime}ms
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Error Rate</span>
                  <span className={`font-medium ${
                    (systemMetrics.errors / systemMetrics.requests * 100) < 1 ? 'text-emerald-400' :
                    'text-red-400'
                  }`}>
                    {((systemMetrics.errors / systemMetrics.requests) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-white">Recommendations</span>
              </div>
              <ul className="space-y-1.5 text-[10px] text-gray-400">
                {systemMetrics.cpu > 70 && (
                  <li className="flex items-start gap-1">
                    <span className="text-amber-400">•</span>
                    <span>High CPU usage detected. Consider scaling resources.</span>
                  </li>
                )}
                {systemMetrics.memory > 70 && (
                  <li className="flex items-start gap-1">
                    <span className="text-amber-400">•</span>
                    <span>Memory usage is high. Check for memory leaks.</span>
                  </li>
                )}
                {errorCount > 0 && (
                  <li className="flex items-start gap-1">
                    <span className="text-red-400">•</span>
                    <span>Service failures detected. Check logs for details.</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 space-y-2">
            <button className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-xs text-gray-300 flex items-center justify-center gap-2">
              <Terminal className="h-3 w-3" />
              View Logs
            </button>
            <button className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-xs text-gray-300 flex items-center justify-center gap-2">
              <Shield className="h-3 w-3" />
              Security Scan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}