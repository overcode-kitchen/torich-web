'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleNotch } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { toastError, toastSuccess, TOAST_MESSAGES } from '@/app/utils/toast'
import { useDailyContent } from '@/app/hooks/tory/useDailyContent'
import type {
  ToryRaisingModalPayload,
  ToryRaisingState,
} from '@/app/hooks/tory-raising/useToryRaisingData'
import { useToryRaisingData } from '@/app/hooks/tory-raising/useToryRaisingData'
import {
  useToryRaisingSecretUnlock,
  DEFAULT_TORY_RAISE_DEMO_TOKEN,
} from '@/app/hooks/tory-raising/useToryRaisingSecretUnlock'
import { type ToryShopCategory, type ToryShopItem } from './ToryRaisingStoreSection'
import ToryRaisingModal from './ToryRaisingModal'
import { TORY_SHOP_CATALOG } from './toryShopCatalog'

const TORY_BUBBLE_LINES = [
  '오늘도 와줘서 고마워!',
  '쓰다듬어줄래?',
  '도토리 모으자!',
  '같이 부자 되자!',
  '오늘 기분이 어때?',
  '꾸준함이 답이야 🌰',
  '명언처럼 살아보자!',
  '나는 너의 도토리 친구!',
] as const

function pickRandomBubble(): string {
  return TORY_BUBBLE_LINES[Math.floor(Math.random() * TORY_BUBBLE_LINES.length)]
}

type ViewTab = 'main' | 'shop' | 'customize'

const VIEW_TABS: Array<{ id: ViewTab; label: string }> = [
  { id: 'main', label: '메인' },
  { id: 'shop', label: '상점' },
  { id: 'customize', label: '꾸미기' },
]

