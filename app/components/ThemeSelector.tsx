'use client'

import { Sun, Moon, Devices, CaretDown } from '@phosphor-icons/react'
import { type Theme } from '@/app/components/ThemeProvider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ThemeSelectorProps {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const THEME_OPTIONS: Array<{ value: Theme; label: string; description: string; icon: React.ComponentType<any> }> = [
  { value: 'light', label: '라이트', description: '밝은 화면', icon: Sun },
  { value: 'dark', label: '다크', description: '어두운 화면', icon: Moon },
  { value: 'system', label: '시스템', description: '기기 설정 따름', icon: Devices },
]

export function ThemeSelector({ theme, setTheme }: ThemeSelectorProps) {
  const current = THEME_OPTIONS.find((option) => option.value === theme) ?? THEME_OPTIONS[2]
  const CurrentIcon = current.icon

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col">
        <p className="text-sm font-medium text-foreground">테마</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          라이트/다크 또는 시스템 설정을 선택해요.
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground-soft hover:bg-surface-hover transition-colors"
          >
            <CurrentIcon
              className="w-4 h-4 text-foreground"
              weight={theme === 'dark' ? 'fill' : 'regular'}
            />
            <span className="text-foreground">{current.label}</span>
            <CaretDown className="w-4 h-4 text-foreground-subtle" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px]">
          {THEME_OPTIONS.map(({ value, label, description, icon: Icon }) => (
            <DropdownMenuItem
              key={value}
              onClick={() => setTheme(value)}
              className="flex items-center gap-2"
            >
              <Icon
                className="w-4 h-4 text-foreground-subtle"
                weight={theme === value ? 'fill' : 'regular'}
              />
              <div className="flex flex-col items-start">
                <span className="text-sm">{label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
