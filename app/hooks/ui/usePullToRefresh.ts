'use client'

import { useEffect, useRef, useState } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number
  maxPull?: number
  resistance?: number
  disabled?: boolean
}

interface UsePullToRefreshReturn {
  pullDistance: number
  isRefreshing: boolean
  threshold: number
}

export function usePullToRefresh({
  onRefresh,
  threshold = 70,
  maxPull = 120,
  resistance = 0.5,
  disabled = false,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const onRefreshRef = useRef(onRefresh)
  const isRefreshingRef = useRef(false)
  const pullDistanceRef = useRef(0)
  const startYRef = useRef<number | null>(null)
  const isPullingRef = useRef(false)

  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  useEffect(() => {
    isRefreshingRef.current = isRefreshing
  }, [isRefreshing])

  useEffect(() => {
    pullDistanceRef.current = pullDistance
  }, [pullDistance])

  useEffect(() => {
    if (disabled) return

    const isAtTop = (): boolean => {
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0
      return scrollTop <= 0
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshingRef.current) return
      if (!isAtTop()) return
      startYRef.current = e.touches[0].clientY
      isPullingRef.current = true
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || startYRef.current === null) return
      if (!isAtTop()) {
        isPullingRef.current = false
        startYRef.current = null
        setPullDistance(0)
        return
      }

      const delta = e.touches[0].clientY - startYRef.current
      if (delta <= 0) {
        if (pullDistanceRef.current !== 0) setPullDistance(0)
        return
      }

      setPullDistance(Math.min(maxPull, delta * resistance))

      if (delta > 5 && e.cancelable) {
        e.preventDefault()
      }
    }

    const handleTouchEnd = () => {
      if (!isPullingRef.current) return
      isPullingRef.current = false
      startYRef.current = null

      if (pullDistanceRef.current >= threshold) {
        setIsRefreshing(true)
        setPullDistance(threshold)
        Promise.resolve(onRefreshRef.current())
          .catch(() => {})
          .finally(() => {
            setIsRefreshing(false)
            setPullDistance(0)
          })
      } else {
        setPullDistance(0)
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
    document.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [disabled, threshold, maxPull, resistance])

  return { pullDistance, isRefreshing, threshold }
}
