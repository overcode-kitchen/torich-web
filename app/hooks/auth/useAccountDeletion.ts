'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toastError } from '@/app/utils/toast'

type UseAccountDeletionReturn = {
  isDeletingAccount: boolean
  handleDeleteAccount: () => Promise<void>
}

export function useAccountDeletion(): UseAccountDeletionReturn {
  const router = useRouter()
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const handleDeleteAccount = async (): Promise<void> => {
    const confirmed = window.confirm(
      '정말로 탈퇴하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.'
    )

    if (!confirmed) return

    setIsDeletingAccount(true)
    try {
      const res = await fetch('/api/delete-account', {
        method: 'POST',
      })

      if (!res.ok) {
        throw new Error('Failed to delete account')
      }

      // 서버 signOut만으로는 브라우저 쿠키/네이티브 Preferences 등 클라이언트 저장소가 남을 수 있음
      const supabase = createClient()
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        console.error('회원 탈퇴 후 클라이언트 로그아웃 실패:', signOutError)
      }

      router.replace('/login')
      window.location.href = '/login'
    } catch {
      toastError('회원 탈퇴 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsDeletingAccount(false)
    }
  }

  return {
    isDeletingAccount,
    handleDeleteAccount,
  }
}

