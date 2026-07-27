'use client'

interface InvestmentFieldProps {
  label: string
  value: string | React.ReactNode
  badge?: {
    text: string
    variant: 'default' | 'custom'
  }
}

export function InvestmentField({
  label,
  value,
  badge,
}: InvestmentFieldProps) {
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
