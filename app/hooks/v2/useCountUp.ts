'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * 목표값까지 숫자가 올라가는 것을 보여준다.
 *
 * 브리프 §11의 "카운터는 절대 줄지 않는다"를 지키려고 올라가는 방향만 굴린다 —
 * 값이 내려갈 때는 애니메이션 없이 바로 앉힌다(항목을 내렸을 때).
 */
export function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)

  useEffect(() => {
    const from = fromRef.current
    fromRef.current = target
    if (from === target) return

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || target < from) {
      setValue(target)
      return
    }

    let raf = 0
    const start = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(from + (target - from) * eased))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return value
}
