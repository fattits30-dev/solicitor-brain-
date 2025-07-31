'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { CaseForm } from '@/components/forms/case-form'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Plus, 
  Calendar, 
  User, 
  Clock, 
  AlertTriangle,
  Scale,
  FileText,
  Gavel,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  MoreVertical,
  Hash,
  Activity,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
  Briefcase
} from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'

interface Case {
  id: string
  title: string
  caseNumber: string
  clientName: string
  caseType: string
  status: string
  priority: string
  nextHearing?: string
  createdAt: string
  updatedAt: string
  value?: number
  progress?: number
}

const columns: ColumnDef<Case>[] = [
  {
    accessorKey: 'caseNumber',
    header: () => (
      <div className="flex items-center gap-1.5">
        <Hash className="h-3 h-3 text-gray-500" />
        <span>Case ID</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="font-mono text-xs text-blue-400">{row.getValue('caseNumber')}</div>
    ),
  },
  {
    accessorKey: 'title',
    header: 'Case Title',
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-white truncate max-w-[250px]">{row.getValue('title')}</div>
        <div className="text-[10px] text-gray-500 mt-0.5">
          Created {new Date(row.original.createdAt).toLocaleDateString()}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'clientName',
    header: 'Client',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <User className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <div className="text-sm text-gray-200">{row.getValue('clientName')}</div>
          <div className="text-[10px] text-gray-500">Individual</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'caseType',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('caseType') as string
      const config: Record<string, { bg: string, text: string, icon: any }> = {
        civil: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Scale },
        criminal: { bg: 'bg-red-500/10', text: 'text-red-400', icon: Gavel },
        family: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: User },
        corporate: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: Briefcase },
        other: { bg: 'bg-gray-500/10', text: 'text-gray-400', icon: FileText }
      }
      const typeConfig = config[type] || config.other
      const Icon = typeConfig?.icon || FileText
      return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${typeConfig?.bg || 'bg-gray-500/10'} ${typeConfig?.text || 'text-gray-400'}`}>
          <Icon className="h-3 w-3" />
          <span className="text-xs font-medium capitalize">{type}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const config: Record<string, { bg: string, text: string, icon: any }> = {
        active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle },
        pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: AlertCircle },
        closed: { bg: 'bg-gray-500/10', text: 'text-gray-400', icon: XCircle },
        archived: { bg: 'bg-gray-600/10', text: 'text-gray-500', icon: FileText }
      }
      const statusConfig = config[status] || config.pending
      const Icon = statusConfig?.icon || AlertCircle
      return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig?.bg || 'bg-amber-500/10'} ${statusConfig?.text || 'text-amber-400'}`}>
          <Icon className="h-3 w-3" />
          <span className="text-xs font-medium capitalize">{status}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row }) => {
      const priority = row.getValue('priority') as string
      const colors: Record<string, string> = {
        low: 'text-gray-400',
        medium: 'text-yellow-400', 
        high: 'text-orange-400',
        urgent: 'text-red-400'
      }
      const icons: Record<string, any> = {
        low: TrendingDown,
        medium: Activity,
        high: TrendingUp,
        urgent: AlertTriangle
      }
      const Icon = icons[priority] || icons.medium
      return (
        <div className={`flex items-center gap-1.5 ${colors[priority] || colors.medium}`}>
          <Icon className="h-3.5 w-3.5" />
          <span className="text-xs font-medium capitalize">{priority}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'nextHearing',
    header: 'Next Hearing',
    cell: ({ row }) => {
      const date = row.getValue('nextHearing') as string
      if (!date) return <span className="text-xs text-gray-500">Not scheduled</span>
      const daysUntil = Math.floor((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return (
        <div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs">{new Date(date).toLocaleDateString()}</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {daysUntil > 0 ? `In ${daysUntil} days` : daysUntil === 0 ? 'Today' : `${Math.abs(daysUntil)} days ago`}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'value',
    header: 'Value',
    cell: ({ row }) => {
      const value = row.original.value || Math.floor(Math.random() * 50000) + 5000
      return (
        <div className="text-right">
          <div className="text-sm font-medium text-white">£{value.toLocaleString()}</div>
          <div className="text-[10px] text-gray-500">Est. fees</div>
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: () => (
      <button className="p-1 hover:bg-white/5 rounded transition-colors">
        <MoreVertical className="h-4 w-4 text-gray-400" />
      </button>
    ),
  },
]

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewCase, setShowNewCase] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    urgent: 0,
    thisMonth: 0,
    totalValue: 0
  })

  useEffect(() => {
    loadCases()
  }, [])

  useEffect(() => {
    // Calculate stats from cases
    const now = new Date()
    const thisMonth = cases.filter(c => {
      const created = new Date(c.createdAt)
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    })
    
    setStats({
      total: cases.length,
      active: cases.filter(c => c.status === 'active').length,
      pending: cases.filter(c => c.status === 'pending').length,
      urgent: cases.filter(c => c.priority === 'urgent' || c.priority === 'high').length,
      thisMonth: thisMonth.length,
      totalValue: cases.reduce((sum, c) => sum + (c.value || Math.floor(Math.random() * 50000) + 5000), 0)
    })
  }, [cases])

  const loadCases = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (window.api) {
        // Use IPC for Electron
        const data = await window.api.getCases({})
        setCases(data)
      } else {
        // Fallback for development
        const response = await fetch('http://localhost:8000/api/cases')
        if (!response.ok) throw new Error('Failed to fetch cases')
        const data = await response.json()
        setCases(data)
      }
    } catch (error) {
      console.error('Failed to load cases:', error)
      setError('Failed to load cases. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCase = async (data: any) => {
    try {
      if (window.api) {
        await window.api.createCase(data)
      } else {
        const response = await fetch('http://localhost:8000/api/cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        if (!response.ok) throw new Error('Failed to create case')
      }
      
      await loadCases()
      setShowNewCase(false)
    } catch (error) {
      console.error('Failed to create case:', error)
      setError('Failed to create case. Please try again.')
    }
  }

  const filteredCases = cases.filter(c => {
    if (selectedFilter === 'all') return true
    if (selectedFilter === 'active') return c.status === 'active'
    if (selectedFilter === 'urgent') return c.priority === 'urgent' || c.priority === 'high'
    if (selectedFilter === 'pending') return c.status === 'pending'
    return true
  })

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
          </div>
          <p className="mt-4 text-gray-400 text-sm">Loading cases...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                <Scale className="h-5 w-5 text-blue-400" />
                Case Management
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">Track and manage your legal matters</p>
            </div>
            <div className="flex items-center gap-2 ml-8">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                  selectedFilter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                All Cases
              </button>
              <button
                onClick={() => setSelectedFilter('active')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                  selectedFilter === 'active' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setSelectedFilter('urgent')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 ${
                  selectedFilter === 'urgent' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <AlertTriangle className="h-3 w-3" />
                Urgent
              </button>
              <button
                onClick={() => setSelectedFilter('pending')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                  selectedFilter === 'pending' 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                Pending
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Download className="h-4 w-4 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Filter className="h-4 w-4 text-gray-400" />
            </button>
            <button
              onClick={() => setShowNewCase(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              New Case
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-3 bg-black/30 border-b border-white/5">
        <div className="grid grid-cols-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">{stats.total}</div>
              <div className="text-[10px] text-gray-500">Total Cases</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">{stats.active}</div>
              <div className="text-[10px] text-gray-500">Active</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">{stats.pending}</div>
              <div className="text-[10px] text-gray-500">Pending</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">{stats.urgent}</div>
              <div className="text-[10px] text-gray-500">Urgent</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">{stats.thisMonth}</div>
              <div className="text-[10px] text-gray-500">This Month</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">£{(stats.totalValue / 1000).toFixed(0)}k</div>
              <div className="text-[10px] text-gray-500">Total Value</div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-400">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 px-6 py-4 overflow-hidden">
        <div className="h-full bg-white/5 rounded-lg border border-white/5 overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredCases}
            searchKey="title"
            searchPlaceholder="Search by case title, client name, or case number..."
          />
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="px-6 py-3 bg-black/30 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[11px] text-gray-500">
          <span>Showing {filteredCases.length} of {cases.length} cases</span>
          <span>•</span>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors flex items-center gap-1.5">
            <FileText className="h-3 w-3" />
            Export Report
          </button>
          <button className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors flex items-center gap-1.5">
            <Activity className="h-3 w-3" />
            View Analytics
          </button>
        </div>
      </div>

      <Dialog open={showNewCase} onOpenChange={setShowNewCase}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Case</DialogTitle>
          </DialogHeader>
          <CaseForm
            onSubmit={handleCreateCase}
            onCancel={() => setShowNewCase(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}