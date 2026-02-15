'use client'

import { Info } from '@phosphor-icons/react'
import { InputWithUnit } from '@/components/ui/input-with-unit'

interface InvestmentFieldProps {
  label: string
  value: string | React.ReactNode
  editValue?: string
  editPlaceholder?: string
  editUnit?: string
  isEditMode: boolean
  onEdit?: (value: string) => void
  badge?: {
    text: string
    variant: 'default' | 'custom'
  }
  tooltip?: string
  children?: React.ReactNode
}

export function InvestmentField({
  label,
  value,
  editValue = '',
  editPlaceholder = '',
  editUnit = '',
  isEditMode,
  onEdit,
  badge,
  tooltip,
  children,
}: InvestmentFieldProps) {
  if (isEditMode) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <label className="block text-foreground font-bold text-base">{label}</label>
          {tooltip && (
            <div className="group relative">
              <Info className="w-4 h-4 text-foreground-subtle" aria-hidden />
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-48 p-2 bg-surface-dark text-white text-xs rounded-lg z-10">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        {children ? (
          <div className="space-y-2">
            <InputWithUnit
              value={editValue}
              onChange={(e) => onEdit?.(e.target.value)}
              placeholder={editPlaceholder}
              unit={editUnit}
            />
            {children}
          </div>
        ) : (
          <InputWithUnit
            value={editValue}
            onChange={(e) => onEdit?.(e.target.value)}
            placeholder={editPlaceholder}
            unit={editUnit}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="inline-flex items-center rounded-full bg-surface text-foreground-muted text-xs font-medium px-2.5 py-1">
            {badge.text}
          </span>
        )}
        <span className="text-base font-semibold text-foreground">
          {value}
        </span>
      </div>
    </div>
  )
}
