'use client'

import { useState, useEffect } from 'react'
import { 
  Mail, 
  Inbox, 
  Send, 
  FileText, 
  Trash2, 
  Archive, 
  Star, 
  Search, 
  Plus, 
  Paperclip,
  Reply,
  ReplyAll,
  Forward,
  X,
  Calendar,
  User,
  Clock,
  Tag,
  CheckCircle,
  AlertCircle,
  Filter,
  MoreVertical,
  Download,
  Briefcase,
  Shield,
  Zap,
  ChevronRight,
  FolderOpen,
  Edit3,
  TrendingUp,
  Activity
} from 'lucide-react'
import { api } from '@/services/api'

interface Email {
  id: string
  folder: string
  from: string
  to: string[]
  subject: string
  body: string
  date: string
  is_read: boolean
  is_flagged: boolean
  has_attachments: boolean
  attachments: string[]
  case_id?: string
  tags: string[]
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  category?: string
}

interface EmailFolder {
  name: string
  count: number
  unread: number
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [folders, setFolders] = useState<EmailFolder[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [selectedFolder, setSelectedFolder] = useState('inbox')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCompose, setShowCompose] = useState(false)
  const [composeData, setComposeData] = useState({
    to: '',
    cc: '',
    subject: '',
    body: '',
    case_id: ''
  })
  const [stats, setStats] = useState({
    totalEmails: 0,
    unreadEmails: 0,
    flaggedEmails: 0,
    todayEmails: 0,
    attachmentCount: 0
  })

  useEffect(() => {
    fetchFolders()
    fetchEmails()
  }, [selectedFolder, fetchEmails])

  useEffect(() => {
    // Calculate stats from emails
    const unread = emails.filter(e => !e.is_read).length
    const flagged = emails.filter(e => e.is_flagged).length
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEmails = emails.filter(e => new Date(e.date) >= today).length
    const attachments = emails.filter(e => e.has_attachments).length
    
    setStats({
      totalEmails: emails.length,
      unreadEmails: unread,
      flaggedEmails: flagged,
      todayEmails: todayEmails,
      attachmentCount: attachments
    })
  }, [emails])

  const fetchFolders = async () => {
    try {
      const response = await api.getEmailFolders()
      if (response.data) {
        setFolders(response.data.folders)
      }
    } catch (error) {
      console.error('Failed to fetch folders:', error)
    }
  }

