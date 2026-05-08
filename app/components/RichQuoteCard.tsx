'use client'

import { Quotes, ShareNetwork } from '@phosphor-icons/react'

interface RichQuoteCardProps {
  text: string
  author: string
  onShare: () => void
}

export default function RichQuoteCard({ text, author, onShare }: RichQuoteCardProps) {
  return (
    <section
      className="rounded-2xl bg-surface-dark text-white p-6 shadow-md flex flex-col gap-5"
      aria-labelledby="rich-quote-title"
    >
      <div className="flex items-center gap-2">
        <Quotes className="w-5 h-5 text-white/70" weight="fill" aria-hidden />
        <p
          id="rich-quote-title"
          className="text-xs font-semibold uppercase tracking-wider text-white/70"
        >
          오늘의 부자 명언
        </p>
      </div>

      <blockquote className="flex flex-col gap-3">
        <p className="text-lg leading-relaxed font-medium break-keep">
          &ldquo;{text}&rdquo;
        </p>
        <footer className="text-sm text-white/70">— {author}</footer>
      </blockquote>

      <button
        type="button"
        onClick={onShare}
        className="self-start inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        aria-label="명언 공유하기"
      >
        <ShareNetwork className="w-4 h-4" weight="bold" aria-hidden />
        공유하기
      </button>
    </section>
  )
}
