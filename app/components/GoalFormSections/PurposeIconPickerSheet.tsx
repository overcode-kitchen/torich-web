'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Plus, X } from '@phosphor-icons/react'
import { PURPOSE_ICONS, resolvePurposeIcon } from '@/app/constants/goal'
import { cn } from '@/lib/utils'

export interface PurposeIconPickerSheetProps {
  isOpen: boolean
  value: string
  onClose: () => void
  onApply: (iconKey: string) => void
}

export default function PurposeIconPickerSheet({
  isOpen,
  value,
  onClose,
  onApply,
}: PurposeIconPickerSheetProps) {
  const [tempKey, setTempKey] = useState<string>('')

  // 시트가 열릴 때마다 부모의 현재 값으로 임시 상태 동기화
  useEffect(() => {
    if (isOpen) {
      setTempKey(resolvePurposeIcon(value)?.key ?? '')
    }
  }, [isOpen, value])

  if (!isOpen) return null

  const preview = resolvePurposeIcon(tempKey)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="fixed inset-0 bg-black/50 animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      <div className="relative z-50 w-full max-w-md bg-card rounded-t-3xl shadow-xl animate-in slide-in-from-bottom duration-300 flex flex-col">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-surface-strong rounded-full" />
        </div>

        <div className="flex items-center justify-between px-6 pb-4">
          <h2 className="text-lg font-bold text-foreground">아이콘 선택</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-foreground-subtle hover:text-foreground-muted transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-center px-6 pb-6">
          <div className="flex h-28 w-28 items-center justify-center rounded-full border border-border-subtle-lighter bg-surface">
            {preview ? (
              <Image
                src={preview.src}
                alt={preview.label}
                width={80}
                height={80}
                className="h-20 w-20 object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-foreground-subtle">
                <Plus className="h-6 w-6" weight="bold" />
                <span className="text-xs font-medium">아이콘</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="grid grid-cols-4 gap-3">
            {PURPOSE_ICONS.map((icon) => {
              const isActive = tempKey === icon.key
              return (
                <button
                  key={icon.key}
                  type="button"
                  onClick={() => setTempKey(icon.key)}
                  aria-label={icon.label}
                  aria-pressed={isActive}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-2xl border bg-surface transition-colors',
                    isActive
                      ? 'border-foreground'
                      : 'border-border-subtle-lighter hover:border-foreground-subtle',
                  )}
                >
                  <Image
                    src={icon.src}
                    alt={icon.label}
                    width={48}
                    height={48}
                    className="h-12 w-12 object-contain"
                  />
                </button>
              )
            })}
          </div>
        </div>

        <div
          className="px-6 py-4 border-t border-border-subtle flex gap-3"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
        >
          <button
            type="button"
            onClick={() => setTempKey('')}
            className="flex-1 py-3 text-sm font-semibold text-foreground-soft bg-secondary rounded-xl hover:bg-surface-strong transition-colors"
          >
            지우기
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(tempKey)
              onClose()
            }}
            className="flex-1 py-3 text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
