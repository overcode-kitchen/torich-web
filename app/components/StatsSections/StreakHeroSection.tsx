'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { track } from '@/app/lib/analytics'
import type { LifetimeConsistency } from '@/app/hooks/stats/useLifetimeConsistency'

const ACORN_SRC = '/icons/3d/acorn-1.png'

/**
 * 연속 적립 hero — 기록 탭의 "빠뜨리지 않았나"에 큰 숫자 하나로 답한다.
 *
 * 값은 기간 필터와 무관한 전체 기간 집계(useLifetimeConsistency)다. 필터를 바꿔도 이 숫자가
 * 변하지 않는 것이 이 카드의 전제라, 차트가 쓰는 consistency(기간 종속)를 여기 끌어오지 않는다.
 *
 * 스트릭이 0일 때 0을 크게 띄우면 "못 했다"는 판정이 되므로 안내 문구로 바꿔 단다.
 */
export default function StreakHeroSection({ consistency }: { consistency: LifetimeConsistency }) {
  const { streakMonths, bestStreakMonths, totalPayments, hasHistory } = consistency

  useEffect(() => {
    track('stats_streak_view', { streak_months: streakMonths })
    // 노출 1회만 — 값이 바뀔 때마다 다시 쏘지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="bg-card rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">연속 적립</p>
          {streakMonths > 0 ? (
            <p className="mt-1 text-[32px] font-extrabold leading-none tracking-tight text-foreground tabular-nums">
              {streakMonths}
              <span className="ml-0.5 text-sm font-bold">개월</span>
            </p>
          ) : (
            <p className="mt-1.5 text-base font-bold text-foreground">
              이번 달 첫 적립을 완료해보세요
            </p>
          )}
        </div>
        <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-2xl bg-brand-accent-bg">
          <Image src={ACORN_SRC} alt="" width={30} height={30} className="select-none" priority />
        </div>
      </div>

      {hasHistory && (
        <p className="mt-2 text-xs text-muted-foreground">
          최고 기록 <span className="font-bold text-foreground">{bestStreakMonths}개월</span> · 지금까지{' '}
          <span className="font-bold text-foreground">{totalPayments}번</span> 적립
        </p>
      )}
    </section>
  )
}
