'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList } from 'recharts'
import type { DateRange } from 'react-day-picker'
import type { PeriodPreset } from '@/app/hooks/stats/usePeriodFilter'
import type { ConsistencyInsight } from '@/app/hooks/chart/useChartData'
import {
  WOOD_CANVAS_AR,
  WOOD_CORE_FRAC,
  WOOD_PLAIN,
  WOOD_DECORATED,
} from '@/app/constants/wood-bar'

// ── 통나무 막대(모듈 쌓기) ────────────────────────────────────────────────
// 부품(모듈)을 아래에서부터 세로로 쌓아 긴 통나무를 만들고, rate(%) 높이에서
// 윗부분을 잘라 정확한 수치를 표현한다. 이미지를 '늘리지' 않고 '잘라 보여서' 결이
// 망가지지 않는다. 부품 파일과 실측 비율은 app/constants/wood-bar.ts가 관리한다.

// 막대별 부품 배치는 index로 '고정'한다(랜덤 금지 — 다시 그릴 때 모양이 바뀌면 어지럽다).
// 맨 아래는 항상 민무늬, 위로 갈수록 가지·옹이를 가끔 섞어 조합마다 다르게 보이게.
// 부품은 파일 그대로만 쓴다 — 반전해 붙이면 광원·결 방향이 어긋나 어색해진다.
function woodSequence(index: number, count: number): string[] {
  let h = (index * 2654435761 + 40503) >>> 0
  const next = () => ((h = (h * 1103515245 + 12345) >>> 0), h % 100)
  const seq: string[] = []
  // 바닥(0)만 민무늬로 고정한다 — 축에 닿는 면이라 여기서 가지가 튀어나오면 떠 보인다.
  //
  // 위에서 잘리는 칸(count-2)까지 민무늬로 묶지 않는다. 막대가 낮을 때 완전히 보이는 칸이
  // 한둘뿐이라, 두 칸을 다 고정하면 옹이·가지가 한 번도 나오지 못하고 민무늬만 쌓인다.
  // 잘린 칸의 장식은 반쯤 보이지만, 통나무를 잘라 놓은 것처럼 읽혀 어색하지 않다.
  // 마디 수와 장식 칸 수는 둘 다 '막대 높이 ÷ 칸 높이'라 높이로는 맞바꿀 수 없다.
  // 이 규칙이 마디를 늘리지 않고 장식만 늘리는 유일한 손잡이다.
  //
  // 직전 칸과 같은 부품이 연달아 오면 복제한 티가 나므로 한 칸 기억해 두고 피한다.
  let prev: string | null = null
  for (let i = 0; i < count; i++) {
    if (i === 0) {
      seq.push(WOOD_PLAIN)
      prev = WOOD_PLAIN
      continue
    }
    // 4칸 중 1칸꼴로 민무늬를 섞어 장식이 빽빽해지지 않게 한다.
    if (next() < 26) {
      seq.push(WOOD_PLAIN)
      prev = WOOD_PLAIN
      continue
    }
    // 직전과 다른 부품만 후보로 남긴다(후보가 3종이라 항상 하나 이상 남는다).
    const candidates = WOOD_DECORATED.filter((src) => src !== prev)
    const src = candidates[next() % candidates.length]
    seq.push(src)
    prev = src
  }
  return seq
}

interface WoodBarShapeProps {
  x?: number
  y?: number
  width?: number
  height?: number
  index?: number
  selectedIndex: number | null
  emphasisColor: string
}

