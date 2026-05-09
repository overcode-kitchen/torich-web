import { Suspense } from 'react'
import EditGoalClient from './EditGoalClient'

export default function EditGoalPage() {
  return (
    <Suspense fallback={null}>
      <EditGoalClient />
    </Suspense>
  )
}
