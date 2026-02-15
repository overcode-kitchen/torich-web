'use client'

import { useCallback, useEffect, useRef } from 'react'

/** 자석 느낌 easing: 빨리 시작해서 끝에서 끌어당기는 느낌 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/** 슈르륵 스크롤용: 시작·끝 모두 부드럽게 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function scrollToAnimated(
  element: HTMLElement,
  targetTop: number,
  duration: number,
  easing: (t: number) => number
) {
  const startTop = element.scrollTop
  const distance = targetTop - startTop
  if (Math.abs(distance) < 2) return

  const startTime = performance.now()
  const originalSnap = element.style.scrollSnapType
  element.style.scrollSnapType = 'none'

  function tick(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = easing(progress)
    element.scrollTop = startTop + distance * eased
    if (progress < 1) {
      requestAnimationFrame(tick)
    } else {
      element.style.scrollSnapType = originalSnap
    }
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
