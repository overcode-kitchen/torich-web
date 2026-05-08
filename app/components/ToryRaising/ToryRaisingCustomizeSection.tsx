import { Button } from '@/components/ui/button'
import type { ToryShopItem } from './ToryRaisingStoreSection'

export default function ToryRaisingCustomizeSection({
  equippedHatId,
  equippedGlassesId,
  equippedOutfitId,
  equippedBackgroundId,
  hatOwnedItems,
  glassesOwnedItems,
  outfitOwnedItems,
  backgroundOwnedItems,
  onEquip,
  onResetDemo,
  previewLabel,
}: {
  equippedHatId: string | null
  equippedGlassesId: string | null
  equippedOutfitId: string | null
  equippedBackgroundId: string
  hatOwnedItems: ToryShopItem[]
  glassesOwnedItems: ToryShopItem[]
  outfitOwnedItems: ToryShopItem[]
  backgroundOwnedItems: ToryShopItem[]
  onEquip: (params: { category: 'hat' | 'glasses' | 'outfit' | 'background'; itemId: string | null }) => void
  onResetDemo: () => void
  previewLabel: string
}) {
  function renderCategory({
    title,
    items,
    equippedId,
    category,
  }: {
    title: string
    items: ToryShopItem[]
    equippedId: string | null
    category: 'hat' | 'glasses' | 'outfit' | 'background'
  }) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-surface p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-foreground-soft">{title}</div>
          <div className="text-xs text-muted-foreground">{items.length}개 보유</div>
        </div>

        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">아직 아이템이 없어요. 상점에서 구매해보세요.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => {
              const owned = true
              const isEquipped = equippedId === item.id
              return (
                <div key={item.id} className="rounded-xl border border-border-subtle bg-surface-hover p-3 flex flex-col gap-2">
                  <div className="aspect-square w-full rounded-lg border border-border-subtle bg-surface p-2 flex items-center justify-center text-muted-foreground">
                    {item.emoji}
                  </div>
                  <div className="text-xs font-semibold text-foreground-soft">{item.name}</div>
                  <Button
                    size="sm"
                    variant={isEquipped ? 'secondary' : 'secondary'}
                    disabled={!owned}
                    onClick={() => onEquip({ category, itemId: isEquipped ? null : item.id })}
                  >
                    {isEquipped ? '벗기' : '장착'}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <div className="text-sm font-semibold text-foreground-soft">토리 꾸미기</div>
        <div className="text-2xl font-bold tracking-tight text-foreground">장착으로 즉시 반영(데모)</div>
        <div className="text-sm text-muted-foreground">각 카테고리당 1개씩 장착 가능, “벗기”도 항상 제공돼요.</div>
      </header>

      <div
        className="aspect-[4/3] w-full rounded-2xl border border-border-subtle bg-surface-hover p-4 flex items-center justify-center text-muted-foreground text-center"
        aria-label="토리 미리보기 이미지 자리 (비움)"
      >
        <div className="flex flex-col gap-2">
          <div className="font-semibold text-foreground-soft">토리 미리보기</div>
          <div className="text-sm">{previewLabel || '아직 장착된 아이템이 없어요.'}</div>
          <div className="text-xs">이미지 영역은 MVP에서 비워두었어요.</div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {renderCategory({
          title: '모자',
          items: hatOwnedItems,
          equippedId: equippedHatId,
          category: 'hat',
        })}
        {renderCategory({
          title: '안경',
          items: glassesOwnedItems,
          equippedId: equippedGlassesId,
          category: 'glasses',
        })}
        {renderCategory({
          title: '의상',
          items: outfitOwnedItems,
          equippedId: equippedOutfitId,
          category: 'outfit',
        })}

        {renderCategory({
          title: '배경',
          items: backgroundOwnedItems,
          equippedId: equippedBackgroundId,
          category: 'background',
        })}
      </div>

      <div className="flex justify-end">
        <Button size="sm" variant="soft" onClick={onResetDemo}>
          데모 초기화
        </Button>
      </div>
    </section>
  )
}

