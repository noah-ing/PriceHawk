"use client"

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function LandingPage() {
  // All hooks must be called at the top level, unconditionally
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Handle authentication redirects in useEffect
  // This keeps the hook call order consistent
  useEffect(() => {
    // Only redirect if authenticated and not already redirecting
    if (status === 'authenticated' && !isRedirecting) {
      setIsRedirecting(true)
      // Adding a try/catch to ensure we handle any navigation errors
      try {
        router.replace('/dashboard')
      } catch (error) {
        // If navigation fails, reset the redirecting state to allow retry
        console.error('Navigation error:', error)
        setIsRedirecting(false)
      }
    }
  }, [status, router, isRedirecting])

  // Render spinner for loading or redirect states - using a memo for consistent rendering pattern
  const loadingSpinner = (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
    </div>
  )
  
  if (status === 'loading' || isRedirecting) {
    return loadingSpinner
  }

  // Only show landing page to unauthenticated users
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* Hero Section - Bold, Powerful, Minimal */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="max-w-4xl space-y-8">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            MAXIMIZE YOUR 
            <span className="block mt-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">DROPSHIPPING PROFITS</span>
          </h1>
          
          <p className="mx-auto mt-8 max-w-2xl text-xl font-light text-gray-300 sm:text-2xl tracking-wide">
            Stop guessing. Start winning. Know exactly when to buy.
          </p>
          
          <div className="mt-12">
            <Button 
              className="h-16 px-10 text-lg font-semibold bg-white text-black hover:bg-gray-200 hover:text-black transition-all transform hover:scale-105 tracking-wide"
              onClick={() => router.push('/auth/signin')}
            >
              TRY NOW
            </Button>
          </div>
          
          <div className="mt-20 grid grid-cols-1 gap-10 md:grid-cols-3">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">32%</h2>
              <p className="text-gray-400 font-light mt-1">Average profit margin increase</p>
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">$1.23M</h2>
              <p className="text-gray-400 font-light mt-1">Total user savings</p>
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">35K+</h2>
              <p className="text-gray-400 font-light mt-1">Active dropshippers</p>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="py-8 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-gray-500 font-light tracking-wide">
            © {new Date().getFullYear()} PriceHawk. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
