import Hero from '@/components/Hero'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import Contact from '@/components/Contact'

export default function Home() {
  return (
    <main className="bg-white">
      <Hero />
      <Features />
      <HowItWorks />
      <Contact />
    </main>
  )
}
