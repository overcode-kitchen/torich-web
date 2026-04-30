'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { useToryRaisingSecretUnlock } from '@/app/hooks/tory-raising/useToryRaisingSecretUnlock'
import ToryRaisingPanel from './ToryRaisingPanel'

export default function ToryRaisingSecretGate() {
  const { isHydrated, isUnlocked, unlockToken, setUnlockToken, errorMessage, unlock, lock, demoToken } =
    useToryRaisingSecretUnlock()

  const helperText = useMemo(() => {
    if (!isHydrated) return ''
    if (isUnlocked) return '이미 열려 있어요.'
    return `데모 토큰: ${demoToken} (이건 MVP 테스트용입니다)`
  }, [demoToken, isHydrated, isUnlocked])

  return (
    <section className="flex flex-col gap-3">
      {!isHydrated ? null : isUnlocked ? (
        <ToryRaisingPanel onLock={lock} />
      ) : (
        <div className="rounded-2xl border border-border-subtle bg-surface p-4 flex flex-col gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground-soft">토리 키우기 (비밀 데모)</div>
            <div className="text-sm text-muted-foreground mt-1">토큰을 입력하면 `/tory` 안에서 조작 데모가 열려요.</div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-foreground-soft">비밀 토큰</label>
            <div className="flex gap-2">
              <input
                value={unlockToken}
                onChange={(e) => setUnlockToken(e.target.value)}
                placeholder="예: 1234"
                className="w-full bg-card rounded-xl px-4 py-3 text-foreground placeholder:text-placeholder border border-border-subtle focus:outline-none focus:ring-2 focus:ring-ring"
                inputMode="text"
              />
              <Button size="lg" onClick={unlock}>
                열기
              </Button>
            </div>
            {errorMessage && <div className="text-sm text-destructive">{errorMessage}</div>}
            <div className="text-xs text-muted-foreground">{helperText}</div>
          </div>
        </div>
      )}
    </section>
  )
}

