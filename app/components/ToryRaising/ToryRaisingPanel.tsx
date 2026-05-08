'use client'

import { useMemo, useState } from 'react'
import { toastError, toastSuccess } from '@/app/utils/toast'
import { Button } from '@/components/ui/button'
import type { ToryRaisingModalPayload, ToryOwnedItems } from '@/app/hooks/tory-raising/useToryRaisingData'
import { useToryRaisingData } from '@/app/hooks/tory-raising/useToryRaisingData'
import { useToryRaisingPanelTabs, type ToryRaisingPanelTab } from '@/app/hooks/tory-raising/useToryRaisingPanelTabs'
import ToryRaisingGrowthSection from './ToryRaisingGrowthSection'
import ToryRaisingStoreSection, { type ToryShopCategory, type ToryShopItem } from './ToryRaisingStoreSection'
import ToryRaisingCustomizeSection from './ToryRaisingCustomizeSection'
import ToryRaisingModal from './ToryRaisingModal'
import { TORY_SHOP_CATALOG } from './toryShopCatalog'

const PANEL_TABS: Array<{ id: ToryRaisingPanelTab; label: string }> = [
  { id: 'growth', label: '성장' },
  { id: 'store', label: '상점' },
  { id: 'customize', label: '꾸미기' },
]

function getOwnedItemIds(ownedItems: ToryOwnedItems): Set<string> {
  return new Set([
    ...ownedItems.hat,
    ...ownedItems.glasses,
    ...ownedItems.outfit,
    ...ownedItems.prop,
    ...ownedItems.background,
  ])
}

export default function ToryRaisingPanel({ onLock }: { onLock: () => void }) {
  const { state, progress, resetDemo, claimAttendance, claimInvestmentComplete, claimToryTabVisit, buyItem, equipItem } =
    useToryRaisingData()
  const { activeTab, selectTab } = useToryRaisingPanelTabs()

  const [modalPayload, setModalPayload] = useState<ToryRaisingModalPayload | null>(null)
  const [storeCategory, setStoreCategory] = useState<ToryShopCategory>('all')

  const ownedItemIds = useMemo(() => getOwnedItemIds(state.ownedItems), [state.ownedItems])
  const itemById = useMemo(() => new Map(TORY_SHOP_CATALOG.map((i) => [i.id, i])), [])

  const filteredShopItems = useMemo(() => {
    if (storeCategory === 'all') return TORY_SHOP_CATALOG
    return TORY_SHOP_CATALOG.filter((i) => i.category === storeCategory)
  }, [storeCategory])

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

  const previewLabel = useMemo(() => {
    const hat = state.equipped.hat ? itemById.get(state.equipped.hat)?.name : null
    const glasses = state.equipped.glasses ? itemById.get(state.equipped.glasses)?.name : null
    const outfit = state.equipped.outfit ? itemById.get(state.equipped.outfit)?.name : null
    const background = state.equipped.background !== 'default' ? itemById.get(state.equipped.background)?.name : null
    return `모자: ${hat ?? '없음'} / 안경: ${glasses ?? '없음'} / 의상: ${outfit ?? '없음'} / 배경: ${background ?? '기본'}`
  }, [state.equipped.hat, state.equipped.glasses, state.equipped.outfit, state.equipped.background, itemById])

  function handleActionResult(result: { ok: boolean; successMessage?: string; errorMessage?: string; modal?: ToryRaisingModalPayload }) {
    if (!result.ok) {
      toastError(result.errorMessage ?? '처리 중 오류가 발생했어요.')
      return
    }
    if (result.successMessage) toastSuccess(result.successMessage)
    if (result.modal) setModalPayload(result.modal)
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border-subtle bg-surface p-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground-soft">토리 키우기 (비밀 데모)</div>
          <div className="text-sm text-muted-foreground mt-1">버튼을 눌러 출석/투자/상점/꾸미기를 직접 조작해보세요.</div>
        </div>
        <Button size="sm" variant="soft" onClick={onLock}>
          잠금
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {PANEL_TABS.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={activeTab === t.id ? 'secondary' : 'soft'}
            onClick={() => selectTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {activeTab === 'growth' && (
        <ToryRaisingGrowthSection
          titleEmoji={progress.title.emoji}
          titleName={progress.title.name}
          level={progress.level}
          progressPercent={progress.progressPercent}
          nextLevel={progress.nextLevel}
          acornsToNext={progress.acornsToNext}
          appearanceStageIndex={progress.appearanceStage.stageIndex}
          attendanceStreak={state.attendanceStreak}
          balance={state.balance}
          recentEarnings={state.recentEarnings}
          onClaimAttendance={() => handleActionResult(claimAttendance())}
          onClaimInvestmentComplete={() => handleActionResult(claimInvestmentComplete())}
          onClaimToryTabVisit={() => handleActionResult(claimToryTabVisit())}
          onResetDemo={resetDemo}
        />
      )}

      {activeTab === 'store' && (
        <ToryRaisingStoreSection
          balance={state.balance}
          activeCategory={storeCategory}
          onSelectCategory={setStoreCategory}
          items={filteredShopItems}
          ownedItemIds={ownedItemIds}
          onBuyItem={(p) => handleActionResult(buyItem(p))}
        />
      )}

      {activeTab === 'customize' && (
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

      <ToryRaisingModal payload={modalPayload} onClose={() => setModalPayload(null)} />
    </section>
  )
}

