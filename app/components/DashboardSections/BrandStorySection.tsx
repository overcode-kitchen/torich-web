'use client'

import BrandStoryCard from './BrandStoryCard'
import BrandStoryBottomSheet from './BrandStoryBottomSheet'

interface BrandStorySectionProps {
    showBrandStoryCard: boolean
    onOpenBrandStory: () => void
    onCloseBrandStoryCard: () => void
    pendingBrandStoryUndo: boolean
    onUndoBrandStory: () => void
    isBrandStoryOpen: boolean
    onCloseBrandStory: () => void
}

export default function BrandStorySection({
    showBrandStoryCard,
    onOpenBrandStory,
    onCloseBrandStoryCard,
    pendingBrandStoryUndo,
    onUndoBrandStory,
    isBrandStoryOpen,
    onCloseBrandStory
}: BrandStorySectionProps) {
    return (
        <>
            <BrandStoryCard
                showBrandStoryCard={showBrandStoryCard}
                onOpenBrandStory={onOpenBrandStory}
                onCloseBrandStoryCard={onCloseBrandStoryCard}
            />

            {pendingBrandStoryUndo && (
                <div
                    className="fixed bottom-24 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-xl bg-surface-dark text-white px-4 py-3 shadow-lg max-w-md md:max-w-lg lg:max-w-2xl mx-auto"
                    role="status"
                >
                    <span className="text-sm font-medium">카드가 닫혔어요</span>
                    <button
                        type="button"
                        onClick={onUndoBrandStory}
                        className="text-sm font-semibold text-brand-300 hover:text-brand-200 transition-colors"
                    >
                        되돌리기
                    </button>
                </div>
            )}

            <BrandStoryBottomSheet
                isBrandStoryOpen={isBrandStoryOpen}
                onCloseBrandStory={onCloseBrandStory}
            />
        </>
    )
}
