import Image from 'next/image'
import { pseudoRandom } from '@/app/utils/acorn-physics'

const ACORN_SRC = '/icons/3d/acorn-1.png'

/**
 * 달성률을 도토리 더미로 시각화하는 정적 폴백 — 물리(pour/기울임) 없이 seed로 흩뿌린다.
 * prefers-reduced-motion·canvas 미지원·저성능일 때 물리 버전 대신 렌더한다.
 * 배치는 seed(목적 인덱스)+i로 고정해 리렌더에도 흔들리지 않는다.
 */
export function AcornStaticFill({ level, seed }: { level: number; seed: number }) {
  const count = Math.min(46, Math.max(2, Math.round(level * 0.5) + 2))
  const fillTop = Math.max(6, level) // 도토리가 흩어질 세로 상한(%)
  const acorns = Array.from({ length: count }, (_, i) => {
    const s = seed * 131 + i * 7
    return {
      key: i,
      size: Math.round(14 + pseudoRandom(s + 1) * 5),
      left: 3 + pseudoRandom(s + 2) * 82,
      bottom: pseudoRandom(s + 3) * fillTop,
      rot: -30 + pseudoRandom(s + 4) * 60,
    }
  })
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {acorns.map((a) => (
        <span
          key={a.key}
          className="absolute"
          style={{ left: `${a.left}%`, bottom: `${a.bottom}%`, transform: `rotate(${a.rot}deg)` }}
        >
          <Image src={ACORN_SRC} alt="" width={a.size} height={a.size} className="select-none" />
        </span>
      ))}
    </div>
  )
}
