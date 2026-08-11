'use client'

import { useTiltGravity } from '@/app/hooks/stats/useTiltGravity'

/**
 * 기울기 재정렬 옵트인 토글 — iOS 모션 권한을 사용자 제스처(탭) 안에서 요청한다.
 * 권한이 없어도 도토리 '쏟기'는 항상 동작하므로 이 버튼은 순수 부가 기능이다.
 * DeviceOrientationEvent가 없는 환경(대부분의 데스크톱)에선 렌더하지 않는다.
 */
export function TiltToggle() {
  const { supported, status, enabled, toggle } = useTiltGravity()
  if (!supported) return null

  const label = enabled ? '기울이기 켬' : status === 'denied' ? '권한 거부됨' : '기울이기'

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={status === 'denied'}
      aria-pressed={enabled}
      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-40 ${
        enabled
          ? 'border-transparent bg-brand-accent-bg text-foreground-soft'
          : 'border-card-border text-foreground-muted'
      }`}
    >
      {label}
    </button>
  )
}
