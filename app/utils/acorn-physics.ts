// 도토리 물리 엔진 — React·DOM 비의존의 순수 로직. canvas 2D에 "쏟기·쌓임·기울임"을 그린다.
// 출발점 스펙: docs/specs/99-acorn-physics-delight.md (§8 프로토타입).
// 지금 풀이는 그 프로토타입이 아니라 위치 기반(PBD)이고, 중력도 2D 벡터다 — stepWorld 주석 참고.
// 채움 밀도·상한 상수는 눈대중이 아니라 "level%와 실제 더미 높이"를 재서 맞춘 값이다.

const BODY = '#CDA067' // 몸통(탄) — 이미지 로드 전 벡터 폴백용
const CAP = '#744F2F' // 캡(브라운)
const STEM = '#5C3E24' // 꼭지

export const GRAVITY = 0.34 // 중력 가속도의 크기. 방향은 호출측이 정한다(기울기 → 2D 벡터).
export const RADIUS = 6.5 // 도토리 반지름(CSS px)
// 스프라이트(도토리 PNG)를 그릴 한 변 = 반지름 × 이 값.
// PNG는 정사각 프레임에 투명 여백이 있어, 보이는 도토리가 충돌 원(2r)에 얼추 맞게 살짝 키운다.
const SPRITE_SCALE = 2.7
/** 화면에 그리는 도토리 한 변(px) — canvas와 정적 폴백이 같은 크기로 그리도록 내보낸다. */
export const SPRITE_SIZE = RADIUS * SPRITE_SCALE
/** PNG 투명 여백을 뺀, 눈에 보이는 도토리의 반경 — "윗면이 어디냐"를 잴 때 쓴다. */
const SPRITE_RADIUS = (SPRITE_SIZE / 2) * 0.86
// 물리로 쌓았을 때의 실측 채움 밀도. 이론값(육각 0.91)이 아니라 이 엔진이 실제로 만드는 값이라,
// 파라미터를 손대면 scripts 없이 눈으로 맞추지 말고 25/50/75/100%에서 다시 재고 고친다.
const PHYSICS_PACK = 0.86
const ROW_PITCH = 0.86 // 정적 폴백의 행 간격(도토리 지름 대비) — 육각으로 물리게 겹친다
const PHYSICS_HEADROOM = 0.9 // 물리는 반듯하게 안 쌓이므로 이론 정원의 이만큼까지만 넣는다
const MAX_ACORNS = 140 // 한 칸 도토리 상한 — 칸이 아주 커질 때만 걸리는 성능 안전판
const DAMPING = 0.99 // 속도 감쇠
const WALL_BOUNCE = -0.3 // 벽 반발
const FLOOR_BOUNCE = -0.18 // 바닥·천장 반발
const FLOOR_FRICTION = 0.88 // 바닥 마찰(수평)
const BOUNCE_MIN = 1.1 // 이보다 느리게 닿으면 튀지 않고 멈춘다 — 잔진동이 남으면 rAF가 못 쉰다
const TOWER_NUDGE = 0.12 // 수직으로 쌓인 탑을 무너뜨릴 수평 성분(충돌 법선에 섞는 양)
// 충돌 해소 반복 횟수. 한 번에 한 접점씩만 정보가 전달되므로, 여러 층으로 쌓이는 더미는
// 반복이 모자라면 위층 무게에 눌려 높이가 달성%보다 낮아진다.
const RELAX_PASSES = 6
const SETTLE_ENERGY = 0.05 // 이 이하의 운동에너지면 "안정"으로 본다

export interface Acorn {
  x: number
  y: number
  /** 직전 프레임 위치 — 제약을 푼 뒤 "실제로 움직인 양"으로 속도를 다시 만든다(§stepWorld). */
  px: number
  py: number
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
  /** 다 쏟아져 전부 칸 안에 들어왔는가 — 이때부터 천장을 막고 중력 방향을 연다. */
  sealed: boolean
}

/** 인덱스 기반 의사난수(0~1). seed 고정 → 리렌더·재구성에도 배치가 재현된다. */
export function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const clampLevel = (level: number) => Math.max(0, Math.min(100, level))

/**
 * level%가 가리키는 채움 높이(px). 물리 버전과 정적 폴백이 함께 겨냥하는 하나의 기준이다.
 * 두 버전은 쌓는 방식이 달라 개수 공식은 각자 갖지만, 목표 높이는 여기 하나에서 나온다.
 */
export function fillHeight(level: number, h: number): number {
  return (h * clampLevel(level)) / 100
}

/** 한 행에 들어가는 도토리 수 — 정적 폴백의 행 배치와 물리 개수 산정이 같은 값을 쓴다. */
function acornsPerRow(w: number): number {
  return Math.max(1, Math.floor(w / (RADIUS * 2)))
}

