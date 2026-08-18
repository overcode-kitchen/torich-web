'use client'

import { useEffect } from 'react'

/**
 * 오버레이가 떠 있는 동안 뒤 화면 스크롤을 잠근다.
 *
 * iOS WKWebView는 body에 overflow:hidden만 줘서는 스크롤이 잠기지 않는다.
 * position:fixed로 body를 뷰포트에 고정하고, 그 순간의 스크롤 위치를 top에
 * 음수로 옮겨 화면이 그대로 있는 것처럼 보이게 한 뒤, 풀 때 원래 위치로
 * 되돌린다. 복원을 빠뜨리면 오버레이를 닫는 순간 화면이 맨 위로 튄다.
 *
 * 잠금은 모듈 레벨에서 참조 카운팅한다. 홈 목적 카드 ⋯ 액션시트 위에 삭제
 * 확인 모달이 겹치는 경로가 실제로 있어, 안쪽 모달이 닫힐 때 바깥 시트가
 * 아직 열려 있는데 잠금이 풀리면 안 된다.
 */

let lockCount = 0
let savedScrollY = 0

function lock(): void {
  lockCount += 1
  if (lockCount > 1) return

  savedScrollY = window.scrollY
  // 데스크톱 웹은 스크롤바가 사라지면서 콘텐츠 폭이 튄다. 그만큼 패딩으로 메운다.
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

  const { style } = document.body
  style.position = 'fixed'
  style.top = `-${savedScrollY}px`
  style.left = '0'
  style.right = '0'
  style.width = '100%'
  style.overflow = 'hidden'
  if (scrollbarWidth > 0) style.paddingRight = `${scrollbarWidth}px`
}

function unlock(): void {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount > 0) return

  const { style } = document.body
  style.position = ''
  style.top = ''
  style.left = ''
  style.right = ''
  style.width = ''
  style.overflow = ''
  style.paddingRight = ''

  // 스타일을 되돌린 뒤에야 스크롤 위치를 되돌릴 수 있다.
  // 부드러운 스크롤이 걸리면 복원이 눈에 보이므로 즉시 이동한다.
  window.scrollTo({ top: savedScrollY, behavior: 'auto' })
}

/**
 * @param enabled 오버레이가 열려 있는 동안 true. 부모가 조건부로 마운트하는
 *   오버레이는 인자 없이 호출하면 된다(마운트~언마운트 동안 잠금).
 */
export function useBodyScrollLock(enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return
    lock()
    return unlock
  }, [enabled])
}
