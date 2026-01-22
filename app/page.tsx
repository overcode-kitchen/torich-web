'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { IconPlus, IconLogout, IconUser, IconLoader2 } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { formatCurrency } from '@/lib/utils'
// import { sendGAEvent } from '@next/third-parties/google'
import { Investment } from '@/app/types/investment'
import InvestmentItem from '@/app/components/InvestmentItem'
import InvestmentDetailView from '@/app/components/InvestmentDetailView'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [records, setRecords] = useState<Investment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number>(1) // 기본값: 1년
  const [isDeleting, setIsDeleting] = useState(false) // 삭제 중 상태
  const [detailItem, setDetailItem] = useState<Investment | null>(null) // 상세 보기 아이템

  const supabase = createClient()

  // 시뮬레이션 기반 복리 계산 헬퍼 함수
  // T: 사용자가 선택한 연도, P: 투자 만기, R: 연이율
  const calculateSimulatedValue = (
    monthlyAmount: number, 
    T: number, 
    P: number, 
    R: number = 0.10
  ): number => {
    // Case A: 선택 시점이 만기보다 짧거나 같음 (T <= P)
    if (T <= P) {
      const monthlyRate = R / 12
      const totalMonths = T * 12
      const futureValue = monthlyAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)
      return futureValue
    }
    
    // Case B: 선택 시점이 만기보다 김 (T > P)
    // Step 1: P년(만기)까지 복리로 불어남
    const monthlyRate = R / 12
    const maturityMonths = P * 12
    const maturityValue = monthlyAmount * ((Math.pow(1 + monthlyRate, maturityMonths) - 1) / monthlyRate)
    
    // Step 2: 만기 이후는 이자 없이 현금으로 보유 (T - P년 동안)
    // 만기 시점의 총액이 그대로 T년 시점의 자산
    return maturityValue
  }

  // 선택된 연도 기준 자산 계산
  const { totalExpectedAsset, totalMonthlyPayment } = useMemo(() => {
    if (records.length === 0) {
      return {
        totalExpectedAsset: 0,
        totalMonthlyPayment: 0
      }
    }

    // 모든 투자를 selectedYear(T) 기준으로 시뮬레이션하여 합산
    const totalExpectedAsset = records.reduce((sum, record) => {
      const T = selectedYear // 사용자 선택 연도
      const P = record.period_years // 투자 만기
      const R = record.annual_rate ? record.annual_rate / 100 : 0.10 // 연이율 (기본 10%)
      
      return sum + calculateSimulatedValue(record.monthly_amount, T, P, R)
    }, 0)

    // 실제 매월 납입하는 총액 (모든 투자의 월 납입액 합계)
    const totalMonthlyPayment = records.reduce((sum, record) => {
      return sum + record.monthly_amount
    }, 0)

    return {
      totalExpectedAsset,
      totalMonthlyPayment
    }
  }, [records, selectedYear])

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



  if (isLoading) {
    return (
      <main className="min-h-screen bg-coolgray-25 flex items-center justify-center">
        <IconLoader2 className="w-8 h-8 animate-spin text-brand-600" />
      </main>
    )
  }

  // 비로그인 상태: 랜딩 페이지
  if (!user) {
    return (
      <main className="min-h-screen bg-[#F2F4F6] flex flex-col">
        {/* 1. 상단 로고 */}
        <div className="text-center pt-8 mb-8">
          <h1 className="text-green-500 font-bold text-2xl">토리치</h1>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 flex items-center justify-center px-6 pb-8">
          <div className="w-full max-w-sm">
            {/* 2. 설명 카드 (White Card) - 텍스트와 이미지만 포함 */}
            <div className="bg-white w-full rounded-[32px] px-6 py-10 shadow-sm">
              {/* 타이틀 */}
              <h2 className="text-2xl font-bold text-gray-900 leading-tight text-left mb-3 whitespace-pre-line">
                내가 심은 작은 도토리,{'\n'}10년 뒤엔 얼마가 될까요?
              </h2>

              {/* 서브 텍스트 */}
              <p className="text-gray-500 text-sm leading-relaxed text-left mb-8 whitespace-pre-line">
                막연한 부자의 꿈, 숫자로 확인해보세요.{'\n'}복리 계산기가 10초 만에 알려드려요.
              </p>

              {/* 이미지 영역 */}
              <div className="w-48 h-48 mx-auto bg-gray-50 rounded-full flex items-center justify-center">
                <span className="text-4xl">🐿️</span>
              </div>
            </div>

            {/* 3. 메인 버튼 (Green Button) - 카드 밖으로 분리 */}
            <button
              onClick={() => router.push('/add')}
              className="w-full bg-[#00C261] hover:bg-green-600 text-white text-lg font-bold py-4 rounded-2xl shadow-md mt-5 mb-8 transition-colors"
            >
              계산기 두드려보기
            </button>

            {/* 4. 로그인 영역 */}
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-3">이미 람쥐이신가요?</p>
              <button
                onClick={() => router.push('/login')}
                className="bg-[#E5E7EB] text-coolgray-600 px-8 py-3 rounded-xl text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                로그인
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // 로그인 상태: 기존 대시보드
  return (
    <main className="min-h-screen bg-coolgray-25">
      {/* 상단 헤더 */}
      <header className="h-[52px] flex items-center justify-between px-4">
        <h1 className="font-bold text-coolgray-900 text-xl">
          티끌모아 태산
        </h1>
        <div className="flex items-center gap-3">
          {/* 유저 프로필 UI */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
              <IconUser className="w-4 h-4 text-brand-600" />
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
            <IconLogout className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-6">
        {/* 상단 요약 카드 */}
        <div className="bg-white rounded-3xl shadow-md p-8">
          <h2 className="text-lg font-bold text-coolgray-900 mb-6">
            나의 적립식 투자
          </h2>
          <div className="space-y-6">
            {/* Header with Year Selector */}
            <div className="flex items-center gap-2 text-coolgray-700 text-lg font-medium">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-coolgray-200 border-coolgray-200 hover:border-coolgray-300"
                  >
                    {selectedYear}년 뒤
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[120px]">
                  <DropdownMenuItem onClick={() => setSelectedYear(1)}>1년 뒤</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedYear(3)}>3년 뒤</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedYear(5)}>5년 뒤</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedYear(10)}>10년 뒤</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedYear(30)}>30년 뒤</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <span>예상 자산</span>
            </div>
            
            {/* Main */}
            <div className="text-coolgray-900 text-3xl font-bold leading-tight">
              {user && records.length > 0
                ? formatCurrency(totalExpectedAsset)
                : '0만원'}
            </div>
            
            {/* Footer */}
            <div className="text-coolgray-700 text-lg font-medium">
              매월{' '}
              <span className="text-brand-600 font-semibold">
                {user && records.length > 0
                  ? formatCurrency(totalMonthlyPayment)
                  : '0만원'}
              </span>
              씩 심고 있어요
            </div>
          </div>
        </div>

        {/* 투자 목록 추가하기 버튼 */}

        <button 
          onClick={() => {
            // sendGAEvent('event', 'click_add_investment_start')
            router.push('/add')
          }}
          className="w-full bg-brand-600 text-white font-bold rounded-2xl py-4 shadow-lg flex items-center justify-center gap-2 hover:bg-brand-700 transition-colors"
        >
          <IconPlus className="w-5 h-5" />
          투자 목록 추가하기
        </button>

        {/* 하단 리스트 카드 */}
        {records.length > 0 ? (
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-coolgray-900 mb-4">
                내 투자 목록
              </h2>
              <div>
                {records.map((item) => (
                  <InvestmentItem
                    key={item.id}
                    item={item}
                    onClick={() => setDetailItem(item)}
                    calculateFutureValue={calculateSimulatedValue}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-3xl p-12 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
              <p className="text-coolgray-500 text-lg">
                아직 등록된 투자가 없어요
              </p>
              <button 
                onClick={() => {
                  // sendGAEvent('event', 'click_add_investment_start')
                  router.push('/add')
                }}
                className="bg-brand-600 text-white font-bold rounded-2xl py-4 px-8 shadow-lg flex items-center justify-center gap-2 hover:bg-brand-700 transition-colors"
              >
                <IconPlus className="w-5 h-5" />
                투자 목록 추가하기
              </button>
            </div>
          )}
      </div>

      {/* 투자 상세 페이지 */}
      {detailItem && (
        <InvestmentDetailView
          item={detailItem}
          onBack={() => setDetailItem(null)}
          onEdit={() => {
            console.log('TODO: 수정 기능 구현')
            setDetailItem(null)
          }}
          onDelete={async () => {
            try {
              setIsDeleting(true)
              
              const { error } = await supabase
                .from('records')
                .delete()
                .eq('id', detailItem.id)

              if (error) throw error

              // 삭제 성공 시 로컬 state 업데이트 후 메인 페이지로 이동
              setRecords(prevRecords => prevRecords.filter(record => record.id !== detailItem.id))
              setDetailItem(null)
            } catch (error) {
              console.error('삭제 오류:', error)
              alert('삭제 중 오류가 발생했습니다.')
            } finally {
              setIsDeleting(false)
            }
          }}
          isDeleting={isDeleting}
          calculateFutureValue={calculateSimulatedValue}
        />
      )}

    </main>
  )
}
