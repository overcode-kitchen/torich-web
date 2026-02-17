'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/hooks/useAuth'

export type Theme = 'light' | 'dark' | 'system'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') return getSystemTheme()
  return theme
}

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
} | null>(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const supabase = createClient()
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // 1. Mount & Initial System Check
  useEffect(() => {
    setMounted(true)
    // Default to system initially
    const initial = 'system'
    setThemeState(initial)
    const resolved = getResolvedTheme(initial)
    setResolvedTheme(resolved)
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [])

  // 2. Fetch from DB if logged in
  useEffect(() => {
    if (!user) return

    const fetchTheme = async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('theme')
        .eq('user_id', user.id)
        .single()

      if (!error && data && data.theme) {
        setThemeState(data.theme as Theme)
      }
    }

    fetchTheme()
  }, [user, supabase])

  // 3. Reflect Theme Changes to DOM
  useEffect(() => {
    if (!mounted) return
    const resolved = getResolvedTheme(theme)
    setResolvedTheme(resolved)
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [theme, mounted])

  // 4. Listen for System Changes
  useEffect(() => {
    if (!mounted || theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const resolved = getSystemTheme()
      setResolvedTheme(resolved)
      document.documentElement.classList.toggle('dark', resolved === 'dark')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme, mounted])

  const setTheme = async (t: Theme) => {
    setThemeState(t)

    if (user) {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, theme: t }, { onConflict: 'user_id' })

      if (error) {
        console.error('Failed to update theme setting', error)
      }
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
