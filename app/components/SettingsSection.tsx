'use client'

import { ReactNode } from 'react'

interface SettingsSectionProps {
  title: string
  children: ReactNode
  className?: string
}

export function SettingsSection({ title, children, className = '' }: SettingsSectionProps) {
  return (
    <section className={`bg-card rounded-2xl overflow-hidden ${className}`}>
      <h2 className="text-sm font-semibold text-foreground-muted px-4 pt-4 pb-2">{title}</h2>
      {children}
    </section>
  )
}
