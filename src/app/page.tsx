'use client'

import { useState, useEffect } from 'react'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import Contact from '@/components/Contact'
import SplashScreen from '@/components/SplashScreen'

export default function Home() {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    // Check if user has seen splash in this session
    const seen = sessionStorage.getItem('splashSeen')
    if (seen) {
      setShowSplash(false)
    }
  }, [])

  const handleSplashComplete = () => {
    sessionStorage.setItem('splashSeen', 'true')
    setShowSplash(false)
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <main className="bg-white">
        <Hero />
        <Features />
        <HowItWorks />
        <Contact />
      </main>
    </>
  )
}
