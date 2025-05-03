import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'image2svg',
  description: 'an image to SVG converter',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'image2svg',
    description: 'an image to SVG converter',
    url: 'https://image2svg.vercel.app',
    siteName: 'image2svg',
    images: [
      {
        url: 'https://image2svg.vercel.app/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en-US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'image2svg',
    description: 'an image to SVG converter',
    images: ['https://image2svg.vercel.app/og-image.png'],
    creator: '@image2svg',
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
