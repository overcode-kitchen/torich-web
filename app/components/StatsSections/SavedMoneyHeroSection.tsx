'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { track } from '@/app/lib/analytics'
import CumulativePrincipalChart from '@/app/components/StatsSections/CumulativePrincipalChart'
import MaskedAmount from '@/app/components/StatsSections/MaskedAmount'
import type { CumulativePrincipal } from '@/app/utils/cumulative-principal'

/** 점 2개는 있어야 선이 된다 — 첫 달만 있으면 곡선 대신 큰 숫자만 둔다 */
const MIN_POINTS_FOR_CURVE = 2

interface SavedMoneyHeroSectionProps {
  totalPaidPrincipal: number
  totalMonthlyPayment: number
  cumulative: CumulativePrincipal
  curveColor: string
  dotStroke: string
  amountsVisible: boolean
  canToggleAmounts: boolean
  onToggleAmounts: () => void
  onShowContribution: () => void
}

/**
 * 모은 돈 hero — "얼마 모였나"에 큰 숫자 하나와 우상향 곡선으로 답한다.
 *
 * 이름을 '자산'으로 두지 않는다(#115). 우리가 아는 건 토리치에 직접 입력하고 직접 체크한 것뿐이라
 * '자산'이라 부르면 금융앱에서 보는 값과 계속 어긋난다.
 *
 * 금액 가리기가 켜져 있어도 곡선과 적립 횟수는 그대로 둔다 — 가리는 대상은 금액이지 성취가 아니다.
 */
export default function SavedMoneyHeroSection({
  totalPaidPrincipal,
  totalMonthlyPayment,
  cumulative,
  curveColor,
  dotStroke,
  amountsVisible,
  canToggleAmounts,
  onToggleAmounts,
  onShowContribution,
}: SavedMoneyHeroSectionProps) {
  const { points, paymentCount, monthSpan } = cumulative

  useEffect(() => {
    track('stats_money_view', { month_span: monthSpan, payment_count: paymentCount })
    // 노출 1회만 — 값이 바뀔 때마다 다시 쏘지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 서브라인 한 줄. 가려진 동안엔 금액 조각만 빼고 "얼마나 오래·몇 번"은 그대로 남긴다.
  const monthlyPart =
    amountsVisible && totalMonthlyPayment > 0 ? `월 ${formatCurrency(totalMonthlyPayment)}씩 · ` : ''
  const subline =
    paymentCount > 0
      ? `${monthlyPart}${monthSpan}개월 동안 ${paymentCount}번 넣어 쌓인 원금이에요`
      : '토리치를 통해 차곡차곡 모으신 금액이에요'

  return (
    <section className="bg-card rounded-2xl p-5 mb-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Image
            src="/icons/3d/coin-stack.png"
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 shrink-0"
            aria-hidden
          />
          <h2 className="text-sm font-semibold text-foreground-muted">지금까지 모은 돈</h2>
        </div>
        {canToggleAmounts && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onToggleAmounts}
            className="h-auto px-2 py-1 text-muted-foreground hover:bg-secondary hover:text-foreground-soft"
          >
            {amountsVisible ? '가리기' : '보기'}
          </Button>
        )}
      </div>

      <MaskedAmount visible={amountsVisible} variant="coins">
        <p className="text-[28px] font-extrabold leading-none tracking-tight text-foreground tabular-nums">
          {formatCurrency(totalPaidPrincipal)}
        </p>
      </MaskedAmount>

      {points.length >= MIN_POINTS_FOR_CURVE && (
        <div className="mt-3">
          <CumulativePrincipalChart points={points} color={curveColor} dotStroke={dotStroke} />
        </div>
      )}

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{subline}</p>

      {totalMonthlyPayment > 0 && (
        <button
          onClick={onShowContribution}
          className="mt-3 inline-flex items-center rounded-full border border-border-subtle bg-muted/30 px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground-muted dark:border-border dark:bg-muted-darker dark:font-semibold dark:text-foreground-soft dark:hover:bg-muted-darker dark:hover:text-foreground-soft dark:hover:brightness-95"
        >
          이번 달 내역 보기
        </button>
      )}
    </section>
  )
}