/** recharts <Bar shape> 커스텀 렌더 — 한 막대를 통나무 부품 스택으로 그린다. */
function WoodBarShape({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  selectedIndex,
  emphasisColor,
}: WoodBarShapeProps) {
  if (height <= 0 || width <= 0) return null
  // 몸통(기둥)이 막대 폭(width)과 정확히 일치하도록 canvas 전체를 확대해서 그린다.
  // → canvas 좌우 여백(가지·옹이)은 막대 밖으로 자연스럽게 넘친다(가로 클립 안 함).
  const renderW = width / WOOD_CORE_FRAC // 몸통이 width가 되도록 canvas를 그릴 폭
  const renderX = x + width / 2 - renderW / 2 // 몸통 중심을 막대 중심에 정렬
  const boxH = renderW * WOOD_CANVAS_AR // 부품 한 칸 높이(가로=세로 동일 배율 → 왜곡 없음)
  const bottom = y + height
  const count = Math.ceil(height / boxH) + 1
  const seq = woodSequence(index, count)
  const clipId = `wood-clip-${index}`
  const isSelected = selectedIndex === index

  const modules = []
  for (let i = 0; i < count; i++) {
    modules.push(
      <image
        key={i}
        href={seq[i]}
        x={renderX}
        y={bottom - (i + 1) * boxH}
        width={renderW}
        height={boxH}
        preserveAspectRatio="none"
      />,
    )
  }
  return (
    <g>
      {/* 세로만 클립(위 잘라 % 표현, 아래는 축에 맞춤). 가로는 클립 안 해 가지가 살아있음 */}
      <clipPath id={clipId}>
        <rect x={renderX} y={y} width={renderW} height={height} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        {modules}
        {/* 선택 강조 — 나뭇결을 가리지 않게 밝게 띄우는 얇은 워시 */}
        {isSelected && (
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            style={{ fill: 'var(--chart-selection-wash)' }}
            opacity={0.14}
          />
        )}
      </g>
      {isSelected && (
        <rect
          x={x - 1}
          y={y - 1}
          width={width + 2}
          height={height + 2}
          fill="none"
          stroke={emphasisColor}
          strokeWidth={2}
          rx={3}
        />
      )}
    </g>
  )
}

interface MonthlyTrendSectionProps {
  // 기간 필터
  periodPreset: PeriodPreset
  setPeriodPreset: (preset: PeriodPreset) => void
  periodLabel: string
  customDateRange: DateRange | undefined
  setCustomDateRange: (range: DateRange | undefined) => void
  handleCustomPeriod: () => void
  // 차트
  chartData: Array<{ name: string; rate: number; completed: number; total: number }>
  chartBarColor: string
  chartEmphasisColor: string
  /** 꾸준함 인사이트 — 통계 고유 집계 지표 (캘린더·홈과 중복되지 않음) */
  consistency: ConsistencyInsight | null
}

/**
 * 월별 이행 추세 블록 — 기간 필터·막대 차트·꾸준함 인사이트를 담당.
 * 이번 달 현황과 같은 주제(이행)의 줌아웃이라 Hero 카드 안에 구분선으로 합쳐 렌더한다.
 * 필터를 차트 바로 위(이 블록 헤더)에 두어 "필터가 무엇을 제어하는지"를 자명하게 만든다.
 */
