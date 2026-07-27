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

interface TiltContextValue {
  /** DeviceOrientationEvent 존재 여부 — 옵트인 버튼 노출 판단용. */
  supported: boolean
  status: TiltStatus
  enabled: boolean
  /** 현재 수평 중력(-0.5~0.5). 기울기 off면 0. canvas 루프가 매 프레임 읽는다. */
  gxRef: MutableRefObject<number>
  /** 센서 구독 중인지 — 안정돼도 루프를 멈추지 않게 하는 신호. */
  activeRef: MutableRefObject<boolean>
  /** 사용자 제스처(탭) 안에서 호출 — iOS 권한 요청 후 구독 토글. */
  toggle: () => void
  /** 기울기가 켜지면 정지해 있던 canvas를 깨운다. 해제 함수를 돌려준다. */
  onResume: (cb: () => void) => () => void
}

const TiltContext = createContext<TiltContextValue | null>(null)

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/** gamma(진입 기준 상대각, deg) → 수평 중력. */
function gammaToGx(relDeg: number): number {
  return clamp(Math.sin((relDeg * Math.PI) / 180) * 0.55, -0.5, 0.5)
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
  const gxRef = useRef(0)
  const activeRef = useRef(false)
  const baseRef = useRef<number | null>(null) // 진입 시점 기준 각(상대각 계산용)
  const pendingRef = useRef(false)
  const resumeCbs = useRef<Set<() => void>>(new Set())
  const [status, setStatus] = useState<TiltStatus>('idle')
  const supported = useSyncExternalStore(noopSubscribe, getSupported, getSupportedServer)

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (e.gamma == null) return
    if (baseRef.current == null) baseRef.current = e.gamma
    const target = gammaToGx(e.gamma - baseRef.current)
    gxRef.current = gxRef.current * 0.85 + target * 0.15 // 저역통과(떨림 억제)
  }, [])

  const enable = useCallback(() => {
    baseRef.current = null
    window.addEventListener('deviceorientation', handleOrientation, true)
    activeRef.current = true
    setStatus('enabled')
    resumeCbs.current.forEach((cb) => cb())
  }, [handleOrientation])

  const disable = useCallback(() => {
    window.removeEventListener('deviceorientation', handleOrientation, true)
    activeRef.current = false
    gxRef.current = 0
    baseRef.current = null
    setStatus('idle')
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
    () => ({ supported, status, enabled: status === 'enabled', gxRef, activeRef, toggle, onResume }),
    [supported, status, toggle, onResume],
  )

  return <TiltContext.Provider value={value}>{children}</TiltContext.Provider>
}

export function useTiltGravity(): TiltContextValue {
  const ctx = useContext(TiltContext)
  if (!ctx) throw new Error('useTiltGravity must be used within TiltProvider')
  return ctx
}
