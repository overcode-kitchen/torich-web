'use client'

import * as React from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'

import { cn } from '@/lib/utils'

interface ScrollAreaProps
  extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  /** 스크롤 위치 제어 등에 사용할 뷰포트 ref (예: scrollTo, scrollTop) */
  viewportRef?: React.RefObject<HTMLDivElement | null>
}

/**
 * 스크롤이 필요할 때만 스크롤바가 나타나도록 type="auto" 사용.
 * 시맨틱 컬러(border-subtle, foreground-soft)로 스타일링.
 */
const ScrollArea = React.forwardRef<
  React.ComponentRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(({ className, children, viewportRef, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    type="auto"
    scrollHideDelay={400}
    className={cn('relative overflow-hidden', className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport
      ref={viewportRef}
      className="h-full w-full rounded-[inherit] [&>div]:!block"
    >
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ComponentRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      'flex touch-none select-none transition-colors',
      orientation === 'vertical' &&
        'h-full w-2.5 border-l border-l-transparent p-px',
      orientation === 'horizontal' &&
        'h-2.5 flex-col border-t border-t-transparent p-px',
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border-subtle hover:bg-foreground-soft/80 transition-colors" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
