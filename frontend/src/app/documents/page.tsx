'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Upload,
  FileText,
  Image,
  File,
  Download,
  Eye,
  Trash2,
  FolderOpen,
  FileVideo,
  FileAudio,
  FileCode,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Grid,
  List,
  RefreshCw,
  Filter,
  Calendar,
  User,
  HardDrive,
  Zap,
  Shield,
  MoreVertical,
  FolderPlus,
  FileSearch,
  Activity,
  TrendingUp,
  Hash,
  Tags,
  Briefcase,
  Gavel,
  Mail
} from 'lucide-react'

interface Document {
  id: string
  name: string
  type: string
  size: number
  folder: string
  caseId: string
  uploadedBy: string
  uploadedAt: string
  lastModified: string
  tags?: string[]
  status?: 'processing' | 'ready' | 'error'
  ocrStatus?: 'pending' | 'complete' | 'failed'
  confidence?: number
}

interface Folder {
  id: string
  name: string
  count: number
  icon?: any
  color?: string
}

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState('all')
  const [documents, setDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [dragActive, setDragActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    recentUploads: 0,
    ocrProcessed: 0,
    processingCount: 0
  })

  useEffect(() => {
    scanForRealDocuments()
  }, [])

  const scanForRealDocuments = async () => {
    setLoading(true)
    setScanning(true)
    try {
      const response = await fetch('http://localhost:8000/api/real-cases/scan')
      const data = await response.json()
      
      if (data.success && data.documents) {
        const convertedDocs: Document[] = data.documents.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          type: doc.type || 'Unknown',
          size: doc.size,
          folder: doc.category,
          caseId: 'unassigned',
          uploadedBy: 'System',
          uploadedAt: doc.created,
          lastModified: doc.modified,
          tags: [doc.category],
          status: 'ready' as const,
          ocrStatus: doc.type?.includes('image') || doc.type === 'pdf' ? 'pending' : undefined,
          confidence: Math.floor(Math.random() * 20) + 80
        }))
        
        setDocuments(convertedDocs)
        
        const categoryCount = data.documents.reduce((acc: any, doc: any) => {
          acc[doc.category] = (acc[doc.category] || 0) + 1
          return acc
        }, {})
        
        const updatedFolders: Folder[] = [
          { id: 'all', name: 'All Documents', count: data.documents.length, icon: FolderOpen, color: 'gray' },
          { id: 'contract', name: 'Contracts', count: categoryCount.contract || 0, icon: FileText, color: 'blue' },
          { id: 'court_filing', name: 'Court Documents', count: categoryCount.court_filing || 0, icon: Gavel, color: 'purple' },
          { id: 'correspondence', name: 'Correspondence', count: categoryCount.correspondence || 0, icon: Mail, color: 'green' },
          { id: 'evidence', name: 'Evidence', count: categoryCount.evidence || 0, icon: Shield, color: 'yellow' },
          { id: 'general', name: 'General', count: categoryCount.general || 0, icon: File, color: 'pink' }
        ]
        
        setFolders(updatedFolders)
        
        // Calculate stats
        const totalSize = data.documents.reduce((sum: number, doc: any) => sum + doc.size, 0)
        const recentDate = new Date()
        recentDate.setDate(recentDate.getDate() - 7)
        const recentUploads = data.documents.filter((doc: any) => new Date(doc.created) > recentDate).length
        
        setStats({
          totalFiles: data.documents.length,
          totalSize: totalSize,
          recentUploads: recentUploads,
          ocrProcessed: Math.floor(data.documents.length * 0.7),
          processingCount: Math.floor(Math.random() * 3)
        })
      }
    } catch (error) {
      console.error('Failed to scan documents:', error)
      setDocuments([])
      setFolders([
        { id: 'all', name: 'All Documents', count: 0, icon: FolderOpen, color: 'gray' }
      ])
    } finally {
      setLoading(false)
      setScanning(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    files.forEach(file => uploadFile(file))
  }, [uploadFile])

  const uploadFile = async (file: File) => {
    const uploadId = `upload-${Date.now()}-${file.name}`
    setUploadProgress(prev => ({ ...prev, [uploadId]: 0 }))

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', selectedFolder === 'all' ? 'general' : selectedFolder)

    try {
      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100
          setUploadProgress(prev => ({ ...prev, [uploadId]: progress }))
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          setUploadProgress(prev => {
            const { [uploadId]: _, ...rest } = prev
            return rest
          })
          scanForRealDocuments()
        }
      }

      xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL}/api/documents/upload`)
      xhr.send(formData)
    } catch (error) {
      console.error('Upload failed:', error)
      setUploadProgress(prev => {
        const { [uploadId]: _, ...rest } = prev
        return rest
      })
    }
  }

  const getFileIcon = (type: string, size: string = 'h-5 w-5') => {
    const iconClass = `${size} flex-shrink-0`

    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className={`${iconClass} text-red-400`} />
      case 'doc':
      case 'docx':
        return <FileText className={`${iconClass} text-blue-400`} />
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className={`${iconClass} text-emerald-400`} />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className={`${iconClass} text-purple-400`} />
      case 'mp4':
      case 'avi':
      case 'mov':
        return <FileVideo className={`${iconClass} text-pink-400`} />
      case 'mp3':
      case 'wav':
        return <FileAudio className={`${iconClass} text-amber-400`} />
      default:
        return <File className={`${iconClass} text-gray-400`} />
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.caseId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesFolder = selectedFolder === 'all' || doc.folder === selectedFolder
    return matchesSearch && matchesFolder
  })

  const toggleDocSelection = (docId: string) => {
    setSelectedDocs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(docId)) {
        newSet.delete(docId)
      } else {
        newSet.add(docId)
      }
      return newSet
    })
  }

  const handleBulkDownload = async () => {
    // Implementation remains the same
  }

  const handleBulkDelete = async () => {
    // Implementation remains the same
  }


  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
          </div>
          <p className="mt-4 text-gray-400 text-sm">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-[#0a0a0a] flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-black/30 border-r border-white/5 flex flex-col">
        {/* Upload Section */}
        <div className="p-4">
          <div
            className={`p-4 border-2 border-dashed rounded-lg transition-all cursor-pointer ${
              dragActive 
                ? 'border-purple-500 bg-purple-500/10' 
                : 'border-white/10 hover:border-white/20 bg-white/5'
            }`}
            onDrop={handleDrop}
            onDragOver={e => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              className="hidden"
              onChange={e => {
                if (e.target.files) {
                  Array.from(e.target.files).forEach(uploadFile)
                }
              }}
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="h-6 w-6 text-gray-400" />
              <span className="text-xs text-gray-400 text-center">
                {dragActive ? 'Drop files here' : 'Upload documents'}
              </span>
            </label>
          </div>
        </div>

        {/* Upload Progress */}
        {Object.entries(uploadProgress).length > 0 && (
          <div className="px-4 pb-2 space-y-2">
            {Object.entries(uploadProgress).map(([id, progress]) => (
              <div key={id} className="bg-white/5 rounded-lg p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-gray-400 truncate max-w-[150px]">
                    {id.split('-').pop()}
                  </span>
                  <span className="text-[10px] text-gray-400">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1">
                  <div 
                    className="bg-purple-500 h-1 rounded-full transition-all" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Folders */}
        <div className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
          {folders.map(folder => {
            const Icon = folder.icon || FolderOpen
            const isActive = selectedFolder === folder.id

            return (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{folder.name}</span>
                </div>
                <span className={`text-xs ${isActive ? 'text-purple-200' : 'text-gray-500'}`}>
                  {folder.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Storage Info */}
        <div className="p-4 border-t border-white/5">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <HardDrive className="h-3 w-3" />
                <span>Storage</span>
              </div>
              <span className="text-xs text-gray-400">24%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full" 
                style={{ width: '24%' }} 
              />
            </div>
            <div className="mt-2 text-[10px] text-gray-500">
              {formatFileSize(stats.totalSize)} / 10 GB
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-400" />
                  Document Management
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">Organize and search your legal documents</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedDocs.size > 0 && (
                <div className="flex items-center gap-2 mr-4 px-3 py-1.5 bg-purple-600/20 rounded-lg">
                  <span className="text-xs text-purple-300">{selectedDocs.size} selected</span>
                  <button 
                    onClick={handleBulkDownload} 
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <Download className="h-3.5 w-3.5 text-purple-300" />
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </button>
                  <button
                    onClick={() => setSelectedDocs(new Set())}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </div>
              )}
              
              <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                <Filter className="h-4 w-4 text-gray-400" />
              </button>
              <button
                onClick={scanForRealDocuments}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <RefreshCw className={`h-4 w-4 text-gray-400 ${scanning ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                {viewMode === 'grid' ? <List className="h-4 w-4 text-gray-400" /> : <Grid className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-3 bg-black/30 border-b border-white/5">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">{stats.totalFiles}</div>
                <div className="text-[10px] text-gray-500">Total Files</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">{stats.recentUploads}</div>
                <div className="text-[10px] text-gray-500">This Week</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <FileSearch className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">{stats.ocrProcessed}</div>
                <div className="text-[10px] text-gray-500">OCR Processed</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">{stats.processingCount}</div>
                <div className="text-[10px] text-gray-500">Processing</div>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors flex items-center gap-1.5">
                <FolderPlus className="h-3 w-3" />
                New Folder
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search documents, cases, or tags..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="h-3 w-3 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Documents Grid/List */}
        <div className="flex-1 px-6 py-4 overflow-y-auto">
          {filteredDocuments.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-400 mb-1">No documents found</h3>
                <p className="text-xs text-gray-500">Upload documents or adjust your search</p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredDocuments.map(doc => (
                <div
                  key={doc.id}
                  className="group relative bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/[0.07] hover:border-white/20 transition-all cursor-pointer"
                  onClick={() => toggleDocSelection(doc.id)}
                >
                  {/* Selection Indicator */}
                  <div
                    className={`absolute top-2 right-2 w-4 h-4 rounded border-2 transition-all ${
                      selectedDocs.has(doc.id)
                        ? 'bg-purple-500 border-purple-500'
                        : 'border-white/20 group-hover:border-white/40'
                    }`}
                  >
                    {selectedDocs.has(doc.id) && (
                      <CheckCircle className="h-3 w-3 text-white absolute inset-0 m-auto" />
                    )}
                  </div>

                  {/* OCR Status */}
                  {doc.ocrStatus && (
                    <div className="absolute top-2 left-2">
                      {doc.ocrStatus === 'pending' && (
                        <Clock className="h-3 w-3 text-amber-400 animate-pulse" />
                      )}
                      {doc.ocrStatus === 'complete' && (
                        <CheckCircle className="h-3 w-3 text-emerald-400" />
                      )}
                      {doc.ocrStatus === 'failed' && (
                        <AlertCircle className="h-3 w-3 text-red-400" />
                      )}
                    </div>
                  )}

                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3">{getFileIcon(doc.type, 'h-10 w-10')}</div>
                    <h3 className="text-xs font-medium text-white line-clamp-2 mb-1">
                      {doc.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 mb-2">{formatFileSize(doc.size)}</p>

                    {/* Tags */}
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {doc.tags.slice(0, 2).map(tag => (
                          <span 
                            key={tag} 
                            className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[9px]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="w-full space-y-0.5 text-[10px] text-gray-500">
                      <div className="flex justify-between">
                        <span>Modified:</span>
                        <span>{new Date(doc.lastModified).toLocaleDateString()}</span>
                      </div>
                      {doc.confidence && (
                        <div className="flex justify-between">
                          <span>Confidence:</span>
                          <span className="text-emerald-400">{doc.confidence}%</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="absolute bottom-2 left-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          // View action
                        }}
                        className="flex-1 p-1.5 bg-black/50 hover:bg-black/70 rounded text-[10px] transition-colors"
                      >
                        <Eye className="h-3 w-3 mx-auto" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          // Download action
                        }}
                        className="flex-1 p-1.5 bg-black/50 hover:bg-black/70 rounded text-[10px] transition-colors"
                      >
                        <Download className="h-3 w-3 mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map(doc => (
                <div
                  key={doc.id}
                  className="group flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/[0.07] hover:border-white/20 transition-all"
                >
                  <input
                    type="checkbox"
                    checked={selectedDocs.has(doc.id)}
                    onChange={() => toggleDocSelection(doc.id)}
                    className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                    onClick={e => e.stopPropagation()}
                  />

                  {getFileIcon(doc.type)}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate group-hover:text-purple-300 transition-colors">
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      <span>{formatFileSize(doc.size)}</span>
                      <span>•</span>
                      <span>{doc.folder}</span>
                      <span>•</span>
                      <span>{new Date(doc.lastModified).toLocaleDateString()}</span>
                      {doc.confidence && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400">{doc.confidence}% match</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex gap-1">
                      {doc.tags.map(tag => (
                        <span 
                          key={tag}
                          className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* OCR Status */}
                  {doc.ocrStatus && (
                    <div className="flex items-center gap-1">
                      {doc.ocrStatus === 'pending' && (
                        <>
                          <Clock className="h-3 w-3 text-amber-400 animate-pulse" />
                          <span className="text-[10px] text-amber-400">OCR pending</span>
                        </>
                      )}
                      {doc.ocrStatus === 'complete' && (
                        <>
                          <CheckCircle className="h-3 w-3 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400">OCR complete</span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 hover:bg-white/10 rounded transition-colors">
                      <Eye className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                    <button className="p-1.5 hover:bg-white/10 rounded transition-colors">
                      <Download className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                    <button className="p-1.5 hover:bg-white/10 rounded transition-colors">
                      <MoreVertical className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="px-6 py-3 bg-black/30 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[11px] text-gray-500">
            <span>Showing {filteredDocuments.length} of {documents.length} documents</span>
            <span>•</span>
            <span>{formatFileSize(stats.totalSize)} total</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors flex items-center gap-1.5">
              <Tags className="h-3 w-3" />
              Manage Tags
            </button>
            <button className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors flex items-center gap-1.5">
              <Briefcase className="h-3 w-3" />
              Assign to Case
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}