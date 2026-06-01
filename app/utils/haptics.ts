'use client'

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { isCapacitorNative } from '@/lib/auth/capacitor-native'

/**
 * 햅틱 피드백 유틸 (Capacitor Haptics 래퍼)
 *
 * iOS HIG(Playing haptics) 원칙을 따른다:
 * - 과용 금지 → 의미 있는 상태 변경(완료/취소)에만 사용. 단순 탭/선택에는 쓰지 않는다.
 * - 웹/SSR 환경에서는 no-op (네이티브 가드 + try/catch).
 *   플러그인 미설치·미동작 시에도 앱이 죽지 않도록 모든 호출을 방어한다.
 */

function isHapticsAvailable(): boolean {
    return isCapacitorNative()
}

/** 액션 성공 확정 — HIG "Confirm a successful action". 납입 완료 등 되돌리기 어려운 상태 변경에 사용 */
export function hapticSuccess(): void {
    if (!isHapticsAvailable()) return
    void Haptics.notification({ type: NotificationType.Success }).catch(() => {
        // 햅틱 실패는 UX 보조 신호일 뿐이라 무시 (로깅 불필요)
    })
}

/** 가벼운 물리 피드백 — 완료의 짝(되돌리기 등) 저강도 확인에 사용 */
export function hapticLightImpact(): void {
    if (!isHapticsAvailable()) return
    void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {
        // 위와 동일
    })
}
