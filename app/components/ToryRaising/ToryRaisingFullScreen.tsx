'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { CircleNotch } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { toastError, toastSuccess, TOAST_MESSAGES } from '@/app/utils/toast'
import { useDailyContent } from '@/app/hooks/tory/useDailyContent'
import type {
  ToryRaisingModalPayload,
  ToryRaisingState,
} from '@/app/hooks/tory-raising/useToryRaisingData'
import { useToryRaisingData } from '@/app/hooks/tory-raising/useToryRaisingData'
import { useToryRaisingSecretUnlock, DEFAULT_TORY_RAISE_DEMO_TOKEN } from '@/app/hooks/tory-raising/useToryRaisingSecretUnlock'
import { type ToryShopCategory, type ToryShopItem } from './ToryRaisingStoreSection'
import ToryRaisingModal from './ToryRaisingModal'
import { TORY_SHOP_CATALOG } from './toryShopCatalog'

function getBackgroundImage(backgroundId: string): string {
  if (backgroundId === 'office_bg') return '/images/onboarding/step1.png'
  if (backgroundId === 'beach_bg') return '/images/onboarding/step2.png'
  if (backgroundId === 'library_bg') return '/images/onboarding/step3.png'
  if (backgroundId === 'cafe_bg') return '/og-image.png'
  return '/images/onboarding/step1.png'
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
    claimToryTabVisit,
    buyItem,
    equipItem,
  } = useToryRaisingData()

  const [view, setView] = useState<'main' | 'shop' | 'customize'>('main')
  const [modalPayload, setModalPayload] = useState<ToryRaisingModalPayload | null>(null)
  const [shopCategory, setShopCategory] = useState<ToryShopCategory>('background')
  const [customizeCategory, setCustomizeCategory] = useState<'hat' | 'glasses' | 'outfit' | 'background'>('background')

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

  const filteredShopItems = useMemo(
    () => TORY_SHOP_CATALOG.filter((i) => i.category === shopCategory).slice(0, 4),
    [shopCategory],
  )

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
  const backgroundOwnedItems = useMemo(() => state.ownedItems.background.map((id) => itemById.get(id)).filter(Boolean) as ToryShopItem[], [state.ownedItems.background, itemById])

  const previewLabel = useMemo(() => getToriiPreviewLabel(state, itemById), [state, itemById])

  function handleActionResult(result: { ok: boolean; successMessage?: string; errorMessage?: string; modal?: ToryRaisingModalPayload }) {
    if (!result.ok) {
      toastError(result.errorMessage ?? TOAST_MESSAGES.dataLoadFailed)
      return
    }
    if (result.successMessage) toastSuccess(result.successMessage)
    if (result.modal) setModalPayload(result.modal)
  }

  const equippedList = useMemo(() => {
    if (customizeCategory === 'hat') return hatOwnedItems
    if (customizeCategory === 'glasses') return glassesOwnedItems
    if (customizeCategory === 'outfit') return outfitOwnedItems
    return backgroundOwnedItems
  }, [backgroundOwnedItems, customizeCategory, glassesOwnedItems, hatOwnedItems, outfitOwnedItems])
  const backgroundImage = getBackgroundImage(state.equipped.background)

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
      <div className="absolute inset-0 -z-20">
        <Image
          src={backgroundImage}
          alt="토리 배경"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-black/20" />

      {/* 상단 정보 */}
      <div className="px-4 pt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white/90 truncate">
            {progress.title.emoji} {progress.title.name}
          </div>
          <div className="text-2xl font-bold tracking-tight text-white tabular-nums">
            Lv.{progress.level}
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-semibold text-white/90">🌰 보유</div>
          <div className="text-2xl font-bold tracking-tight text-white tabular-nums">{state.balance}</div>
        </div>
      </div>

      {/* 상단 상시 명언 + 경험치 */}
      <div className="px-4 mt-2">
        <div className="rounded-2xl border border-white/30 bg-black/30 backdrop-blur-sm p-3">
          <div className="text-xs text-white/80 mb-1">오늘의 명언</div>
          <div className="text-sm text-white leading-snug line-clamp-2">
            {quoteLoading
              ? '명언을 불러오는 중...'
              : richQuote
                ? `"${richQuote.text}" - ${richQuote.author}`
                : '명언을 불러오지 못했어요.'}
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-xs text-white/80">경험치 {Math.round(progress.progressPercent)}%</div>
            <div className="text-xs text-white/80">
              다음 Lv까지 {progress.acornsToNext ?? 0}개
            </div>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/25 overflow-hidden">
            <div
              className="h-full bg-white/90 transition-[width_300ms_ease]"
              style={{ width: `${Math.min(100, Math.max(0, progress.progressPercent))}%` }}
              aria-label={`진행도 ${Math.round(progress.progressPercent)}%`}
            />
          </div>
        </div>
      </div>

      {/* 중앙 영역 (스크롤 없음) */}
      <div className="flex-1 min-h-0 px-4 pt-3 pb-2">
        {view === 'main' && (
          <div className="h-full flex flex-col items-center justify-center text-center rounded-3xl border border-white/30 bg-black/25 backdrop-blur-sm p-5">
            <div className="text-6xl">🐿️</div>
            <div className="mt-3 text-sm text-white/90">{previewLabel}</div>
            <div className="mt-1 text-xs text-white/70">토리는 중앙 고정, 배경은 전체 이미지로 유지됩니다.</div>
          </div>
        )}

        {view === 'shop' && (
          <div className="h-full rounded-3xl border border-white/30 bg-black/25 backdrop-blur-sm p-4 flex flex-col gap-3 overflow-hidden">
            <div className="text-lg font-bold tracking-tight text-white">도토리 상점</div>
            <div className="flex flex-wrap gap-2">
              {(['background', 'hat', 'glasses', 'outfit'] as ToryShopCategory[]).map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={shopCategory === c ? 'secondary' : 'soft'}
                  onClick={() => setShopCategory(c)}
                >
                  {c === 'background' && '배경'}
                  {c === 'hat' && '모자'}
                  {c === 'glasses' && '안경'}
                  {c === 'outfit' && '의상'}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {filteredShopItems.map((item) => {
                const owned = ownedItemIds.has(item.id)
                return (
                  <div key={item.id} className="rounded-2xl border border-white/30 bg-black/20 p-2 flex flex-col gap-2">
                    <div className="text-xs font-semibold text-white/90 truncate">{item.emoji} {item.name}</div>
                    <div className="text-xs text-white/80">🌰 {item.price}</div>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={owned}
                      onClick={() => handleActionResult(buyItem({ itemId: item.id, category: item.category, price: item.price }))}
                    >
                      {owned ? '보유중' : '구매'}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {view === 'customize' && (
          <div className="h-full rounded-3xl border border-white/30 bg-black/25 backdrop-blur-sm p-4 flex flex-col gap-3 overflow-hidden">
            <div className="text-lg font-bold tracking-tight text-white">토리 꾸미기</div>
            <div className="flex flex-wrap gap-2">
              {(['background', 'hat', 'glasses', 'outfit'] as const).map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={customizeCategory === c ? 'secondary' : 'soft'}
                  onClick={() => setCustomizeCategory(c)}
                >
                  {c === 'background' && '배경'}
                  {c === 'hat' && '모자'}
                  {c === 'glasses' && '안경'}
                  {c === 'outfit' && '의상'}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {equippedList.slice(0, 4).map((item) => {
                const equippedId =
                  customizeCategory === 'hat'
                    ? state.equipped.hat
                    : customizeCategory === 'glasses'
                      ? state.equipped.glasses
                      : customizeCategory === 'outfit'
                        ? state.equipped.outfit
                        : state.equipped.background
                const isEquipped = equippedId === item.id
                return (
                  <div key={item.id} className="rounded-2xl border border-white/30 bg-black/20 p-2 flex flex-col gap-2">
                    <div className="text-xs font-semibold text-white/90 truncate">{item.emoji} {item.name}</div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleActionResult(equipItem({ category: customizeCategory, itemId: isEquipped ? null : item.id }))}
                    >
                      {isEquipped ? '벗기' : '장착'}
                    </Button>
                  </div>
                )
              })}
              {equippedList.length === 0 && (
                <div className="col-span-2 text-sm text-white/80">보유한 아이템이 없어요. 상점에서 구매해보세요.</div>
              )}
            </div>
          </div>
        )}
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
            disabled={!isUnlocked}
            onClick={() => handleActionResult(claimToryTabVisit())}
          >
            🐿️ 방문 보상
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            size="lg"
            variant={view === 'main' ? 'secondary' : 'soft'}
            disabled={!isUnlocked}
            onClick={() => setView('main')}
          >
            메인
          </Button>
          <Button
            size="lg"
            variant={view === 'shop' ? 'secondary' : 'soft'}
            disabled={!isUnlocked}
            onClick={() => setView('shop')}
          >
            🛍️ 상점
          </Button>
          <Button
            size="lg"
            variant={view === 'customize' ? 'secondary' : 'soft'}
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

