'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { track } from '@/app/lib/analytics'
import { resolvePurposeIcon } from '@/app/constants/goal'
import type { FulfillmentHeatmap, HeatmapCell } from '@/app/utils/fulfillment-heatmap'

/** 접기 전 기본으로 그리는 행 수 — 목적이 많으면 셀이 12 × 목적 수만큼 늘어난다 */
const VISIBLE_ROWS = 5

/**
 * 셀 농도 3단계 + 미완료 회색.
 *
 * 통계 화면은 coolgray 위계가 원칙이라, 브랜드 그린은 기록 탭에서 이 히트맵 하나에만 쓴다.
 * 농도 간격(35/60/100)은 다크 모드 기준으로 잡았다 — 카드 배경이 이미 어두워 25% 근처는
 * 회색 셀과 잘 안 갈린다.
 */
function cellClass(cell: HeatmapCell): string {
  if (cell.postponed) return 'border border-dashed border-border-subtle'
  if (!cell.scheduled) return 'bg-progress-track/40'
  if (cell.rate >= 100) return 'bg-primary'
  if (cell.rate >= 50) return 'bg-primary/60'
  if (cell.rate > 0) return 'bg-primary/35'
  return 'bg-progress-track'
}

interface SelectedCell {
  rowLabel: string
  cell: HeatmapCell
}

/**
 * 이행 히트맵 — 행은 목적, 열은 최근 12개월.
 *
 * 글자 없이 12개월 × 목적 수만큼의 정보를 담는 것이 목적이라 카드 안에 판정 문구를 두지 않는다.
 * 미룬 달만 점선으로 갈라 '실패'와 다르게 읽히게 하고, 그 한 줄만 캡션으로 설명한다.
 */
export default function FulfillmentHeatmapSection({ heatmap }: { heatmap: FulfillmentHeatmap }) {
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState<SelectedCell | null>(null)

  const hasPostponed = useMemo(
    () => heatmap.rows.some((r) => r.cells.some((c) => c.postponed)),
    [heatmap.rows]
  )

  const isCollapsible = heatmap.rows.length > VISIBLE_ROWS
  const rows = isCollapsible && !expanded ? heatmap.rows.slice(0, VISIBLE_ROWS) : heatmap.rows

  const handleCellClick = (rowLabel: string, cell: HeatmapCell) => {
    track('stats_heatmap_cell_tap', { has_postponed: cell.postponed })
    setSelected((prev) =>
      prev && prev.rowLabel === rowLabel && prev.cell.yearMonth === cell.yearMonth
        ? null
        : { rowLabel, cell }
    )
  }

  return (
    <section className="bg-card rounded-2xl p-5 mb-4">
      <h2 className="text-sm font-semibold text-foreground-muted mb-3">최근 12개월 이행</h2>

      <div className="flex flex-col gap-[3px]">
        {rows.map((row) => {
          // goals.emoji는 3D 아이콘 키('airplane')거나 구버전 이모지('✈️')다.
          // 그대로 찍으면 키가 글자로 새어 나오므로 다른 화면과 같이 아이콘으로 푼다.
          const icon = resolvePurposeIcon(row.emoji)
          return (
            <div
              key={row.key}
              className="grid items-center gap-[3px]"
              style={{ gridTemplateColumns: `56px repeat(${row.cells.length}, 1fr)` }}
            >
              <span className="flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground">
                {icon && (
                  <Image
                    src={icon.src}
                    alt=""
                    width={12}
                    height={12}
                    className="h-3 w-3 shrink-0 object-contain"
                  />
                )}
                <span className="truncate">{row.label}</span>
              </span>
              {row.cells.map((cell) => (
                <button
                  key={cell.yearMonth}
                  type="button"
                  disabled={!cell.scheduled}
                  onClick={() => handleCellClick(row.label, cell)}
                  aria-label={`${row.label} ${cell.month}월 ${cell.scheduled ? `${cell.total}건 중 ${cell.completed}건` : '적립 예정 없음'}`}
                  className={`aspect-square rounded-[3px] disabled:cursor-default ${cellClass(cell)}`}
                />
              ))}
            </div>
          )
        })}

        {/* 월 눈금 — 행 라벨 칸만큼 비우고 셀에 맞춰 정렬한다 */}
        <div
          className="grid gap-[3px]"
          style={{ gridTemplateColumns: `56px repeat(${heatmap.months.length}, 1fr)` }}
        >
          <span />
          {heatmap.months.map((m) => (
            <span key={m} className="text-center text-[8.5px] text-muted-foreground tabular-nums">
              {m}
            </span>
          ))}
        </div>
      </div>

      {isCollapsible && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 w-full text-xs font-medium text-muted-foreground"
        >
          {expanded ? '접기' : `더 보기 (${heatmap.rows.length - VISIBLE_ROWS}개)`}
        </button>
      )}

      {/* 셀을 누르면 그 달 상세, 아니면 점선 설명 한 줄. 카드당 설명은 최대 1줄로 유지한다. */}
      {selected ? (
        <p className="mt-3 border-t border-border-subtle pt-2 text-xs text-muted-foreground">
          {selected.rowLabel} · {selected.cell.month}월 ·{' '}
          {selected.cell.postponed ? (
            '미룬 달이에요'
          ) : (
            <>
              {selected.cell.total}건 중{' '}
              <span className="font-bold text-foreground">{selected.cell.completed}건</span>
            </>
          )}
        </p>
      ) : (
        hasPostponed && (
          <p className="mt-3 border-t border-border-subtle pt-2 text-xs text-muted-foreground">
            점선은 미룬 달이에요 — 빠진 것으로 세지 않아요
          </p>
        )
      )}
    </section>
  )
}
