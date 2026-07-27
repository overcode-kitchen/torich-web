import { pseudoRandom } from '@/app/utils/acorn-physics'

/** 도토리 한 알 (SVG 일러스트 — 캡=브라운, 몸통=탄). */
function Acorn({ size }: { size: number }) {
  return (
    <svg width={size} height={size * 1.08} viewBox="0 0 24 26" aria-hidden="true">
      <rect x="11" y="2" width="2.2" height="3.4" rx="1.1" fill="#5C3E24" />
      <ellipse cx="12" cy="8" rx="8" ry="3.8" fill="#744F2F" />
      <path d="M4.4 8 Q12 27 19.6 8 Z" fill="#CDA067" />
      <ellipse cx="9" cy="13" rx="1.1" ry="1.6" fill="#E0BE8E" opacity="0.7" />
    </svg>
  )
}

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
      size: 12 + pseudoRandom(s + 1) * 4,
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
          <Acorn size={a.size} />
        </span>
      ))}
    </div>
  )
}
