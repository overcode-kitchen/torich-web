'use client'

import { useMemo, useState, useCallback } from 'react'
import { CircleNotch, X } from '@phosphor-icons/react'
import { Share } from '@capacitor/share'
import { Button } from '@/components/ui/button'
import { toastError, toastSuccess, TOAST_MESSAGES } from '@/app/utils/toast'
import { useDailyContent } from '@/app/hooks/tory/useDailyContent'
import RichQuoteCard from '@/app/components/RichQuoteCard'
import type {
  ToryRaisingModalPayload,
  ToryRaisingState,
} from '@/app/hooks/tory-raising/useToryRaisingData'
import { useToryRaisingData } from '@/app/hooks/tory-raising/useToryRaisingData'
import { useToryRaisingSecretUnlock, DEFAULT_TORY_RAISE_DEMO_TOKEN } from '@/app/hooks/tory-raising/useToryRaisingSecretUnlock'
import ToryRaisingStoreSection, { type ToryShopCategory, type ToryShopItem } from './ToryRaisingStoreSection'
import ToryRaisingCustomizeSection from './ToryRaisingCustomizeSection'
import ToryRaisingModal from './ToryRaisingModal'
import { TORY_SHOP_CATALOG } from './toryShopCatalog'

function isUserCancelError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  const lower = message.toLowerCase()
  return lower.includes('cancel') || lower.includes('abort') || lower.includes('dismiss')
}

const SHARE_FAIL_MESSAGE = '공유에 실패했어요. 잠시 후 다시 시도해 주세요.'

function getBackgroundClass(backgroundId: string): string {
  if (backgroundId === 'office_bg') return 'bg-coolgray-25'
  if (backgroundId === 'beach_bg') return 'bg-coolgray-50'
  if (backgroundId === 'library_bg') return 'bg-coolgray-75'
  if (backgroundId === 'cafe_bg') return 'bg-coolgray-100'
  return 'bg-surface'
}

function getToriiPreviewLabel(state: ToryRaisingState, itemById: Map<string, ToryShopItem>): string {
  const hat = state.equipped.hat ? itemById.get(state.equipped.hat)?.name : null
  const glasses = state.equipped.glasses ? itemById.get(state.equipped.glasses)?.name : null
  const outfit = state.equipped.outfit ? itemById.get(state.equipped.outfit)?.name : null
  const background = state.equipped.background !== 'default' ? itemById.get(state.equipped.background)?.name : null
  return `모자: ${hat ?? '없음'} / 안경: ${glasses ?? '없음'} / 의상: ${outfit ?? '없음'} / 배경: ${background ?? '기본'}`
}

