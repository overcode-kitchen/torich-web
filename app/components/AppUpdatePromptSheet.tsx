'use client'

import Image from 'next/image'
import { X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface AppUpdatePromptSheetProps {
  isOpen: boolean
  onUpdate: () => void
  onDismiss: () => void
}

export function AppUpdatePromptSheet({
  isOpen,
  onUpdate,
  onDismiss,
}: AppUpdatePromptSheetProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="앱 업데이트 안내"
      onClick={onDismiss}
    >
      <div
        className="bg-card rounded-t-3xl max-w-md mx-auto w-full shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end px-4 pt-4">
          <button
            type="button"
            onClick={onDismiss}
            aria-label="닫기"
            className="p-1 text-muted-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-6 pt-2 pb-2 flex flex-col items-center text-center gap-4">
          <Image
            src="/icons/3d/bell-yellow.png"
            alt="앱 업데이트 알림 아이콘"
            width={72}
            height={72}
            className="w-[72px] h-[72px]"
          />
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-semibold text-foreground">
              새로운 버전이 출시되었어요
            </h2>
            <p className="text-sm leading-relaxed text-foreground-soft">
              더 나은 경험을 위해 최신 버전으로 업데이트해 주세요.
            </p>
          </div>
        </div>

        <div className="shrink-0 px-6 pb-6 pt-6 flex flex-col gap-2">
          <Button type="button" onClick={onUpdate} size="lg" className="w-full">
            업데이트
          </Button>
          <Button
            type="button"
            onClick={onDismiss}
            size="lg"
            variant="ghost"
            className="w-full"
          >
            나중에
          </Button>
        </div>
      </div>
    </div>
  )
}
