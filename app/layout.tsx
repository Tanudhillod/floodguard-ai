import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FloodGuard AI — Disaster Response Command Center',
  description: 'Real-time flood monitoring and emergency response operations dashboard.',
  generator: 'FloodGuard AI',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#08111f',
  userScalable: false,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="dark"><body className="antialiased">{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