/** 칸에 들어가는 행 수 — 100%에서 맨 윗줄이 칸 밖으로 잘려 나가지 않게 하는 상한이다. */
function maxRows(h: number): number {
  return Math.max(1, Math.floor((h - RADIUS * 2) / (RADIUS * 2 * ROW_PITCH)) + 1)
}

/**
 * 채움 높이만큼 물리로 쌓으려면 몇 알이 필요한지(실측 밀도 기준).
 *
 * 상한은 성능이 아니라 **칸에 실제로 들어가는 양**이다. 물리는 육각처럼 반듯하게 쌓이지 않으므로
 * 이론 정원(행×열)에 여유를 두고 자른다. 넘치게 넣으면 도토리가 서로 낀 채 굳어, 한 알이 천장
 * 위로 밀려 sealed가 서지 않고 rAF도 안 멈춘다.
 */
export function acornTarget(level: number, w: number, h: number): number {
  if (w <= 0 || h <= 0) return 0
  const perAcorn = Math.PI * RADIUS * RADIUS
  const n = Math.round((w * fillHeight(level, h) * PHYSICS_PACK) / perAcorn)
  const capacity = Math.round(acornsPerRow(w) * maxRows(h) * PHYSICS_HEADROOM)
  return Math.min(MAX_ACORNS, capacity, n)
}

export function createWorld(level: number, w: number, h: number, seed: number): AcornWorld {
  const target = acornTarget(level, w, h)
  return { acorns: [], target, spawned: 0, frame: 0, w, h, seed, sealed: target === 0 }
}

/**
 * 위(y<0)에서 한 알을 떨어뜨린다. 회전·흔들림은 seed로 흩뿌려 칸마다 조금씩 다르게.
 * 떨어뜨리는 x는 완전 랜덤이 아니라 폭을 나눈 자리를 돌아가며 쓴다 — 한곳에 몰려 봉우리가 서면
 * 같은 개수라도 더미가 실제보다 높게 읽혀 달성%와 어긋난다.
 */
function spawn(world: AcornWorld) {
  const s = world.seed * 131 + world.spawned * 7
  const slots = acornsPerRow(world.w)
  const i = world.spawned % slots
  // 마지막 줄은 대개 자리 수보다 적게 남는다. 그대로 순서대로 쓰면 늘 왼쪽부터 채워져 한쪽만
  // 솟는다 — 남은 알 수만큼 폭을 다시 나눠 고르게 흩는다.
  const left = world.target - Math.floor(world.spawned / slots) * slots
  const inRow = Math.min(slots, left)
  const slot = inRow === slots ? i : Math.floor(((i + 0.5) * slots) / inRow)
  const span = (world.w - 2 * RADIUS) / slots
  const x = RADIUS + span * (slot + 0.5) + (pseudoRandom(s + 1) - 0.5) * span * 0.8
  const y = -RADIUS - pseudoRandom(s + 2) * 16
  world.acorns.push({
    x,
    y,
    px: x,
    py: y,
    vx: (pseudoRandom(s + 3) - 0.5) * 1.4,
    vy: 0,
    rot: (pseudoRandom(s + 4) - 0.5) * 1.4,
    vr: (pseudoRandom(s + 5) - 0.5) * 0.12,
    r: RADIUS,
  })
  world.spawned++
}

/**
 * 벽·바닥·천장 안으로 되돌린다. 되꺾인 만큼은 '직전 위치'를 옮겨 반발·마찰로 남긴다
 * (속도를 직접 만지지 않는 이유는 stepWorld 주석 참고).
 * 천장은 sealed일 때만 — 그 전엔 도토리가 위에서 떨어져 들어오는 통로다.
 */
function confine(p: Acorn, w: number, h: number, sealed: boolean) {
  if (p.x < p.r) {
    const v = p.x - p.px
    p.x = p.r
    p.px = p.x - (v < -BOUNCE_MIN ? v * WALL_BOUNCE : 0)
  } else if (p.x > w - p.r) {
    const v = p.x - p.px
    p.x = w - p.r
    p.px = p.x - (v > BOUNCE_MIN ? v * WALL_BOUNCE : 0)
  }
  if (p.y > h - p.r) {
    const v = p.y - p.py
    p.y = h - p.r
    p.py = p.y - (v > BOUNCE_MIN ? v * FLOOR_BOUNCE : 0)
    p.px = p.x - (p.x - p.px) * FLOOR_FRICTION
  } else if (sealed && p.y < p.r) {
    const v = p.y - p.py
    p.y = p.r
    p.py = p.y - (v < -BOUNCE_MIN ? v * FLOOR_BOUNCE : 0)
    p.px = p.x - (p.x - p.px) * FLOOR_FRICTION
  }
}

