import type { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'
import './globals.css'

export const metadata: Metadata = { title: 'Hail Mary', description: '가계부' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-950 text-white">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
