'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TimePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: string
  onChange: (value: string) => void
}

export function TimePicker({ value, onChange, className, disabled, ...props }: TimePickerProps) {
  return (
    <input
      type="time"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className={cn(
        'h-11 w-full rounded-2xl border border-border-subtle bg-card px-3 text-sm text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'dark:[&::-webkit-calendar-picker-indicator]:invert',
        className
      )}
      {...props}
    />
  )
}

