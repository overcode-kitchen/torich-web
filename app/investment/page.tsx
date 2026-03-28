'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CircleNotch } from '@phosphor-icons/react'
import { useAuth } from '@/app/hooks/auth/useAuth'
import { useInvestments } from '@/app/hooks/investment/data/useInvestments'
import InvestmentDetailView from '@/app/components/InvestmentDetailView'
import { calculateSimulatedValue } from '@/app/utils/finance'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'
import { useIsNativeApp } from '@/app/hooks/platform/useIsNativeApp'

function InvestmentDetail() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isNativeApp = useIsNativeApp()
  const { user, isLoading: authLoading } = useAuth()
  const { records, isLoading: dataLoading, updateInvestment, deleteInvestment } = useInvestments(user?.id)
  const { goBack } = useFlowBack({
    rootPath: '/',
    enableHistoryFallback: true,
  })

  const rawId = searchParams.get('id')
  const id = rawId && rawId.trim() !== '' ? rawId : null
  const item = id !== null ? (records.find((r) => r.id === id) ?? null) : null

  useEffect(() => {
    if (id === null) {
      router.replace('/')
    }
  }, [id, router])

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

  const mainStyle = {
    paddingTop: isNativeApp ? 'env(safe-area-inset-top, 0px)' : '0px',
    paddingBottom: isNativeApp ? 'env(safe-area-inset-bottom, 0px)' : '0px',
  }

  if (id === null) {
    return (
      <main className="min-h-dvh bg-background flex items-center justify-center" style={mainStyle}>
        <CircleNotch className="w-8 h-8 animate-spin text-brand-600" />
      </main>
    )
  }

  if (authLoading || !user) {
    return (
      <main className="min-h-dvh bg-background flex items-center justify-center" style={mainStyle}>
        <CircleNotch className="w-8 h-8 animate-spin text-brand-600" />
      </main>
    )
  }

  if (dataLoading || !item) {
    return (
      <main className="min-h-dvh bg-background flex items-center justify-center" style={mainStyle}>
        <CircleNotch className="w-8 h-8 animate-spin text-brand-600" />
      </main>
    )
  }

  return (
    <InvestmentDetailView
      item={item}
      onBack={goBack}
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

export default function InvestmentPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh bg-background flex items-center justify-center">
          <CircleNotch className="w-8 h-8 animate-spin text-brand-600" />
        </main>
      }
    >
      <InvestmentDetail />
    </Suspense>
  )
}
