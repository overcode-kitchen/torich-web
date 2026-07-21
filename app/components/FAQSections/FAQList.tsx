import type { FAQCategory, FAQItem as FAQItemType } from '@/app/lib/faq-content'
import FAQItem from './FAQItem'

interface FAQListProps {
  groups: Array<{ category: FAQCategory; items: FAQItemType[] }>
}

export default function FAQList({ groups }: FAQListProps) {
  return (
    <div className="space-y-8">
      {groups.map(({ category, items }) =>
        items.length === 0 ? null : (
          <section key={category.id} aria-labelledby={`faq-cat-${category.id}`}>
            <h2
              id={`faq-cat-${category.id}`}
              className="text-sm font-semibold text-foreground-muted mb-3 px-1"
            >
              {category.label}
            </h2>
            <div className="space-y-2">
              {items.map((item) => (
                <FAQItem key={item.id} item={item} />
              ))}
            </div>
          </section>
        ),
      )}
    </div>
  )
}
