import { Button } from '@/components/ui/button'

export type ToryShopCategory = 'all' | 'hat' | 'glasses' | 'outfit' | 'background'

export type ToryShopItem = {
  id: string
  category: Exclude<ToryShopCategory, 'all'>
  emoji: string
  name: string
  price: number
  limited?: boolean
  minLevel?: number
}

export default function ToryRaisingStoreSection({
  balance,
  activeCategory,
  onSelectCategory,
  items,
  ownedItemIds,
  onBuyItem,
}: {
  balance: number
  activeCategory: ToryShopCategory
  onSelectCategory: (c: ToryShopCategory) => void
  items: ToryShopItem[]
  ownedItemIds: Set<string>
  onBuyItem: (params: { itemId: string; category: ToryShopItem['category']; price: number }) => void
}) {
  const categories: ToryShopCategory[] = ['all', 'hat', 'glasses', 'outfit', 'background']

  return (
    <section className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-foreground-soft">도토리 상점</div>
          <div className="text-2xl font-bold tracking-tight text-foreground">🌰 보유: {balance}</div>
          <div className="text-sm text-muted-foreground mt-1">카테고리를 골라 아이템을 구매해보세요.</div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const isActive = activeCategory === c
          return (
            <Button
              key={c}
              type="button"
              size="sm"
              variant={isActive ? 'secondary' : 'soft'}
              onClick={() => onSelectCategory(c)}
            >
              {c === 'all' && '전체'}
              {c === 'hat' && '모자'}
              {c === 'glasses' && '안경'}
              {c === 'outfit' && '의상'}
              {c === 'background' && '배경'}
            </Button>
          )
        })}
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground">표시할 아이템이 없어요.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => {
            const owned = ownedItemIds.has(item.id)
            return (
              <div key={item.id} className="rounded-2xl border border-border-subtle bg-surface p-3 flex flex-col gap-3">
                <div
                  className="aspect-square w-full rounded-xl border border-border-subtle bg-surface-hover p-3 flex items-center justify-center text-center text-muted-foreground"
                  aria-label="아이템 이미지 자리 (비움)"
                >
                  이미지 자리
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground-soft">
                      {item.emoji} {item.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">🌰 {item.price}</div>
                  </div>
                </div>
                <Button
                  size="lg"
                  variant={owned ? 'secondary' : 'secondary'}
                  disabled={owned}
                  onClick={() => onBuyItem({ itemId: item.id, category: item.category, price: item.price })}
                >
                  {owned ? '보유중' : '구매'}
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

