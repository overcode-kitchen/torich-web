'use client'

import { useMemo } from 'react'
import { useTheme } from '@/app/components/ThemeSections/ThemeProvider'

/**
 * 조각 색 순서 — 첫 조각(가장 큰 목적)만 브랜드 그린, 나머지는 coolgray 단계.
 * 통계 화면은 coolgray 위계가 원칙이고 브랜드 그린은 탭당 1~2곳만 쓴다 (docs/design-system.md).
 * 라이트에서는 진한 회색 → 옅은 회색, 다크에서는 밝은 회색 → 어두운 회색 순으로 벌어지는 토큰들이라
 * 두 모드 모두 인접 조각이 붙지 않는다.
 */
const SLICE_TOKENS = [
  '--primary',
  '--foreground-muted',
  '--foreground-subtle',
  '--surface-strong',
  '--border-subtle',
] as const

/**
 * getComputedStyle을 쓸 수 없는 서버·초기 렌더용 폴백.
 * hex를 임의로 고르지 않고 globals.css의 같은 토큰 값을 그대로 적어 "설명 가능한 값"만 둔다.
 */
const FALLBACK_SLICES = [
  'hsl(140, 98%, 35%)', // --palette-brand-600
  'hsl(228, 5%, 41%)', // --palette-coolgray-600
  'hsl(228, 5%, 54%)', // --palette-coolgray-400
  'hsl(220, 5%, 73%)', // --palette-coolgray-200
  'hsl(220, 5%, 81%)', // --palette-coolgray-100
]
const FALLBACK_CARD = 'hsl(0, 0%, 100%)' // --palette-white

export interface MoneyChartColors {
  /** 누적 곡선 선·그라데이션 색 */
  curve: string
  /** 도넛 조각 색 (SLICE_TOKENS 순서) */
  slices: string[]
  /** 조각 사이 구분선·끝점 테두리 — 카드 배경색이라 배경에 녹아 틈처럼 보인다 */
  separator: string
}

/**
 * 곡선·도넛 색을 globals.css 토큰에서 읽는다. hex 하드코딩 금지 (docs/design-system.md).
 *
 * resolvedTheme을 의존성으로 둬야 라이트↔다크를 바꿀 때 값을 다시 읽는다. ThemeProvider가
 * `.dark` 클래스를 토글한 뒤 같은 이펙트에서 resolvedTheme을 갱신하므로, 이 memo가 다시 돌 때는
 * 문서에 새 테마가 이미 반영돼 있다.
 */
export function useMoneyChartColors(): MoneyChartColors {
  const { resolvedTheme } = useTheme()

  return useMemo(() => {
    if (typeof window === 'undefined') {
      return { curve: FALLBACK_SLICES[0], slices: FALLBACK_SLICES, separator: FALLBACK_CARD }
    }

    const root = getComputedStyle(document.documentElement)
    const read = (token: string, fallback: string) =>
      root.getPropertyValue(token).trim() || fallback

    const slices = SLICE_TOKENS.map((token, index) => read(token, FALLBACK_SLICES[index]))
    return {
      curve: slices[0],
      slices,
      separator: read('--card', FALLBACK_CARD),
    }
    // resolvedTheme은 memo 안에서 쓰이지 않지만, 값이 아니라 '문서의 테마가 바뀌었다'는 신호로
    // 넣은 의도적인 의존성이다. 빼면 라이트↔다크 전환 후에도 이전 테마 색이 그대로 남는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme])
}
