'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Briefcase,
  DollarSign,
  Clock,
  BarChart3,
  PieChart,
  Filter,
  Plus,
  Send,
  Eye,
  Printer,
  Share2,
  Settings,
  FileBarChart,
  FileSpreadsheet,
  FilePieChart,
  Activity,
  Target,
  Award,
  AlertCircle,
  Shield,
  ChevronRight,
  ChevronDown,
  CalendarRange,
  Building,
  Scale,
  Receipt,
  Timer,
  CheckCircle,
  XCircle,
  Info,
  FolderOpen,
  Mail,
  Hash,
  Zap,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'

interface Report {
  id: string
  name: string
  description: string
  type: 'performance' | 'financial' | 'case' | 'client' | 'compliance' | 'custom'
  icon: any
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'on-demand'
  lastGenerated?: string
  nextScheduled?: string
  status: 'ready' | 'generating' | 'scheduled' | 'error'
  format: 'pdf' | 'excel' | 'csv' | 'html'
  recipients?: string[]
  parameters?: any
}

interface ReportTemplate {
  id: string
  name: string
  category: string
  description: string
  icon: any
  parameters: {
    name: string
    type: 'date' | 'select' | 'multiselect' | 'text'
    label: string
    required: boolean
    options?: string[]
  }[]
}

interface ReportMetrics {
  totalReports: number
  scheduledReports: number
  generatedToday: number
  averageGenerationTime: number
}

const reportTemplates: ReportTemplate[] = [
  {
    id: '1',
    name: 'Case Performance Report',
    category: 'performance',
    description: 'Analyze case outcomes, durations, and success rates',
    icon: Briefcase,
    parameters: [
      { name: 'dateRange', type: 'date', label: 'Date Range', required: true },
      { name: 'caseTypes', type: 'multiselect', label: 'Case Types', required: false, options: ['Contract', 'Employment', 'Property', 'Family'] },
      { name: 'status', type: 'select', label: 'Status', required: false, options: ['Active', 'Closed', 'All'] }
    ]
  },
  {
    id: '2',
    name: 'Financial Summary',
    category: 'financial',
    description: 'Revenue, expenses, and profitability analysis',
    icon: DollarSign,
    parameters: [
      { name: 'period', type: 'select', label: 'Period', required: true, options: ['This Month', 'Last Month', 'This Quarter', 'Last Quarter', 'This Year'] },
      { name: 'breakdown', type: 'select', label: 'Breakdown By', required: false, options: ['Client', 'Case Type', 'Team Member'] }
    ]
  },
  {
    id: '3',
    name: 'Client Activity Report',
    category: 'client',
    description: 'Client interactions, communications, and case progress',
    icon: Users,
    parameters: [
      { name: 'clientId', type: 'select', label: 'Client', required: true, options: ['All Clients', 'Active Clients', 'Select Client...'] },
      { name: 'includeEmails', type: 'select', label: 'Include Emails', required: false, options: ['Yes', 'No'] }
    ]
  },
  {
    id: '4',
    name: 'Compliance Audit',
    category: 'compliance',
    description: 'SRA compliance checks and audit trail',
    icon: Shield,
    parameters: [
      { name: 'auditType', type: 'select', label: 'Audit Type', required: true, options: ['Full Audit', 'Client Money', 'Data Protection', 'File Review'] },
      { name: 'period', type: 'date', label: 'Audit Period', required: true }
    ]
  },
  {
    id: '5',
    name: 'Time Tracking Report',
    category: 'performance',
    description: 'Billable hours and time allocation analysis',
    icon: Clock,
    parameters: [
      { name: 'dateRange', type: 'date', label: 'Date Range', required: true },
      { name: 'groupBy', type: 'select', label: 'Group By', required: false, options: ['Team Member', 'Client', 'Case', 'Task Type'] }
    ]
  }
]

