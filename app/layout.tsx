import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { SafeAuthProvider } from './providers/safe-auth-provider'
import { SubscriptionProvider } from './providers/subscription-provider'
import { StartupProvider } from './providers/startup-provider'
import { Toaster } from '@/components/ui/toaster'
import { Inter } from 'next/font/google'

// Initialize Inter font with optimized settings for performance
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
  adjustFontFallback: true,  // Automatically adjust the font fallback to minimize layout shift
  weight: ['400', '500', '600', '700'], // Only load the font weights we use
})

export const metadata: Metadata = {
  title: 'PriceHawk - Track Prices & Save Money',
  description: 'Track product prices across multiple retailers and get notified when they drop',
  generator: 'v0.dev',
}

// We're deliberately NOT using a theme provider at all since it causes hydration issues
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`light ${inter.variable}`}>
      <head>
        {/* Preconnect to Google Fonts to speed up font loading */}
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-background text-foreground font-sans">
        <SafeAuthProvider>
          <SubscriptionProvider>
            <StartupProvider />
            {children}
            <Toaster />
          </SubscriptionProvider>
        </SafeAuthProvider>
      </body>
    </html>
  )
}
