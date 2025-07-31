'use client'

import Sidebar from './sidebar'

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#030303]">
      {/* Fixed Sidebar */}
      <div className="flex-shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Main Content Area - Full height with no extra wrappers */}
      <main className="flex-1 h-full w-full overflow-hidden">
        {children}
      </main>
    </div>
  )
}