'use client'

import { WarningCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export interface FullScreenErrorSectionProps {
  type?: 'network' | 'server' | 'unknown'
  title?: string
  description?: string
  primaryAction?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  debugMessage?: string
}

export function FullScreenErrorSection({
  type = 'unknown',
  title,
  description,
  primaryAction,
  secondaryAction,
  debugMessage,
}: FullScreenErrorSectionProps) {
  const copy = getErrorCopy(type)

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl p-8 text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <WarningCircle size={32} weight="bold" />
        </div>

        <div className="space-y-2">
          <p className="text-xl font-semibold tracking-tight text-foreground">
            {title ?? copy.title}
          </p>
          <p className="text-base text-muted-foreground">
            {description ?? copy.description}
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          {primaryAction && (
            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="w-full"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>

        {debugMessage && (
          <p className="pt-2 text-xs text-foreground-subtle break-words">
            {debugMessage}
          </p>
        )}
      </div>
    </div>
  )
}

function getErrorCopy(type: FullScreenErrorSectionProps['type']) {
  switch (type) {
    case 'network':
      return {
        title: '네트워크에 연결할 수 없어요',
        description: '인터넷 연결을 확인한 뒤 다시 시도해 주세요.',
      }
    case 'server':
      return {
        title: '서버에 문제가 발생했어요',
        description: '잠시 후 다시 시도해 주세요. 문제가 계속되면 문의해 주세요.',
      }
    default:
      return {
        title: '문제가 발생했어요',
        description: '앱을 다시 실행하거나 잠시 후 다시 시도해 주세요.',
      }
  }
}

