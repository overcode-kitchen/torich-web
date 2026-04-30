'use client'

import {
  calculateToryLevel,
  getTitleForLevel,
} from '@/app/hooks/tory-raising/useToryRaisingCalculations'

export type ToryInvestmentRewardResult = {
  awarded: boolean
  amount: number
  levelBefore: number
  levelAfter: number
  titleAfter: string
}

const STORAGE_KEY = 'tory-state'

type ToryOwnedItems = {
  hat: string[]
  glasses: string[]
  outfit: string[]
  prop: string[]
  background: string[]
}

type ToryEquippedItems = {
  hat: string | null
  glasses: string | null
  outfit: string | null
  prop: string | null
  background: string
}

type ToryRecentEarning = {
  type: 'attendance' | 'investment' | 'streak' | 'shop_buy' | 'levelup' | 'title_change'
  amount: number
  at: string
}

type ToryRaisingState = {
  totalAcorns: number
  balance: number
  lastAttendanceDate: string
  attendanceStreak: number
  lastToryTabVisit: string
  lastInvestmentCompleteDate: string
  ownedItems: ToryOwnedItems
  equipped: ToryEquippedItems
  recentEarnings: ToryRecentEarning[]
}

function getDefaultState() {
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
  } as ToryRaisingState
}

function ymdNow(date = new Date()): string {
  return date.toLocaleDateString('sv-SE')
}

function safeReadState(): ToryRaisingState {
  if (typeof window === 'undefined') return getDefaultState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultState()
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return getDefaultState()
    const p = parsed as Partial<ToryRaisingState>
    if (!parsed || typeof parsed !== 'object') return getDefaultState()
    const defaults = getDefaultState()
    return {
      ...defaults,
      ...p,
      ownedItems: { ...defaults.ownedItems, ...(p.ownedItems ?? {}) },
      equipped: { ...defaults.equipped, ...(p.equipped ?? {}) },
      recentEarnings: Array.isArray(p.recentEarnings) ? (p.recentEarnings as ToryRecentEarning[]) : defaults.recentEarnings,
    }
  } catch {
    return getDefaultState()
  }
}

function safeWriteState(next: ToryRaisingState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function awardToryInvestmentComplete(params: { paymentDateYMD: string; amount?: number }): ToryInvestmentRewardResult {
  const amount = params.amount ?? 10
  const paymentDateYMD = params.paymentDateYMD || ymdNow(new Date())

  const beforeState = safeReadState()
  const levelBefore = calculateToryLevel(beforeState.totalAcorns)

  if (beforeState.lastInvestmentCompleteDate === paymentDateYMD) {
    const levelAfter = calculateToryLevel(beforeState.totalAcorns)
    return {
      awarded: false,
      amount: 0,
      levelBefore,
      levelAfter,
      titleAfter: getTitleForLevel(levelAfter).name,
    }
  }

  const at = new Date().toISOString()

  const nextTotalAcorns = Number(beforeState.totalAcorns ?? 0) + amount
  const nextBalance = Number(beforeState.balance ?? 0) + amount

  const nextState = {
    ...beforeState,
    totalAcorns: nextTotalAcorns,
    balance: nextBalance,
    lastInvestmentCompleteDate: paymentDateYMD,
    recentEarnings: [
      { type: 'investment' as const, amount, at } satisfies ToryRecentEarning,
      ...beforeState.recentEarnings,
    ].slice(0, 12),
  }

  safeWriteState(nextState)

  const levelAfter = calculateToryLevel(nextTotalAcorns)

  return {
    awarded: true,
    amount,
    levelBefore,
    levelAfter,
    titleAfter: getTitleForLevel(levelAfter).name,
  }
}

