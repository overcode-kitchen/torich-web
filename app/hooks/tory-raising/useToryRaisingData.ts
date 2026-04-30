'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toastSuccess } from '@/app/utils/toast'
import {
  calculateToryLevel,
  calculateToryLevelProgress,
  type ToryLevelProgress,
  getTitleForLevel,
} from './useToryRaisingCalculations'

export type ToryOwnedItems = {
  hat: string[]
  glasses: string[]
  outfit: string[]
  prop: string[]
  background: string[]
}

export type ToryEquippedItems = {
  hat: string | null
  glasses: string | null
  outfit: string | null
  prop: string | null
  background: string
}

export type ToryRecentEarning = {
  type: 'attendance' | 'investment' | 'streak' | 'shop_buy' | 'levelup' | 'title_change'
  amount: number
  at: string
}

export type ToryRaisingState = {
  totalAcorns: number
  balance: number
  lastAttendanceDate: string // YYYY-MM-DD
  attendanceStreak: number
  lastToryTabVisit: string // YYYY-MM-DD
  lastInvestmentCompleteDate: string // YYYY-MM-DD
  ownedItems: ToryOwnedItems
  equipped: ToryEquippedItems
  recentEarnings: ToryRecentEarning[]
}

export type ToryRaisingModalPayload = {
  kind: 'growth'
  fromLevel: number
  toLevel: number
  title: {
    emoji: string
    name: string
  }
  nextAppearanceStageLevelsRemaining: number | null
}

export type ToryRaisingActionResult =
  | { ok: true; successMessage?: string; modal?: ToryRaisingModalPayload }
  | { ok: false; errorMessage: string }

const STORAGE_KEY = 'tory-state'

function toYMD(date: Date): string {
  // sv-SE: "YYYY-MM-DD" 형태를 로컬 기준으로 제공
  return date.toLocaleDateString('sv-SE')
}

function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map((x) => Number(x))
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  return toYMD(dt)
}

function safeParseState(raw: string | null): ToryRaisingState | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<ToryRaisingState>
    if (!parsed || typeof parsed !== 'object') return null

    const defaults: ToryRaisingState = getDefaultToryRaisingState()
    return {
      ...defaults,
      ...parsed,
      ownedItems: { ...defaults.ownedItems, ...(parsed.ownedItems ?? {}) },
      equipped: { ...defaults.equipped, ...(parsed.equipped ?? {}) },
      recentEarnings: Array.isArray(parsed.recentEarnings) ? parsed.recentEarnings : defaults.recentEarnings,
    }
  } catch {
    return null
  }
}

function getDefaultToryRaisingState(): ToryRaisingState {
  return {
    totalAcorns: 0,
    balance: 0,
    lastAttendanceDate: '',
    attendanceStreak: 0,
    lastToryTabVisit: '',
    lastInvestmentCompleteDate: '',
    ownedItems: {
      hat: [],
      glasses: [],
      outfit: [],
      prop: [],
      background: [],
    },
    equipped: {
      hat: null,
      glasses: null,
      outfit: null,
      prop: null,
      background: 'default',
    },
    recentEarnings: [],
  }
}

function appendEarning(prev: ToryRaisingState['recentEarnings'], entry: ToryRecentEarning): ToryRaisingState['recentEarnings'] {
  const next = [entry, ...prev]
  return next.slice(0, 12)
}

function computeModalIfLevelChanged(params: {
  beforeTotalAcorns: number
  afterTotalAcorns: number
}): ToryRaisingModalPayload | null {
  const fromLevel = calculateToryLevel(params.beforeTotalAcorns)
  const toLevel = calculateToryLevel(params.afterTotalAcorns)
  if (toLevel <= fromLevel) return null

  const title = getTitleForLevel(toLevel)
  const progress: ToryLevelProgress = calculateToryLevelProgress(params.afterTotalAcorns)
  const nextAppearanceStageLevelsRemaining = progress.nextAppearanceStageLevelsRemaining

  return {
    kind: 'growth',
    fromLevel,
    toLevel,
    title: { emoji: title.emoji, name: title.name },
    nextAppearanceStageLevelsRemaining,
  }
}