  const fetchEmails = async () => {
    setLoading(true)
    try {
      const response = await api.getEmails({ 
        folder: selectedFolder, 
        ...(searchQuery ? { search: searchQuery } : {})
      })
      if (response.data) {
        setEmails(response.data.emails)
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error)
      setEmails([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchEmails()
  }

  const handleSendEmail = async () => {
    const toEmails = composeData.to.split(',').map(e => e.trim()).filter(e => e)
    const ccEmails = composeData.cc ? composeData.cc.split(',').map(e => e.trim()).filter(e => e) : []
    
    try {
      const response = await api.sendEmail({
        to: toEmails,
        cc: ccEmails,
        subject: composeData.subject,
        body: composeData.body,
        case_id: composeData.case_id || undefined,
        is_draft: false
      })
      
      if (response.data) {
        setShowCompose(false)
        setComposeData({ to: '', cc: '', subject: '', body: '', case_id: '' })
        fetchEmails()
        fetchFolders()
      }
    } catch (error) {
      console.error('Failed to send email:', error)
    }
  }

  const toggleFlag = async (email: Email) => {
    await api.updateEmail(email.id, { is_flagged: !email.is_flagged })
    fetchEmails()
  }

  const markAsRead = async (email: Email) => {
    if (!email.is_read) {
      await api.updateEmail(email.id, { is_read: true })
      fetchEmails()
    }
  }

  const moveToTrash = async (email: Email) => {
    await api.updateEmail(email.id, { folder: 'trash' })
    fetchEmails()
    fetchFolders()
    setSelectedEmail(null)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return date.toLocaleDateString('en-GB', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400'
      case 'high': return 'text-orange-400'
      case 'normal': return 'text-blue-400'
      case 'low': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const folderIcons: Record<string, React.ReactNode> = {
    inbox: <Inbox className="h-4 w-4" />,
    sent: <Send className="h-4 w-4" />,
    drafts: <FileText className="h-4 w-4" />,
    trash: <Trash2 className="h-4 w-4" />,
    archive: <Archive className="h-4 w-4" />
  }

  if (loading && emails.length === 0) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
          </div>
          <p className="mt-4 text-gray-400 text-sm">Loading emails...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-[#0a0a0a] flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-black/30 border-r border-white/5 flex flex-col">
        <div className="p-4">
          <button
            onClick={() => setShowCompose(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Compose
          </button>
        </div>

        <div className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
          {folders.map((folder) => (
            <button
              key={folder.name}
              onClick={() => setSelectedFolder(folder.name)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm ${
                selectedFolder === folder.name
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                {folderIcons[folder.name]}
                <span className="capitalize">{folder.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {folder.unread > 0 && (
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                    {folder.unread}
                  </span>
                )}
                <span className={`text-xs ${selectedFolder === folder.name ? 'text-blue-200' : 'text-gray-500'}`}>
                  {folder.count}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="p-4 border-t border-white/5">
          <div className="bg-white/5 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Today&apos;s emails</span>
              <span className="text-gray-300">{stats.todayEmails}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Unread</span>
              <span className="text-blue-400">{stats.unreadEmails}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Flagged</span>
              <span className="text-amber-400">{stats.flaggedEmails}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 flex">
        <div className="w-96 border-r border-white/5 flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-white capitalize">{selectedFolder}</h2>
              <div className="flex items-center gap-2">
                <button className="p-1.5 hover:bg-white/5 rounded transition-colors">
                  <Filter className="h-3.5 w-3.5 text-gray-400" />
                </button>
                <button className="p-1.5 hover:bg-white/5 rounded transition-colors">
                  <MoreVertical className="h-3.5 w-3.5 text-gray-400" />
                </button>
              </div>
            </div>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search emails..."
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    fetchEmails()
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X className="h-3 w-3 text-gray-400" />
                </button>
              )}
            </form>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto">
            {emails.length === 0 ? (
              <div className="p-8 text-center">
                <Mail className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No emails found</p>
              </div>
            ) : (
              emails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => {
                    setSelectedEmail(email)
                    markAsRead(email)
                  }}
                  className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
                    !email.is_read ? 'bg-white/[0.02]' : ''
                  } ${selectedEmail?.id === email.id ? 'bg-white/5 border-l-2 border-l-blue-500' : ''}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm truncate ${!email.is_read ? 'font-semibold text-white' : 'text-gray-300'}`}>
                          {email.from}
                        </span>
                        <div className="flex items-center gap-1">
                          {email.is_flagged && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
                          {email.has_attachments && <Paperclip className="h-3 w-3 text-gray-500" />}
                          {email.priority && email.priority !== 'normal' && (
                            <div className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(email.priority)} bg-current`} />
                          )}
                        </div>
                      </div>
                      <div className={`text-sm truncate ${!email.is_read ? 'text-gray-200' : 'text-gray-400'}`}>
                        {email.subject || '(No subject)'}
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {email.body}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {formatDate(email.date)}
                    </span>
                  </div>
                  {(email.tags.length > 0 || email.case_id) && (
                    <div className="flex items-center gap-1 mt-2">
                      {email.case_id && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[10px]">
                          <Briefcase className="h-2.5 w-2.5" />
                          Case
                        </span>
                      )}
                      {email.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px]"
                        >
                          {tag}
                        </span>
                      ))}
                      {email.tags.length > 2 && (
                        <span className="text-[10px] text-gray-500">+{email.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Email Detail */}
        <div className="flex-1 flex flex-col">
          {selectedEmail ? (
            <>
              {/* Email Header */}
              <div className="px-6 py-4 border-b border-white/5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-white mb-1">{selectedEmail.subject || '(No subject)'}</h2>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(selectedEmail.date).toLocaleString('en-GB')}
                      </span>
                      {selectedEmail.priority && selectedEmail.priority !== 'normal' && (
                        <span className={`flex items-center gap-1 ${getPriorityColor(selectedEmail.priority)}`}>
                          <Zap className="h-3 w-3" />
                          {selectedEmail.priority}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleFlag(selectedEmail)}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                      title="Flag email"
                    >
                      <Star className={`h-4 w-4 ${selectedEmail.is_flagged ? 'text-amber-400 fill-amber-400' : 'text-gray-400'}`} />
                    </button>
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors" title="Archive">
                      <Archive className="h-4 w-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => moveToTrash(selectedEmail)}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-gray-200">{selectedEmail.from}</div>
                      <div className="text-xs text-gray-500">
                        to {selectedEmail.to.join(', ')}
                      </div>
                    </div>
                  </div>
                  {selectedEmail.case_id && (
                    <a 
                      href={`/cases/${selectedEmail.case_id}`} 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-colors text-xs"
                    >
                      <Briefcase className="h-3 w-3" />
                      View Case
                    </a>
                  )}
                </div>
              </div>

              {/* Email Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl">
                  <div className="whitespace-pre-wrap text-sm text-gray-200 leading-relaxed">
                    {selectedEmail.body}
                  </div>
                  
                  {selectedEmail.has_attachments && selectedEmail.attachments.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-white/5">
                      <h3 className="text-sm font-medium text-white mb-3">Attachments ({selectedEmail.attachments.length})</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedEmail.attachments.map((attachment, index) => (
                          <button
                            key={index}
                            className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/[0.07] rounded-lg transition-colors group"
                          >
                            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                              <FileText className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-sm text-gray-200 truncate">{attachment}</p>
                              <p className="text-xs text-gray-500">PDF Document</p>
                            </div>
                            <Download className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-6 py-4 bg-black/30 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm">
                      <Reply className="h-4 w-4" />
                      Reply
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm text-gray-300">
                      <ReplyAll className="h-4 w-4" />
                      Reply All
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm text-gray-300">
                      <Forward className="h-4 w-4" />
                      Forward
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors flex items-center gap-1.5">
                      <Tag className="h-3 w-3" />
                      Add Tag
                    </button>
                    <button className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors flex items-center gap-1.5">
                      <Shield className="h-3 w-3" />
                      Mark Confidential
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Mail className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Select an email to view</p>
                <p className="text-xs text-gray-500 mt-1">Choose from your {selectedFolder}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">New Email</h2>
              <button
                onClick={() => setShowCompose(false)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">To</label>
                <input
                  type="text"
                  value={composeData.to}
                  onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                  placeholder="email@example.com, another@example.com"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">CC (optional)</label>
                <input
                  type="text"
                  value={composeData.cc}
                  onChange={(e) => setComposeData({ ...composeData, cc: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                  placeholder="cc@example.com"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                  placeholder="Email subject"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Link to Case (optional)</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    value={composeData.case_id}
                    onChange={(e) => setComposeData({ ...composeData, case_id: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                    placeholder="Case ID or number"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Message</label>
                <textarea
                  value={composeData.body}
                  onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                  rows={12}
                  placeholder="Type your message..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors" title="Attach files">
                  <Paperclip className="h-4 w-4 text-gray-400" />
                </button>
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors" title="Add template">
                  <FileText className="h-4 w-4 text-gray-400" />
                </button>
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors" title="Set priority">
                  <Zap className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/5">
              <button className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">
                Save as Draft
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
                >
                  Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}