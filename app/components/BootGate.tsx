'use client'

import type { ReactNode } from 'react'
import { useAuth } from '@/app/hooks/auth/useAuth'
import { FullScreenErrorSection } from '@/app/components/ErrorSections/FullScreenErrorSection'

/**
 * 앱 부팅 게이트.
 *
 * 앱 시작 시 세션 확인이 네트워크 에러/타임아웃으로 실패하면(흰 화면·무한 스피너 원인)
 * 전체화면 에러 + "다시 시도하기" 버튼을 띄운다. 정상 로그아웃(세션 없음)은 에러로 보지 않고
 * 평소처럼 children을 렌더한다.
 */
export default function BootGate({ children }: { children: ReactNode }) {
  const { connectionError, retry } = useAuth()

  if (connectionError) {
    return (
      <FullScreenErrorSection
        type="network"
        primaryAction={{
          label: '다시 시도하기',
          onClick: retry,
        }}
      />
    )
  }

  return <>{children}</>
}
