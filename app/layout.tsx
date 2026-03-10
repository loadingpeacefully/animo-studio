import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display, Space_Mono } from 'next/font/google'
import './globals.css'
import '@esotericsoftware/spine-player/dist/spine-player.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-space-mono',
  weight: ['400', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Animo Studio',
  description: 'Create 2D animated educational lessons in minutes. Teacher-led. Reviewer-approved. Export-ready.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${playfair.variable} ${spaceMono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
