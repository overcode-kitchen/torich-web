'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Plus, LogOut, User, Loader2 } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface Record {
  id: string
  title: string
  monthly_amount: number
  period_years: number
  expected_amount: string
  created_at: string
}

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [records, setRecords] = useState<Record[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    // 인증 상태 확인 및 데이터 로드
    const checkAuthAndLoadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          // 로그인한 경우 records 데이터 가져오기
          const { data, error } = await supabase
            .from('records')
            .select('*')
            .order('created_at', { ascending: false })

          if (error) {
            console.error('데이터 조회 오류:', error)
          } else {
            setRecords(data || [])
          }
        }
      } catch (error) {
        console.error('인증 확인 오류:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthAndLoadData()

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        // 로그인 시 데이터 다시 로드
        supabase
          .from('records')
          .select('*')
          .order('created_at', { ascending: false })
          .then(({ data, error }) => {
            if (!error) {
              setRecords(data || [])
            }
          })
      } else {
        // 로그아웃 시 데이터 초기화
        setRecords([])
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error

      setUser(null)
      setRecords([])
      router.refresh()
      
      // 확실한 이동을 위해 window.location 사용
      window.location.href = '/login'
    } catch (error) {
      console.error('로그아웃 오류:', error)
      setIsLoggingOut(false)
    }
  }

  const formatAmount = (amount: number) => {
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}만`
    }
    return `${amount.toLocaleString()}`
  }

  const formatExpectedAmount = (amount: string) => {
    const num = parseFloat(amount)
    if (num >= 100000000) {
      return `${(num / 100000000).toFixed(1)}억`
    } else if (num >= 10000) {
      return `${(num / 10000).toFixed(0)}만`
    }
    return `${num.toLocaleString()}`
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-coolgray-25 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-coolgray-25">
      {/* 상단 헤더 */}
      <header className="h-[52px] flex items-center justify-between px-4">
        <h1 className="font-bold text-coolgray-900 text-xl">
          티끌모아 태산
        </h1>
        {user ? (
          <div className="flex items-center gap-3">
            {/* 유저 프로필 UI */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                <User className="w-4 h-4 text-brand-600" />
              </div>
              <span className="text-sm text-coolgray-700 hidden sm:inline">
                {user.email?.split('@')[0] || '사용자'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="p-2 text-coolgray-700 hover:text-coolgray-900 transition-colors disabled:opacity-50"
              aria-label="로그아웃"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-1.5 text-sm font-medium text-coolgray-800 hover:text-brand-600 transition-colors"
          >
            로그인
          </button>
        )}
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-6">
        {/* 상단 요약 카드 */}
        <div className="bg-white rounded-3xl shadow-md p-8">
          <h2 className="text-lg font-bold text-coolgray-900 mb-6">
            나의 자산 예측
          </h2>
          <div className="space-y-6">
            {/* Header */}
            <div className="text-coolgray-700 text-lg font-medium">
              5년 뒤 예상 자산
            </div>
            
            {/* Main */}
            <div className="text-coolgray-900 text-3xl font-bold leading-tight">
              {user && records.length > 0
                ? `${formatExpectedAmount(
                    records.reduce((sum, record) => sum + parseFloat(record.expected_amount), 0).toString()
                  )}원`
                : '0원'}
            </div>
            
            {/* Footer */}
            <div className="text-coolgray-700 text-lg font-medium">
              매월{' '}
              <span className="text-brand-600 font-semibold">
                {user && records.length > 0
                  ? `${formatAmount(
                      records.reduce((sum, record) => sum + record.monthly_amount, 0)
                    )}원`
                  : '0원'}
              </span>
              씩 모으고 있어요
            </div>
          </div>
        </div>

        {/* 투자 목록 추가하기 버튼 */}

        <button 
          onClick={() => router.push('/add')}
          className="w-full bg-brand-600 text-white font-bold rounded-2xl py-4 shadow-lg flex items-center justify-center gap-2 hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          투자 목록 추가하기
        </button>

        {/* 하단 리스트 카드 */}
        {user ? (
          records.length > 0 ? (
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-coolgray-900 mb-4">
                내 투자 목록
              </h2>
              <div className="space-y-1">
                {records.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-4 px-2 border-b border-coolgray-100 last:border-b-0"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-coolgray-900 mb-1">
                        {item.title}
                      </div>
                      <div className="text-xs text-coolgray-400">
                        월 {formatAmount(item.monthly_amount)} / {item.period_years}년
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-coolgray-900">
                        총 {formatExpectedAmount(item.expected_amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-3xl p-12 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
              <p className="text-coolgray-500 text-lg">
                아직 등록된 투자가 없어요
              </p>
              <button className="bg-brand-600 text-white font-bold rounded-2xl py-4 px-8 shadow-lg flex items-center justify-center gap-2 hover:bg-brand-700 transition-colors">
                <Plus className="w-5 h-5" />
                투자 목록 추가하기
              </button>
            </div>
          )
        ) : (
          /* 비로그인 상태 - 기본 뷰 */
          <div className="bg-white rounded-3xl p-12 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
            <p className="text-coolgray-500 text-lg">
              로그인 후 투자 목록을 관리하세요
            </p>
            <button
              onClick={() => router.push('/login')}
              className="bg-brand-600 text-white font-bold rounded-2xl py-4 px-8 shadow-lg flex items-center justify-center gap-2 hover:bg-brand-700 transition-colors"
            >
              로그인하기
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
