// 도토리 물리 엔진 — React·DOM 비의존의 순수 로직. canvas 2D에 "쏟기·쌓임·기울임"을 그린다.
// 스펙(검증된 프로토타입 파라미터): docs/specs/99-acorn-physics-delight.md §8.

const BODY = '#CDA067' // 몸통(탄)
const CAP = '#744F2F' // 캡(브라운)
const STEM = '#5C3E24' // 꼭지

export const GRAVITY = 0.34 // 기본 중력(아래)
export const RADIUS = 6.5 // 도토리 반지름(CSS px)
const PACK = 0.72 // 채움 밀도
const MAX_ACORNS = 64 // 한 칸 도토리 상한(성능 cap)
const DAMPING = 0.99 // 속도 감쇠
const WALL_BOUNCE = -0.3 // 벽 반발
const FLOOR_BOUNCE = -0.18 // 바닥 반발
const FLOOR_FRICTION = 0.88 // 바닥 마찰(수평)
const SETTLE_ENERGY = 0.05 // 이 이하의 운동에너지면 "안정"으로 본다

export interface Acorn {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vr: number
  r: number
}

export interface AcornWorld {
  acorns: Acorn[]
  target: number
  spawned: number
  frame: number
  w: number
  h: number
  seed: number
}

/** 인덱스 기반 의사난수(0~1). seed 고정 → 리렌더·재구성에도 배치가 재현된다. */
export function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/** level%와 칸 넓이로 도토리 목표 개수를 산정한다(packing 0.72, cap 64). */
export function acornTarget(level: number, w: number, h: number): number {
  if (w <= 0 || h <= 0) return 0
  const perAcorn = Math.PI * RADIUS * RADIUS
  return Math.min(MAX_ACORNS, Math.max(2, Math.round((level / 100) * ((w * h) / perAcorn) * PACK)))
}

export function createWorld(level: number, w: number, h: number, seed: number): AcornWorld {
  return { acorns: [], target: acornTarget(level, w, h), spawned: 0, frame: 0, w, h, seed }
}

/** 위(y<0)에서 한 알을 떨어뜨린다. x·회전은 seed로 흩뿌려 칸마다 조금씩 다르게. */
function spawn(world: AcornWorld) {
  const s = world.seed * 131 + world.spawned * 7
  world.acorns.push({
    x: RADIUS + pseudoRandom(s + 1) * Math.max(1, world.w - 2 * RADIUS),
    y: -RADIUS - pseudoRandom(s + 2) * 16,
    vx: (pseudoRandom(s + 3) - 0.5) * 1.4,
    vy: 0,
    rot: (pseudoRandom(s + 4) - 0.5) * 1.4,
    vr: (pseudoRandom(s + 5) - 0.5) * 0.12,
    r: RADIUS,
  })
  world.spawned++
}

/** 물리 한 스텝. gx = 기울기에서 온 수평 중력(-0.5~0.5). */
export function stepWorld(world: AcornWorld, gx: number) {
  const { w, h, acorns } = world
  if (world.spawned < world.target && world.frame % 2 === 0) spawn(world) // 2프레임마다 1알씩 쏟기
  world.frame++

  for (const p of acorns) {
    p.vy += GRAVITY
    p.vx += gx
    p.vx *= DAMPING
    p.vy *= DAMPING
    p.x += p.vx
    p.y += p.vy
    p.rot += p.vr
    p.vr *= 0.96
    if (p.x < p.r) {
      p.x = p.r
      p.vx *= WALL_BOUNCE
    } else if (p.x > w - p.r) {
      p.x = w - p.r
      p.vx *= WALL_BOUNCE
    }
    if (p.y > h - p.r) {
      p.y = h - p.r
      p.vy *= FLOOR_BOUNCE
      p.vx *= FLOOR_FRICTION
    }
  }

  // 원-원 충돌 relaxation 2회 — 겹치면 절반씩 밀어낸다(O(n²), cap 64라 감당 가능).
  for (let pass = 0; pass < 2; pass++) {
    for (let a = 0; a < acorns.length; a++) {
      for (let b = a + 1; b < acorns.length; b++) {
        const pa = acorns[a]
        const pb = acorns[b]
        const dx = pb.x - pa.x
        const dy = pb.y - pa.y
        const min = pa.r + pb.r
        const d2 = dx * dx + dy * dy
        if (d2 < min * min && d2 > 1e-4) {
          const d = Math.sqrt(d2)
          const ov = (min - d) / 2
          const nx = (dx / d) * ov
          const ny = (dy / d) * ov
          pa.x -= nx
          pa.y -= ny
          pb.x += nx
          pb.y += ny
        }
      }
    }
    for (const p of acorns) {
      if (p.x < p.r) p.x = p.r
      else if (p.x > w - p.r) p.x = w - p.r
      if (p.y > h - p.r) p.y = h - p.r
    }
  }
}

/** 모두 쏟아졌고 거의 멈췄으면 true — rAF 정지(배터리) 판단용. */
export function isSettled(world: AcornWorld): boolean {
  if (world.spawned < world.target) return false
  let energy = 0
  for (const p of world.acorns) energy += p.vx * p.vx + p.vy * p.vy
  return energy < SETTLE_ENERGY
}

function drawAcorn(ctx: CanvasRenderingContext2D, p: Acorn) {
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rot)
  ctx.fillStyle = BODY
  ctx.beginPath()
  ctx.ellipse(0, p.r * 0.18, p.r * 0.82, p.r, 0, 0, 6.283)
  ctx.fill()
  ctx.fillStyle = CAP
  ctx.beginPath()
  ctx.ellipse(0, -p.r * 0.5, p.r * 0.92, p.r * 0.5, 0, 0, 6.283)
  ctx.fill()
  ctx.fillStyle = STEM
  ctx.fillRect(-1, -p.r * 1.05, 2, p.r * 0.5)
  ctx.restore()
}

export function drawWorld(ctx: CanvasRenderingContext2D, world: AcornWorld) {
  ctx.clearRect(0, 0, world.w, world.h)
  for (const p of world.acorns) drawAcorn(ctx, p)
}

/** reduce-motion·리사이즈 폴백: rAF 없이 동기로 진행해 최종 쌓임 상태만 만든다. */
export function settleInstantly(world: AcornWorld, steps = 220) {
  for (let i = 0; i < steps; i++) stepWorld(world, 0)
}
