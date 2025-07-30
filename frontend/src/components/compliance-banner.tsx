'use client'

import { AlertCircle } from 'lucide-react'

export function ComplianceBanner() {
  return (
    <div className="compliance-banner flex items-center justify-center gap-2">
      <AlertCircle className="h-4 w-4" />
      <span>AI outputs are organisational assistance only – verify before use.</span>
    </div>
  )
}