function getEquippedSummary(state: ToryRaisingState, itemById: Map<string, ToryShopItem>): string {
  const hat = state.equipped.hat ? itemById.get(state.equipped.hat)?.name : null
  const glasses = state.equipped.glasses ? itemById.get(state.equipped.glasses)?.name : null
  const outfit = state.equipped.outfit ? itemById.get(state.equipped.outfit)?.name : null
  const background =
    state.equipped.background !== 'default' ? itemById.get(state.equipped.background)?.name : null
  return `모자 ${hat ?? '없음'} · 안경 ${glasses ?? '없음'} · 의상 ${outfit ?? '없음'} · 배경 ${background ?? '기본'}`
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
    claimPlay,
    claimPet,
    buyItem,
    equipItem,
  } = useToryRaisingData()

  const [view, setView] = useState<ViewTab>('main')
  const [modalPayload, setModalPayload] = useState<ToryRaisingModalPayload | null>(null)
  const [shopCategory, setShopCategory] = useState<ToryShopCategory>('background')
  const [customizeCategory, setCustomizeCategory] = useState<
    'hat' | 'glasses' | 'outfit' | 'background'
  >('background')

  const [bubble, setBubble] = useState<string | null>(null)
  const bubbleTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) window.clearTimeout(bubbleTimerRef.current)
    }
  }, [])

  function showBubble(text?: string) {
    setBubble(text ?? pickRandomBubble())
    if (bubbleTimerRef.current) window.clearTimeout(bubbleTimerRef.current)
    bubbleTimerRef.current = window.setTimeout(() => setBubble(null), 3000)
  }

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

  const equippedListByCategory = useMemo(() => {
    const pick = (cat: 'hat' | 'glasses' | 'outfit' | 'background') =>
      state.ownedItems[cat]
        .map((id) => itemById.get(id))
        .filter((i): i is ToryShopItem => Boolean(i))
    return {
      hat: pick('hat'),
      glasses: pick('glasses'),
      outfit: pick('outfit'),
      background: pick('background'),
    }
  }, [
    itemById,
    state.ownedItems.background,
    state.ownedItems.glasses,
    state.ownedItems.hat,
    state.ownedItems.outfit,
  ])

  const equippedList = equippedListByCategory[customizeCategory]
  const equippedSummary = useMemo(() => getEquippedSummary(state, itemById), [state, itemById])
  const titleLabel = `${progress.title.emoji} ${progress.title.name}`

  function handleActionResult(result: {
    ok: boolean
    successMessage?: string
    errorMessage?: string
    modal?: ToryRaisingModalPayload
  }) {
    if (!result.ok) {
      toastError(result.errorMessage ?? TOAST_MESSAGES.dataLoadFailed)
      return
    }
    if (result.successMessage) toastSuccess(result.successMessage)
    if (result.modal) setModalPayload(result.modal)
  }

  function handleCharacterTap() {
    if (!isUnlocked) return
    showBubble()
    const result = claimToryTabVisit()
    if (result.ok) {
      if (result.successMessage) toastSuccess(result.successMessage)
      if (result.modal) setModalPayload(result.modal)
    }
  }

  if (!toryHydrated && quoteLoading) {
    return (
      <main className="min-h-screen bg-brand-50 flex items-center justify-center">
        <CircleNotch className="w-8 h-8 animate-spin text-brand-600" />
      </main>
    )
  }

  return (
    <main className="relative h-full flex flex-col overflow-hidden bg-brand-50">
      {/* 상단 헤더: 레벨/칭호 · 보유 도토리 */}
      <div className="px-5 pt-3 pb-2">
        <div className="flex items-end justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base font-semibold text-foreground tabular-nums">
              레벨 {progress.level}
            </span>
            <span className="text-sm text-foreground-soft truncate">{titleLabel}</span>
          </div>
          <div className="text-sm font-semibold text-foreground tabular-nums">
            보유 도토리 : {state.balance}
          </div>
        </div>

        {/* 경험치 진행도 (얇은 라인) */}
        <div className="mt-2 h-[3px] rounded-full bg-white/70 overflow-hidden">
          <div
            className="h-full bg-brand-500 transition-[width_300ms_ease]"
            style={{
              width: `${Math.min(100, Math.max(0, progress.progressPercent))}%`,
            }}
            aria-label={`경험치 ${Math.round(progress.progressPercent)}%`}
          />
        </div>
      </div>

      {/* 탭 (메인 / 상점 / 꾸미기) */}
      <div className="px-5">
        <div className="grid grid-cols-3 border-b border-coolgray-100">
          {VIEW_TABS.map((t) => {
            const active = view === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setView(t.id)}
                disabled={!isUnlocked}
                className={`relative py-3 text-sm font-semibold transition-colors ${
                  active ? 'text-foreground' : 'text-foreground-subtle'
                } disabled:opacity-50`}
              >
                {t.label}
                <span
                  className={`absolute left-0 right-0 -bottom-px h-[2px] ${
                    active ? 'bg-brand-500' : 'bg-transparent'
                  }`}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* 메인/상점/꾸미기 콘텐츠 */}
      <div className="flex-1 min-h-0 px-5 pt-4 pb-3 overflow-hidden flex flex-col">
        {view === 'main' && (
          <div className="h-full flex flex-col gap-4 overflow-hidden">
            {/* 명언 카드 */}
            <div className="rounded-2xl bg-[#ece4f7] px-4 py-3">
              <div className="text-sm text-foreground leading-snug line-clamp-3">
                {quoteLoading
                  ? '명언을 불러오는 중...'
                  : richQuote
                    ? `${richQuote.text}`
                    : '명언을 불러오지 못했어요.'}
              </div>
              {!quoteLoading && richQuote && (
                <div className="mt-1 text-xs text-foreground-soft">— {richQuote.author}</div>
              )}
            </div>

            {/* 토리 캐릭터 + 말풍선 */}
            <div className="flex-1 min-h-0 flex flex-col items-center justify-start gap-3">
              <div
                className={`min-h-[40px] px-4 py-2 rounded-full bg-coolgray-50 border border-coolgray-100 text-sm text-foreground transition-opacity ${
                  bubble ? 'opacity-100' : 'opacity-0'
                }`}
                aria-live="polite"
                aria-hidden={!bubble}
              >
                {bubble ?? '토리 터치했을 때 말 나오는 영역'}
              </div>

              <button
                type="button"
                onClick={handleCharacterTap}
                disabled={!isUnlocked}
                className="flex-1 min-h-0 w-full max-w-[260px] rounded-2xl bg-torich-brown-light flex flex-col items-center justify-center gap-2 active:scale-[0.99] transition-transform disabled:opacity-50"
                aria-label="토리 캐릭터 (탭하면 반응)"
              >
                <div className="text-6xl">🐿️</div>
                <div className="text-xs text-foreground-soft px-3 text-center line-clamp-2">
                  {equippedSummary}
                </div>
              </button>
            </div>
          </div>
        )}

        {view === 'shop' && (
          <div className="h-full rounded-2xl bg-white border border-coolgray-100 p-4 flex flex-col gap-3 overflow-hidden">
            <div className="text-base font-semibold text-foreground">도토리 상점</div>
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
            <div className="grid grid-cols-2 gap-2 overflow-auto">
              {filteredShopItems.map((item) => {
                const owned = ownedItemIds.has(item.id)
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-coolgray-100 bg-coolgray-25 p-3 flex flex-col gap-2"
                  >
                    <div className="text-sm font-semibold text-foreground truncate">
                      {item.emoji} {item.name}
                    </div>
                    <div className="text-xs text-foreground-soft">🌰 {item.price}</div>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={owned}
                      onClick={() =>
                        handleActionResult(
                          buyItem({ itemId: item.id, category: item.category, price: item.price }),
                        )
                      }
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
          <div className="h-full rounded-2xl bg-white border border-coolgray-100 p-4 flex flex-col gap-3 overflow-hidden">
            <div className="text-base font-semibold text-foreground">토리 꾸미기</div>
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
            <div className="grid grid-cols-2 gap-2 overflow-auto">
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
                  <div
                    key={item.id}
                    className="rounded-xl border border-coolgray-100 bg-coolgray-25 p-3 flex flex-col gap-2"
                  >
                    <div className="text-sm font-semibold text-foreground truncate">
                      {item.emoji} {item.name}
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        handleActionResult(
                          equipItem({
                            category: customizeCategory,
                            itemId: isEquipped ? null : item.id,
                          }),
                        )
                      }
                    >
                      {isEquipped ? '벗기' : '장착'}
                    </Button>
                  </div>
                )
              })}
              {equippedList.length === 0 && (
                <div className="col-span-2 text-sm text-foreground-soft">
                  보유한 아이템이 없어요. 상점에서 구매해보세요.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 하단 액션: 출석 / 놀아주기 / 쓰다듬기 */}
      <div className="px-5 pb-3">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleActionResult(claimAttendance())}
            disabled={!isUnlocked}
            className="h-12 rounded-full bg-white border border-coolgray-100 text-sm font-semibold text-foreground active:scale-[0.99] transition-transform disabled:opacity-50"
          >
            출석
          </button>
          <button
            type="button"
            onClick={() => handleActionResult(claimPlay())}
            disabled={!isUnlocked}
            className="h-12 rounded-full bg-white border border-coolgray-100 text-sm font-semibold text-foreground active:scale-[0.99] transition-transform disabled:opacity-50"
          >
            놀아주기
          </button>
          <button
            type="button"
            onClick={() => handleActionResult(claimPet())}
            disabled={!isUnlocked}
            className="h-12 rounded-full bg-white border border-coolgray-100 text-sm font-semibold text-foreground active:scale-[0.99] transition-transform disabled:opacity-50"
          >
            쓰다듬기
          </button>
        </div>

        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={resetDemo}
            disabled={!isUnlocked}
            className="text-[11px] text-foreground-subtle underline disabled:opacity-50"
          >
            데모 초기화
          </button>
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
                <div className="text-sm font-semibold text-foreground-soft tracking-tight">
                  토리 키우기 (비밀 데모)
                </div>
                <div className="text-2xl font-bold tracking-tight text-foreground mt-1">
                  열기 전용
                </div>
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
