'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  Brain,
  RefreshCw,
  Zap,
  Shield,
  Database,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle,
  Scale,
  BookOpen,
  Gavel,
  FileSearch,
  AlertCircle,
  Timer,
  Eye,
  Target,
  Award
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { api } from '@/services/api'

// Dynamically import chart components
const Chart = dynamic(() => import('react-apexcharts'), { 
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-white/5 rounded-lg" />
})

export default function DashboardPage() {
  const [, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [metrics, setMetrics] = useState({
    total_cases: 0,
    active_cases: 0,
    pending_deadlines: 0,
    documents_processed: 0,
    ai_tasks_completed: 0,
    client_satisfaction: 0
  })
  const [realDocuments, setRealDocuments] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
    scanForRealDocuments()
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.getDashboardMetrics()
      if (response.data) {
        setMetrics(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const scanForRealDocuments = async () => {
    setScanning(true)
    try {
      const response = await fetch('http://localhost:8000/api/real-cases/scan')
      const data = await response.json()
      
      if (data.success && data.documents) {
        setRealDocuments(data.documents)
        setMetrics(prev => ({
          ...prev,
          documents_processed: data.count || 0
        }))
        const activities = data.documents.slice(0, 10).map((doc: any, idx: number) => ({
          id: doc.id,
          action: 'Document found',
          description: doc.name,
          time: `${idx + 1} minutes ago`,
          type: doc.category === 'case' ? 'case' : 'document'
        }))
        setRecentActivities(activities)
      }
    } catch (error) {
      console.error('Failed to scan documents:', error)
    } finally {
      setScanning(false)
    }
  }

  // Chart configurations
  const caseCategories = realDocuments.reduce((acc: any, doc: any) => {
    acc[doc.category] = (acc[doc.category] || 0) + 1
    return acc
  }, {})

  const documentStatusChart = {
    series: Object.values(caseCategories).length ? Object.values(caseCategories) as number[] : [1],
    options: {
      chart: { 
        type: 'donut' as const, 
        background: 'transparent',
        animations: { enabled: true, speed: 800 }
      },
      labels: Object.keys(caseCategories).length ? Object.keys(caseCategories) : ['No documents'],
      colors: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'],
      legend: { 
        position: 'bottom' as const,
        labels: { colors: '#e5e7eb' },
        fontSize: '11px'
      },
      plotOptions: {
        pie: {
          donut: { 
            size: '70%',
            background: 'transparent',
            labels: {
              show: true,
              value: {
                show: true,
                fontSize: '20px',
                fontWeight: 600,
                color: '#fff',
                offsetY: 5
              },
              total: {
                show: true,
                showAlways: true,
                label: 'Total Files',
                fontSize: '12px',
                fontWeight: 400,
                color: '#9ca3af',
              }
            }
          }
        }
      },
      dataLabels: { enabled: false },
      stroke: { show: false },
      tooltip: { 
        theme: 'dark',
        y: {
          formatter: (val: number) => `${val} documents`
        }
      }
    }
  }

  const activityChart = {
    series: [{
      name: 'Cases',
      data: [30, 40, 35, 50, 49, 60, 70]
    }, {
      name: 'Documents',
      data: [23, 32, 27, 38, 37, 42, 53]
    }],
    options: {
      chart: { 
        type: 'area' as const,
        background: 'transparent',
        toolbar: { show: false },
        stacked: true,
      },
      stroke: { 
        curve: 'smooth' as const,
        width: 2,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.6,
          opacityTo: 0.1,
          stops: [0, 100]
        }
      },
      colors: ['#3b82f6', '#8b5cf6'],
      xaxis: {
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        labels: { style: { colors: '#9ca3af', fontSize: '11px' } },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: { style: { colors: '#9ca3af', fontSize: '11px' } },
      },
      grid: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
        strokeDashArray: 3,
      },
      dataLabels: { enabled: false },
      legend: {
        position: 'top' as const,
        horizontalAlign: 'right' as const,
        labels: { colors: '#9ca3af' },
        fontSize: '11px'
      },
      tooltip: { 
        theme: 'dark',
        x: { show: true }
      }
    }
  }

  const performanceChart = {
    series: [{
      name: 'Performance',
      data: [85, 88, 87, 91, 94, 94, 95]
    }],
    options: {
      chart: { 
        type: 'line' as const,
        background: 'transparent',
        toolbar: { show: false },
        sparkline: { enabled: true }
      },
      stroke: { 
        curve: 'smooth' as const,
        width: 3,
        colors: ['#10b981']
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
          stops: [0, 100]
        }
      },
      tooltip: { enabled: false },
      grid: { show: false },
    }
  }

  const caseTypesChart = {
    series: [44, 55, 13, 43, 22],
    options: {
      chart: { 
        type: 'polarArea' as const,
        background: 'transparent',
      },
      labels: ['Civil', 'Criminal', 'Family', 'Corporate', 'Other'],
      colors: ['#3b82f6', '#ef4444', '#8b5cf6', '#10b981', '#f59e0b'],
      fill: { opacity: 0.8 },
      stroke: { 
        colors: ['#1a1a1a'],
        width: 2
      },
      yaxis: { show: false },
      legend: { 
        position: 'bottom' as const,
        labels: { colors: '#e5e7eb' },
        fontSize: '11px'
      },
      plotOptions: {
        polarArea: {
          rings: {
            strokeWidth: 1,
            strokeColor: 'rgba(255, 255, 255, 0.1)'
          },
          spokes: {
            strokeWidth: 1,
            connectorColors: 'rgba(255, 255, 255, 0.1)'
          }
        }
      },
      tooltip: { 
        theme: 'dark',
        y: {
          formatter: (val: number) => `${val} cases`
        }
      }
    }
  }

  return (
    <div className="h-screen w-full bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Top Bar - System Status (32px) */}
      <div className="h-8 bg-black/50 border-b border-white/5 flex items-center px-4 flex-shrink-0">
        <div className="flex items-center gap-6 text-[11px]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-gray-400">System Online</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-blue-400" />
            <span className="text-gray-400">AI: Mixtral 8x7B</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-green-400" />
            <span className="text-gray-400">Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-3 h-3 text-purple-400" />
            <span className="text-gray-400">{realDocuments.length} Documents</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-3 h-3 text-cyan-400" />
            <span className="text-gray-400">GPU: RX 6600 XT</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2 text-[11px]">
            <Timer className="w-3 h-3 text-gray-500" />
            <span className="text-gray-500">Response: 124ms</span>
          </div>
          <button
            onClick={scanForRealDocuments}
            disabled={scanning}
            className="px-3 py-1 text-[11px] bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scanning...' : 'Scan Files'}
          </button>
        </div>
      </div>

      {/* Header (40px) */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">Legal Intelligence Dashboard</h1>
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <Scale className="w-3 h-3" />
            <span>Solicitor Brain v2.0</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[11px] text-gray-400">
            Last sync: {new Date().toLocaleTimeString('en-GB')}
          </div>
          <div className="text-[11px] text-gray-400">
            {new Date().toLocaleDateString('en-GB', { 
              weekday: 'short', 
              day: 'numeric', 
              month: 'short',
              year: 'numeric'
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area - Flex grow to fill remaining space */}
      <div className="flex-1 p-3 overflow-hidden">
        <div className="h-full grid grid-cols-12 gap-3">
          
          {/* Left Column - Key Metrics (3 cols) */}
          <div className="col-span-3 space-y-2">
            {/* Primary Metrics */}
            <div className="bg-white/5 rounded-lg p-2.5 hover:bg-white/[0.07] transition-colors border border-white/5">
              <div className="flex items-center justify-between mb-1.5">
                <FileText className="w-4 h-4 text-blue-400" />
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400">+12%</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{metrics.active_cases}</div>
              <div className="text-[11px] text-gray-400">Active Cases</div>
              <div className="mt-2 h-8">
                <Chart options={performanceChart.options} series={performanceChart.series} type="line" height="100%" />
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-2.5 hover:bg-white/[0.07] transition-colors border border-white/5">
              <div className="flex items-center justify-between mb-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <AlertCircle className="w-3 h-3 text-amber-400 animate-pulse" />
              </div>
              <div className="text-2xl font-bold text-white">{metrics.pending_deadlines}</div>
              <div className="text-[11px] text-gray-400">Urgent Deadlines</div>
              <div className="mt-1 text-[10px] text-amber-400/70">Next: 2 days</div>
            </div>

            <div className="bg-white/5 rounded-lg p-2.5 hover:bg-white/[0.07] transition-colors border border-white/5">
              <div className="flex items-center justify-between mb-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] text-emerald-400">+25%</span>
              </div>
              <div className="text-2xl font-bold text-white">{metrics.documents_processed}</div>
              <div className="text-[11px] text-gray-400">Documents Processed</div>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-emerald-400/50"></div>
                </div>
                <span className="text-[9px] text-gray-500">75%</span>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-2.5 hover:bg-white/[0.07] transition-colors border border-white/5">
              <div className="flex items-center justify-between mb-1.5">
                <Brain className="w-4 h-4 text-purple-400" />
                <CheckCircle className="w-3 h-3 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white">{metrics.ai_tasks_completed}</div>
              <div className="text-[11px] text-gray-400">AI Tasks Completed</div>
              <div className="mt-1 grid grid-cols-3 gap-1">
                <div className="h-1 bg-purple-400/30 rounded-full"></div>
                <div className="h-1 bg-purple-400/30 rounded-full"></div>
                <div className="h-1 bg-purple-400/30 rounded-full"></div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-lg p-2.5 border border-white/5">
              <div className="flex items-center justify-between mb-1">
                <Award className="w-4 h-4 text-yellow-400" />
                <span className="text-[10px] text-yellow-400">Top 5%</span>
              </div>
              <div className="text-xl font-bold text-white">{metrics.client_satisfaction}%</div>
              <div className="text-[11px] text-gray-400">Client Satisfaction</div>
            </div>

            <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-3 h-3 text-cyan-400" />
                <span className="text-[11px] text-gray-400">Monthly Target</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-500">Cases</span>
                  <span className="text-gray-300">45/50</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-[90%] bg-gradient-to-r from-cyan-400 to-blue-400"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column - Charts (6 cols) */}
          <div className="col-span-6 space-y-3">
            {/* Case Types Distribution */}
            <div className="bg-white/5 rounded-lg p-3 h-[30%] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-gray-400" />
                  Case Type Distribution
                </h3>
                <button className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors">
                  View All
                </button>
              </div>
              <div className="h-[calc(100%-2rem)]">
                <Chart 
                  options={caseTypesChart.options} 
                  series={caseTypesChart.series} 
                  type="polarArea" 
                  height="100%" 
                />
              </div>
            </div>

            {/* Document Analysis */}
            <div className="bg-white/5 rounded-lg p-3 h-[35%] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-gray-400" />
                  Document Analysis
                </h3>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-gray-500">Total: {realDocuments.length}</span>
                  <BarChart3 className="w-3 h-3 text-gray-500" />
                </div>
              </div>
              <div className="h-[calc(100%-2rem)]">
                <Chart 
                  options={documentStatusChart.options} 
                  series={documentStatusChart.series} 
                  type="donut" 
                  height="100%" 
                />
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white/5 rounded-lg p-3 h-[32%] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-400" />
                  Weekly Activity
                </h3>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-500">Cases</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-gray-500">Documents</span>
                  </span>
                </div>
              </div>
              <div className="h-[calc(100%-2rem)]">
                <Chart 
                  options={activityChart.options} 
                  series={activityChart.series} 
                  type="area" 
                  height="100%" 
                />
              </div>
            </div>
          </div>

          {/* Right Column - Activity Feed & Insights (3 cols) */}
          <div className="col-span-3 space-y-3 h-full">
            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-lg p-3 border border-white/5">
              <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button className="p-2 bg-white/5 hover:bg-white/10 rounded text-[11px] text-gray-300 transition-colors flex flex-col items-center gap-1">
                  <FileText className="w-4 h-4 text-blue-400" />
                  New Case
                </button>
                <button className="p-2 bg-white/5 hover:bg-white/10 rounded text-[11px] text-gray-300 transition-colors flex flex-col items-center gap-1">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  Templates
                </button>
                <button className="p-2 bg-white/5 hover:bg-white/10 rounded text-[11px] text-gray-300 transition-colors flex flex-col items-center gap-1">
                  <FileSearch className="w-4 h-4 text-purple-400" />
                  Search
                </button>
                <button className="p-2 bg-white/5 hover:bg-white/10 rounded text-[11px] text-gray-300 transition-colors flex flex-col items-center gap-1">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  AI Chat
                </button>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
              <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                AI Insights
              </h3>
              <div className="space-y-2">
                <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-3 h-3 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-blue-300">Case volume up 15% this week</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Consider resource allocation</p>
                    </div>
                  </div>
                </div>
                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-amber-300">3 deadlines approaching</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Review priority cases</p>
                    </div>
                  </div>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-emerald-300">Document processing 98% accurate</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Above target threshold</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/5 rounded-lg p-3 flex-1 flex flex-col border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-400" />
                  Recent Activity
                </h3>
                <Eye className="w-3 h-3 text-gray-500" />
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-[11px] text-gray-500">No recent activity</p>
                  </div>
                ) : (
                  recentActivities.map((activity) => (
                    <div 
                      key={activity.id}
                      className="p-2 rounded bg-black/20 hover:bg-black/30 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start gap-2">
                        <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                          activity.type === 'case' ? 'bg-blue-500/20' :
                          activity.type === 'document' ? 'bg-emerald-500/20' :
                          activity.type === 'ai' ? 'bg-purple-500/20' :
                          'bg-amber-500/20'
                        }`}>
                          {activity.type === 'case' && <FileText className="w-3 h-3 text-blue-400" />}
                          {activity.type === 'document' && <FileText className="w-3 h-3 text-emerald-400" />}
                          {activity.type === 'ai' && <Brain className="w-3 h-3 text-purple-400" />}
                          {activity.type === 'deadline' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-white group-hover:text-blue-300 transition-colors">
                            {activity.action}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">{activity.description}</p>
                          <p className="text-[9px] text-gray-600 mt-0.5">{activity.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats Bar (32px) */}
      <div className="h-8 bg-black/50 border-t border-white/5 px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] text-gray-400">Active Users: 3</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] text-gray-400">Next Hearing: 2 days</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] text-gray-400">Performance: 94%</span>
          </div>
          <div className="flex items-center gap-2">
            <Scale className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] text-gray-400">Compliance: 100%</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-gray-500">
          <span>CPU: 12%</span>
          <span>RAM: 4.2GB</span>
          <span>Storage: 124GB</span>
          <span>Updated: {new Date().toLocaleTimeString('en-GB')}</span>
        </div>
      </div>
    </div>
  )
}