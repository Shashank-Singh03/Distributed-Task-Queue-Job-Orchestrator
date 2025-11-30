import { useEffect, useState } from 'react'
import { MotionFadeIn } from '../common/MotionFadeIn'

export default function DashboardHero() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="relative overflow-hidden mb-8 rounded-lg">
      <div
        className="absolute inset-0 bg-gradient-to-r from-sky-900 via-slate-900 to-amber-800"
        style={{
          transform: `translateY(${scrollY * 0.1}px)`,
        }}
      />
      <div className="relative px-8 py-12">
        <MotionFadeIn>
          <h1 className="text-3xl font-bold text-white mb-2">
            Task Queue Control Plane
          </h1>
          <p className="text-slate-300 text-sm">
            Monitor and manage distributed job processing in real-time
          </p>
        </MotionFadeIn>
      </div>
    </div>
  )
}

