'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
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

      // 서버에서 세션을 정리한 뒤 클라이언트에서도 즉시 로그인 페이지로 이동
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

