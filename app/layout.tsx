import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Squigglify',
  description: 'an image to SVG converter',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Squigglify',
    description: 'an image to SVG converter',
    url: 'https://Squigglify.vercel.app',
    siteName: 'Squigglify',
    images: [
      {
        url: 'https://Squigglify.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Squigglify - Image to SVG Converter',
      },
    ],
    locale: 'en-US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Squigglify',
    description: 'an image to SVG converter',
    images: ['https://Squigglify.vercel.app/og-image.png'],
    creator: '@tapiwohb',
    site: 'https://quigglify.vercel.app',
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
