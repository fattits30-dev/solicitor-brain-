'use client'

import { useState } from 'react'
import {
  HardDrive,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Cloud,
  Server,
  Database,
  FolderSync,
  Archive,
  Settings,
  RefreshCw,
  Calendar,
  Timer,
  Lock,
  FileCheck,
  AlertCircle,
  Save,
  Package,
  Wifi,
  WifiOff,
  MoreVertical,
  X,
  Eye,
  FolderOpen
} from 'lucide-react'

interface Backup {
  id: string
  name: string
  type: 'full' | 'incremental' | 'differential'
  status: 'completed' | 'in-progress' | 'failed' | 'scheduled'
  size: string
  duration: number // seconds
  createdAt: string
  location: 'local' | 'cloud' | 'both'
  encrypted: boolean
  verified: boolean
  items: {
    databases: number
    files: number
    emails: number
    total: number
  }
  schedule?: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
    nextRun: string
  }
  error?: string
}

interface BackupStats {
  totalBackups: number
  totalSize: string
  lastBackup: string
  nextScheduled: string
  successRate: number
  averageDuration: number
  storageUsed: {
    local: string
    cloud: string
  }
  dataProtected: {
    cases: number
    documents: number
    emails: number
  }
}

interface BackupSettings {
  autoBackup: boolean
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
  time: string
  retention: number // days
  locations: {
    local: boolean
    cloud: boolean
  }
  encryption: boolean
  compression: boolean
  notifications: {
    onSuccess: boolean
    onFailure: boolean
  }
  includeItems: {
    database: boolean
    documents: boolean
    emails: boolean
    configurations: boolean
  }
}

const mockBackups: Backup[] = [
  {
    id: '1',
    name: 'Daily Backup - 2024-03-20',
    type: 'full',
    status: 'completed',
    size: '2.4 GB',
    duration: 180,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    location: 'both',
    encrypted: true,
    verified: true,
    items: {
      databases: 3,
      files: 1245,
      emails: 3421,
      total: 4669
    },
    schedule: {
      frequency: 'daily',
      nextRun: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString()
    }
  },
  {
    id: '2',
    name: 'Incremental Backup - 2024-03-19',
    type: 'incremental',
    status: 'completed',
    size: '324 MB',
    duration: 45,
    createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    location: 'local',
    encrypted: true,
    verified: true,
    items: {
      databases: 3,
      files: 124,
      emails: 234,
      total: 361
    }
  },
  {
    id: '3',
    name: 'Weekly Full Backup',
    type: 'full',
    status: 'in-progress',
    size: '1.8 GB',
    duration: 120,
    createdAt: new Date().toISOString(),
    location: 'cloud',
    encrypted: true,
    verified: false,
    items: {
      databases: 3,
      files: 987,
      emails: 2341,
      total: 3331
    }
  }
]

