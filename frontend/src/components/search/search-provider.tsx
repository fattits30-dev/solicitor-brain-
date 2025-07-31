'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import MiniSearch from 'minisearch'

interface SearchDocument {
  id: string
  title: string
  content: string
  type: 'case' | 'document' | 'email' | 'note'
  caseId?: string
  date?: string
  tags?: string[]
}

interface SearchContextType {
  search: (query: string) => SearchDocument[]
  addDocuments: (documents: SearchDocument[]) => void
  removeDocument: (id: string) => void
  updateDocument: (id: string, document: SearchDocument) => void
  isReady: boolean
}

const SearchContext = createContext<SearchContextType | null>(null)

export function useSearch() {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider')
  }
  return context
}

interface SearchProviderProps {
  children: React.ReactNode
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [miniSearch, setMiniSearch] = useState<MiniSearch<SearchDocument> | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const ms = new MiniSearch<SearchDocument>({
      fields: ['title', 'content', 'tags'],
      storeFields: ['id', 'title', 'content', 'type', 'caseId', 'date', 'tags'],
      searchOptions: {
        boost: { title: 2 },
        fuzzy: 0.2,
        prefix: true
      }
    })
    
    setMiniSearch(ms)
    setIsReady(true)
  }, [])

  const search = (query: string): SearchDocument[] => {
    if (!miniSearch || !query.trim()) return []
    
    try {
      const results = miniSearch.search(query)
      return results.map(result => ({
        id: result.id,
        title: result.title,
        content: result.content,
        type: result.type,
        caseId: result.caseId,
        date: result.date,
        tags: result.tags
      }))
    } catch (error) {
      console.error('Search error:', error)
      return []
    }
  }

  const addDocuments = (documents: SearchDocument[]) => {
    if (!miniSearch) return
    
    try {
      miniSearch.addAll(documents)
    } catch (error) {
      console.error('Error adding documents:', error)
    }
  }

  const removeDocument = (id: string) => {
    if (!miniSearch) return
    
    try {
      miniSearch.remove({ id } as any)
    } catch (error) {
      console.error('Error removing document:', error)
    }
  }

  const updateDocument = (id: string, document: SearchDocument) => {
    if (!miniSearch) return
    
    try {
      miniSearch.remove({ id } as any)
      miniSearch.add(document)
    } catch (error) {
      console.error('Error updating document:', error)
    }
  }

  return (
    <SearchContext.Provider value={{
      search,
      addDocuments,
      removeDocument,
      updateDocument,
      isReady
    }}>
      {children}
    </SearchContext.Provider>
  )
}