/** 겹친 도토리를 절반씩 밀어낸다(위치만). O(n²)이지만 한 칸 수십 알이라 감당 가능. */
function separate(acorns: Acorn[]) {
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
        let ux = dx / d
        const uy = dy / d
        // 거의 수직으로 겹친 쌍은 서로 위아래로만 밀려, 벽 옆에 도토리 탑이 선 채 안 무너진다.
        // 아주 작은 수평 성분을 섞어 넘어뜨린다. 부호는 쌍마다 고정이라 그림은 매번 같다.
        if (ux < TOWER_NUDGE && ux > -TOWER_NUDGE) ux += (a + b) % 2 ? TOWER_NUDGE : -TOWER_NUDGE
        pa.x -= ux * ov
        pa.y -= uy * ov
        pb.x += ux * ov
        pb.y += uy * ov
      }
    }
  }
}

/** 겹침을 푼 뒤에도 칸 밖으로 나가지 않게 위치만 가둔다(반발 없이). */
function clampInside(p: Acorn, w: number, h: number, sealed: boolean) {
  if (p.x < p.r) p.x = p.r
  else if (p.x > w - p.r) p.x = w - p.r
  if (p.y > h - p.r) p.y = h - p.r
  else if (sealed && p.y < p.r) p.y = p.r
}

/**
 * 물리 한 스텝. (gx, gy)는 중력 벡터(캔버스 좌표계, y는 아래가 +).
 * 기본값은 아래 방향이라 기울기를 안 쓰는 호출측은 그대로 두면 된다.
 *
 * 위치 기반(PBD)으로 푼다 — 예측 위치를 만들고, 겹침·경계를 위치로 해소한 뒤,
 * **실제로 움직인 양**을 다시 속도로 삼는다. 속도를 그대로 두고 위치만 되밀면 쌓인 도토리가
 * 매 프레임 중력을 계속 누적해 더미 속으로 파고든다 — 더미가 눌려 높이가 달성%보다 낮아지고,
 * 잔진동이 죽지 않아 rAF도 영영 못 쉰다. 막혀서 못 움직인 만큼 속도도 사라지는 게 요점이다.
 *
 * 도토리는 칸 위(y<0)에서 떨어져 들어오므로 그동안은 천장이 뚫려 있어야 한다.
 * 그래서 다 쏟아져 전부 들어오기(sealed) 전까지는 중력을 아래로 고정한다 —
 * 안 그러면 아직 못 들어온 알이 위로 날아가 영영 사라진다.
 */
export function stepWorld(world: AcornWorld, gx: number, gy: number = GRAVITY) {
  const { w, h, acorns } = world
  if (world.spawned < world.target && world.frame % 2 === 0) {
    // 개수가 많은 칸도 쏟는 시간이 길어지지 않게 한 번에 여러 알을 붓는다
    const per = Math.max(1, Math.ceil(world.target / 50))
    for (let i = 0; i < per && world.spawned < world.target; i++) spawn(world)
  }
  world.frame++

  // 쏟는 동안은 기울기를 통째로 무시하고 곧게 아래로 쏟는다. 수평 성분만 남겨도 도토리가
  // 구석에 비스듬히 쌓여 칸 위로 삐져나가고, 그러면 sealed가 영영 서지 않아 rAF도 안 멈춘다.
  const sealed = world.sealed
  const ax = sealed ? gx : 0
  const ay = sealed ? gy : GRAVITY

  // ① 속도 적분 → 예측 위치. 직전 위치를 남겨 둔다.
  for (const p of acorns) {
    p.vx = (p.vx + ax) * DAMPING
    p.vy = (p.vy + ay) * DAMPING
    p.px = p.x
    p.py = p.y
    p.x += p.vx
    p.y += p.vy
    p.rot += p.vr
    p.vr *= 0.96
    confine(p, w, h, sealed) // 경계 충돌(반발·마찰)은 부딪힌 그 순간 한 번만
  }

  // ② 겹침 해소 — 여러 층 더미는 한 번에 한 접점씩만 정보가 전달돼 반복이 필요하다.
  for (let pass = 0; pass < RELAX_PASSES; pass++) {
    separate(acorns)
    for (const p of acorns) clampInside(p, w, h, sealed)
  }

  // ③ 속도 = 실제 이동량.
  for (const p of acorns) {
    p.vx = p.x - p.px
    p.vy = p.y - p.py
  }

  // 마지막 알까지 칸 안에 들어온 순간부터 천장이 생긴다(그 전엔 스폰 지점이 천장 바깥이다).
  // 기준은 '중심이 칸 안(y ≥ 0)'이다 — 천장선(y ≥ r)까지 요구하면 거의 꽉 찬 칸에서 한 알이
  // 위로 밀린 채 굳어 영영 sealed가 안 되고, 그러면 isSettled도 못 서서 rAF가 안 멈춘다.
  // 그래도 못 서는 경우를 대비해 프레임 상한을 둔다 — 안 서면 배터리를 계속 태운다.
  if (!world.sealed && world.spawned >= world.target) {
    world.sealed = acorns.every((p) => p.y >= 0) || world.frame > world.target * 2 + 300
  }
}

