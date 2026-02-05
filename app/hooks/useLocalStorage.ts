'use client'

import { useEffect, useState } from 'react'

type SetStateAction<T> = T | ((prev: T) => T)

type UseLocalStorageOptions<T> = {
  serialize?: (value: T) => string
  deserialize?: (raw: string) => T
}

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'
const isNumber = (value: unknown): value is number => typeof value === 'number'
const isString = (value: unknown): value is string => typeof value === 'string'

const defaultSerialize = <T,>(value: T): string => {
  if (isBoolean(value)) {
    return value ? '1' : '0'
  }

  if (isNumber(value)) {
    return String(value)
  }

  if (isString(value)) {
    return value
  }

  return JSON.stringify(value)
}

const defaultDeserialize = <T,>(raw: string, initialValue: T): T => {
  if (isBoolean(initialValue)) {
    return (raw === '1') as unknown as T
  }

  if (isNumber(initialValue)) {
    const parsed: number = Number(raw)
    return (Number.isNaN(parsed) ? initialValue : parsed) as unknown as T
  }

  if (isString(initialValue)) {
    return raw as unknown as T
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return initialValue
  }
}

export const useLocalStorage = <T,>(
  key: string,
  initialValue: T,
  options?: UseLocalStorageOptions<T>,
): readonly [T, (action: SetStateAction<T>) => void] => {
  const [value, setValue] = useState<T>(initialValue)

  useEffect((): void => {
    if (typeof window === 'undefined') return

    const stored: string | null = window.localStorage.getItem(key)
    if (stored === null) {
      setValue(initialValue)
      return
    }

    const deserialize: (raw: string) => T =
      options?.deserialize ?? ((raw: string): T => defaultDeserialize<T>(raw, initialValue))

    setValue(deserialize(stored))
  }, [key, initialValue, options?.deserialize])

  const setStoredValue = (action: SetStateAction<T>): void => {
    setValue((prev: T): T => {
      const next: T = typeof action === 'function' ? (action as (p: T) => T)(prev) : action

      if (typeof window !== 'undefined') {
        const serialize: (val: T) => string = options?.serialize ?? defaultSerialize
        window.localStorage.setItem(key, serialize(next))
      }

      return next
    })
  }

  return [value, setStoredValue] as const
}
