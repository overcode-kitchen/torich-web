'use client'

import { useDesignSystem } from '@/app/hooks/ui/useDesignSystem'
import DesignSystemView from '@/app/components/design-system/DesignSystemView'

export default function DesignSystemPage() {
  const { activeTab, setActiveTab, tabs } = useDesignSystem()

  return (
    <DesignSystemView
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabs={tabs}
    />
  )
}
