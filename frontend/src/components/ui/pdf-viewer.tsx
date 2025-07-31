'use client'

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from './button'
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Download,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Set worker URL
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

interface PDFViewerProps {
  url: string
  className?: string
  onPageChange?: (page: number) => void
}

export function PDFViewer({ url, className, onPageChange }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  const changePage = (offset: number) => {
    const newPage = pageNumber + offset
    if (newPage > 0 && newPage <= numPages) {
      setPageNumber(newPage)
      onPageChange?.(newPage)
    }
  }

  const changeZoom = (delta: number) => {
    const newScale = scale + delta
    if (newScale >= 0.5 && newScale <= 2.5) {
      setScale(newScale)
    }
  }

  return (
    <div className={cn('flex flex-col h-full bg-gray-950/50 rounded-lg border border-gray-800', className)}>
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-400">
            Page {pageNumber} of {numPages}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-700 mx-2" />
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => changeZoom(-0.1)}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-400 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => changeZoom(0.1)}
            disabled={scale >= 2.5}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-700 mx-2" />
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open(url, '_blank')}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 flex justify-center">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading PDF...</div>
            </div>
          }
          error={
            <div className="flex items-center justify-center h-full">
              <div className="text-red-500">Error loading PDF</div>
            </div>
          }
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-xl"
          />
        </Document>
      </div>
    </div>
  )
}