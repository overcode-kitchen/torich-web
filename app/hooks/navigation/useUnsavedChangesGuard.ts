'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'

/**
 * 히스토리에 심는 "감시 항목" 표식.
 * 뒤로가기를 한 번 흡수해 줄 더미 항목을 구분하는 데 쓴다.
 */
const GUARD_KEY = '__torichExitGuard'

function hasGuardEntry(): boolean {
  if (typeof window === 'undefined') return false
  const state = window.history.state as Record<string, unknown> | null
  return !!state && state[GUARD_KEY] === true
}

function pushGuardEntry(): void {
  // Next App Router가 쓰는 state 필드를 보존한 채 표식만 얹는다. URL은 바꾸지 않는다.
  window.history.pushState(
    { ...(window.history.state as Record<string, unknown> | null), [GUARD_KEY]: true },
    '',
  )
}

export interface UseUnsavedChangesGuardOptions {
  /** 현재 폼 값을 대표하는 문자열. 기준 스냅샷과 다르면 "작성 중"으로 본다. */
  signature: string
  /** 기준 스냅샷을 잡아도 되는 시점인지. 편집 데이터 로딩 전에는 false. 기본 true. */
  ready?: boolean
  /**
   * 마운트 직후 폼이 프리필되는 화면(편집 모드, preset 진입 등)이면 true.
   * 프리필은 effect에서 일어나 한 커밋 뒤에 반영되므로, 기준 스냅샷도 한 커밋 미뤄 잡아야
   * "아무것도 안 고쳤는데 작성 중으로 판정"되는 오판을 피할 수 있다.
   */
  deferBaseline?: boolean
  /** 확인을 통과했을 때 실제로 화면을 떠나는 동작. */
  onExit: () => void
}

export interface UseUnsavedChangesGuardReturn {
  /** 기준 스냅샷 대비 입력이 바뀌었는지 */
  isDirty: boolean
  /** 이탈 확인 다이얼로그 노출 여부 */
  isConfirmOpen: boolean
  /** 화면 안의 ←·취소 버튼에 연결. 작성 중이면 확인, 아니면 즉시 이탈. */
  requestExit: () => void
  /** 다이얼로그의 "그만두기" */
  confirmExit: () => void
  /** 다이얼로그의 "계속하기" */
  cancelExit: () => void
  /**
   * 저장처럼 스스로 화면을 옮기는 동작을 감쌀 때 쓴다.
   * 감시 항목을 먼저 걷어내고 실행하므로 히스토리에 빈 항목이 남지 않는다.
   * 동작이 끝났는데 화면에 그대로 남아 있으면(저장 실패·모달 취소) 감시를 복구한다.
   */
  runWithoutGuard: <T>(action: () => T | Promise<T>) => Promise<T>
}

/**
 * "작성 중인 내용이 사라지는" 이탈을 한 규칙으로 막는 공용 훅.
 *
 * - 입력이 실제로 바뀐 경우에만 확인 다이얼로그를 띄운다. (빈 폼에서는 붙잡지 않는다)
 * - 화면 안의 ← 버튼뿐 아니라 브라우저·안드로이드 하드웨어 뒤로가기도 같은 확인을 거친다.
 *   Next App Router에는 내비게이션 차단 API가 없어, 작성 중일 때만 히스토리에 더미 항목을
 *   하나 심어 뒤로가기를 흡수하는 방식을 쓴다.
 */