export default function ToryRaisingFullScreen() {
  const { richQuote, isLoading: quoteLoading } = useDailyContent()
  const {
    isHydrated: unlockHydrated,
    isUnlocked,
    unlockToken,
    setUnlockToken,
    errorMessage,
    unlock,
  } = useToryRaisingSecretUnlock()

  const {
    isHydrated: toryHydrated,
    state,
    progress,
    resetDemo,
    claimAttendance,
    buyItem,
    equipItem,
  } = useToryRaisingData()

  const [view, setView] = useState<'main' | 'shop' | 'customize'>('main')
  const [isQuoteOpen, setIsQuoteOpen] = useState(false)
  const [modalPayload, setModalPayload] = useState<ToryRaisingModalPayload | null>(null)
  const [shopCategory, setShopCategory] = useState<ToryShopCategory>('all')

  const itemById = useMemo(() => new Map(TORY_SHOP_CATALOG.map((i) => [i.id, i])), [])
  const ownedItemIds = useMemo(
    () =>
      new Set([
        ...state.ownedItems.hat,
        ...state.ownedItems.glasses,
        ...state.ownedItems.outfit,
        ...state.ownedItems.prop,
        ...state.ownedItems.background,
      ]),
    [state.ownedItems],
  )

  const filteredShopItems = useMemo(() => {
    if (shopCategory === 'all') return TORY_SHOP_CATALOG
    return TORY_SHOP_CATALOG.filter((i) => i.category === shopCategory)
  }, [shopCategory])

  const hatOwnedItems = useMemo(
    () => state.ownedItems.hat.map((id) => itemById.get(id)).filter(Boolean) as ToryShopItem[],
    [state.ownedItems.hat, itemById],
  )
  const glassesOwnedItems = useMemo(
    () => state.ownedItems.glasses.map((id) => itemById.get(id)).filter(Boolean) as ToryShopItem[],
    [state.ownedItems.glasses, itemById],
  )
  const outfitOwnedItems = useMemo(
    () => state.ownedItems.outfit.map((id) => itemById.get(id)).filter(Boolean) as ToryShopItem[],
    [state.ownedItems.outfit, itemById],
  )
  const backgroundOwnedItems = useMemo(
    () => state.ownedItems.background.map((id) => itemById.get(id)).filter(Boolean) as ToryShopItem[],
    [state.ownedItems.background, itemById],
  )

  const previewLabel = useMemo(() => getToriiPreviewLabel(state, itemById), [state, itemById])

  function handleActionResult(result: { ok: boolean; successMessage?: string; errorMessage?: string; modal?: ToryRaisingModalPayload }) {
    if (!result.ok) {
      toastError(result.errorMessage ?? TOAST_MESSAGES.dataLoadFailed)
      return
    }
    if (result.successMessage) toastSuccess(result.successMessage)
    if (result.modal) setModalPayload(result.modal)
  }

  const handleShareQuote = useCallback(async (): Promise<void> => {
    if (!richQuote) return
    try {
      await Share.share({
        text: `"${richQuote.text}" - ${richQuote.author}\n\n토리치에서 매일 명언 받기 👉 https://torich.app`,
      })
    } catch (error) {
      if (isUserCancelError(error)) return
      toastError(SHARE_FAIL_MESSAGE)
    }
  }, [richQuote])

  const backgroundClass = getBackgroundClass(state.equipped.background)

  if (!toryHydrated && quoteLoading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <CircleNotch className="w-8 h-8 animate-spin text-brand-600" />
      </main>
    )
  }

  return (
    <main className="relative h-full flex flex-col overflow-hidden">
      {/* 배경(상점 구매 배경 반영) */}
      <div className={`absolute inset-0 -z-10 ${backgroundClass}`} aria-hidden />

      {/* 상단 정보 */}
      <div className="px-4 pt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground-soft truncate">
            {progress.title.emoji} {progress.title.name}
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            Lv.{progress.level}
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-semibold text-foreground-soft">🌰 보유</div>
          <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{state.balance}</div>
        </div>
      </div>

      {/* 경험치/진행도 */}
      <div className="px-4 mt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">경험치</div>
          <div className="text-sm font-semibold text-foreground-soft tabular-nums">
            {Math.round(progress.progressPercent)}%
          </div>
        </div>
        <div className="h-3 rounded-full bg-surface-hover overflow-hidden border border-border-subtle">
          <div
            className="h-full bg-surface-strong transition-[width_300ms_ease]"
            style={{ width: `${Math.min(100, Math.max(0, progress.progressPercent))}%` }}
            aria-label={`진행도 ${Math.round(progress.progressPercent)}%`}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          다음 레벨까지 <span className="font-semibold text-foreground tabular-nums">{progress.acornsToNext ?? 0}</span>개
        </div>
      </div>

      {/* 가운데 토리 */}
      <div className="flex-1 px-4 flex items-center justify-center">
        <div className="w-full max-w-sm flex flex-col items-center justify-center gap-3 text-center">
          <div className="text-5xl">🐿️</div>
          <div className="text-sm text-muted-foreground">{previewLabel}</div>
          <div className="text-xs text-muted-foreground">일러스트 영역(이미지)은 MVP에서 비워두었어요.</div>
        </div>
      </div>

      {/* 하단 액션 */}
      <div className="px-4 pb-3 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="lg"
            variant="secondary"
            disabled={!isUnlocked}
            onClick={() => handleActionResult(claimAttendance())}
          >
            🌰 출석
          </Button>
          <Button
            size="lg"
            variant="soft"
            disabled={false}
            onClick={() => setIsQuoteOpen(true)}
          >
            💬 하루의 명언 보기
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            size="lg"
            variant="soft"
            disabled={!isUnlocked}
            onClick={() => setView('shop')}
          >
            🛍️ 상점
          </Button>
          <Button
            size="lg"
            variant="soft"
            disabled={!isUnlocked}
            onClick={() => setView('customize')}
          >
            👔 꾸미기
          </Button>
        </div>

        {/* 데모 초기화(개발용) */}
        <div className="flex items-center justify-end">
          <Button size="sm" variant="ghost" onClick={resetDemo} disabled={!isUnlocked}>
            데모 초기화
          </Button>
        </div>
      </div>

      {/* 상점/꾸미기 오버레이 */}
      {isUnlocked && view !== 'main' && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setView('main')} role="presentation" />
          <div className="relative z-[61] w-full h-full overflow-y-auto">
            <div className="max-w-md mx-auto p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="text-lg font-bold tracking-tight text-foreground">
                  {view === 'shop' ? '도토리 상점' : '토리 꾸미기'}
                </div>
                <Button size="sm" variant="soft" onClick={() => setView('main')}>
                  <X weight="bold" className="size-4" /> 닫기
                </Button>
              </div>

              {view === 'shop' && (
                <ToryRaisingStoreSection
                  balance={state.balance}
                  activeCategory={shopCategory}
                  onSelectCategory={setShopCategory}
                  items={filteredShopItems}
                  ownedItemIds={ownedItemIds}
                  onBuyItem={(p) => handleActionResult(buyItem(p))}
                />
              )}

              {view === 'customize' && (
                <ToryRaisingCustomizeSection
                  equippedHatId={state.equipped.hat}
                  equippedGlassesId={state.equipped.glasses}
                  equippedOutfitId={state.equipped.outfit}
                  equippedBackgroundId={state.equipped.background}
                  hatOwnedItems={hatOwnedItems}
                  glassesOwnedItems={glassesOwnedItems}
                  outfitOwnedItems={outfitOwnedItems}
                  backgroundOwnedItems={backgroundOwnedItems}
                  previewLabel={previewLabel}
                  onEquip={(p) => {
                    handleActionResult(equipItem(p))
                    if (p.itemId) toastSuccess('장착 완료!')
                    else toastSuccess('해제 완료!')
                  }}
                  onResetDemo={resetDemo}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 명언 모달 */}
      {isQuoteOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsQuoteOpen(false)} role="presentation" />
          <div className="relative z-[71] w-full max-w-md">
            <div className="bg-card rounded-2xl border border-border-subtle p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="text-lg font-bold tracking-tight text-foreground">오늘의 명언</div>
                <Button size="sm" variant="soft" onClick={() => setIsQuoteOpen(false)}>
                  <X weight="bold" className="size-4" /> 닫기
                </Button>
              </div>

              {quoteLoading ? (
                <div className="min-h-[220px] flex items-center justify-center">
                  <CircleNotch className="w-8 h-8 animate-spin text-brand-600" />
                </div>
              ) : richQuote ? (
                <RichQuoteCard text={richQuote.text} author={richQuote.author} onShare={handleShareQuote} />
              ) : (
                <div className="text-sm text-muted-foreground">명언을 불러오지 못했어요.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 레벨업 모달 */}
      <ToryRaisingModal payload={modalPayload} onClose={() => setModalPayload(null)} />

      {/* 잠금 오버레이(비밀 토큰) */}
      {unlockHydrated && !isUnlocked && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative z-[81] w-full max-w-md rounded-2xl border border-border-subtle bg-card p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-foreground-soft tracking-tight">토리 키우기 (비밀 데모)</div>
                <div className="text-2xl font-bold tracking-tight text-foreground mt-1">열기 전용</div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <label className="text-xs font-semibold text-foreground-soft">비밀 토큰</label>
              <div className="flex gap-2">
                <input
                  value={unlockToken}
                  onChange={(e) => setUnlockToken(e.target.value)}
                  placeholder="예: 1234"
                  className="w-full bg-card rounded-xl px-4 py-3 text-foreground placeholder:text-placeholder border border-border-subtle focus:outline-none focus:ring-2 focus:ring-ring"
                  inputMode="text"
                  aria-label="비밀 토큰 입력"
                />
                <Button size="lg" onClick={unlock}>
                  열기
                </Button>
              </div>
              {errorMessage && <div className="text-sm text-destructive">{errorMessage}</div>}
              <div className="text-xs text-muted-foreground">
                현재 데모 토큰: <span className="font-semibold">{DEFAULT_TORY_RAISE_DEMO_TOKEN}</span> (개발용)
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

