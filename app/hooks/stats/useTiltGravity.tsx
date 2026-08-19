'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MutableRefObject,
  type ReactNode,
} from 'react'

export type TiltStatus = 'idle' | 'enabled' | 'denied' | 'unsupported'

/** 중력 방향(캔버스 좌표계, y는 아래가 +). 크기는 1 이하 — 화면이 수평이면 0에 가깝다. */
export interface GravityVector {
  x: number
  y: number
}

interface TiltContextValue {
  /** DeviceOrientationEvent 존재 여부 — 옵트인 버튼 노출 판단용. */
  supported: boolean
  status: TiltStatus
  enabled: boolean
  /** 현재 중력 방향. 기울기 off면 (0, 1) = 아래. canvas 루프가 매 프레임 읽는다. */
  gravityRef: MutableRefObject<GravityVector>
  /** 센서 구독 중인지 — 안정돼도 루프를 멈추지 않게 하는 신호. */
  activeRef: MutableRefObject<boolean>
  /** 사용자 제스처(탭) 안에서 호출 — iOS 권한 요청 후 구독 토글. */
  toggle: () => void
  /** 기울기가 켜지거나 꺼지면 정지해 있던 canvas를 깨운다. 해제 함수를 돌려준다. */
  onResume: (cb: () => void) => () => void
}

const TiltContext = createContext<TiltContextValue | null>(null)

const DOWN: GravityVector = { x: 0, y: 1 }

/**
 * beta(앞뒤)·gamma(좌우)로 중력이 화면 안에서 어느 쪽인지 구한다.
 *
 * 지구 좌표의 아래(0,0,-1)를 기기 좌표로 되돌리면 (sinγ·cosβ, -sinβ, -cosγ·cosβ)이고,
 * 화면은 y가 아래로 커지므로 화면 안 중력은 **(sinγ·cosβ, sinβ)**가 된다.
 * gamma만 읽으면 앞뒤로 뒤집혔는지 알 수 없어, 거꾸로 들어도 아래로만 쏠린다.
 *
 * 길이를 1로 정규화하지 않는 것도 의도다 — 기기를 눕히면 화면 안 중력 성분이 실제로 0에 가까워지고,
 * 도토리도 그대로 멈춘다(바닥에 내려놓은 그릇처럼).
 */
function screenGravity(beta: number, gamma: number, angle: number): GravityVector {
  const b = (beta * Math.PI) / 180
  const g = (gamma * Math.PI) / 180
  const x = Math.sin(g) * Math.cos(b)
  const y = Math.sin(b)
  if (!angle) return { x, y }
  // 화면이 돌아가 있으면(가로 모드) 기기 축과 화면 축이 어긋난다 — 그 각도만큼 되돌린다.
  // iPhone은 세로 고정이라 항상 0이지만, iPad·웹은 가로가 열려 있다.
  const a = (angle * Math.PI) / 180
  const c = Math.cos(a)
  const s = Math.sin(a)
  return { x: x * c + y * s, y: -x * s + y * c }
}

function screenAngle(): number {
  if (typeof window === 'undefined') return 0
  return window.screen?.orientation?.angle ?? 0
}

// DeviceOrientationEvent 지원 여부는 클라이언트에서만 알 수 있다.
// useSyncExternalStore로 서버=false, 클라=실제값을 하이드레이션 불일치 없이 읽는다.
const noopSubscribe = () => () => {}
const getSupported = () => typeof window !== 'undefined' && 'DeviceOrientationEvent' in window
const getSupportedServer = () => false

// iOS 13+ 전용 권한 API — 표준 lib.dom엔 없어 좁혀 쓴다.
type OrientationCtor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

export function TiltProvider({ children }: { children: ReactNode }) {
  const gravityRef = useRef<GravityVector>({ ...DOWN })
  const activeRef = useRef(false)
  const pendingRef = useRef(false)
  const resumeCbs = useRef<Set<() => void>>(new Set())
  const [status, setStatus] = useState<TiltStatus>('idle')
  const supported = useSyncExternalStore(noopSubscribe, getSupported, getSupportedServer)

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (e.beta == null || e.gamma == null) return
    const target = screenGravity(e.beta, e.gamma, screenAngle())
    const cur = gravityRef.current
    // 저역통과(떨림 억제) — 방향 두 성분에 똑같이 걸어야 벡터가 튀지 않는다
    cur.x = cur.x * 0.85 + target.x * 0.15
    cur.y = cur.y * 0.85 + target.y * 0.15
  }, [])

  const wake = () => resumeCbs.current.forEach((cb) => cb())

  const enable = useCallback(() => {
    window.addEventListener('deviceorientation', handleOrientation, true)
    activeRef.current = true
    setStatus('enabled')
    wake()
  }, [handleOrientation])

  const disable = useCallback(() => {
    window.removeEventListener('deviceorientation', handleOrientation, true)
    activeRef.current = false
    gravityRef.current = { ...DOWN }
    setStatus('idle')
    wake() // 중력이 아래로 돌아왔으니, 천장·벽에 붙어 있던 도토리를 다시 떨어뜨려야 한다
  }, [handleOrientation])

  const toggle = useCallback(() => {
    if (activeRef.current) {
      disable()
      return
    }
    if (pendingRef.current) return
    const ctor = window.DeviceOrientationEvent as OrientationCtor | undefined
    if (!ctor) {
      setStatus('unsupported')
      return
    }
    if (typeof ctor.requestPermission === 'function') {
      pendingRef.current = true
      ctor
        .requestPermission()
        .then((res) => {
          pendingRef.current = false
          if (res === 'granted') enable()
          else setStatus('denied')
        })
        .catch(() => {
          pendingRef.current = false
          setStatus('denied')
        })
    } else {
      enable() // Android·데스크톱: 권한 없이 바로 구독
    }
  }, [enable, disable])

  useEffect(
    () => () => {
      window.removeEventListener('deviceorientation', handleOrientation, true)
    },
    [handleOrientation],
  )

  const onResume = useCallback((cb: () => void) => {
    const set = resumeCbs.current
    set.add(cb)
    return () => {
      set.delete(cb)
    }
  }, [])

  const value = useMemo<TiltContextValue>(
    () => ({
      supported,
      status,
      enabled: status === 'enabled',
      gravityRef,
      activeRef,
      toggle,
      onResume,
    }),
    [supported, status, toggle, onResume],
  )

  return <TiltContext.Provider value={value}>{children}</TiltContext.Provider>
}

export function useTiltGravity(): TiltContextValue {
  const ctx = useContext(TiltContext)
  if (!ctx) throw new Error('useTiltGravity must be used within TiltProvider')
  return ctx
}
