'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { SPRITE_SIZE, stackedAcorns } from '@/app/utils/acorn-physics'

const ACORN_SRC = '/icons/3d/acorn-1.png'
const DRAW = Math.round(SPRITE_SIZE) // canvas가 그리는 크기와 같게 — 두 버전의 도토리가 같은 크기로 보이게

/**
 * 달성률을 도토리 더미로 시각화하는 정적 폴백 — 물리(pour/기울임) 없이 바닥부터 쌓아 그린다.
 * prefers-reduced-motion·canvas 미지원일 때 물리 버전 대신 렌더한다.
 *
 * 배치는 물리 버전과 같은 stackedAcorns가 정하므로 두 버전의 더미 높이가 같게 읽힌다.
 * (예전엔 0~level% 구간에 균등하게 흩뿌려, 43%여도 "듬성듬성한 점"으로만 보였다.)
 * 쌓는 높이는 칸의 실제 픽셀 크기에서 나오므로 %가 아니라 측정값이 필요하다.
 */
export function AcornStaticFill({ level, seed }: { level: number; seed: number }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const read = () => {
      const r = el.getBoundingClientRect()
      const w = Math.round(r.width)
      const h = Math.round(r.height)
      setBox((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }))
    }
    read()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const acorns = box ? stackedAcorns(level, box.w, box.h, seed) : []

  return (
    <div
      ref={boxRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {acorns.map((a, i) => (
        <Image
          key={i}
          src={ACORN_SRC}
          alt=""
          width={DRAW}
          height={DRAW}
          className="absolute max-w-none select-none"
          style={{
            left: a.x - DRAW / 2,
            top: a.y - DRAW / 2,
            transform: `rotate(${a.rot}rad)`,
          }}
        />
      ))}
    </div>
  )
}
