'use client'

import SubPageScaffold from '@/app/components/SubPageScaffold'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'
import FAQList from '@/app/components/FAQSections/FAQList'
import { groupFAQByCategory } from '@/app/lib/faq-content'

export default function FAQPage() {
  const { goBack } = useFlowBack({
    rootPath: '/stats',
    enableHistoryFallback: false,
  })

  const groups = groupFAQByCategory()

  return (
    <SubPageScaffold onBack={goBack} surfaceClassName="bg-background" contentClassName="py-6">
      <header className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          예상 자산은 어떻게 계산되나요?
        </h1>
        <p className="mt-2 text-base text-muted-foreground leading-relaxed">
          수익률·환율·공식·유의사항을 한 페이지에 모았어요.
        </p>
      </header>

      <FAQList groups={groups} />
    </SubPageScaffold>
  )
}
