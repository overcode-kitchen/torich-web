'use client'

import { useCallback, useEffect, useRef } from 'react'
import { scrollToAnimated, easeOutCubic, easeInOutCubic } from '@/app/utils/scroll-animation'

export function useLandingScroll(mainRef: React.RefObject<HTMLElement | null>) {
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isAnimatingRef = useRef(false)

  const snapToNearestSection = useCallback(() => {
    const main = mainRef.current
    if (!main || isAnimatingRef.current) return

    const snapSections = Array.from(main.querySelectorAll('section'))
    const scrollTop = main.scrollTop
    const viewportMid = scrollTop + main.clientHeight / 2

    let targetTop: number | null = null
    let nearestDistance = Infinity

    for (const section of snapSections) {
      const sectionTop = (section as HTMLElement).offsetTop
      const sectionMid = sectionTop + (section as HTMLElement).offsetHeight / 2
      const distance = Math.abs(viewportMid - sectionMid)
      if (distance < nearestDistance) {
        nearestDistance = distance
        targetTop = sectionTop
      }
    }

    if (targetTop !== null && Math.abs(main.scrollTop - targetTop) > 5) {
      isAnimatingRef.current = true
      scrollToAnimated(main, targetTop, 350, easeOutCubic)
      setTimeout(() => {
        isAnimatingRef.current = false
      }, 350)
    }
  }, [])

  const scrollToSection2 = useCallback(() => {
    const main = mainRef.current
    const section2 = document.getElementById('landing-section-2')
    if (!main || !section2) return
    const targetTop = section2.offsetTop
    scrollToAnimated(main, targetTop, 550, easeInOutCubic)
  }, [])

  const scrollToTop = useCallback(() => {
    const main = mainRef.current
    if (!main) return
    scrollToAnimated(main, 0, 550, easeInOutCubic)
  }, [])

  useEffect(() => {
    const main = mainRef.current
    if (!main) return

    const handleScrollEnd = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = setTimeout(() => {
        snapToNearestSection()
        scrollTimeoutRef.current = null
      }, 120)
    }

    main.addEventListener('scroll', handleScrollEnd, { passive: true })
    return () => {
      main.removeEventListener('scroll', handleScrollEnd)
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    }
  }, [snapToNearestSection])

  return {
    scrollToSection2,
    scrollToTop
  }
}
