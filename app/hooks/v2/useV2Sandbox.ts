'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * v2 메인 플로우 프로토타입의 상태.
 *
 * **DB를 쓰지 않는다.** 스키마 변경 4건은 Phase 2.5(9/1~9/6) 범위이고,
 * 이 화면들은 그전에 흐름만 확인하려는 것이라 브라우저 안에만 저장한다.
 * v2가 정식 화면이 되면 이 훅의 store를 Supabase 조회로 갈아끼운다.
 *
 * localStorage는 React 바깥의 저장소라 useSyncExternalStore로 붙인다.
 * 그래야 서버 렌더와 첫 클라이언트 렌더가 같고(하이드레이션 불일치 없음),
 * /v2와 /v2/add처럼 서로 다른 화면이 같은 값을 본다.
 */

export const V2_GOAL_AMOUNT = 100_000_000

export interface V2Item {
  id: string
  name: string
  amount: number
  /** 납입일이 지나 자동으로 채워진 상태. 사용자는 틀렸을 때만 내린다. */
  filled: boolean
}

export interface V2SandboxState {
  onboarded: boolean
  startBalance: number
  monthlyPlan: number
  payday: number
  items: V2Item[]
}

const STORAGE_KEY = 'torich-v2-sandbox'

const INITIAL: V2SandboxState = {
  onboarded: false,
  startBalance: 0,
  monthlyPlan: 0,
  payday: 25,
  items: [],
}

type Snapshot = V2SandboxState & { ready: boolean }

/** 서버·하이드레이션 시점의 고정 스냅샷. 절대 바꾸지 않는다. */
const SERVER_SNAPSHOT: Snapshot = { ...INITIAL, ready: false }

let snapshot: Snapshot = SERVER_SNAPSHOT
let hydrated = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function hydrate() {
  hydrated = true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    snapshot = { ...INITIAL, ...(raw ? JSON.parse(raw) : null), ready: true }
  } catch {
    snapshot = { ...INITIAL, ready: true }
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!hydrated) {
    hydrate()
    queueMicrotask(emit)
  }
  return () => {
    listeners.delete(listener)
  }
}

/** 스냅샷에서 저장 대상(ready 제외)만 떼어낸다. */
function currentState(): V2SandboxState {
  const { onboarded, startBalance, monthlyPlan, payday, items } = snapshot
  return { onboarded, startBalance, monthlyPlan, payday, items }
}

function update(patch: (state: V2SandboxState) => V2SandboxState) {
  const next = patch(currentState())
  snapshot = { ...next, ready: true }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 저장 실패는 프로토타입 동작을 막지 않는다(사파리 프라이빗 모드 등).
  }
  emit()
}

export function useV2Sandbox() {
  const state = useSyncExternalStore(subscribe, () => snapshot, () => SERVER_SNAPSHOT)

  const completeOnboarding = useCallback(
    (next: { startBalance: number; monthlyPlan: number; payday: number }) =>
      update((s) => ({ ...s, ...next, onboarded: true })),
    [],
  )

  const addItem = useCallback(
    (name: string, amount: number) =>
      update((s) => ({
        ...s,
        items: [...s.items, { id: `${Date.now()}`, name, amount, filled: true }],
      })),
    [],
  )

  const toggleFilled = useCallback(
    (id: string) =>
      update((s) => ({
        ...s,
        items: s.items.map((it) => (it.id === id ? { ...it, filled: !it.filled } : it)),
      })),
    [],
  )

  const reset = useCallback(() => update(() => INITIAL), [])

  const filled = state.items.reduce((sum, it) => (it.filled ? sum + it.amount : sum), 0)
  const committed = state.items.reduce((sum, it) => sum + it.amount, 0)
  const total = state.startBalance + filled
  // 계획을 건너뛴 사람은 항목 합계가 곧 계획이다(브리프 §4).
  const plan = state.monthlyPlan || committed

  return {
    ...state,
    filled,
    committed,
    total,
    plan,
    remaining: Math.max(0, plan - filled),
    progress: Math.min(100, (total / V2_GOAL_AMOUNT) * 100),
    allFilled: state.items.length > 0 && state.items.every((it) => it.filled),
    completeOnboarding,
    addItem,
    toggleFilled,
    reset,
  }
}
