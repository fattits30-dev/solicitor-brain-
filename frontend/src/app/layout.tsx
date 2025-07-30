import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ComplianceBanner } from '@/components/compliance-banner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Solicitor Brain - AI Legal Practice Management',
  description: 'AI-powered legal practice management system with SRA compliance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ComplianceBanner />
          {children}
        </Providers>
      </body>
    </html>
  )
}