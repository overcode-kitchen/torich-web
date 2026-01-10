'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { IconArrowLeft, IconLoader2 } from '@tabler/icons-react'
import { createClient } from '@/utils/supabase/client'
import { sendGAEvent } from '@next/third-parties/google'

// 검색 결과 (간단한 정보만)

interface SearchResult {
  symbol: string
  name: string
  group?: string
}

// 선택된 종목의 상세 정보
interface StockDetail {
  symbol: string
  name: string
  averageRate: number
  currentPrice: number
}

export default function AddInvestmentPage() {
  const router = useRouter()
  const [stockName, setStockName] = useState('')
  const [monthlyAmount, setMonthlyAmount] = useState('')
  const [period, setPeriod] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  // 주식 검색 관련 상태
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedStock, setSelectedStock] = useState<StockDetail | null>(null)
  const [annualRate, setAnnualRate] = useState(10) // 기본 10%

  // 체류 시간 추적
  useEffect(() => {
    const startTime = Date.now()

    return () => {
      const endTime = Date.now()
      const timeSpent = Math.round((endTime - startTime) / 1000) // 초 단위로 변환
      sendGAEvent('event', 'time_spent_add_page', { value: timeSpent })
    }
  }, [])

  useEffect(() => {
    // 로그인한 유저 정보 가져오기
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      } else {
        // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
        router.push('/login')
      }
    }
    getUser()
  }, [router])

  // 주식 검색 (Debounce 적용)
  useEffect(() => {
    // 선택된 종목이 있으면 검색하지 않음 (드롭다운 재오픈 방지)
    if (selectedStock) {
      return
    }

    // 입력이 없거나 너무 짧으면 검색하지 않음
    if (!stockName.trim() || stockName.trim().length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    // Debounce: 0.5초 후 검색 실행
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true)
        setShowDropdown(false)
        
        // 새로운 Search API 호출 (빠른 DB 조회만)
        const response = await fetch(`/api/search?query=${encodeURIComponent(stockName.trim())}`)
        const data = await response.json()
        
        if (response.ok && data.stocks && data.stocks.length > 0) {
          setSearchResults(data.stocks)
          setShowDropdown(true)
        } else {
          setSearchResults([])
          setShowDropdown(false)
        }
      } catch (error) {
        console.error('주식 검색 오류:', error)
        setSearchResults([])
        setShowDropdown(false)
      } finally {
        setIsSearching(false)
      }
    }, 500)

    // Cleanup: 컴포넌트 unmount 또는 stockName 변경 시 타이머 제거
    return () => clearTimeout(timer)
  }, [stockName, selectedStock])

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // 드롭다운 영역이나 입력 필드 내부 클릭은 무시
      if (target.closest('.stock-search-container')) {
        return
      }
      setShowDropdown(false)
    }

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showDropdown])

  // 복리 계산 함수 (동적 수익률 적용)
  const calculateFinalAmount = (monthlyAmount: number, periodYears: number, rate: number): number => {
    const monthlyRate = rate / 12 / 100 // 월 이율
    const totalMonths = periodYears * 12 // 총 개월 수

    // 기납입액 기준 월복리 계산: 월납입금 * ((1 + r)^n - 1) / r * (1 + r)
    const finalAmount = monthlyAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)
    
    return Math.round(finalAmount)
  }

  // 종목 선택 핸들러 (상세 정보 조회)
  const handleSelectStock = async (stock: SearchResult) => {
    try {
      // 드롭다운 닫고 임시 선택 상태 설정 (검색 재실행 방지)
      setShowDropdown(false)
      setSelectedStock({
        symbol: stock.symbol,
        name: stock.name,
        averageRate: 0,
        currentPrice: 0
      })
      setStockName(stock.name)
      setIsSearching(true)

      // Stock API 호출하여 상세 정보 조회 (Yahoo Finance 데이터)
      const response = await fetch(`/api/stock?symbol=${encodeURIComponent(stock.symbol)}`)
      const data = await response.json()

      if (response.ok && data.averageRate) {
        // 실제 상세 정보로 업데이트
        setSelectedStock(data)
        setAnnualRate(data.averageRate)
      } else {
        // 상세 정보 조회 실패 시 기본값 사용
        console.warn('상세 정보 조회 실패, 기본값 사용')
        setSelectedStock(null)
        setAnnualRate(10)
      }
    } catch (error) {
      console.error('상세 정보 조회 오류:', error)
      setSelectedStock(null)
      setAnnualRate(10)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 유효성 검사
    if (!stockName.trim()) {
      alert('종목명을 입력해주세요.')
      return
    }
    if (!monthlyAmount || parseInt(monthlyAmount) <= 0) {
      alert('월 투자액을 입력해주세요.')
      return
    }
    if (!period || parseInt(period) <= 0) {
      alert('투자 기간을 입력해주세요.')
      return
    }
    if (!userId) {
      alert('로그인이 필요합니다.')
      router.push('/login')
      return
    }

    try {
      setIsSubmitting(true)

      const supabase = createClient()
      const monthlyAmountNum = parseInt(monthlyAmount)
      const periodYearsNum = parseInt(period)
      // 검색으로 선택한 수익률 또는 기본값(10%) 사용
      const finalAmount = calculateFinalAmount(monthlyAmountNum, periodYearsNum, annualRate)

      // Supabase에 데이터 저장
      const { error } = await supabase
        .from('records')
        .insert({
          user_id: userId,
          title: stockName.trim(),
          monthly_amount: monthlyAmountNum,
          period_years: periodYearsNum,
          annual_rate: annualRate, // 실제 조회된 수익률 저장
          final_amount: finalAmount,
        })

      if (error) {
        console.error('저장 오류:', error)
        alert('저장에 실패했습니다. 다시 시도해주세요.')
        return
      }

      // 저장 완료 이벤트 전송
      sendGAEvent('event', 'click_add_investment_complete')

      // 성공 시 메인으로 이동
      router.refresh()
      router.push('/')
    } catch (error) {
      console.error('저장 오류:', error)
      alert('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 숫자만 입력받는 핸들러
  const handleNumericInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void
  ) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setter(value)
  }

  return (
    <main className="min-h-screen bg-coolgray-25">
      {/* 뒤로가기 버튼 */}
      <header className="h-[52px] flex items-center px-4">
        <button
          onClick={() => router.back()}
          className="p-2 text-coolgray-700 hover:text-coolgray-900 transition-colors"
          aria-label="뒤로가기"
        >
          <IconArrowLeft className="w-6 h-6" />
        </button>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* 상단 헤더 텍스트 */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-coolgray-900 mb-3">
            람쥐씨, 어떤 꿈을 꾸고 계신가요?
          </h1>
          <p className="text-sm text-coolgray-400 whitespace-pre-line">
            매달 꾸준히 모았을 때,{'\n'}10년 뒤 얼마가 될지 바로 보여드릴게요.
          </p>
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          {/* 종목명 입력 (검색 기능 포함) */}
          <div className="relative stock-search-container">
            <input
              type="text"
              value={stockName}
              onChange={(e) => {
                setStockName(e.target.value)
                setSelectedStock(null) // 입력 변경 시 선택 초기화
                setAnnualRate(10) // 기본값으로 리셋
              }}
              placeholder="S&P 500"
              className="w-full bg-white rounded-2xl p-5 pr-12 text-coolgray-900 placeholder-coolgray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              autoComplete="off"
            />
            
            {/* 로딩 스피너 */}
            {isSearching && (
              <div className="absolute right-5 top-1/2 -translate-y-1/2">
                <IconLoader2 className="w-5 h-5 animate-spin text-brand-600" />
              </div>
            )}

            {/* 드롭다운 검색 결과 */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-coolgray-100 overflow-hidden z-10 max-h-80 overflow-y-auto">
                {searchResults.map((stock) => (
                  <button
                    key={stock.symbol}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectStock(stock)
                    }}
                    className="w-full px-5 py-4 text-left hover:bg-coolgray-50 transition-colors border-b border-coolgray-100 last:border-b-0"
                  >
                    <div className="font-medium text-coolgray-900">
                      {stock.name}
                    </div>
                    <div className="text-sm text-coolgray-500 mt-1">
                      {stock.symbol}
                      {stock.group && ` · ${stock.group}`}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 선택된 종목 안내 문구 */}
          {selectedStock && (
            <div className="text-sm text-brand-600 font-medium flex items-center gap-1">
              <span>📊</span>
              <span>지난 10년 평균 수익률 {selectedStock.averageRate}%가 적용되었어요!</span>
            </div>
          )}

          {/* 월 투자액 입력 */}
          <input
            type="text"
            value={monthlyAmount}
            onChange={(e) => handleNumericInput(e, setMonthlyAmount)}
            placeholder="10만원씩"
            className="w-full bg-white rounded-2xl p-5 text-coolgray-900 placeholder-coolgray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          {/* 투자 기간 입력 */}
          <input
            type="text"
            value={period}
            onChange={(e) => handleNumericInput(e, setPeriod)}
            placeholder="3년간"
            className="w-full bg-white rounded-2xl p-5 text-coolgray-900 placeholder-coolgray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>

        {/* 저장하기 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-coolgray-800 text-white font-medium rounded-xl py-4 hover:bg-coolgray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <IconLoader2 className="w-5 h-5 animate-spin" />
              <span>저장 중...</span>
            </>
          ) : (
            '저장하기'
          )}
        </button>
      </div>
    </main>
  )
}