/** 모두 쏟아졌고 거의 멈췄으면 true — rAF 정지(배터리) 판단용. */
export function isSettled(world: AcornWorld): boolean {
  if (world.spawned < world.target || !world.sealed) return false
  let energy = 0
  for (const p of world.acorns) energy += p.vx * p.vx + p.vy * p.vy
  return energy < SETTLE_ENERGY
}

/**
 * 정적 폴백 배치 — 물리 없이 바닥부터 행 단위로 쌓아 올린다.
 *
 * 흩뿌리면 "43% 찼다"가 아니라 "듬성듬성한 점"으로 읽힌다. 물리 버전과 같은 fillHeight를
 * 겨냥해 맨 윗줄의 **보이는 윗면**이 정확히 그 높이에 오도록 행 간격을 조금 늘였다 줄인다
 * (행 수만 반올림하면 한 행 ≈ 9%씩 계단이 생겨 43%와 50%가 같은 그림이 된다).
 */
export function stackedAcorns(
  level: number,
  w: number,
  h: number,
  seed: number,
): Array<{ x: number; y: number; rot: number }> {
  if (w <= 0 || h <= 0) return []
  const d = RADIUS * 2
  const perRow = acornsPerRow(w)
  const fill = fillHeight(level, h)
  if (fill <= 0) return []

  const bottom = h - RADIUS // 맨 아랫줄 중심
  const top = Math.max(SPRITE_RADIUS, h - fill + SPRITE_RADIUS) // 맨 윗줄 중심(윗면이 fill에 닿게)
  const span = Math.max(0, bottom - top)
  const rows = Math.min(maxRows(h), Math.max(1, Math.round(span / (d * ROW_PITCH)) + 1))
  // 행이 하나면 간격이 필요 없고, 여럿이면 남은 높이를 고르게 나눈다(너무 벌어지지 않게 상한)
  const rowH = rows > 1 ? Math.min(d * 0.95, span / (rows - 1)) : 0

  const out: Array<{ x: number; y: number; rot: number }> = []
  for (let row = 0; row < rows; row++) {
    // 맨 위 행은 듬성하게 얹어 윗면이 칼로 자른 듯 반듯해지지 않게 한다.
    // 두 줄뿐일 땐 그대로 채운다 — 절반이 비면 더미가 실제보다 낮아 보인다.
    const inRow = row === rows - 1 && rows > 2 ? Math.max(1, Math.round(perRow * 0.7)) : perRow
    const step = w / inRow
    for (let col = 0; col < inRow; col++) {
      const s = seed * 131 + (row * perRow + col) * 7
      const x = Math.max(
        RADIUS,
        Math.min(w - RADIUS, step * (col + 0.5) + (pseudoRandom(s + 1) - 0.5) * step * 0.4),
      )
      out.push({
        x,
        y: bottom - row * rowH,
        rot: (pseudoRandom(s + 3) - 0.5) * 1.2,
      })
    }
  }
  return out
}

/** 이미지 로드 전 벡터 폴백 — 캡+몸통+꼭지 3파트. */
function drawAcornVector(ctx: CanvasRenderingContext2D, p: Acorn) {
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

/** 도토리 PNG 스프라이트를 회전·중앙 정렬해 그린다. */
function drawAcornSprite(ctx: CanvasRenderingContext2D, p: Acorn, sprite: CanvasImageSource) {
  const d = p.r * SPRITE_SCALE
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rot)
  ctx.drawImage(sprite, -d / 2, -d / 2, d, d)
  ctx.restore()
}

function spriteReady(sprite: HTMLImageElement | null): sprite is HTMLImageElement {
  return !!sprite && sprite.complete && sprite.naturalWidth > 0
}

/** sprite(도토리 PNG)가 준비됐으면 이미지로, 아니면 벡터로 그린다. */
export function drawWorld(
  ctx: CanvasRenderingContext2D,
  world: AcornWorld,
  sprite: HTMLImageElement | null = null,
) {
  ctx.clearRect(0, 0, world.w, world.h)
  const ready = spriteReady(sprite)
  for (const p of world.acorns) {
    if (ready) drawAcornSprite(ctx, p, sprite)
    else drawAcornVector(ctx, p)
  }
}

/** 리사이즈 폴백: rAF 없이 동기로 진행해 최종 쌓임 상태만 만든다. */
export function settleInstantly(world: AcornWorld, maxSteps = 900) {
  for (let i = 0; i < maxSteps; i++) {
    stepWorld(world, 0, GRAVITY)
    if (isSettled(world)) break
  }
}
