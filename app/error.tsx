'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  FullScreenErrorSection,
  type FullScreenErrorSectionProps,
} from '@/app/components/ErrorSections/FullScreenErrorSection'

interface RootErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

function getErrorTypeFromMessage(message: string | undefined): FullScreenErrorSectionProps['type'] {
  if (!message) return 'unknown'

  const lower = message.toLowerCase()

  if (
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('net::') ||
    lower.includes('timeout')
  ) {
    return 'network'
  }

  if (lower.includes('internal server error') || lower.includes('500')) {
    return 'server'
  }

  return 'unknown'
}

export default function RootError({ error, reset }: RootErrorProps): ReactNode {
  const router = useRouter()

  const type = getErrorTypeFromMessage(error?.message)

  const debugMessage =
    process.env.NODE_ENV === 'development'
      ? `${error?.message ?? ''}${error?.digest ? ` (${error.digest})` : ''}`
      : undefined

  return (
    <FullScreenErrorSection
      type={type}
      primaryAction={{
        label: '다시 시도하기',
        onClick: () => reset(),
      }}
      secondaryAction={{
        label: '홈으로 돌아가기',
        onClick: () => router.replace('/'),
      }}
      debugMessage={debugMessage}
    />
  )
}

