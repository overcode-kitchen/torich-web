'use client'

import { useV2Sandbox } from '@/app/hooks/v2/useV2Sandbox'
import { useCountUp } from '@/app/hooks/v2/useCountUp'
import { useV2Gate } from '@/app/hooks/v2/useV2Gate'
import V2HomeView from '@/app/components/V2Sections/V2HomeView'

export default function V2HomePage() {
  const sandbox = useV2Sandbox()
  const displayAmount = useCountUp(sandbox.total)
  useV2Gate(sandbox.ready, sandbox.onboarded)

  return (
    <V2HomeView
      displayAmount={displayAmount}
      progress={sandbox.progress}
      plan={sandbox.plan}
      filled={sandbox.filled}
      remaining={sandbox.remaining}
      payday={sandbox.payday}
      items={sandbox.items}
      allFilled={sandbox.allFilled}
      onToggle={sandbox.toggleFilled}
    />
  )
}
