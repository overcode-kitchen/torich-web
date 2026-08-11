'use client'

import { Area, AreaChart, ReferenceDot, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import type { CumulativePoint } from '@/app/utils/cumulative-principal'

const CHART_HEIGHT = 76
const GRADIENT_ID = 'cumulative-principal-fill'

interface CumulativePrincipalChartProps {
  /** 오래된 달 → 이번 달. 2개 이상일 때만 렌더한다(호출측에서 판정) */
  points: CumulativePoint[]
  color: string
  /** 끝점 테두리 — 카드 배경색을 둘러 점이 곡선에서 떨어져 보이게 한다 */
  dotStroke: string
}

/**
 * 월별 누적 원금 곡선.
 *
 * 적립식에서는 원금 자체가 성과다. 수익률을 말하지 않고도 우상향하는 선 하나로 "쌓이고 있다"를
 * 보여주는 것이 이 차트의 전부라, 눈금·격자·값 라벨·툴팁을 두지 않는다. 정확한 금액은 바로 위
 * 큰 숫자가 말하고, 이 곡선은 그 숫자가 어떻게 여기까지 왔는지만 말한다.
 *
 * 축 라벨은 처음과 마지막 달만 둔다. 12개월이 넘으면 달 눈금이 서로 붙어 읽히지 않는다.
 */
export default function CumulativePrincipalChart({
  points,
  color,
  dotStroke,
}: CumulativePrincipalChartProps) {
  const last = points[points.length - 1]

  return (
    <div>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <AreaChart data={points} margin={{ top: 6, right: 6, bottom: 0, left: 6 }}>
          <defs>
            <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" hide />
          {/* 0에서 시작해야 '얼마나 쌓였나'가 과장 없이 읽힌다 */}
          <YAxis hide domain={[0, 'dataMax']} />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${GRADIENT_ID})`}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
          {/* 끝점 = 지금 — 위 큰 숫자와 같은 값이라는 걸 점 하나로 잇는다.
              Area 뒤에 두어 곡선 위에 그려진다(recharts 3부터 isFront가 없다) */}
          <ReferenceDot
            x={last.label}
            y={last.cumulative}
            r={4}
            fill={color}
            stroke={dotStroke}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex justify-between px-1 text-[10px] tabular-nums text-foreground-subtle">
        <span>{points[0].label}</span>
        <span>{last.label}</span>
      </div>
    </div>
  )
}
