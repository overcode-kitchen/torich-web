/**
 * 스크롤 애니메이션 유틸리티 함수
 */

export type EasingFunction = (t: number) => number

/**
 * 자석 느낌 easing: 빨리 시작해서 끝에서 끌어당기는 느낌
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * 슈르륵 스크롤용: 시작·끝 모두 부드럽게
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * 애니메이션 스크롤
 * @param element 스크롤할 요소
 * @param targetTop 목표 스크롤 위치
 * @param duration 애니메이션 지속 시간 (ms)
 * @param easing 이징 함수
 */
export function scrollToAnimated(
  element: HTMLElement,
  targetTop: number,
  duration: number,
  easing: EasingFunction
): void {
  const startTop = element.scrollTop
  const distance = targetTop - startTop
  if (Math.abs(distance) < 2) return

  const startTime = performance.now()
  const originalSnap = element.style.scrollSnapType
  element.style.scrollSnapType = 'none'

  function tick(currentTime: number): void {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = easing(progress)
    element.scrollTop = startTop + distance * eased
    if (progress < 1) {
      requestAnimationFrame(tick)
    } else {
      element.style.scrollSnapType = originalSnap
    }
  }

  requestAnimationFrame(tick)
}
