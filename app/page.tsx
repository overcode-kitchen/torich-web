"'use client'\n\nimport { useState, useEffect, useMemo } from 'react'\nimport Image from 'next/image'\nimport { useRouter } from 'next/navigation'\nimport Link from 'next/link'\nimport { createClient } from '@/utils/supabase/client'\nimport { IconPlus, IconLoader2, IconChevronDown } from '@tabler/icons-react'\nimport { Button } from '@/components/ui/button'\nimport {\n  DropdownMenu,\n  DropdownMenuTrigger,\n  DropdownMenuContent,\n  DropdownMenuItem,\n} from '@/components/ui/dropdown-menu'"
'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { IconPlus, IconLoader2, IconChevronDown, IconX } from '@tabler/icons-react'
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
import UpcomingInvestments from '@/app/components/UpcomingInvestments'
import { isCompleted, getDaysUntilNextPayment } from '@/app/utils/date'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [records, setRecords] = useState<Investment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false) // 삭제 중 상태
  const [isUpdating, setIsUpdating] = useState(false) // 수정 중 상태
  const [detailItem, setDetailItem] = useState<Investment | null>(null) // 상세 보기 아이템
  const [isUpdatingRates, setIsUpdatingRates] = useState(false) // 수익률 갱신 중 상태
  const [showRateUpdateToast, setShowRateUpdateToast] = useState(false) // 수익률 갱신 완료 토스트
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'ENDED'>('ACTIVE') // 필터 상태
  const [sortBy, setSortBy] = useState<'TOTAL_VALUE' | 'MONTHLY_PAYMENT' | 'NAME' | 'NEXT_PAYMENT'>('TOTAL_VALUE') // 정렬 기준
  const [showMonthlyAmount, setShowMonthlyAmount] = useState(true)
  const [isBrandStoryOpen, setIsBrandStoryOpen] = useState(false)
  const [showBrandStoryCard, setShowBrandStoryCard] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('torich_show_monthly_amount')
      setShowMonthlyAmount(stored === null ? true : stored === '1')
    }
  }, [])

  const toggleMonthlyAmountVisibility = () => {
    const next = !showMonthlyAmount
    setShowMonthlyAmount(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem('torich_show_monthly_amount', next ? '1' : '0')
    }
  }

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

  // 월 납입 총액
  const totalMonthlyPayment = useMemo(() => {
    return records.reduce((sum, record) => sum + record.monthly_amount, 0)
  }, [records])

  // 이번 달 납입 현황 (진행 중인 투자만)
  const activeRecords = useMemo(() => {
    return records.filter((r) => {
      const start = getStartDate(r)
      return !isCompleted(start, r.period_years)
    })
  }, [records])

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
      } else if (sortBy === 'NEXT_PAYMENT') {
        const d_a = getDaysUntilNextPayment(a.investment_days)
        const d_b = getDaysUntilNextPayment(b.investment_days)
        if (d_a === null && d_b === null) return 0
        if (d_a === null) return 1
        if (d_b === null) return -1
        return d_a - d_b // 오름차순 (가까운 결제일 먼저)
      }
      return 0
    })

    return sorted
  }, [records, filterStatus, sortBy, calculateSimulatedValue])

  // 수익률 갱신 필요 여부 체크 및 업데이트 함수
  const checkAndUpdateRates = async (userId: string) => {
    try {
      // 1. 갱신 필요 여부 확인
      const checkResponse = await fetch(`/api/update-user-rates?userId=${userId}`)
      const checkData = await checkResponse.json()

      if (!checkData.needsUpdate) {
        console.log('[Rate Update] 이미 최신 상태입니다.')
        return false
      }

      console.log('[Rate Update] 갱신이 필요합니다. 업데이트 시작...')
      setIsUpdatingRates(true)

      // 2. 수익률 업데이트 실행
      const updateResponse = await fetch('/api/update-user-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      const updateData = await updateResponse.json()

      if (updateData.success && updateData.updated) {
        console.log(`[Rate Update] 완료: ${updateData.updatedRecords}개 레코드 업데이트`)
        return true
      }

      return false
    } catch (error) {
      console.error('[Rate Update] 오류:', error)
      return false
    } finally {
      setIsUpdatingRates(false)
    }
  }

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

          // 수익률 갱신 필요 여부 체크 및 업데이트
          const wasUpdated = await checkAndUpdateRates(user.id)
          if (wasUpdated) {
            // 업데이트가 있었으면 데이터 다시 로드
            const { data: refreshedData } = await supabase
              .from('records')
              .select('*')
              .order('created_at', { ascending: false })
            
            if (refreshedData) {
              setRecords(refreshedData)
            }
            
            // 토스트 알림 표시
            setShowRateUpdateToast(true)
            setTimeout(() => setShowRateUpdateToast(false), 4000)
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

  // 수익률 갱신 중 로딩 UI (오버레이)
  if (isUpdatingRates) {
    return (
      <main className="min-h-screen bg-coolgray-25 flex flex-col items-center justify-center gap-4">
        <IconLoader2 className="w-10 h-10 animate-spin text-brand-600" />
        <p className="text-coolgray-600 text-sm">최신 데이터 반영 중...</p>
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
                매달 꾸준히 적립하면{'\n'}10년 뒤엔 얼마가 될까요?
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
      {/* 수익률 갱신 완료 토스트 */}
      {showRateUpdateToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-white border border-coolgray-200 rounded-xl px-4 py-3 shadow-lg flex items-center gap-2">
            <span className="text-lg">🐿️</span>
            <span className="text-sm text-coolgray-700">지난달 시장 데이터를 반영하여 예측을 업데이트했어요!</span>
          </div>
        </div>
      )}

      {/* 상단 헤더 */}
      <header className="h-[52px] flex items-center justify-between px-4">
        <h1 className="text-xl font-semibold tracking-tight text-coolgray-900">
          티끌모아 태산
        </h1>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* 다가오는 투자 섹션 */}
        {activeRecords.length > 0 && (
          <UpcomingInvestments records={activeRecords} />
        )}

        {/* 투자 목록 추가하기 버튼 */}
        <button 
          onClick={() => {
            // sendGAEvent('event', 'click_add_investment_start')
            router.push('/add')
          }}
          className="w-full bg-brand-600 text-white font-semibold rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-brand-700 transition-colors shadow-sm"
        >
          <IconPlus className="w-5 h-5" />
          투자 목록 추가하기
        </button>

        {/* 이번 달 투자금액 (금액만 가리기 가능) */}
        {records.length > 0 && totalMonthlyPayment > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-coolgray-50 bg-white px-4 py-3">
            <p className="text-sm font-medium text-coolgray-500">이번 달 투자금액</p>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-coolgray-900">
                {showMonthlyAmount ? formatCurrency(totalMonthlyPayment) : '••••••'}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={toggleMonthlyAmountVisibility}
                className="text-coolgray-500 hover:text-coolgray-700 hover:bg-coolgray-100 h-auto py-1 px-2"
              >
                {showMonthlyAmount ? '가리기' : '보기'}
              </Button>
            </div>
          </div>
        )}

        {/* 브랜드 스토리 - 텍스트만 보이고 바텀시트로 바로 오픈 (닫으면 메인에서 숨김) */}
        {showBrandStoryCard && (
          <div className="w-full flex items-center justify-between rounded-2xl bg-white px-4 py-3 border border-coolgray-50">
            <button
              type="button"
              onClick={() => setIsBrandStoryOpen(true)}
              className="flex-1 flex flex-col items-start text-left"
            >
              <span className="text-coolgray-900 font-medium">토리치가 궁금하다면</span>
              <span className="text-sm text-coolgray-500 mt-0.5">
                이름에 담긴 의미와 우리가 추구하는 방향을 소개해요.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setShowBrandStoryCard(false)}
              className="ml-2 p-1 text-coolgray-400 hover:text-coolgray-700 transition-colors"
              aria-label="브랜드 스토리 카드 닫기"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 브랜드 스토리 바텀시트 (홈) */}
        {isBrandStoryOpen && (
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="토리치 브랜드 스토리"
            onClick={() => setIsBrandStoryOpen(false)}
          >
            <div
              className="bg-white rounded-t-3xl max-h-[80vh] max-w-md mx-auto w-full shadow-xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mt-3 mb-3 h-1 w-10 rounded-full bg-coolgray-200 shrink-0" />
              <div className="flex-1 overflow-y-auto scrollbar-thin px-6 pb-4 pt-1 min-h-0">
                <div className="mb-4">
                  <div className="relative w-full">
                    <Image
                      src="/torich-squirrel.png"
                      alt="도토리를 모으는 토리치 람쥐 일러스트"
                      width={368}
                      height={460}
                      className="w-full h-auto rounded-xl"
                      priority
                    />
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-coolgray-900 mb-3">
                  토리치(Torich)는 &quot;(도)토리 + 리치&quot;의 합성어예요.
                </h2>
                <div className="space-y-3 text-sm leading-relaxed text-coolgray-700">
                  <p>
                    도토리를 조금씩 모으듯, 작은 투자와 저축이 쌓여 언젠가 &quot;리치&quot;한 삶으로 이어진다는
                    믿음에서 시작된 이름이에요. 한 번에 큰 결심을 요구하기보다는, 오늘 할 수 있는 가장 작고 부드러운
                    한 걸음을 도와주는 투자 동반자를 지향합니다.
                  </p>
                  <p>
                    토리치는 어려운 전문 용어보다 &quot;적립식 투자&quot;를 쉽게 시작하고, 꾸준히 이어갈 수 있게
                    도와주는 서비스예요. 캘린더와 그래프, 목표 금액과 투자 기록을 통해 &quot;나는 얼마나 잘 쌓아가고
                    있는가&quot;를 한눈에 확인할 수 있도록 설계했어요.
                  </p>
                  <div className="pt-1">
                    <p className="text-coolgray-900 font-medium mb-1">우리가 사용자에게 바라는 것</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>단기 수익보다, 내가 원하는 삶의 속도와 방향을 먼저 떠올리기</li>
                      <li>완벽한 투자자가 되기보다, 꾸준한 투자자가 되기</li>
                      <li>숫자에 쫓기지 않고, 숫자를 통해 마음이 편안해지는 경험을 쌓기</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="shrink-0 px-6 pb-6 pt-4 bg-white rounded-b-3xl">
                <Button
                  type="button"
                  onClick={() => setIsBrandStoryOpen(false)}
                  size="lg"
                  className="w-full"
                >
                  닫기
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 내 투자 목록 카드 */}
        {records.length > 0 ? (
            <div className="bg-white rounded-3xl p-6">
              <h2 className="text-lg font-semibold tracking-tight text-coolgray-900 mb-4">
                내 투자 목록
              </h2>
              
              {/* 필터 및 정렬 컨트롤 바 */}
              <div className="flex items-center justify-between mb-4 gap-2">
                {/* 필터 칩 */}
                <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
                  <button
                    onClick={() => setFilterStatus('ALL')}
                    className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${
                      filterStatus === 'ALL'
                        ? 'bg-coolgray-900 text-white font-medium'
                        : 'bg-coolgray-25 text-coolgray-600 hover:bg-coolgray-50 font-normal'
                    }`}
                  >
                    전체
                  </button>
                  <button
                    onClick={() => setFilterStatus('ACTIVE')}
                    className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${
                      filterStatus === 'ACTIVE'
                        ? 'bg-coolgray-900 text-white font-medium'
                        : 'bg-coolgray-25 text-coolgray-600 hover:bg-coolgray-50 font-normal'
                    }`}
                  >
                    진행 중
                  </button>
                  <button
                    onClick={() => setFilterStatus('ENDED')}
                    className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${
                      filterStatus === 'ENDED'
                        ? 'bg-coolgray-900 text-white font-medium'
                        : 'bg-coolgray-25 text-coolgray-600 hover:bg-coolgray-50 font-normal'
                    }`}
                  >
                    종료
                  </button>
                </div>

                {/* 정렬 드롭다운 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-coolgray-500 hover:text-coolgray-900 transition-colors whitespace-nowrap">
                      {sortBy === 'TOTAL_VALUE' && '평가금액 순'}
                      {sortBy === 'MONTHLY_PAYMENT' && '월 투자액 순'}
                      {sortBy === 'NAME' && '이름 순'}
                      {sortBy === 'NEXT_PAYMENT' && '다음 투자일 순'}
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
                    <DropdownMenuItem onClick={() => setSortBy('NEXT_PAYMENT')}>
                      다음 투자일 순
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

        {/* 통계 보기 링크 - 예상 자산·수익 차트는 /stats에서 */}
        {records.length > 0 && (
          <Link
            href="/stats"
            className="block text-center py-3 text-sm text-coolgray-500 hover:text-coolgray-700 transition-colors"
          >
            예상 자산 · 수익 차트 보기 →
          </Link>
        )}
      </div>

      {/* 투자 상세 페이지 */}
      {detailItem && (
        <InvestmentDetailView
          item={detailItem}
          onBack={() => setDetailItem(null)}
          onUpdate={async (data) => {
            try {
              if (!detailItem) {
                throw new Error('투자 정보를 찾을 수 없습니다.')
              }
              
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
                  investment_days: data.investment_days !== undefined 
                    ? (Array.isArray(data.investment_days) && data.investment_days.length > 0 ? data.investment_days : null)
                    : null,
                })
                .eq('id', detailItem.id)

              if (error) {
                console.error('Supabase 업데이트 에러:', {
                  message: error.message,
                  details: error.details,
                  hint: error.hint,
                  code: error.code,
                })
                throw error
              }

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
              console.error('에러 타입:', typeof error)
              console.error('에러 객체:', JSON.stringify(error, null, 2))
              
              let errorMessage = '알 수 없는 오류가 발생했습니다.'
              if (error instanceof Error) {
                errorMessage = error.message
              } else if (error && typeof error === 'object') {
                // Supabase 에러 객체 처리
                if ('message' in error) {
                  errorMessage = String(error.message)
                } else if ('details' in error) {
                  errorMessage = String(error.details)
                } else {
                  errorMessage = JSON.stringify(error)
                }
              }
              
              alert(`수정 중 오류가 발생했습니다: ${errorMessage}`)
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
