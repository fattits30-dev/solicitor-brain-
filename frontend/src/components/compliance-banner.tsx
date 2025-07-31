'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export function ComplianceBanner() {
  const [showBanner, setShowBanner] = useState(true)

  if (!showBanner) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500 rounded blur opacity-50"></div>
              <AlertTriangle className="relative h-4 w-4 text-amber-400" />
            </div>
            <p className="text-sm font-medium text-amber-200/90">
              AI outputs are organisational assistance only – verify before use
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowBanner(false)}
            className="text-gray-500 hover:text-white transition-colors p-1 hover:bg-white/5 rounded"
            aria-label="Close compliance banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}