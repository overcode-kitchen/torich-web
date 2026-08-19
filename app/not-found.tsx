'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FullScreenErrorSection } from '@/app/components/ErrorSections/FullScreenErrorSection'
import { track } from '@/app/lib/analytics'

/**
 * 404 화면.
 *
 * 이 파일이 없으면 Next가 프레임워크 기본 404(영문 문구 + #000/#fff 하드코딩 +
 * 100vh 고정 + 액션 없음)를 대신 넣는다. 정적 export + Capacitor 조합에서는
 * 빌드 시점에 없던 경로가 곧바로 404가 되므로(옛 푸시 페이로드·구버전 앱 딥링크),
 * 404는 예외가 아니라 예정된 도착지다. app/error.tsx와 같은 모양으로 맞춘다.
 */
export default function NotFound(): ReactNode {
  const router = useRouter()

  // 어떤 옛 경로가 아직 사용자를 404로 보내는지 남긴다.
  // 이 데이터가 쌓여야 구 경로 → 신 경로 리다이렉트를 어디에 놓을지 판단할 수 있다.
  useEffect(() => {
    track('page_not_found', { path: window.location.pathname })
  }, [])

  return (
    <FullScreenErrorSection
      type="unknown"
      title="페이지를 찾을 수 없어요"
      description="주소가 바뀌었거나 삭제된 화면이에요."
      primaryAction={{
        label: '홈으로 돌아가기',
        onClick: () => router.replace('/'),
      }}
    />
  )
}
