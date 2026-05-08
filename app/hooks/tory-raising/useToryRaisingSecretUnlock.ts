'use client'

import { useCallback, useEffect, useState } from 'react'

const SECRET_UNLOCK_STORAGE_KEY = 'tory-raising-secret-unlocked'

// MVP 데모용 고정 토큰. 실제 배포에서는 env로 옮기거나 서버 검증이 필요합니다.
export const DEFAULT_TORY_RAISE_DEMO_TOKEN = '1234'

export function useToryRaisingSecretUnlock() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [unlockToken, setUnlockToken] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(SECRET_UNLOCK_STORAGE_KEY)
    setIsUnlocked(stored === '1')
    setIsHydrated(true)
  }, [])

  const unlock = useCallback((): void => {
    setErrorMessage(null)
    const next = unlockToken.trim()
    if (next === DEFAULT_TORY_RAISE_DEMO_TOKEN) {
      localStorage.setItem(SECRET_UNLOCK_STORAGE_KEY, '1')
      setIsUnlocked(true)
      return
    }

    setErrorMessage('코드가 올바르지 않아요.')
  }, [unlockToken])

  const lock = useCallback((): void => {
    localStorage.removeItem(SECRET_UNLOCK_STORAGE_KEY)
    setIsUnlocked(false)
    setUnlockToken('')
    setErrorMessage(null)
  }, [])

  return {
    isHydrated,
    isUnlocked,
    unlockToken,
    setUnlockToken,
    errorMessage,
    unlock,
    lock,
    demoToken: DEFAULT_TORY_RAISE_DEMO_TOKEN,
  }
}