export default function MonthlyTrendSection({
  periodPreset,
  setPeriodPreset,
  periodLabel,
  customDateRange,
  setCustomDateRange,
  handleCustomPeriod,
  chartData,
  chartEmphasisColor,
  consistency,
}: MonthlyTrendSectionProps) {
  // 막대 탭 → 그 달 요약(차트 아래). 같은 막대 재탭 시 해제. 기간 필터 변경 시 선택 초기화.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const handlePreset = (p: PeriodPreset) => {
    setSelectedIndex(null)
    setPeriodPreset(p)
  }
  const handleCustom = () => {
    setSelectedIndex(null)
    handleCustomPeriod()
  }

  // 추세로 볼 만한 데이터(2개월 이상 납입 활동)가 있는지 — 없으면 빈 차트 대신 안내.
  const hasTrend = !!consistency && consistency.activeMonths >= 2

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-sm font-semibold text-foreground-muted">월별 적립 기록</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border border-border hover:border-surface-strong-hover"
            >
              {periodLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[140px]">
            <DropdownMenuItem onClick={() => handlePreset('1')}>이번 달</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePreset('3')}>최근 3개월</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePreset('6')}>최근 6개월</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePreset('12')}>최근 12개월</DropdownMenuItem>
            <DropdownMenuItem onClick={handleCustom}>기간 선택</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {periodPreset === 'custom' && (
        <div className="mb-3">
          <DateRangePicker
            value={customDateRange}
            onChange={setCustomDateRange}
            placeholder="기간 선택"
            buttonClassName="w-full"
          />
        </div>
      )}

      {hasTrend ? (
        <>
          {/* 차트 위 문장 0줄 — 스트릭·기간 중 N개월 100%·가장 잘한 달은 전부 걷어냈다.
              연속 적립은 기간 필터에 흔들리지 않는 hero(StreakHeroSection)가 이어받는다. */}
          {/* 차트 안쪽 포커스 링을 전부 없앤다.
              recharts가 접근성용으로 차트 <svg>와 내부 레이어를 포커스 대상으로 만드는데,
              막대를 탭하면 거기에 포커스가 들어가 브랜드 그린 링(--ring)이 차트를 감싸 버린다.
              이 차트는 Tooltip이 없어 포커스로 할 수 있는 동작이 없으므로 잃는 기능이 없다.
              accessibilityLayer={false}로 tabIndex는 떼지만, 어떤 요소에 걸리든 막히도록 함께 둔다. */}
          <div className="h-28 mt-3 [&_:focus]:outline-none [&_:focus-visible]:outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                accessibilityLayer={false}
                data={chartData}
                margin={{ top: 22, right: 8, left: 0, bottom: 0 }}
              >
                {/* design-guard-disable-next-line fontsize — Recharts tick prop은 내부 SVG 렌더러가 받는 값이라 Tailwind 스케일 클래스가 닿지 않는다 */}
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                {/* design-guard-disable-next-line fontsize — 위와 같음(Recharts tick prop) */}
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={28} />
                <Bar
                  dataKey="rate"
                  barSize={22}
                  isAnimationActive={false}
                  onClick={(_, index) => setSelectedIndex((prev) => (prev === index ? null : index))}
                  shape={(props: unknown) => (
                    <WoodBarShape
                      {...(props as WoodBarShapeProps)}
                      selectedIndex={selectedIndex}
                      emphasisColor={chartEmphasisColor}
                    />
                  )}
                >
                  <LabelList
                    dataKey="rate"
                    content={(props: unknown) => {
                      // 이번 달(마지막) 막대 위에만 '적립 중' — 아직 적립 중이라 완료율이 확정 아님을 알림
                      const { x, y, width, index } = props as {
                        x: number
                        y: number
                        width: number
                        index: number
                      }
                      if (index !== chartData.length - 1) return null
                      return (
                        <text
                          x={x + width / 2}
                          y={y - 6}
                          textAnchor="middle"
                          style={{ fontSize: 9 }}
                          className="fill-muted-foreground"
                        >
                          적립 중
                        </text>
                      )
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 막대 탭 시 그 달 요약(차트 아래 고정 줄). 미선택 시 탐색 안내. */}
          {selectedIndex !== null && chartData[selectedIndex] ? (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {chartData[selectedIndex].name} · {chartData[selectedIndex].total}건 중 {chartData[selectedIndex].completed}건 ·{' '}
              <span className="font-bold text-primary">{chartData[selectedIndex].rate}%</span> 완료
            </p>
          ) : (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              막대를 눌러 월별 기록을 볼 수 있어요
            </p>
          )}
        </>
      ) : (
        // 추세를 그릴 만큼 쌓이지 않은 신규/단월 상태 — 빈 차트 대신 격려 문구.
        <p className="text-sm text-muted-foreground py-6 text-center">
          다음 달부터 월별 적립 기록이 쌓여요.
        </p>
      )}
    </div>
  )
}
