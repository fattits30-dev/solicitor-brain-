import { ReactNode } from 'react'

interface PageWrapperProps {
  children: ReactNode
  className?: string
}

export default function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <div className={`h-full w-full bg-[#030303] overflow-hidden ${className}`}>
      <div className="h-full w-full overflow-y-auto">
        {children}
      </div>
    </div>
  )
}