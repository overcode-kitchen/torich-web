'use client'

import { Toaster as SonnerToaster } from 'sonner'
import {
  APP_TOAST_OFFSET_BOTTOM,
  APP_TOAST_OFFSET_X,
} from '@/app/constants/layout-constants'

/**
 * 앱 전역 토스트 규격 (성공·에러·되돌리기 공통).
 *
 * - 위치: 하단 중앙. 탭바 위 + safe-area(홈 인디케이터) 위로 띄운다.
 *   viewport-fit=cover라 offset 없이는 시스템 영역과 겹친다.
 * - sonner는 600px 이하에서 offset 대신 mobileOffset을 쓰므로 둘 다 같은 값으로 준다.
 *   (실기기는 사실상 mobileOffset만 적용된다)
 * - 생김새: 되돌리기 배너와 같은 다크 알약 하나로 통일. richColors 대신
 *   아이콘 색으로만 성공/에러를 구분한다.
 */

const TOAST_OFFSET = {
  bottom: APP_TOAST_OFFSET_BOTTOM,
  left: APP_TOAST_OFFSET_X,
  right: APP_TOAST_OFFSET_X,
} as const

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      offset={TOAST_OFFSET}
      mobileOffset={TOAST_OFFSET}
      className="font-sans"
      toastOptions={{
        // sonner 기본 테마를 끄고(=data-styled:false) 토큰 클래스만 쓴다.
        // 위치·애니메이션은 [data-sonner-toast] 기본 규칙이 그대로 담당한다.
        unstyled: true,
        classNames: {
          toast:
            'flex w-full items-center gap-3 rounded-xl bg-surface-dark px-4 py-3 shadow-lg',
          content: 'flex min-w-0 flex-1 flex-col gap-1',
          title: 'text-label font-medium text-white',
          description: 'text-label text-white/80',
          // unstyled라 sonner의 아이콘 크기 규칙이 빠진다 — svg 크기를 직접 못박는다.
          icon: 'flex shrink-0 items-center [&>svg]:h-5 [&>svg]:w-5',
          actionButton: 'shrink-0 text-label font-semibold text-brand-300',
          cancelButton: 'shrink-0 text-label font-medium text-white/70',
          // 아이콘만 색을 받는다 (제목·설명은 위에서 색을 고정했다)
          success: 'text-brand-300',
          error: 'text-destructive',
        },
      }}
    />
  )
}
