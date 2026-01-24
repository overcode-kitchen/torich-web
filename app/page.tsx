'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { IconPlus, IconLogout, IconUser, IconLoader2, IconInfoCircle, IconChevronDown } from '@tabler/icons-react'
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
import { Investment, getStartDate } from '@/app/types/investment'
import InvestmentItem from '@/app/components/InvestmentItem'
import InvestmentDetailView from '@/app/components/InvestmentDetailView'
import CashHoldItemsSheet from '@/app/components/CashHoldItemsSheet'
import MonthlyContributionSheet from '@/app/components/MonthlyContributionSheet'
import { isCompleted } from '@/app/utils/date'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [records, setRecords] = useState<Investment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number>(1) // 기본값: 1년
  const [isDeleting, setIsDeleting] = useState(false) // 삭제 중 상태
  const [isUpdating, setIsUpdating] = useState(false) // 수정 중 상태
  const [detailItem, setDetailItem] = useState<Investment | null>(null) // 상세 보기 아이템
  const [showCashHoldSheet, setShowCashHoldSheet] = useState(false) // 현금 보관 항목 시트
  const [showContributionSheet, setShowContributionSheet] = useState(false) // 월 납입 내역 시트
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'ENDED'>('ACTIVE') // 필터 상태
  const [sortBy, setSortBy] = useState<'TOTAL_VALUE' | 'MONTHLY_PAYMENT' | 'NAME'>('TOTAL_VALUE') // 정렬 기준
  const bannerRef = useRef<HTMLDivElement | null>(null)
  const [bannerIndex, setBannerIndex] = useState<0 | 1>(0)

  const supabase = createClient()

  // 시뮬레이션 기반 복리 계산 헬퍼 함수
  // T: 사용자가 선택한 연도, P: 투자 만기, R: 연이율
  // 기납입액 기준 월복리 공식: PMT * ((1+r)^n - 1) / r * (1+r)
  const calculateSimulatedValue = (
    monthlyAmount: number, 
    T: number, 
    P: number, 
    R: number = 0.10
  ): number => {
    const monthlyRate = R / 12
    
    // Case A: 선택 시점이 만기보다 짧거나 같음 (T <= P)
    if (T <= P) {
      const totalMonths = T * 12
      // 기납입액 기준 월복리 계산 (월초 납입)
      const futureValue = monthlyAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)
      return futureValue
    }
    
    // Case B: 선택 시점이 만기보다 김 (T > P)
    // Step 1: P년(만기)까지 복리로 불어남 (기납입액 기준)
    const maturityMonths = P * 12
    const maturityValue = monthlyAmount * ((Math.pow(1 + monthlyRate, maturityMonths) - 1) / monthlyRate) * (1 + monthlyRate)
    
    // Step 2: 만기 이후는 이자 없이 현금으로 보유 (T - P년 동안)
    // 만기 시점의 총액이 그대로 T년 시점의 자산
    return maturityValue
  }

  // 선택된 연도 기준 자산 계산
  const { totalExpectedAsset, totalMonthlyPayment, hasMaturedInvestments } = useMemo(() => {
    if (records.length === 0) {
      return {
        totalExpectedAsset: 0,
        totalMonthlyPayment: 0,
        hasMaturedInvestments: false
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

    // 선택한 기간보다 만기가 짧은 투자가 있는지 확인
    const hasMaturedInvestments = records.some(record => record.period_years < selectedYear)

    return {
      totalExpectedAsset,
      totalMonthlyPayment,
      hasMaturedInvestments
    }
  }, [records, selectedYear])

  // 필터링 및 정렬된 투자 목록
  const filteredAndSortedRecords = useMemo(() => {
    let filtered = records

    // 필터링
    if (filterStatus === 'ACTIVE') {
      filtered = records.filter(item => {
        const startDate = getStartDate(item)
        return !isCompleted(startDate, item.period_years)
      })
    } else if (filterStatus === 'ENDED') {
      filtered = records.filter(item => {
        const startDate = getStartDate(item)
        return isCompleted(startDate, item.period_years)
      })
    }

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'TOTAL_VALUE') {
        const R_a = a.annual_rate ? a.annual_rate / 100 : 0.10
        const R_b = b.annual_rate ? b.annual_rate / 100 : 0.10
        const value_a = calculateSimulatedValue(a.monthly_amount, a.period_years, a.period_years, R_a)
        const value_b = calculateSimulatedValue(b.monthly_amount, b.period_years, b.period_years, R_b)
        return value_b - value_a // 내림차순
      } else if (sortBy === 'MONTHLY_PAYMENT') {
        return b.monthly_amount - a.monthly_amount // 내림차순
      } else if (sortBy === 'NAME') {
        return a.title.localeCompare(b.title, 'ko') // 오름차순
      }
      return 0
    })

    return sorted
  }, [records, filterStatus, sortBy, calculateSimulatedValue])

  useEffect(() => {
    const el = bannerRef.current
    if (!el) return

    const handleScroll = () => {
      const width = el.clientWidth || 1
      const next = Math.max(0, Math.min(1, Math.round(el.scrollLeft / width))) as 0 | 1
      setBannerIndex(next)
    }

    handleScroll()
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

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

      <div className="max-w-md mx-auto px-4 py-4 space-y-3">
        {/* 상단 배너 (2장 가로 스크롤) */}
        <div className="relative overflow-hidden rounded-3xl">
          {/* 페이지네이션 점 (우측 상단) */}
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
            <button
              type="button"
              aria-label="배너 1"
              onClick={() => bannerRef.current?.scrollTo({ left: 0, behavior: 'smooth' })}
              className={`h-2 w-2 rounded-full transition-colors ${bannerIndex === 0 ? 'bg-brand-600' : 'bg-coolgray-200'}`}
            />
            <button
              type="button"
              aria-label="배너 2"
              onClick={() => {
                const el = bannerRef.current
                if (!el) return
                el.scrollTo({ left: el.clientWidth, behavior: 'smooth' })
              }}
              className={`h-2 w-2 rounded-full transition-colors ${bannerIndex === 1 ? 'bg-brand-600' : 'bg-coolgray-200'}`}
            />
          </div>

          <div
            ref={bannerRef}
            className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {/* 배너 1: 예상 자산 */}
            <div className="min-w-full snap-start bg-white p-6 relative">
              <div className="space-y-3 pb-12">
                <div className="flex items-center gap-3 text-coolgray-700 text-lg font-medium">
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
                  <span className="text-coolgray-700 font-semibold">예상 자산</span>
                </div>

                <div className="text-coolgray-900 text-2xl font-extrabold tracking-tight leading-tight">
                  {user && records.length > 0
                    ? formatCurrency(totalExpectedAsset)
                    : '0만원'}
                </div>

                {/* 만기 안내 문구 - 클릭하면 상세 시트 오픈 */}
                {hasMaturedInvestments && records.length > 0 && (
                  <button
                    onClick={() => setShowCashHoldSheet(true)}
                    className="flex items-center gap-1.5 w-full text-left group"
                  >
                    <IconInfoCircle className="w-4 h-4 text-coolgray-400 flex-shrink-0 group-hover:text-coolgray-500 transition-colors" />
                    <p className="text-xs text-coolgray-400 leading-relaxed group-hover:text-coolgray-500 transition-colors">
                      만기가 지난 상품은 현금으로 보관한다고 가정했어요.
                    </p>
                  </button>
                )}
              </div>

              {/* 월 납입 요약 pill (우측 하단) */}
              {records.length > 0 && (
                <button
                  onClick={() => setShowContributionSheet(true)}
                  className="absolute right-6 bottom-6 inline-flex items-center rounded-full border border-brand-600 bg-brand-50 text-brand-700 font-semibold text-sm px-3 py-1.5 hover:bg-brand-100 transition-colors"
                >
                  월 {formatCurrency(totalMonthlyPayment)}씩 심는 중
                </button>
              )}
            </div>

            {/* 배너 2: 임시 텍스트 */}
            <div className="min-w-full snap-start bg-white p-6 flex items-center justify-center">
              <p className="text-coolgray-700 font-semibold">2번째 배너입니다.</p>
            </div>
          </div>
        </div>

        {/* 투자 목록 추가하기 버튼 */}

        <button 
          onClick={() => {
            // sendGAEvent('event', 'click_add_investment_start')
            router.push('/add')
          }}
          className="w-full bg-brand-600 text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-brand-700 transition-colors"
        >
          <IconPlus className="w-5 h-5" />
          투자 목록 추가하기
        </button>

        {/* 하단 리스트 카드 */}
        {records.length > 0 ? (
            <div className="bg-white rounded-3xl p-6">
              <h2 className="text-lg font-bold text-coolgray-900 mb-4">
                내 투자 목록
              </h2>
              
              {/* 필터 및 정렬 컨트롤 바 */}
              <div className="flex items-center justify-between mb-4 gap-2">
                {/* 필터 칩 */}
                <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
                  <button
                    onClick={() => setFilterStatus('ALL')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      filterStatus === 'ALL'
                        ? 'bg-coolgray-900 text-white'
                        : 'bg-coolgray-25 text-coolgray-600 hover:bg-coolgray-50'
                    }`}
                  >
                    전체
                  </button>
                  <button
                    onClick={() => setFilterStatus('ACTIVE')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      filterStatus === 'ACTIVE'
                        ? 'bg-coolgray-900 text-white'
                        : 'bg-coolgray-25 text-coolgray-600 hover:bg-coolgray-50'
                    }`}
                  >
                    진행 중
                  </button>
                  <button
                    onClick={() => setFilterStatus('ENDED')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      filterStatus === 'ENDED'
                        ? 'bg-coolgray-900 text-white'
                        : 'bg-coolgray-25 text-coolgray-600 hover:bg-coolgray-50'
                    }`}
                  >
                    종료
                  </button>
                </div>

                {/* 정렬 드롭다운 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-coolgray-600 hover:text-coolgray-900 transition-colors whitespace-nowrap">
                      {sortBy === 'TOTAL_VALUE' && '평가금액 순'}
                      {sortBy === 'MONTHLY_PAYMENT' && '월 투자액 순'}
                      {sortBy === 'NAME' && '이름 순'}
                      <IconChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[140px]">
                    <DropdownMenuItem onClick={() => setSortBy('TOTAL_VALUE')}>
                      평가금액 순
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('MONTHLY_PAYMENT')}>
                      월 투자액 순
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('NAME')}>
                      이름 순
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div>
                {filteredAndSortedRecords.length > 0 ? (
                  filteredAndSortedRecords.map((item) => (
                    <InvestmentItem
                      key={item.id}
                      item={item}
                      onClick={() => setDetailItem(item)}
                      calculateFutureValue={calculateSimulatedValue}
                    />
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-coolgray-400 text-sm">
                      {filterStatus === 'ACTIVE' && '진행 중인 투자가 없습니다'}
                      {filterStatus === 'ENDED' && '종료된 투자가 없습니다'}
                      {filterStatus === 'ALL' && '투자가 없습니다'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-6">
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

      {/* 현금 보관 항목 시트 */}
      {showCashHoldSheet && (
        <CashHoldItemsSheet
          items={records}
          selectedYear={selectedYear}
          onClose={() => setShowCashHoldSheet(false)}
          calculateFutureValue={calculateSimulatedValue}
        />
      )}

      {/* 월 납입 내역 시트 */}
      {showContributionSheet && (
        <MonthlyContributionSheet
          items={records}
          totalAmount={totalMonthlyPayment}
          onClose={() => setShowContributionSheet(false)}
        />
      )}

      {/* 투자 상세 페이지 */}
      {detailItem && (
        <InvestmentDetailView
          item={detailItem}
          onBack={() => setDetailItem(null)}
          onUpdate={async (data) => {
            try {
              setIsUpdating(true)
              
              // 예상 금액 재계산
              const R = data.annual_rate / 100
              const monthlyRate = R / 12
              const totalMonths = data.period_years * 12
              const finalAmount = data.monthly_amount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)

              const { error } = await supabase
                .from('records')
                .update({
                  monthly_amount: data.monthly_amount,
                  period_years: data.period_years,
                  annual_rate: data.annual_rate,
                  // 수익률을 수정 화면에서 저장한 경우: 직접 입력/수정으로 간주
                  is_custom_rate:
                    (detailItem.is_custom_rate ?? false) ||
                    data.annual_rate !== detailItem.annual_rate,
                  final_amount: finalAmount,
                  investment_days: data.investment_days || null,
                })
                .eq('id', detailItem.id)

              if (error) throw error

              // 수정 성공 시 로컬 state 업데이트
              setRecords(prevRecords => 
                prevRecords.map(record => 
                  record.id === detailItem.id 
                    ? { 
                        ...record, 
                        monthly_amount: data.monthly_amount,
                        period_years: data.period_years,
                        annual_rate: data.annual_rate,
                        investment_days: data.investment_days,
                        is_custom_rate:
                          (record.is_custom_rate ?? false) ||
                          data.annual_rate !== detailItem.annual_rate,
                      }
                    : record
                )
              )
              // detailItem도 업데이트
              setDetailItem(prev => prev ? {
                ...prev,
                monthly_amount: data.monthly_amount,
                period_years: data.period_years,
                annual_rate: data.annual_rate,
                investment_days: data.investment_days,
                is_custom_rate:
                  (prev.is_custom_rate ?? false) ||
                  data.annual_rate !== detailItem.annual_rate,
              } : null)
            } catch (error) {
              console.error('수정 오류:', error)
              alert('수정 중 오류가 발생했습니다.')
            } finally {
              setIsUpdating(false)
            }
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
          isUpdating={isUpdating}
          calculateFutureValue={calculateSimulatedValue}
        />
      )}

    </main>
  )
}