export function useUnsavedChangesGuard({
  signature,
  ready = true,
  deferBaseline = false,
  onExit,
}: UseUnsavedChangesGuardOptions): UseUnsavedChangesGuardReturn {
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false)

  // 기준 스냅샷. 잡히기 전(null)에는 작성 중으로 보지 않는다.
  const [baseline, setBaseline] = useState<string | null>(null)
  const sawReadyCommitRef = useRef<boolean>(false)
  useEffect(() => {
    if (!ready || baseline !== null) return
    if (deferBaseline && !sawReadyCommitRef.current) {
      // 프리필 effect가 방금 돌았다. 그 결과가 반영된 다음 커밋에서 기준을 잡는다.
      sawReadyCommitRef.current = true
      return
    }
    setBaseline(signature)
  }, [ready, baseline, deferBaseline, signature])

  const isDirty = baseline !== null && signature !== baseline

  const onExitRef = useRef(onExit)
  useEffect(() => {
    onExitRef.current = onExit
  })

  // 감시 항목을 걷어낸 popstate 직후에 실행할 동작.
  const pendingActionRef = useRef<(() => void) | null>(null)
  const guardActiveRef = useRef<boolean>(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isDirty) return

    pushGuardEntry()
    guardActiveRef.current = true

    const handlePop = (): void => {
      const pending = pendingActionRef.current
      if (pending) {
        pendingActionRef.current = null
        pending()
        return
      }
      // 사용자가 뒤로가기를 눌러 감시 항목이 빠졌다. 화면은 그대로 두고 확인만 띄운다.
      pushGuardEntry()
      setIsConfirmOpen(true)
    }
    window.addEventListener('popstate', handlePop)

    // 안드로이드 하드웨어 뒤로가기. iOS는 이 이벤트를 보내지 않는다.
    // 리스너가 붙어 있는 동안에만 기본 동작(뒤로/앱 종료)이 대체된다.
    let removeBackButton: (() => void) | null = null
    let disposed = false
    if (Capacitor.isNativePlatform()) {
      void import('@capacitor/app')
        .then(({ App }) => App.addListener('backButton', () => setIsConfirmOpen(true)))
        .then((handle) => {
          if (disposed) {
            void handle.remove()
            return
          }
          removeBackButton = (): void => {
            void handle.remove()
          }
        })
        .catch(() => {
          // 플러그인을 못 붙여도 웹 popstate 경로는 그대로 동작한다.
        })
    }

    return () => {
      disposed = true
      window.removeEventListener('popstate', handlePop)
      removeBackButton?.()
      guardActiveRef.current = false
      // 심어둔 감시 항목은 되돌린다. 남기면 뒤로가기를 한 번 더 눌러야 나가게 된다.
      if (hasGuardEntry()) window.history.back()
    }
  }, [isDirty])

  const exitNow = useCallback((): void => {
    const exit = (): void => onExitRef.current()
    if (guardActiveRef.current && hasGuardEntry()) {
      pendingActionRef.current = exit
      window.history.back()
      return
    }
    exit()
  }, [])

  const requestExit = useCallback((): void => {
    if (isDirty) {
      setIsConfirmOpen(true)
      return
    }
    exitNow()
  }, [isDirty, exitNow])

  const confirmExit = useCallback((): void => {
    setIsConfirmOpen(false)
    exitNow()
  }, [exitNow])

  const cancelExit = useCallback((): void => {
    setIsConfirmOpen(false)
  }, [])

  const runWithoutGuard = useCallback(
    async <T,>(action: () => T | Promise<T>): Promise<T> => {
      const hrefBefore = typeof window === 'undefined' ? '' : window.location.href

      if (guardActiveRef.current && hasGuardEntry()) {
        await new Promise<void>((resolve) => {
          pendingActionRef.current = resolve
          window.history.back()
        })
      }

      const result = await action()

      // 화면에 그대로 남아 있고(저장 실패·확인 모달 취소) 여전히 작성 중이면 감시를 복구한다.
      if (
        guardActiveRef.current &&
        typeof window !== 'undefined' &&
        window.location.href === hrefBefore &&
        !hasGuardEntry()
      ) {
        pushGuardEntry()
      }
      return result
    },
    [],
  )

  return {
    isDirty,
    isConfirmOpen,
    requestExit,
    confirmExit,
    cancelExit,
    runWithoutGuard,
  }
}
