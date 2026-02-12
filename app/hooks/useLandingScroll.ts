'use client'

import { useCallback, useEffect, useRef } from 'react'

/** 자석 느낌 easing: 빨리 시작해서 끝에서 끌어당기는 느낌 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/** 스크롤을 목표 위치로 자석처럼 끌어당기는 애니메이션 */
function scrollToWithMagnet(
  element: HTMLElement,
  targetTop: number,
  duration = 350
) {
  const startTop = element.scrollTop
  const distance = targetTop - startTop
  if (Math.abs(distance) < 2) return

  const startTime = performance.now()

  function tick(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = easeOutCubic(progress)
    element.scrollTop = startTop + distance * eased
    if (progress < 1) requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}

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
      scrollToWithMagnet(main, targetTop)
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
    scrollToWithMagnet(main, targetTop, 450)
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
    scrollToSection2
  }
}