const mockReports: Report[] = [
  {
    id: '1',
    name: 'Monthly Case Performance',
    description: 'March 2024 case outcomes and metrics',
    type: 'performance',
    icon: BarChart3,
    frequency: 'monthly',
    lastGenerated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'ready',
    format: 'pdf',
    recipients: ['john@lawfirm.com', 'sarah@lawfirm.com']
  },
  {
    id: '2',
    name: 'Q1 Financial Summary',
    description: 'First quarter revenue and expense report',
    type: 'financial',
    icon: DollarSign,
    frequency: 'quarterly',
    lastGenerated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'ready',
    format: 'excel'
  },
  {
    id: '3',
    name: 'Weekly Team Performance',
    description: 'Team productivity and billable hours',
    type: 'performance',
    icon: Users,
    frequency: 'weekly',
    nextScheduled: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'scheduled',
    format: 'pdf',
    recipients: ['manager@lawfirm.com']
  }
]

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>(mockReports)
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [activeTab, setActiveTab] = useState<'generated' | 'templates' | 'scheduled'>('generated')
  const [reportMetrics, setReportMetrics] = useState<ReportMetrics>({
    totalReports: 156,
    scheduledReports: 12,
    generatedToday: 8,
    averageGenerationTime: 4.2
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [filterCategory, setFilterCategory] = useState<'all' | Report['type']>('all')

  const getTypeColor = (type: Report['type']) => {
    switch (type) {
      case 'performance': return 'text-blue-400 bg-blue-500/10'
      case 'financial': return 'text-emerald-400 bg-emerald-500/10'
      case 'case': return 'text-purple-400 bg-purple-500/10'
      case 'client': return 'text-amber-400 bg-amber-500/10'
      case 'compliance': return 'text-red-400 bg-red-500/10'
      case 'custom': return 'text-gray-400 bg-gray-500/10'
    }
  }

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'ready': return 'text-emerald-400'
      case 'generating': return 'text-blue-400'
      case 'scheduled': return 'text-amber-400'
      case 'error': return 'text-red-400'
    }
  }

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'ready': return <CheckCircle className="h-3 w-3" />
      case 'generating': return <div className="h-3 w-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      case 'scheduled': return <Clock className="h-3 w-3" />
      case 'error': return <XCircle className="h-3 w-3" />
    }
  }

  const generateReport = async () => {
    setIsGenerating(true)
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsGenerating(false)
    setShowGenerateModal(false)
    // Add new report to list
    const newReport: Report = {
      id: Date.now().toString(),
      name: selectedTemplate?.name || 'Custom Report',
      description: 'Generated on ' + new Date().toLocaleDateString(),
      type: (selectedTemplate?.category as Report['type']) || 'custom',
      icon: selectedTemplate?.icon || FileText,
      frequency: 'on-demand',
      lastGenerated: new Date().toISOString(),
      status: 'ready',
      format: 'pdf'
    }
    setReports([newReport, ...reports])
  }

  const filteredReports = filterCategory === 'all' 
    ? reports 
    : reports.filter(r => r.type === filterCategory)

  return (
    <div className="h-screen w-full bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-purple-400" />
              Reports & Analytics
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Generate and manage business intelligence reports</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Settings className="h-4 w-4 text-gray-400" />
            </button>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="px-6 py-4 bg-black/30 border-b border-white/5">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <div className="text-2xl font-semibold text-white">{reportMetrics.totalReports}</div>
            <div className="text-[10px] text-gray-500">Reports generated</div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-gray-500">Scheduled</span>
            </div>
            <div className="text-2xl font-semibold text-blue-400">{reportMetrics.scheduledReports}</div>
            <div className="text-[10px] text-gray-500">Auto-generated</div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-gray-500">Today</span>
            </div>
            <div className="text-2xl font-semibold text-emerald-400">{reportMetrics.generatedToday}</div>
            <div className="text-[10px] text-gray-500">Generated today</div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Timer className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-gray-500">Avg Time</span>
            </div>
            <div className="text-2xl font-semibold text-amber-400">{reportMetrics.averageGenerationTime}s</div>
            <div className="text-[10px] text-gray-500">Generation time</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {[
              { id: 'generated', label: 'Generated Reports' },
              { id: 'templates', label: 'Report Templates' },
              { id: 'scheduled', label: 'Scheduled Reports' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-sm rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {activeTab === 'generated' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Filter:</span>
              {[
                { id: 'all', label: 'All' },
                { id: 'performance', label: 'Performance' },
                { id: 'financial', label: 'Financial' },
                { id: 'case', label: 'Case' },
                { id: 'client', label: 'Client' },
                { id: 'compliance', label: 'Compliance' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setFilterCategory(filter.id as any)}
                  className={`px-3 py-1 text-xs rounded transition-all ${
                    filterCategory === filter.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'generated' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredReports.map(report => {
              const Icon = report.icon
              return (
                <div
                  key={report.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/[0.07] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getTypeColor(report.type)}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white">{report.name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{report.description}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${getStatusColor(report.status)}`}>
                      {getStatusIcon(report.status)}
                      <span className="capitalize">{report.status}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center justify-between">
                      <span>Format:</span>
                      <span className="text-gray-300 uppercase">{report.format}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Frequency:</span>
                      <span className="text-gray-300 capitalize">{report.frequency}</span>
                    </div>
                    {report.lastGenerated && (
                      <div className="flex items-center justify-between">
                        <span>Last Generated:</span>
                        <span className="text-gray-300">
                          {new Date(report.lastGenerated).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {report.nextScheduled && (
                      <div className="flex items-center justify-between">
                        <span>Next Scheduled:</span>
                        <span className="text-gray-300">
                          {new Date(report.nextScheduled).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {report.recipients && report.recipients.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Mail className="h-3 w-3" />
                        <span>Sent to {report.recipients.length} recipient{report.recipients.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="flex-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors text-xs flex items-center justify-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </button>
                    <button className="flex-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors text-xs flex items-center justify-center gap-1">
                      <Download className="h-3 w-3" />
                      Download
                    </button>
                    <button className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors">
                      <Share2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {reportTemplates.map(template => {
              const Icon = template.icon
              return (
                <div
                  key={template.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/[0.07] transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedTemplate(template)
                    setShowGenerateModal(true)
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(template.category as Report['type'])}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">{template.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{template.description}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {template.parameters.map(param => (
                      <div key={param.name} className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{param.label}:</span>
                        <span className="text-gray-400 capitalize">{param.type}</span>
                      </div>
                    ))}
                  </div>

                  <button className="w-full mt-4 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded transition-colors text-xs flex items-center justify-center gap-1">
                    <Zap className="h-3 w-3" />
                    Use Template
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'scheduled' && (
          <div className="space-y-3">
            {reports.filter(r => r.status === 'scheduled').map(report => {
              const Icon = report.icon
              return (
                <div
                  key={report.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/[0.07] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getTypeColor(report.type)}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white">{report.name}</h3>
                        <p className="text-xs text-gray-400">{report.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Next run:</div>
                      <div className="text-sm text-amber-400">
                        {report.nextScheduled && new Date(report.nextScheduled).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 max-w-lg w-full">
            <h2 className="text-xl font-semibold text-white mb-6">Generate Report</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-white mb-2">{selectedTemplate.name}</h3>
                <p className="text-xs text-gray-400">{selectedTemplate.description}</p>
              </div>

              {/* Parameters */}
              <div className="space-y-3">
                {selectedTemplate.parameters.map(param => (
                  <div key={param.name}>
                    <label className="text-xs text-gray-400 mb-1 block">{param.label}</label>
                    {param.type === 'date' && (
                      <input
                        type="date"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                      />
                    )}
                    {param.type === 'select' && (
                      <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm">
                        <option value="">Select {param.label}</option>
                        {param.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                    {param.type === 'text' && (
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Output Options */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Output Format</label>
                <div className="grid grid-cols-4 gap-2">
                  {['PDF', 'Excel', 'CSV', 'HTML'].map(format => (
                    <button
                      key={format}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs transition-colors"
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                <button
                  onClick={generateReport}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}