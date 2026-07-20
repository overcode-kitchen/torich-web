/**
 * 상세 화면 섹션 탭 클릭 시, 대상 섹션을 스티키 탭바 바로 아래로 부드럽게 스크롤한다.
 * 목적 상세·투자 상세가 동일 규약을 쓰도록 계산 로직을 한 곳으로 모은다.
 */

// 대략적 헤더 높이(52px) + 스티키 탭바 높이(40px).
// 두 상세 화면이 각자 복사해 쓰던 매직넘버를 한 곳으로 모은 값 — 기존 동작을 그대로 보존한다.
// (실제 헤더는 safe-area + 48px이라 노치별 편차가 있을 수 있으니, 추후 실기기 튜닝은 여기만 고치면 된다.)
const STICKY_HEADER_HEIGHT = 52
const STICKY_TABS_HEIGHT = 40
const SCROLL_OFFSET = STICKY_HEADER_HEIGHT + STICKY_TABS_HEIGHT

export function scrollToDetailSection(
  container: HTMLElement | null,
  target: HTMLElement | null,
): void {
  if (!container || !target) return
  const containerRect = container.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  const offset = targetRect.top - containerRect.top + container.scrollTop - SCROLL_OFFSET
  container.scrollTo({ top: offset, behavior: 'smooth' })
}
