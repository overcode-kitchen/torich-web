'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { CircleNotch } from '@phosphor-icons/react'
import { useAuth } from '@/app/hooks/auth/useAuth'
import { useInvestments } from '@/app/hooks/investment/data/useInvestments'
import InvestmentDetailView from '@/app/components/InvestmentDetailView'
import { calculateSimulatedValue } from '@/app/utils/finance'

export default function InvestmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { records, isLoading: dataLoading, updateInvestment, deleteInvestment } = useInvestments(user?.id)

  const rawId = params?.id
  const id = typeof rawId === 'string' ? rawId : null
  const item = id !== null ? records.find((r) => r.id === id) ?? null : null

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (!dataLoading && user && id !== null && records.length > 0 && item === null) {
      router.replace('/')
    }
  }, [dataLoading, user, id, records.length, item, router])

  if (authLoading || !user) {
    return (
      <main
        className="min-h-dvh bg-background flex items-center justify-center"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <CircleNotch className="w-8 h-8 animate-spin text-brand-600" />
      </main>
    )
  }

  if (dataLoading || !item) {
    return (
      <main
        className="min-h-dvh bg-background flex items-center justify-center"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <CircleNotch className="w-8 h-8 animate-spin text-brand-600" />
      </main>
    )
  }

  return (
    <InvestmentDetailView
      item={item}
      onBack={() => router.back()}
      onUpdate={async (data) => {
        await updateInvestment(item.id, data)
      }}
      onDelete={async () => {
        await deleteInvestment(item.id)
        router.replace('/')
      }}
      calculateFutureValue={calculateSimulatedValue}
    />
  )
}
