import type { CSSProperties } from 'react'

/** 문자열을 안정적인 정수 해시로. 키마다 일정하지만 서로 다른 박자를 만든다. */
export function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/**
 * 키 해시로 무한 애니메이션의 주기(9~15s)·시작 위상(음수 지연)을 정한다.
 * Math.random 대신 해시라 리렌더·SSR에도 값이 안정적이고, 키마다 서로 다른 박자가 된다.
 * 활성 구간이 짧은 keyframe(예: tory-nudge, handle-nudge)과 함께 쓰면,
 * 위상이 넓게 흩어져 한 화면에 여러 개여도 동시에 한둘만 뜨문뜨문 움직인다.
 *
 * 아바타(RecordAvatar)와 적립 항목 추가 손잡이(AddRecordDrawer)가 공유한다.
 */
export function getWiggleStyle(key: string): CSSProperties {
  const seed = hashString(key)
  const r1 = (seed % 1000) / 1000
  const r2 = ((seed >>> 10) % 1000) / 1000
  const duration = 9 + r1 * 6 // 9s ~ 15s (긴 정지 + 짧은 꿈틀)
  const delay = -(r2 * duration) // 음수 지연으로 시작 위상을 전 주기에 흩뿌려 desync
  return {
    animationDuration: `${duration.toFixed(2)}s`,
    animationDelay: `${delay.toFixed(2)}s`,
  }
}
