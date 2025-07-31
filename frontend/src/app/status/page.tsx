'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Database, 
  Brain, 
  FileText,
  BarChart3, 
  Mail, 
  Activity, 
  Zap, 
  Lock, 
  Search, 
  Calendar,
  Info,
  TrendingUp,
  AlertCircle,
  Shield,
  Users,
  Server,
  GitBranch,
  Package,
  Cpu,
  HardDrive,
  Wifi,
  Globe,
  Terminal,
  Code,
  Gauge,
  PlayCircle,
  PauseCircle,
  CheckSquare,
  Square,
  CircleDot,
  ArrowRight,
  ExternalLink,
  Layers,
  Briefcase,
  MessageSquare,
  FolderOpen,
  Settings,
  Heart,
  Bug,
  Rocket
} from 'lucide-react'
import { api } from '@/services/api'

interface Feature {
  name: string
  description: string
  status: 'implemented' | 'partial' | 'missing'
  icon: any
  apiEndpoint?: string
  notes?: string
  progress?: number
  category: 'core' | 'ai' | 'integration' | 'security'
}

interface SystemStatus {
  api: 'checking' | 'healthy' | 'error'
  database: 'checking' | 'connected' | 'error'
  ai: 'checking' | 'ready' | 'not-installed' | 'error'
  websocket: 'checking' | 'connected' | 'disconnected'
}

interface ProjectStats {
  totalFiles: number
  linesOfCode: number
  lastUpdated: string
  version: string
  dependencies: number
  diskUsage: string
}

