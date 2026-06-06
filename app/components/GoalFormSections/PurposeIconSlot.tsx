'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import { resolvePurposeIcon } from '@/app/constants/goal'
import { cn } from '@/lib/utils'
import PurposeIconPickerSheet from './PurposeIconPickerSheet'

export interface PurposeIconSlotProps {
  value: string
  onChange: (iconKey: string) => void
  disabled?: boolean
}

/**
 * 목적 폼에서 쓰는 3D 아이콘 선택 슬롯.
 * 슬롯을 탭하면 바텀시트가 열리고, 거기서 아이콘을 골라 "확인"하면 반영된다.
 */
export default function PurposeIconSlot({
  value,
  onChange,
  disabled,
}: PurposeIconSlotProps) {
  const selected = resolvePurposeIcon(value)
  const [open, setOpen] = useState<boolean>(false)

  return (
    <>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          aria-label={selected ? '아이콘 변경' : '아이콘 추가'}
          className={cn(
            'flex h-24 w-24 items-center justify-center rounded-full bg-card transition-colors disabled:opacity-50',
            selected
              ? 'border border-border-subtle-lighter'
              : 'border-2 border-dashed border-border-subtle hover:border-foreground-subtle',
          )}
        >
          {selected ? (
            <Image
              src={selected.src}
              alt={selected.label}
              width={72}
              height={72}
              className="h-[72px] w-[72px] object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-foreground-subtle">
              <Plus className="h-5 w-5" weight="bold" />
              <span className="text-xs font-medium">아이콘</span>
            </div>
          )}
        </button>
      </div>

      <PurposeIconPickerSheet
        isOpen={open}
        value={value}
        onClose={() => setOpen(false)}
        onApply={(iconKey) => onChange(iconKey)}
      />
    </>
  )
}
