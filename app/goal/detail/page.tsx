import { Suspense } from 'react'
import GoalDetailClient from './GoalDetailClient'

export default function GoalDetailPage() {
  return (
    <Suspense fallback={null}>
      <GoalDetailClient />
    </Suspense>
  )
}