export default function StatusPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    api: 'checking',
    database: 'checking',
    ai: 'checking',
    websocket: 'checking'
  })
  const [projectStats, setProjectStats] = useState<ProjectStats>({
    totalFiles: 247,
    linesOfCode: 18542,
    lastUpdated: new Date().toISOString(),
    version: '0.1.0-alpha',
    dependencies: 82,
    diskUsage: '124 MB'
  })
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'core' | 'ai' | 'integration' | 'security'>('all')

  const features: Feature[] = [
    // Core Features
    {
      name: 'Dashboard',
      description: 'Main overview with metrics and charts',
      status: 'implemented',
      icon: BarChart3,
      apiEndpoint: '/api/dashboard',
      notes: 'Real-time updates, auto-refresh',
      progress: 100,
      category: 'core'
    },
    {
      name: 'Case Management',
      description: 'Create, view, and manage legal cases',
      status: 'implemented',
      icon: Briefcase,
      apiEndpoint: '/api/cases',
      notes: 'CRUD operations, status tracking',
      progress: 100,
      category: 'core'
    },
    {
      name: 'Document Management',
      description: 'Upload and process legal documents',
      status: 'implemented',
      icon: FolderOpen,
      apiEndpoint: '/api/documents',
      notes: 'File upload, PDF/Word support',
      progress: 100,
      category: 'core'
    },
    {
      name: 'Email System',
      description: 'Process emails and attachments',
      status: 'partial',
      icon: Mail,
      apiEndpoint: '/api/emails',
      notes: 'Backend ready, needs IMAP config',
      progress: 70,
      category: 'core'
    },
    // AI Features
    {
      name: 'AI Chat Assistant',
      description: 'Interactive AI for legal queries',
      status: 'partial',
      icon: MessageSquare,
      apiEndpoint: '/api/chat',
      notes: 'Basic chat works, needs AI integration',
      progress: 60,
      category: 'ai'
    },
    {
      name: 'Case Analysis',
      description: 'AI-powered case insights',
      status: 'partial',
      icon: Brain,
      apiEndpoint: '/api/case-analysis',
      notes: 'Structure ready, needs AI model',
      progress: 50,
      category: 'ai'
    },
    {
      name: 'AI Monitor',
      description: 'Track AI activity and performance',
      status: 'partial',
      icon: Activity,
      apiEndpoint: '/api/ai-monitor',
      notes: 'UI ready, needs metrics collection',
      progress: 65,
      category: 'ai'
    },
    {
      name: 'Document OCR',
      description: 'Extract text from scanned documents',
      status: 'missing',
      icon: FileText,
      apiEndpoint: '/api/ocr',
      notes: 'Tesseract integration planned',
      progress: 0,
      category: 'ai'
    },
    // Integration Features
    {
      name: 'WebSocket Updates',
      description: 'Real-time notifications',
      status: 'partial',
      icon: Zap,
      apiEndpoint: '/ws',
      notes: 'Client ready, server needs implementation',
      progress: 40,
      category: 'integration'
    },
    {
      name: 'Calendar Integration',
      description: 'Deadline and appointment tracking',
      status: 'missing',
      icon: Calendar,
      apiEndpoint: '/api/calendar',
      notes: 'Needs implementation',
      progress: 0,
      category: 'integration'
    },
    {
      name: 'Full-Text Search',
      description: 'Search across all case data',
      status: 'missing',
      icon: Search,
      apiEndpoint: '/api/search',
      notes: 'Needs Elasticsearch/PostgreSQL FTS',
      progress: 0,
      category: 'integration'
    },
    {
      name: 'Report Generation',
      description: 'Generate case reports',
      status: 'missing',
      icon: FileText,
      apiEndpoint: '/api/reports',
      notes: 'PDF generation needed',
      progress: 0,
      category: 'integration'
    },
    // Security Features
    {
      name: 'Authentication',
      description: 'User login and sessions',
      status: 'missing',
      icon: Lock,
      apiEndpoint: '/api/auth',
      notes: 'JWT setup needed',
      progress: 0,
      category: 'security'
    },
    {
      name: 'Role-Based Access',
      description: 'User permissions and roles',
      status: 'missing',
      icon: Shield,
      apiEndpoint: '/api/roles',
      notes: 'RBAC implementation needed',
      progress: 0,
      category: 'security'
    },
    {
      name: 'Audit Logging',
      description: 'Track all user actions',
      status: 'missing',
      icon: FileText,
      apiEndpoint: '/api/audit',
      notes: 'Compliance requirement',
      progress: 0,
      category: 'security'
    },
    {
      name: 'Data Encryption',
      description: 'Encrypt sensitive data',
      status: 'partial',
      icon: Lock,
      notes: 'TLS enabled, need at-rest encryption',
      progress: 30,
      category: 'security'
    }
  ]

  useEffect(() => {
    checkSystemHealth()
    const interval = setInterval(checkSystemHealth, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const checkSystemHealth = async () => {
    // Check API
    try {
      const response = await api.checkHealth()
      if (response.data) {
        setSystemStatus(prev => ({
          ...prev,
          api: 'healthy',
          database: response.data.services?.database === 'connected' ? 'connected' : 'error'
        }))
      } else {
        setSystemStatus(prev => ({ ...prev, api: 'error' }))
      }
    } catch (error) {
      setSystemStatus(prev => ({ ...prev, api: 'error', database: 'error' }))
    }

    // Check WebSocket
    try {
      const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws')
      ws.onopen = () => {
        setSystemStatus(prev => ({ ...prev, websocket: 'connected' }))
        ws.close()
      }
      ws.onerror = () => {
        setSystemStatus(prev => ({ ...prev, websocket: 'disconnected' }))
      }
    } catch {
      setSystemStatus(prev => ({ ...prev, websocket: 'disconnected' }))
    }

    // Check AI (simulate for now)
    setSystemStatus(prev => ({ ...prev, ai: 'not-installed' }))
  }

  const getStatusIcon = (status: Feature['status']) => {
    switch (status) {
      case 'implemented':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />
      case 'partial':
        return <Clock className="h-4 w-4 text-amber-400" />
      case 'missing':
        return <Circle className="h-4 w-4 text-gray-500" />
    }
  }

  const getSystemStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-emerald-400" />
      case 'error':
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-red-400" />
      case 'not-installed':
        return <AlertCircle className="h-5 w-5 text-amber-400" />
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-500 border-t-transparent animate-spin" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return 'Healthy'
      case 'connected': return 'Connected'
      case 'ready': return 'Ready'
      case 'error': return 'Error'
      case 'disconnected': return 'Disconnected'
      case 'not-installed': return 'Not Installed'
      default: return 'Checking...'
    }
  }

  const counts = {
    implemented: features.filter(f => f.status === 'implemented').length,
    partial: features.filter(f => f.status === 'partial').length,
    missing: features.filter(f => f.status === 'missing').length
  }

  const overallProgress = Math.round(
    (counts.implemented * 100 + counts.partial * 50) / features.length
  )

  const categories = [
    { id: 'all', name: 'All Features', icon: Layers },
    { id: 'core', name: 'Core', icon: Package },
    { id: 'ai', name: 'AI Features', icon: Brain },
    { id: 'integration', name: 'Integrations', icon: Zap },
    { id: 'security', name: 'Security', icon: Shield }
  ]

  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(f => f.category === selectedCategory)

  return (
    <div className="h-screen w-full bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-400" />
              Implementation Status
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Track development progress and system health</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-500">Version</div>
              <div className="text-sm font-medium text-white">{projectStats.version}</div>
            </div>
            <a 
              href="https://github.com/yourusername/solicitor-brain" 
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <GitBranch className="h-4 w-4 text-gray-400" />
            </a>
          </div>
        </div>
      </div>

      {/* System Status Bar */}
      <div className="px-6 py-4 bg-black/30 border-b border-white/5">
        <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <Server className="h-4 w-4 text-gray-400" />
          System Health
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">API Server</span>
              {getSystemStatusIcon(systemStatus.api)}
            </div>
            <div className="text-sm font-medium text-white">{getStatusText(systemStatus.api)}</div>
            <div className="text-[10px] text-gray-500">localhost:8000</div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Database</span>
              {getSystemStatusIcon(systemStatus.database)}
            </div>
            <div className="text-sm font-medium text-white">{getStatusText(systemStatus.database)}</div>
            <div className="text-[10px] text-gray-500">PostgreSQL 15</div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">AI Model</span>
              {getSystemStatusIcon(systemStatus.ai)}
            </div>
            <div className="text-sm font-medium text-white">{getStatusText(systemStatus.ai)}</div>
            <div className="text-[10px] text-gray-500">Ollama / Mistral</div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">WebSocket</span>
              {getSystemStatusIcon(systemStatus.websocket)}
            </div>
            <div className="text-sm font-medium text-white">{getStatusText(systemStatus.websocket)}</div>
            <div className="text-[10px] text-gray-500">Real-time updates</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Progress Overview */}
        <div className="w-80 border-r border-white/5 p-6 flex flex-col">
          {/* Overall Progress */}
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-400" />
              Overall Progress
            </h3>
            <div className="text-3xl font-bold text-white mb-2">{overallProgress}%</div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mb-4">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-semibold text-emerald-400">{counts.implemented}</div>
                <div className="text-[10px] text-gray-500">Complete</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-amber-400">{counts.partial}</div>
                <div className="text-[10px] text-gray-500">In Progress</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-400">{counts.missing}</div>
                <div className="text-[10px] text-gray-500">Planned</div>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <h3 className="text-xs font-medium text-gray-400 mb-3">Filter by Category</h3>
            <div className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`w-full text-left p-2 rounded-lg transition-all flex items-center gap-2 ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-white/5 text-gray-400'
                  }`}
                >
                  <cat.icon className="h-4 w-4" />
                  <span className="text-sm">{cat.name}</span>
                  <span className="ml-auto text-xs">
                    {cat.id === 'all' 
                      ? features.length
                      : features.filter(f => f.category === cat.id).length
                    }
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Project Stats */}
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Code className="h-4 w-4 text-gray-400" />
              Project Statistics
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Files</span>
                <span className="text-gray-300">{projectStats.totalFiles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lines of Code</span>
                <span className="text-gray-300">{projectStats.linesOfCode.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dependencies</span>
                <span className="text-gray-300">{projectStats.dependencies}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Disk Usage</span>
                <span className="text-gray-300">{projectStats.diskUsage}</span>
              </div>
              <div className="pt-2 border-t border-white/5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="text-gray-300">
                    {new Date(projectStats.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-auto space-y-2">
            <button className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-xs text-gray-300 flex items-center justify-center gap-2">
              <Terminal className="h-3 w-3" />
              View Logs
            </button>
            <button className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-xs text-gray-300 flex items-center justify-center gap-2">
              <Bug className="h-3 w-3" />
              Report Issue
            </button>
          </div>
        </div>

        {/* Right Panel - Features List */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-gray-400" />
              Feature Implementation Status
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredFeatures.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.name}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/[0.07] transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        feature.status === 'implemented' ? 'bg-emerald-500/10' :
                        feature.status === 'partial' ? 'bg-amber-500/10' :
                        'bg-gray-500/10'
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          feature.status === 'implemented' ? 'text-emerald-400' :
                          feature.status === 'partial' ? 'text-amber-400' :
                          'text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-medium text-white">{feature.name}</h3>
                          {getStatusIcon(feature.status)}
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{feature.description}</p>
                        
                        {feature.progress !== undefined && (
                          <div className="mb-2">
                            <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{feature.progress}%</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${
                                  feature.progress === 100 ? 'bg-emerald-500' :
                                  feature.progress >= 50 ? 'bg-amber-500' :
                                  'bg-gray-500'
                                }`}
                                style={{ width: `${feature.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {feature.notes && (
                          <p className="text-[10px] text-gray-500 italic mb-2">{feature.notes}</p>
                        )}
                        
                        <div className="flex items-center gap-2">
                          {feature.apiEndpoint && (
                            <code className="text-[10px] bg-black/30 px-2 py-0.5 rounded font-mono">
                              {feature.apiEndpoint}
                            </code>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            feature.category === 'core' ? 'bg-blue-500/20 text-blue-300' :
                            feature.category === 'ai' ? 'bg-purple-500/20 text-purple-300' :
                            feature.category === 'integration' ? 'bg-cyan-500/20 text-cyan-300' :
                            'bg-rose-500/20 text-rose-300'
                          }`}>
                            {feature.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Next Steps */}
            <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-300 mb-4 flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Next Steps
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-blue-300">1</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">Install Ollama</h4>
                      <p className="text-xs text-gray-400">Required for AI features to work</p>
                      <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" 
                         className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1">
                        Documentation <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-blue-300">2</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">Configure Email</h4>
                      <p className="text-xs text-gray-400">Set IMAP/SMTP credentials in settings</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-blue-300">3</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">Complete AI Integration</h4>
                      <p className="text-xs text-gray-400">Connect chat and analysis to Mistral</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-blue-300">4</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">Implement WebSocket</h4>
                      <p className="text-xs text-gray-400">Enable real-time updates</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-blue-300">5</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">Add Authentication</h4>
                      <p className="text-xs text-gray-400">Secure the application with JWT</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-blue-300">6</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">Deploy to Production</h4>
                      <p className="text-xs text-gray-400">Set up secure hosting environment</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-xs text-gray-500">
              <p>Built with <Heart className="h-3 w-3 inline text-red-400" /> for UK solicitors</p>
              <p className="mt-1">SRA Compliance Ready • GDPR Compliant • On-Premise Deployment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Fix missing Circle import
import { Circle } from 'lucide-react'