import { CaretDown } from '@phosphor-icons/react'
import type { FAQItem as FAQItemType } from '@/app/lib/faq-content'

interface FAQItemProps {
  item: FAQItemType
}

export default function FAQItem({ item }: FAQItemProps) {
  return (
    <details
      id={item.id}
      className="group bg-card rounded-xl border border-border-subtle overflow-hidden"
    >
      <summary
        className="
          flex items-center justify-between gap-3
          px-4 py-4 cursor-pointer
          list-none
          [&::-webkit-details-marker]:hidden
          [&::marker]:hidden
          hover:bg-surface-hover transition-colors
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-xl
        "
      >
        <span className="text-base font-medium text-foreground">
          {item.question}
        </span>
        <CaretDown
          aria-hidden="true"
          className="w-5 h-5 text-foreground-subtle shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <div className="px-4 pb-4 pt-0 space-y-3 text-base text-foreground-soft leading-relaxed">
        {item.answer.map((para, idx) => (
          <p key={idx}>{para}</p>
        ))}
      </div>
    </details>
  )
}
