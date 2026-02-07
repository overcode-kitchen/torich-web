'use client'

import { Sun, Moon, Devices } from '@phosphor-icons/react'
import { type Theme } from '@/app/components/ThemeProvider'

interface ThemeSelectorProps {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export function ThemeSelector({ theme, setTheme }: ThemeSelectorProps) {
  return (
    <>
      <p className="text-sm text-muted-foreground mb-3">테마</p>
      <div className="flex gap-2">
        {(
          [
            { value: 'light' as Theme, label: '라이트', icon: Sun },
            { value: 'dark' as Theme, label: '다크', icon: Moon },
            { value: 'system' as Theme, label: '시스템', icon: Devices },
          ] as const
        ).map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-colors ${
              theme === value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border-subtle bg-surface hover:bg-surface-hover text-foreground-soft'
            }`}
          >
            <Icon className="w-5 h-5" weight={theme === value ? 'fill' : 'regular'} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        시스템: 기기 설정(라이트/다크)을 따릅니다.
      </p>
    </>
  )
}
