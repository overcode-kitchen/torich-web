'use client'

import MaskedAmount from '@/app/components/StatsSections/MaskedAmount'
import { shortWon } from '@/app/utils/goal-format'
import type { TypeShareTile } from '@/app/utils/money-composition'

interface RecordTypeShareTilesProps {
  tiles: TypeShareTile[]
  amountsVisible: boolean
}

/**
 * 유형 비중 — 주식·ETF / 예적금·현금.
 *
 * 같은 정보를 문장으로 쓰면 두 줄, 타일로 쓰면 두 칸이다. 이 탭의 브랜드 그린은 곡선과 도넛
 * 첫 조각이 이미 쓰고 있어(탭당 1~2곳) 여기는 coolgray 위계로만 그린다.
 *
 * 0%인 칸도 지우지 않는다 — "예적금은 아직 없다"도 이 카드가 답해야 할 정보다.
 */
export default function RecordTypeShareTiles({
  tiles,
  amountsVisible,
}: RecordTypeShareTilesProps) {
  const total = tiles.reduce((sum, tile) => sum + tile.amount, 0)
  if (total <= 0) return null

  return (
    <div className="mb-4 grid grid-cols-2 gap-3">
      {tiles.map((tile) => (
        <div key={tile.key} className="rounded-2xl bg-card p-4">
          <p className="text-xs text-muted-foreground">{tile.label}</p>
          <p className="mt-1.5 text-xl font-bold leading-none tabular-nums text-foreground">
            {tile.percent}%
          </p>
          <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
            <MaskedAmount visible={amountsVisible}>{shortWon(tile.amount)}</MaskedAmount>
          </p>
        </div>
      ))}
    </div>
  )
}
