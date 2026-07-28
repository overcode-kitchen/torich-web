'use client'

import Image from 'next/image'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import MaskedAmount from '@/app/components/StatsSections/MaskedAmount'
import { resolvePurposeIcon } from '@/app/constants/goal'
import { shortWon } from '@/app/utils/goal-format'
import type { CompositionSlice } from '@/app/utils/money-composition'

const DONUT_SIZE = 116

interface GoalCompositionSectionProps {
  slices: CompositionSlice[]
  /** 조각 색 — 첫 조각만 브랜드 그린, 나머지는 coolgray 단계 */
  colors: string[]
  /** 조각 사이 구분선(카드 배경색) */
  separator: string
  amountsVisible: boolean
}

/**
 * 목적별 구성 — "어디에 모여 있나".
 *
 * 판정하지 않는다. 한 목적에 쏠려 있는지, 고르게 나뉘어 있는지를 사용자가 스스로 발견하게 하는
 * 정보라 "한 곳에 너무 몰려 있어요" 같은 잔소리 문구를 붙이지 않는다.
 *
 * 합계를 적지 않는 것도 의도다 — 조각 금액은 목적 진척 카드와 같은 기준(currentValue)이라
 * 정산된 예적금의 이자만큼 hero보다 클 수 있다. 이 카드가 말하는 건 비중이지 총액이 아니다.
 */
export default function GoalCompositionSection({
  slices,
  colors,
  separator,
  amountsVisible,
}: GoalCompositionSectionProps) {
  if (slices.length === 0) return null

  const colorAt = (index: number) => colors[index % colors.length]

  return (
    <section className="bg-card rounded-2xl p-5 mb-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground-muted">어디에 모여 있나</h2>

      <div className="flex items-center gap-4">
        {/* outerRadius를 96%로 두는 건 조각 테두리(2px)가 컨테이너에 잘리지 않게 하기 위함이다 */}
        <div className="shrink-0" style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="amount"
                nameKey="label"
                innerRadius="60%"
                outerRadius="96%"
                startAngle={90}
                endAngle={-270}
                stroke={separator}
                strokeWidth={2}
                isAnimationActive={false}
              >
                {slices.map((slice, index) => (
                  <Cell key={slice.key} fill={colorAt(index)} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="flex min-w-0 flex-1 flex-col gap-2">
          {slices.map((slice, index) => {
            // goals.emoji는 3D 아이콘 키('airplane')거나 구버전 이모지('✈️')다.
            // 그대로 찍으면 키가 글자로 새어 나오므로 다른 화면과 같이 아이콘으로 푼다.
            const icon = resolvePurposeIcon(slice.emoji)
            return (
              <li key={slice.key} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: colorAt(index) }}
                  aria-hidden
                />
                <span className="flex min-w-0 items-center gap-1 text-foreground-muted">
                  {icon && (
                    <Image
                      src={icon.src}
                      alt=""
                      width={16}
                      height={16}
                      className="h-4 w-4 shrink-0 object-contain"
                    />
                  )}
                  <span className="truncate">{slice.label}</span>
                </span>
                <span className="ml-auto shrink-0 font-bold tabular-nums text-foreground">
                  {slice.percent}%
                </span>
                <span className="w-[62px] shrink-0 text-right tabular-nums text-muted-foreground">
                  <MaskedAmount visible={amountsVisible}>{shortWon(slice.amount)}</MaskedAmount>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
