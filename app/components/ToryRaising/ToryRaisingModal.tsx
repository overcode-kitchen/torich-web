'use client'

import type { ToryRaisingModalPayload } from '@/app/hooks/tory-raising/useToryRaisingData'
import { Button } from '@/components/ui/button'

export default function ToryRaisingModal({
  payload,
  onClose,
}: {
  payload: ToryRaisingModalPayload | null
  onClose: () => void
}) {
  if (!payload) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-foreground-subtle/30"
        onClick={onClose}
        role="presentation"
      />

      <div
        className="relative z-[71] w-full max-w-md rounded-2xl border border-border-subtle bg-card p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground-soft tracking-tight">
              🌟 레벨업!
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              토리가 Lv.{payload.toLevel}가 됐어요
            </h2>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface-hover p-4">
            <div className="text-base font-semibold text-foreground">
              {payload.title.emoji} {payload.title.name}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {payload.nextAppearanceStageLevelsRemaining !== null
                ? `다음 외형 단계까지 ${payload.nextAppearanceStageLevelsRemaining}레벨 남았어요!`
                : '더 성장 중이에요!'}
            </div>
          </div>

          <div
            className="aspect-square w-full rounded-xl border border-border-subtle bg-surface p-4 flex items-center justify-center text-center text-muted-foreground"
            aria-label="일러스트 이미지 영역 (비움)"
          >
            이미지 자리 (MVP 데모)
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button size="lg" variant="secondary" onClick={onClose}>
            확인
          </Button>
        </div>
      </div>
    </div>
  )
}