export function useToryRaisingData() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [state, setState] = useState<ToryRaisingState>(() => getDefaultToryRaisingState())

  useEffect(() => {
    const stored = safeParseState(localStorage.getItem(STORAGE_KEY))
    if (stored) setState(stored)
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, isHydrated])

  const derivedProgress = useMemo(() => calculateToryLevelProgress(state.totalAcorns), [state.totalAcorns])

  const resetDemo = useCallback(() => {
    const defaults = getDefaultToryRaisingState()
    setState(defaults)
    toastSuccess('토리 키우기 데모 데이터가 초기화됐어요.')
  }, [])

  const claimAttendance = useCallback((): ToryRaisingActionResult => {
    const today = toYMD(new Date())
    if (state.lastAttendanceDate === today) {
      return { ok: false, errorMessage: '오늘은 이미 출석했어요.' }
    }

    const beforeTotal = state.totalAcorns
    const yesterday = addDays(today, -1)

    const nextStreak = state.lastAttendanceDate === yesterday ? state.attendanceStreak + 1 : 1

    const baseEarn = 1
    let bonus = 0
    if (nextStreak % 30 === 0) bonus = 30
    else if (nextStreak % 7 === 0) bonus = 5

    const earned = baseEarn + bonus

    const at = new Date().toISOString()
    setState((prev) => {
      const nextTotal = prev.totalAcorns + earned
      const nextBalance = prev.balance + earned
      return {
        ...prev,
        totalAcorns: nextTotal,
        balance: nextBalance,
        lastAttendanceDate: today,
        attendanceStreak: nextStreak,
        recentEarnings: appendEarning(prev.recentEarnings, { type: 'attendance', amount: earned, at }),
      }
    })

    const modal = computeModalIfLevelChanged({ beforeTotalAcorns: beforeTotal, afterTotalAcorns: beforeTotal + earned })
    return {
      ok: true,
      successMessage: `🌰 +${earned} 출석 도토리${bonus ? ` (연속 ${nextStreak}일 보너스 포함)` : ''}`,
      modal: modal ?? undefined,
    }
  }, [state.attendanceStreak, state.lastAttendanceDate, state.totalAcorns, state.balance])

  const claimToryTabVisit = useCallback((): ToryRaisingActionResult => {
    const today = toYMD(new Date())
    if (state.lastToryTabVisit === today) {
      return { ok: false, errorMessage: '오늘은 이미 토리 탭 방문 보상을 받았어요.' }
    }

    const beforeTotal = state.totalAcorns
    const earned = 1
    const at = new Date().toISOString()

    setState((prev) => ({
      ...prev,
      totalAcorns: prev.totalAcorns + earned,
      balance: prev.balance + earned,
      lastToryTabVisit: today,
      recentEarnings: appendEarning(prev.recentEarnings, { type: 'streak', amount: earned, at }),
    }))

    const modal = computeModalIfLevelChanged({ beforeTotalAcorns: beforeTotal, afterTotalAcorns: beforeTotal + earned })
    return {
      ok: true,
      successMessage: '🌰 +1 토리 탭 방문 도토리',
      modal: modal ?? undefined,
    }
  }, [state.lastToryTabVisit, state.totalAcorns, state.balance])

  const claimInvestmentComplete = useCallback((): ToryRaisingActionResult => {
    const today = toYMD(new Date())
    if (state.lastInvestmentCompleteDate === today) {
      return { ok: false, errorMessage: '오늘은 이미 투자 완료 체크를 했어요.' }
    }

    const beforeTotal = state.totalAcorns
    const earned = 10
    const at = new Date().toISOString()

    setState((prev) => ({
      ...prev,
      totalAcorns: prev.totalAcorns + earned,
      balance: prev.balance + earned,
      lastInvestmentCompleteDate: today,
      recentEarnings: appendEarning(prev.recentEarnings, { type: 'investment', amount: earned, at }),
    }))

    const modal = computeModalIfLevelChanged({ beforeTotalAcorns: beforeTotal, afterTotalAcorns: beforeTotal + earned })
    return {
      ok: true,
      successMessage: '🎉 이번 달 납입 완료! 🌰 +10',
      modal: modal ?? undefined,
    }
  }, [state.lastInvestmentCompleteDate, state.totalAcorns, state.balance])

  const buyItem = useCallback(
    (params: { itemId: string; category: keyof ToryOwnedItems; price: number }): ToryRaisingActionResult => {
      if (state.balance < params.price) {
        return { ok: false, errorMessage: '도토리가 부족해요.' }
      }

      if (state.ownedItems[params.category].includes(params.itemId)) {
        return { ok: false, errorMessage: '이미 가지고 있는 아이템이에요.' }
      }

      setState((prev) => {
        const nextOwned = [...prev.ownedItems[params.category], params.itemId]
        return {
          ...prev,
          balance: prev.balance - params.price,
          equipped:
            params.category === 'background'
              ? {
                  ...prev.equipped,
                  background: params.itemId,
                }
              : prev.equipped,
          ownedItems: {
            ...prev.ownedItems,
            [params.category]: nextOwned,
          },
        }
      })

      // 구매는 totalAcorns를 늘리지 않으므로 모달은 없음(데모 간소화)
      return { ok: true, successMessage: `구매 완료! ${params.itemId}를 얻었어요.` }
    },
    [state.balance, state.ownedItems, state.totalAcorns],
  )

  const equipItem = useCallback(
    (params: { category: keyof ToryEquippedItems; itemId: string | null }): ToryRaisingActionResult => {
      const category = params.category
      const resolvedItemId = category === 'background' ? params.itemId ?? 'default' : params.itemId
      setState((prev) => ({
        ...prev,
        equipped: {
          ...prev.equipped,
          [category]: resolvedItemId,
        },
      }))
      return { ok: true }
    },
    [],
  )

  return {
    isHydrated,
    state,
    progress: derivedProgress,
    resetDemo,
    claimAttendance,
    claimToryTabVisit,
    claimInvestmentComplete,
    buyItem,
    equipItem,
  }
}

