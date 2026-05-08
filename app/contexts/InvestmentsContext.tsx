'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useAuth } from '@/app/hooks/auth/useAuth'
import { useInvestments } from '@/app/hooks/investment/data/useInvestments'
import type { UseInvestmentsReturn } from '@/app/hooks/types/useInvestments'

const InvestmentsContext = createContext<UseInvestmentsReturn | null>(null)

interface InvestmentsProviderProps {
  children: ReactNode
}

export function InvestmentsProvider({ children }: InvestmentsProviderProps) {
  const { user } = useAuth()
  const value = useInvestments(user?.id)
  return (
    <InvestmentsContext.Provider value={value}>
      {children}
    </InvestmentsContext.Provider>
  )
}

export function useInvestmentsContext(): UseInvestmentsReturn {
  const ctx = useContext(InvestmentsContext)
  if (!ctx) {
    throw new Error(
      'useInvestmentsContext는 InvestmentsProvider 내부에서만 사용할 수 있습니다.',
    )
  }
  return ctx
}
