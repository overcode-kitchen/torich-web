'use client'

import { useCallback, useState } from 'react'

/**
 * 담기 폼의 입력 상태.
 * 답한 만큼만 아래가 열리는 구조라, 열림 여부는 값 자체로 판단한다(별도 step 없음).
 */
export function useV2AddForm(onAdd: (name: string, amount: number) => void, onDone: () => void) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState(0)

  const canSubmit = name.trim().length > 0 && amount > 0

  const submit = useCallback(() => {
    if (!canSubmit) return
    onAdd(name.trim(), amount)
    setName('')
    setAmount(0)
    onDone()
  }, [canSubmit, name, amount, onAdd, onDone])

  return { name, amount, canSubmit, setName, setAmount, submit }
}
