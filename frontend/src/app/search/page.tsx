'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  FileText,
  Briefcase,
  Mail,
  Calendar,
  User,
  Clock,
  ChevronRight,
  X,
  Hash,
  Tag,
  Folder,
  Database,
  TrendingUp,
  Eye,
  Download,
  Share2,
  History,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Settings,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  FileSearch,
  MessageSquare,
  Sparkles,
  Command,
  Globe,
  Shield,
  Zap
} from 'lucide-react'

interface SearchResult {
  id: string
  type: 'case' | 'document' | 'email' | 'event' | 'client' | 'note'
  title: string
  excerpt: string
  highlights: string[]
  metadata: {
    date?: string
    caseId?: string
    caseTitle?: string
    author?: string
    tags?: string[]
    size?: string
    status?: string
  }
  relevance: number
  url: string
}

interface SearchFilters {
  type: string[]
  dateRange: {
    from: string | null
    to: string | null
  }
  cases: string[]
  tags: string[]
  status: string[]
}

interface SearchStats {
  totalResults: number
  searchTime: number
  topCategories: {
    type: string
    count: number
  }[]
}

const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    type: 'case',
    title: 'Smith vs Johnson - Contract Dispute',
    excerpt: 'A complex contract dispute involving breach of terms regarding software delivery deadlines...',
    highlights: ['contract dispute', 'software delivery', 'breach of terms'],
    metadata: {
      date: '2024-03-15',
      caseId: 'CASE-2024-001',
      status: 'Active',
      tags: ['Contract Law', 'Commercial']
    },
    relevance: 95,
    url: '/cases/CASE-2024-001'
  },
  {
    id: '2',
    type: 'document',
    title: 'Employment Contract Template',
    excerpt: 'Standard employment contract template with clauses for confidentiality, non-compete...',
    highlights: ['employment contract', 'confidentiality', 'non-compete'],
    metadata: {
      date: '2024-02-20',
      caseId: 'CASE-2024-003',
      caseTitle: 'Williams Estate Planning',
      size: '245 KB',
      tags: ['Template', 'Employment']
    },
    relevance: 88,
    url: '/documents/DOC-2024-045'
  },
  {
    id: '3',
    type: 'email',
    title: 'Re: Discovery Documents Request',
    excerpt: 'Please find attached the requested discovery documents for the Brown vs State case...',
    highlights: ['discovery documents', 'Brown vs State'],
    metadata: {
      date: '2024-03-18',
      author: 'Jane Doe',
      caseId: 'CASE-2024-002',
      caseTitle: 'Brown vs State'
    },
    relevance: 82,
    url: '/emails/EMAIL-2024-123'
  }
]

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    type: [],
    dateRange: { from: null, to: null },
    cases: [],
    tags: [],
    status: []
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'title'>('relevance')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(true)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'contract breach',
    'employment law',
    'discovery deadline',
    'client meeting notes'
  ])
  const [searchStats, setSearchStats] = useState<SearchStats>({
    totalResults: 0,
    searchTime: 0,
    topCategories: []
  })

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    const startTime = Date.now()

    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Filter mock results based on query
    const filtered = mockSearchResults.filter(result =>
      result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.highlights.some(h => h.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    setSearchResults(filtered.length > 0 ? filtered : mockSearchResults)
    
    const endTime = Date.now()
    setSearchStats({
      totalResults: filtered.length > 0 ? filtered.length : mockSearchResults.length,
      searchTime: endTime - startTime,
      topCategories: [
        { type: 'Cases', count: 45 },
        { type: 'Documents', count: 128 },
        { type: 'Emails', count: 67 }
      ]
    })

    // Add to recent searches
    if (!recentSearches.includes(searchQuery)) {
      setRecentSearches(prev => [searchQuery, ...prev.slice(0, 4)])
    }

    setIsSearching(false)
  }

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'case': return <Briefcase className="h-4 w-4" />
      case 'document': return <FileText className="h-4 w-4" />
      case 'email': return <Mail className="h-4 w-4" />
      case 'event': return <Calendar className="h-4 w-4" />
      case 'client': return <User className="h-4 w-4" />
      case 'note': return <MessageSquare className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'case': return 'text-blue-400 bg-blue-500/10'
      case 'document': return 'text-purple-400 bg-purple-500/10'
      case 'email': return 'text-emerald-400 bg-emerald-500/10'
      case 'event': return 'text-amber-400 bg-amber-500/10'
      case 'client': return 'text-rose-400 bg-rose-500/10'
      case 'note': return 'text-cyan-400 bg-cyan-500/10'
    }
  }

  const highlightText = (text: string, highlights: string[]) => {
    let highlightedText = text
    highlights.forEach(highlight => {
      const regex = new RegExp(`(${highlight})`, 'gi')
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">$1</mark>')
    })
    return { __html: highlightedText }
  }

  return (
    <div className="h-screen w-full bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-400" />
              Global Search
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Search across all cases, documents, and communications</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-gray-400'
              }`}
            >
              <Filter className="h-4 w-4" />
            </button>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Settings className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-4 bg-black/30 border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-400" />
              <kbd className="hidden sm:block px-1.5 py-0.5 text-[10px] bg-white/10 rounded text-gray-400 font-mono">
                ⌘K
              </kbd>
            </div>
            <input
              type="text"
              placeholder="Search cases, documents, emails, clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-14 pr-32 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button className="p-2 hover:bg-white/5 rounded transition-colors">
                <Sparkles className="h-4 w-4 text-purple-400" />
              </button>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded transition-colors text-sm"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-gray-400">Quick filters:</span>
            {['Cases', 'Documents', 'Emails', 'This Week', 'My Items'].map(filter => (
              <button
                key={filter}
                className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg transition-colors"
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-64 border-r border-white/5 p-4 overflow-y-auto">
            <h3 className="text-sm font-medium text-white mb-4">Refine Results</h3>

            {/* Type Filter */}
            <div className="mb-6">
              <h4 className="text-xs text-gray-400 mb-3">Type</h4>
              <div className="space-y-2">
                {[
                  { id: 'case', label: 'Cases', count: 45 },
                  { id: 'document', label: 'Documents', count: 128 },
                  { id: 'email', label: 'Emails', count: 67 },
                  { id: 'event', label: 'Events', count: 23 },
                  { id: 'client', label: 'Clients', count: 34 },
                  { id: 'note', label: 'Notes', count: 89 }
                ].map(type => (
                  <label key={type.id} className="flex items-center gap-2 text-xs text-gray-300 hover:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-600 bg-white/5 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{type.label}</span>
                    <span className="ml-auto text-gray-500">({type.count})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="mb-6">
              <h4 className="text-xs text-gray-400 mb-3">Date Range</h4>
              <div className="space-y-2">
                <input
                  type="date"
                  className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="From"
                />
                <input
                  type="date"
                  className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="To"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="mb-6">
              <h4 className="text-xs text-gray-400 mb-3">Status</h4>
              <div className="space-y-2">
                {['Active', 'Closed', 'Pending', 'Archived'].map(status => (
                  <label key={status} className="flex items-center gap-2 text-xs text-gray-300 hover:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-600 bg-white/5 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            <div>
              <h4 className="text-xs text-gray-400 mb-3">Recent Searches</h4>
              <div className="space-y-1">
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchQuery(search)
                      handleSearch()
                    }}
                    className="w-full text-left px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors truncate"
                  >
                    <History className="h-3 w-3 inline mr-1" />
                    {search}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto">
          {searchResults.length === 0 && !isSearching ? (
            // Empty State
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <div className="mb-4 p-4 bg-white/5 rounded-full inline-flex">
                  <FileSearch className="h-12 w-12 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Start Your Search</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Search across all your cases, documents, emails, and client information in one place.
                </p>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Try searching for:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['contract breach', 'client name', 'case number', 'deadline'].map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setSearchQuery(suggestion)
                          handleSearch()
                        }}
                        className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Search Stats */}
              {searchStats.totalResults > 0 && (
                <div className="px-6 py-3 bg-black/30 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-gray-400">
                        Found <span className="text-white font-medium">{searchStats.totalResults}</span> results
                        in <span className="text-white font-medium">{searchStats.searchTime}ms</span>
                      </span>
                      <div className="flex items-center gap-2">
                        {searchStats.topCategories.map(cat => (
                          <span key={cat.type} className="px-2 py-0.5 bg-white/5 rounded text-gray-400">
                            {cat.type}: {cat.count}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="p-1.5 hover:bg-white/5 rounded transition-colors"
                      >
                        {sortOrder === 'asc' ? <SortAsc className="h-4 w-4 text-gray-400" /> : <SortDesc className="h-4 w-4 text-gray-400" />}
                      </button>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs focus:outline-none"
                      >
                        <option value="relevance">Relevance</option>
                        <option value="date">Date</option>
                        <option value="title">Title</option>
                      </select>
                      <div className="flex items-center bg-white/5 rounded">
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-1.5 transition-colors ${viewMode === 'list' ? 'text-blue-400' : 'text-gray-400'}`}
                        >
                          <List className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'text-blue-400' : 'text-gray-400'}`}
                        >
                          <Grid className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Results List */}
              <div className="p-6">
                {isSearching ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Searching...</p>
                    </div>
                  </div>
                ) : (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-3'}>
                    {searchResults.map(result => (
                      <div
                        key={result.id}
                        onClick={() => setSelectedResult(result)}
                        className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/[0.07] cursor-pointer transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${getTypeColor(result.type)}`}>
                            {getTypeIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-sm font-medium text-white mb-1">{result.title}</h3>
                                <p 
                                  className="text-xs text-gray-400 line-clamp-2"
                                  dangerouslySetInnerHTML={highlightText(result.excerpt, result.highlights)}
                                />
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <div className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                                  {result.relevance}% match
                                </div>
                              </div>
                            </div>

                            {/* Metadata */}
                            <div className="flex items-center gap-3 text-[10px] text-gray-500">
                              {result.metadata.date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(result.metadata.date).toLocaleDateString()}
                                </span>
                              )}
                              {result.metadata.caseTitle && (
                                <span className="flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  {result.metadata.caseTitle}
                                </span>
                              )}
                              {result.metadata.author && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {result.metadata.author}
                                </span>
                              )}
                              {result.metadata.size && (
                                <span>{result.metadata.size}</span>
                              )}
                            </div>

                            {/* Tags */}
                            {result.metadata.tags && result.metadata.tags.length > 0 && (
                              <div className="flex items-center gap-1 mt-2">
                                {result.metadata.tags.map(tag => (
                                  <span key={tag} className="px-2 py-0.5 bg-white/5 text-[10px] text-gray-400 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <button className="p-1.5 hover:bg-white/10 rounded transition-colors">
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Result Preview Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getTypeColor(selectedResult.type)}`}>
                  {getTypeIcon(selectedResult.type)}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedResult.title}</h2>
                  <p className="text-xs text-gray-400 capitalize">{selectedResult.type}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Preview Content */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-2">Preview</h3>
                <p className="text-sm text-gray-300" dangerouslySetInnerHTML={highlightText(selectedResult.excerpt, selectedResult.highlights)} />
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                {selectedResult.metadata.date && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Date</div>
                    <div className="text-sm text-white">{new Date(selectedResult.metadata.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                )}
                {selectedResult.metadata.caseTitle && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Related Case</div>
                    <div className="text-sm text-white">{selectedResult.metadata.caseTitle}</div>
                  </div>
                )}
                {selectedResult.metadata.author && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Author</div>
                    <div className="text-sm text-white">{selectedResult.metadata.author}</div>
                  </div>
                )}
                {selectedResult.metadata.status && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Status</div>
                    <div className="text-sm text-white">{selectedResult.metadata.status}</div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  View Full
                </button>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors text-sm flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors text-sm flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors text-sm ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}