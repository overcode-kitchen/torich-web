'use client'

import { useEffect, useState } from 'react'
import { Check } from '@phosphor-icons/react'
import type { RecordType } from '@/app/types/investment'

interface RecordTypeSelectorProps {
  /** null이면 어떤 카드도 선택되지 않은 상태 (페이지 진입 직후) */
  recordType: RecordType | null
  onRecordTypeChange: (type: RecordType) => void
  /** 편집 모드에서 record_type 변경을 막기 위해 true 전달 */
  disabled?: boolean
}

const OPTIONS: { value: RecordType; label: string; description: string }[] = [
  { value: 'investment', label: '투자', description: '주식·ETF 등 종목 기반' },
  { value: 'savings', label: '예·적금', description: '약정 금리·만기 보장' },
  { value: 'cash', label: '현금', description: '자유롭게 모으는 비상금' },
]

/**
 * 적립 항목 유형 선택 — 세로 카드 버튼.
 * - 미선택(null): 3개 카드 펼침
 * - 선택 후: 선택된 카드 1개만 표시 (다시 탭하면 펼침 → 변경 가능)
 * - 편집 모드(disabled): 선택된 카드 1개만 표시, 탭/변경 불가
 */
export default function RecordTypeSelector({
  recordType,
  onRecordTypeChange,
  disabled = false,
}: RecordTypeSelectorProps) {
  const [expanded, setExpanded] = useState<boolean>(recordType === null)

  // recordType이 외부에서 null로 리셋되면 다시 펼침
  useEffect(() => {
    if (recordType === null) setExpanded(true)
  }, [recordType])

  const handleSelect = (type: RecordType): void => {
    onRecordTypeChange(type)
    setExpanded(false)
  }

  // 1) 편집 모드: 항상 선택된 카드 1개만, 탭해도 펼치지 않음
  // 2) 신규: 펼친 상태면 3개, 접힌 상태면 선택된 카드 1개 (재탭하면 펼침)
  const collapsedToSelected = !expanded && recordType !== null
  const visibleOptions =
    (collapsedToSelected || disabled) && recordType !== null
      ? OPTIONS.filter((o) => o.value === recordType)
      : OPTIONS

  return (
    <div className="space-y-2">
      {visibleOptions.map((option) => {
        const selected = recordType === option.value
        const isCollapsedSelected = collapsedToSelected && selected
        return (
          <button
            key={option.value}
            type="button"
            onClick={() =>
              isCollapsedSelected && !disabled
                ? setExpanded(true)
                : handleSelect(option.value)
            }
            disabled={disabled}
            className={`w-full rounded-2xl border-2 bg-card p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              selected
                ? 'border-foreground'
                : 'border-border-subtle hover:border-border'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-foreground">
                  {option.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
              {selected && (
                <Check
                  className="h-5 w-5 shrink-0 text-foreground"
                  weight="bold"
                />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
