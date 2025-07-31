import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import DesktopLayout from '@/components/layout/desktop-layout'
import { ComplianceBanner } from '@/components/compliance-banner'
import CommandPalette from '@/components/command-palette'
import { ToastContainer } from '@/components/ui/toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Solicitor Brain',
  description: 'On-premises UK law AI clerk for small firms'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} overflow-hidden`}>
        <Providers>
          <div className="noise-overlay" />
          <ComplianceBanner />
          <CommandPalette />
          <ToastContainer />
          <DesktopLayout>{children}</DesktopLayout>
        </Providers>
      </body>
    </html>
  )
}