export default function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>(mockBackups)
  const [, setSelectedBackup] = useState<Backup | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [, setShowRestore] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)
  const [filterStatus, setFilterStatus] = useState<'all' | Backup['status']>('all')
  const [backupStats, ] = useState<BackupStats>({
    totalBackups: 156,
    totalSize: '234.5 GB',
    lastBackup: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    nextScheduled: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    successRate: 98.5,
    averageDuration: 145,
    storageUsed: {
      local: '45.2 GB',
      cloud: '189.3 GB'
    },
    dataProtected: {
      cases: 1234,
      documents: 5678,
      emails: 12345
    }
  })
  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
    autoBackup: true,
    frequency: 'daily',
    time: '02:00',
    retention: 30,
    locations: {
      local: true,
      cloud: true
    },
    encryption: true,
    compression: true,
    notifications: {
      onSuccess: false,
      onFailure: true
    },
    includeItems: {
      database: true,
      documents: true,
      emails: true,
      configurations: true
    }
  })

  const startBackup = async (type: Backup['type'] = 'full') => {
    setIsBackingUp(true)
    setBackupProgress(0)

    // Simulate backup progress
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsBackingUp(false)
          // Add new backup to list
          const newBackup: Backup = {
            id: Date.now().toString(),
            name: `Manual ${type} Backup - ${new Date().toLocaleDateString()}`,
            type,
            status: 'completed',
            size: type === 'full' ? '2.1 GB' : '256 MB',
            duration: type === 'full' ? 150 : 30,
            createdAt: new Date().toISOString(),
            location: 'both',
            encrypted: true,
            verified: true,
            items: {
              databases: 3,
              files: type === 'full' ? 1100 : 150,
              emails: type === 'full' ? 3200 : 450,
              total: type === 'full' ? 4303 : 603
            }
          }
          setBackups([newBackup, ...backups])
          return 100
        }
        return prev + 2
      })
    }, 100)
  }

  const getStatusColor = (status: Backup['status']) => {
    switch (status) {
      case 'completed': return 'text-emerald-400'
      case 'in-progress': return 'text-blue-400'
      case 'failed': return 'text-red-400'
      case 'scheduled': return 'text-amber-400'
    }
  }

  const getStatusIcon = (status: Backup['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'in-progress': return <div className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      case 'failed': return <AlertTriangle className="h-4 w-4" />
      case 'scheduled': return <Clock className="h-4 w-4" />
    }
  }

  const getLocationIcon = (location: Backup['location']) => {
    switch (location) {
      case 'local': return <Server className="h-3 w-3" />
      case 'cloud': return <Cloud className="h-3 w-3" />
      case 'both': return <FolderSync className="h-3 w-3" />
    }
  }

  const filteredBackups = filterStatus === 'all' 
    ? backups 
    : backups.filter(b => b.status === filterStatus)

  return (
    <div className="h-screen w-full bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-cyan-400" />
              Backup & Recovery
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Protect your data with automated backups</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <Settings className="h-4 w-4 text-gray-400" />
            </button>
            <button
              onClick={() => startBackup('incremental')}
              disabled={isBackingUp}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors text-sm"
            >
              Quick Backup
            </button>
            <button
              onClick={() => startBackup('full')}
              disabled={isBackingUp}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-600/50 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              {isBackingUp ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Backing up... {backupProgress}%
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Full Backup
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="px-6 py-4 bg-black/30 border-b border-white/5">
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Archive className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <div className="text-2xl font-semibold text-white">{backupStats.totalBackups}</div>
            <div className="text-[10px] text-gray-500">Backups created</div>
          </div>

          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Database className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-gray-500">Size</span>
            </div>
            <div className="text-2xl font-semibold text-blue-400">{backupStats.totalSize}</div>
            <div className="text-[10px] text-gray-500">Total backed up</div>
          </div>

          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-gray-500">Success</span>
            </div>
            <div className="text-2xl font-semibold text-emerald-400">{backupStats.successRate}%</div>
            <div className="text-[10px] text-gray-500">Success rate</div>
          </div>

          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Timer className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-gray-500">Duration</span>
            </div>
            <div className="text-2xl font-semibold text-amber-400">{Math.floor(backupStats.averageDuration / 60)}m</div>
            <div className="text-[10px] text-gray-500">Average time</div>
          </div>

          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Server className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-gray-500">Local</span>
            </div>
            <div className="text-2xl font-semibold text-purple-400">{backupStats.storageUsed.local}</div>
            <div className="text-[10px] text-gray-500">Storage used</div>
          </div>

          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Cloud className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-gray-500">Cloud</span>
            </div>
            <div className="text-2xl font-semibold text-cyan-400">{backupStats.storageUsed.cloud}</div>
            <div className="text-[10px] text-gray-500">Storage used</div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Status */}
      <div className="px-6 py-3 bg-black/20 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-gray-400">Last backup:</span>
              <span className="text-gray-300">{new Date(backupStats.lastBackup).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-gray-400">Next scheduled:</span>
              <span className="text-amber-400">{new Date(backupStats.nextScheduled).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {backupSettings.autoBackup ? (
                <>
                  <Wifi className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Auto-backup enabled</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-red-400" />
                  <span className="text-red-400">Auto-backup disabled</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Filter:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'completed', label: 'Completed' },
              { id: 'in-progress', label: 'In Progress' },
              { id: 'failed', label: 'Failed' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setFilterStatus(filter.id as any)}
                className={`px-3 py-1 text-xs rounded transition-all ${
                  filterStatus === filter.id
                    ? 'bg-cyan-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Backups List */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Data Protected Summary */}
        <div className="mb-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-4 border border-cyan-500/20">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-400" />
            Data Protected
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-semibold text-cyan-400">{backupStats.dataProtected.cases}</div>
              <div className="text-xs text-gray-400">Cases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-cyan-400">{backupStats.dataProtected.documents}</div>
              <div className="text-xs text-gray-400">Documents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-cyan-400">{backupStats.dataProtected.emails}</div>
              <div className="text-xs text-gray-400">Emails</div>
            </div>
          </div>
        </div>

        {/* Backups */}
        <div className="space-y-3">
          {filteredBackups.map(backup => (
            <div
              key={backup.id}
              className={`bg-white/5 border rounded-lg p-4 transition-all ${
                backup.status === 'failed' ? 'border-red-500/30' : 'border-white/10'
              } hover:bg-white/[0.07]`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    backup.type === 'full' ? 'bg-cyan-500/10' :
                    backup.type === 'incremental' ? 'bg-blue-500/10' :
                    'bg-purple-500/10'
                  }`}>
                    <HardDrive className={`h-4 w-4 ${
                      backup.type === 'full' ? 'text-cyan-400' :
                      backup.type === 'incremental' ? 'text-blue-400' :
                      'text-purple-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-medium text-white">{backup.name}</h3>
                      <span className={`flex items-center gap-1 text-xs ${getStatusColor(backup.status)}`}>
                        {getStatusIcon(backup.status)}
                        <span className="capitalize">{backup.status}</span>
                      </span>
                      <span className="text-xs text-gray-500 capitalize px-2 py-0.5 bg-white/5 rounded">
                        {backup.type}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500">Size:</span>
                        <span className="text-gray-300 ml-1">{backup.size}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <span className="text-gray-300 ml-1">{Math.floor(backup.duration / 60)}m {backup.duration % 60}s</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Location:</span>
                        <span className="text-gray-300 ml-1 inline-flex items-center gap-1">
                          {getLocationIcon(backup.location)}
                          {backup.location}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Items:</span>
                        <span className="text-gray-300 ml-1">{backup.items.total.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1 text-[10px]">
                        <Database className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-400">{backup.items.databases} databases</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <FolderOpen className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-400">{backup.items.files} files</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <Archive className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-400">{backup.items.emails} emails</span>
                      </div>
                      {backup.encrypted && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                          <Lock className="h-3 w-3" />
                          <span>Encrypted</span>
                        </div>
                      )}
                      {backup.verified && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                          <FileCheck className="h-3 w-3" />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>

                    {backup.error && (
                      <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-300">
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        {backup.error}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedBackup(backup)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="View details"
                  >
                    <Eye className="h-4 w-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => setShowRestore(true)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Restore from backup"
                  >
                    <RefreshCw className="h-4 w-4 text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Progress bar for in-progress backups */}
              {backup.status === 'in-progress' && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-gray-300">65%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all" style={{ width: '65%' }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Backup Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Auto Backup */}
              <div>
                <h3 className="text-sm font-medium text-white mb-3">Automatic Backup</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={backupSettings.autoBackup}
                      onChange={(e) => setBackupSettings({ ...backupSettings, autoBackup: e.target.checked })}
                      className="rounded border-gray-600 bg-white/5 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-300">Enable automatic backups</span>
                  </label>
                  
                  {backupSettings.autoBackup && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Frequency</label>
                        <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm">
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Time</label>
                        <input
                          type="time"
                          value={backupSettings.time}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Storage Locations */}
              <div>
                <h3 className="text-sm font-medium text-white mb-3">Storage Locations</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={backupSettings.locations.local}
                      className="rounded border-gray-600 bg-white/5 text-cyan-600 focus:ring-cyan-500"
                    />
                    <Server className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Local Storage</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={backupSettings.locations.cloud}
                      className="rounded border-gray-600 bg-white/5 text-cyan-600 focus:ring-cyan-500"
                    />
                    <Cloud className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Cloud Storage (AWS S3)</span>
                  </label>
                </div>
              </div>

              {/* Security */}
              <div>
                <h3 className="text-sm font-medium text-white mb-3">Security & Compression</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={backupSettings.encryption}
                      className="rounded border-gray-600 bg-white/5 text-cyan-600 focus:ring-cyan-500"
                    />
                    <Lock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Encrypt backups (AES-256)</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={backupSettings.compression}
                      className="rounded border-gray-600 bg-white/5 text-cyan-600 focus:ring-cyan-500"
                    />
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Enable compression</span>
                  </label>
                </div>
              </div>

              {/* Save */}
              <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm">
                  Save Settings
                </button>
                <button
                  onClick={() => setShowSettings(false)}
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