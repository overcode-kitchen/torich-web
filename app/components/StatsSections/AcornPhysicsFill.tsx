'use client'

import { useEffect, useRef, useState } from 'react'
import { AcornStaticFill } from './AcornStaticFill'
import { useTiltGravity } from '@/app/hooks/stats/useTiltGravity'
import {
  createWorld,
  drawWorld,
  isSettled,
  settleInstantly,
  stepWorld,
  type AcornWorld,
} from '@/app/utils/acorn-physics'

type Mode = 'pending' | 'static' | 'physics'

function canUsePhysics(): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false
  if (!document.createElement('canvas').getContext) return false
  const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  return !mq?.matches
}

/**
 * 달성% 도토리 채움 — canvas 물리(쏟기·기울임)로 정적 버전을 감싼 progressive enhancement.
 * 서버·초기 클라 렌더는 null(하이드레이션 안전), 마운트 후 조건에 따라 물리/정적으로 확정한다.
 * props 시그니처 { level, seed }는 정적 AcornFill과 동일하게 유지한다.
 */
export function AcornPhysicsFill({ level, seed }: { level: number; seed: number }) {
  const [mode, setMode] = useState<Mode>('pending')

  useEffect(() => {
    const resolve = () => setMode(canUsePhysics() ? 'physics' : 'static')
    resolve()
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    mq?.addEventListener?.('change', resolve)
    return () => mq?.removeEventListener?.('change', resolve)
  }, [])

  if (mode === 'pending') return null
  if (mode === 'static') return <AcornStaticFill level={level} seed={seed} />
  return <AcornCanvas level={level} seed={seed} />
}

/** 실제 물리 루프. 화면 밖·안정 시 rAF를 멈추고, 기울기가 켜지면 다시 깨어난다. */
function AcornCanvas({ level, seed }: { level: number; seed: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { gxRef, activeRef, onResume } = useTiltGravity()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let world: AcornWorld | null = null
    let raf = 0
    let running = false
    let visible = false
    let settledFrames = 0
    let lastW = 0
    let lastH = 0

    const measure = () => {
      const rect = canvas.getBoundingClientRect()
      const w = Math.max(1, Math.round(rect.width))
      const h = Math.max(1, Math.round(rect.height))
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      lastW = w
      lastH = h
      return { w, h }
    }

    const loop = () => {
      if (!world) return
      stepWorld(world, gxRef.current)
      drawWorld(ctx, world)
      settledFrames = isSettled(world) ? settledFrames + 1 : 0
      // 안정 + 기울기 미사용 → 정지(배터리). 기울기 켜지면 onResume이 다시 깨운다.
      if (settledFrames > 18 && !activeRef.current) {
        running = false
        return
      }
      raf = requestAnimationFrame(loop)
    }

    const start = () => {
      if (running || !visible || !world) return
      running = true
      settledFrames = 0
      raf = requestAnimationFrame(loop)
    }

    const stop = () => {
      running = false
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }

    const { w, h } = measure()
    world = createWorld(level, w, h, seed) // 빈 상태 → 진입 시 위에서 쏟아진다

    let teardownIO = () => {}
    if (typeof IntersectionObserver !== 'undefined') {
      const io = new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? false
          if (visible) start()
          else stop()
        },
        { threshold: 0.1 },
      )
      io.observe(canvas)
      teardownIO = () => io.disconnect()
    } else {
      visible = true
      start()
    }

    let teardownRO = () => {}
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        const rect = canvas.getBoundingClientRect()
        const nw = Math.max(1, Math.round(rect.width))
        const nh = Math.max(1, Math.round(rect.height))
        if (nw === lastW && nh === lastH) return // 최초 발화·무변화 무시(pour 보존)
        measure()
        world = createWorld(level, nw, nh, seed)
        settleInstantly(world) // 리사이즈는 다시 쏟지 않고 즉시 최종 배치
        drawWorld(ctx, world)
        if (visible) start()
      })
      ro.observe(canvas)
      teardownRO = () => ro.disconnect()
    }

    const teardownResume = onResume(start)

    return () => {
      stop()
      teardownIO()
      teardownRO()
      teardownResume()
    }
  }, [level, seed, gxRef, activeRef, onResume])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  )
}
