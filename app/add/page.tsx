'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { IconArrowLeft, IconLoader2, IconInfoCircle, IconX } from '@tabler/icons-react'
import { createClient } from '@/utils/supabase/client'
// import { sendGAEvent } from '@next/third-parties/google'

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
  const [startDate, setStartDate] = useState(() => {
    // 기본값: 오늘 날짜 (YYYY-MM-DD 형식)
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [investmentDays, setInvestmentDays] = useState<number[]>([]) // 매월 투자하는 날짜들
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  // 주식 검색 관련 상태
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedStock, setSelectedStock] = useState<StockDetail | null>(null)
  const [annualRate, setAnnualRate] = useState(10) // 기본 10%
  const [market, setMarket] = useState<'KR' | 'US'>('KR') // 기본값: 국내 주식
  
  // 직접 입력 모달 관련 상태
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const [manualStockName, setManualStockName] = useState('')
  const [manualRate, setManualRate] = useState('')
  const [isManualInput, setIsManualInput] = useState(false) // 직접 입력 모드 플래그
  
  // 수익률 안내 모달 상태
  const [isRateHelpModalOpen, setIsRateHelpModalOpen] = useState(false)
  
  // 수익률 인라인 수정 상태
  const [isRateEditing, setIsRateEditing] = useState(false)
  const [editingRate, setEditingRate] = useState('')
  const [originalSystemRate, setOriginalSystemRate] = useState<number | null>(null) // 시스템에서 가져온 원본 수익률

  // 체류 시간 추적
  useEffect(() => {
    const startTime = Date.now()

    return () => {
      const endTime = Date.now()
      const timeSpent = Math.round((endTime - startTime) / 1000) // 초 단위로 변환
      // sendGAEvent('event', 'time_spent_add_page', { value: timeSpent })
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
    // Guard Clause: 직접 입력 모드일 때는 검색하지 않음
    if (isManualInput) {
      return
    }

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
        
        // Search API 호출 (market 파라미터 포함)
        const response = await fetch(`/api/search?query=${encodeURIComponent(stockName.trim())}&market=${market}`)
        const data = await response.json()
        
        if (response.ok && data.stocks && data.stocks.length > 0) {
          setSearchResults(data.stocks)
          setShowDropdown(true)
        } else {
          setSearchResults([])
          setShowDropdown(true) // 검색 결과 없을 때도 드롭다운 열어서 "직접 입력하기" 버튼 표시
        }
      } catch (error) {
        console.error('주식 검색 오류:', error)
        setSearchResults([])
        setShowDropdown(false)
      } finally {
        setIsSearching(false)
      }
    }, 500)

    // Cleanup: 컴포넌트 unmount 또는 stockName/market 변경 시 타이머 제거
    return () => clearTimeout(timer)
  }, [stockName, selectedStock, market, isManualInput])

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
        setOriginalSystemRate(data.averageRate) // 원본 시스템 수익률 저장
      } else {
        // 상세 정보 조회 실패 시 기본값 사용
        console.warn('상세 정보 조회 실패, 기본값 사용')
        setSelectedStock(null)
        setAnnualRate(10)
        setOriginalSystemRate(null)
      }
    } catch (error) {
      console.error('상세 정보 조회 오류:', error)
      setSelectedStock(null)
      setAnnualRate(10)
      setOriginalSystemRate(null)
    } finally {
      setIsSearching(false)
    }
  }

  // 직접 입력 확인 핸들러
  const handleManualConfirm = () => {
    if (!manualStockName.trim()) {
      alert('종목 이름을 입력해주세요.')
      return
    }
    if (!manualRate || parseFloat(manualRate) <= 0) {
      alert('예상 수익률을 입력해주세요.')
      return
    }

    // 메인 폼에 적용 (순서 중요: isManualInput을 먼저 설정)
    setIsManualInput(true) // 1. 직접 입력 모드 활성화 (검색 방지)
    setStockName(manualStockName) // 2. 종목명 설정
    setAnnualRate(parseFloat(manualRate)) // 3. 수익률 설정
    setSelectedStock(null) // 4. 선택 상태 초기화
    
    // 모달 닫기 및 초기화
    setIsManualModalOpen(false)
    setManualStockName('')
    setManualRate('')
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
      // 콤마 제거 후 숫자로 변환하고 만원 단위로 처리 (원 단위로 변환)
      const monthlyAmountInWon = parseInt(monthlyAmount.replace(/,/g, '')) * 10000
      const periodYearsNum = parseInt(period)
      // 검색으로 선택한 수익률 또는 기본값(10%) 사용
      const finalAmount = calculateFinalAmount(monthlyAmountInWon, periodYearsNum, annualRate)

      // Supabase에 데이터 저장 (만원 단위를 원 단위로 변환하여 저장)
      const { error } = await supabase
        .from('records')
        .insert({
          user_id: userId,
          title: stockName.trim(),
          monthly_amount: monthlyAmountInWon,
          period_years: periodYearsNum,
          annual_rate: annualRate, // 실제 조회된 수익률 저장
          final_amount: finalAmount,
          start_date: startDate, // 투자 시작일
          investment_days: investmentDays.length > 0 ? investmentDays : null, // 매월 투자일
        })

      if (error) {
        console.error('저장 오류:', error)
        alert('저장에 실패했습니다. 다시 시도해주세요.')
        return
      }

      // 저장 완료 이벤트 전송
      // sendGAEvent('event', 'click_add_investment_complete')

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

  // 숫자만 입력받는 핸들러 (기간용)
  const handleNumericInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void
  ) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setter(value)
  }

  // 금액 입력 핸들러 (천 단위 콤마 포맷팅)
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 숫자만 추출
    const value = e.target.value.replace(/[^0-9]/g, '')
    
    if (value === '') {
      setMonthlyAmount('')
      return
    }

    // 천 단위 콤마 추가
    const formatted = parseInt(value).toLocaleString('ko-KR')
    setMonthlyAmount(formatted)
  }

  // 월 투자금액 조절 함수 (만원 단위)
  const adjustAmount = (delta: number) => {
    // 현재 값을 숫자로 변환 (콤마 제거 후 만원 단위로 해석)
    const currentValue = monthlyAmount ? parseInt(monthlyAmount.replace(/,/g, '')) : 0
    const newValue = Math.max(0, currentValue + delta) // 최소 0
    
    if (newValue === 0) {
      setMonthlyAmount('')
    } else {
      // 천 단위 콤마 추가
      setMonthlyAmount(newValue.toLocaleString('ko-KR'))
    }
  }

  // 투자 기간 조절 함수 (년 단위)
  const adjustPeriod = (delta: number) => {
    // 현재 값을 숫자로 변환
    const currentValue = period ? parseInt(period) : 0
    const newValue = Math.max(1, currentValue + delta) // 최소 1년
    
    setPeriod(newValue.toString())
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

        {/* 마켓 선택 탭 */}
        <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button
            type="button"
            onClick={() => {
              if (market !== 'KR') {
                setMarket('KR')
                // 종목명과 수익률 관련 데이터 초기화
                setStockName('')
                setSelectedStock(null)
                setAnnualRate(10)
                setOriginalSystemRate(null)
                setIsRateEditing(false)
                setIsManualInput(false)
                setSearchResults([])
                setShowDropdown(false)
              }
            }}
            className={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              market === 'KR'
                ? 'bg-white text-coolgray-900 shadow-sm'
                : 'text-coolgray-500 hover:text-coolgray-700'
            }`}
          >
            🇰🇷 국내 주식
          </button>
          <button
            type="button"
            onClick={() => {
              if (market !== 'US') {
                setMarket('US')
                // 종목명과 수익률 관련 데이터 초기화
                setStockName('')
                setSelectedStock(null)
                setAnnualRate(10)
                setOriginalSystemRate(null)
                setIsRateEditing(false)
                setIsManualInput(false)
                setSearchResults([])
                setShowDropdown(false)
              }
            }}
            className={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              market === 'US'
                ? 'bg-white text-coolgray-900 shadow-sm'
                : 'text-coolgray-500 hover:text-coolgray-700'
            }`}
          >
            🇺🇸 미국 주식
          </button>
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          {/* 종목명 입력 (검색 기능 포함) */}
          <div>
            <div className="relative stock-search-container">
            <input
              type="text"
              value={stockName}
              onChange={(e) => {
                setIsManualInput(false) // 사용자가 다시 타이핑하면 검색 모드로 전환
                setStockName(e.target.value)
                setSelectedStock(null) // 입력 변경 시 선택 초기화
                setAnnualRate(10) // 기본값으로 리셋
                setOriginalSystemRate(null) // 원본 수익률 리셋
                setIsRateEditing(false) // 수정 모드 종료
              }}
              placeholder={market === 'KR' ? '삼성전자, TIGER...' : 'S&P 500, AAPL...'}
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

            {/* 검색 결과 없음 - 직접 입력 안내 */}
            {showDropdown && searchResults.length === 0 && !isSearching && stockName.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-coolgray-100 overflow-hidden z-10">
                <div className="px-5 py-4 text-center">
                  <p className="text-sm text-coolgray-500 mb-3">
                    찾으시는 종목이 없나요?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualModalOpen(true)
                      setManualStockName(stockName)
                      setShowDropdown(false)
                    }}
                    className="w-full bg-brand-600 text-white font-medium py-2 px-4 rounded-xl hover:bg-brand-700 transition-colors"
                  >
                    직접 입력하기
                  </button>
                </div>
              </div>
            )}
            </div>
            
            {/* 선택된 종목 안내 문구 - 종목 선택 필드 바로 아래 */}
            {selectedStock && (
              <div className="mt-2">
                {isRateEditing ? (
                  // 수정 모드
                  <div className="flex items-center gap-2 bg-coolgray-50 rounded-xl p-3">
                    <span className="text-sm text-coolgray-600">연 수익률</span>
                    <input
                      type="text"
                      value={editingRate}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '')
                        const parts = value.split('.')
                        if (parts.length <= 2) setEditingRate(value)
                      }}
                      className="w-16 text-center bg-white border border-coolgray-200 rounded-lg px-2 py-1 text-coolgray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="10"
                      autoFocus
                    />
                    <span className="text-sm text-coolgray-600">%</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newRate = parseFloat(editingRate)
                        if (newRate > 0) {
                          setAnnualRate(newRate)
                        }
                        setIsRateEditing(false)
                      }}
                      className="px-3 py-1 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
                    >
                      확인
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRateEditing(false)
                        setEditingRate('')
                      }}
                      className="px-3 py-1 bg-coolgray-200 text-coolgray-700 text-sm font-medium rounded-lg hover:bg-coolgray-300 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  // 표시 모드
                  <div className="text-sm font-medium flex items-center gap-1 flex-wrap">
                    {originalSystemRate !== null && annualRate !== originalSystemRate ? (
                      // 사용자가 수정한 경우
                      <>
                        <span className="text-purple-600">✏️</span>
                        <span className="text-purple-600">
                          수익률 {annualRate}%가 적용됩니다
                        </span>
                        <span className="text-xs text-coolgray-400 ml-1">
                          (시스템: {originalSystemRate}%)
                        </span>
                      </>
                    ) : (
                      // 시스템 수익률 그대로
                      <>
                        <span className="text-brand-600">📊</span>
                        <span className="text-brand-600">
                          지난 10년 평균 수익률 {annualRate}%가 적용되었어요!
                        </span>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsRateHelpModalOpen(true)}
                      className="p-1 flex items-center justify-center bg-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                      aria-label="수익률 계산 방식 안내"
                    >
                      <IconInfoCircle className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRate(annualRate.toString())
                        setIsRateEditing(true)
                      }}
                      className="px-2 py-0.5 bg-coolgray-100 text-coolgray-600 text-xs font-medium rounded-full hover:bg-coolgray-200 transition-colors ml-1"
                    >
                      수정
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* 직접 입력한 종목 안내 문구 - 종목 선택 필드 바로 아래 */}
            {isManualInput && stockName && (
              <div className="mt-2">
                {isRateEditing ? (
                  // 수정 모드
                  <div className="flex items-center gap-2 bg-coolgray-50 rounded-xl p-3">
                    <span className="text-sm text-coolgray-600">연 수익률</span>
                    <input
                      type="text"
                      value={editingRate}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '')
                        const parts = value.split('.')
                        if (parts.length <= 2) setEditingRate(value)
                      }}
                      className="w-16 text-center bg-white border border-coolgray-200 rounded-lg px-2 py-1 text-coolgray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="10"
                      autoFocus
                    />
                    <span className="text-sm text-coolgray-600">%</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newRate = parseFloat(editingRate)
                        if (newRate > 0) {
                          setAnnualRate(newRate)
                        }
                        setIsRateEditing(false)
                      }}
                      className="px-3 py-1 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
                    >
                      확인
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRateEditing(false)
                        setEditingRate('')
                      }}
                      className="px-3 py-1 bg-coolgray-200 text-coolgray-700 text-sm font-medium rounded-lg hover:bg-coolgray-300 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  // 표시 모드
                  <div className="text-sm text-purple-600 font-medium flex items-center gap-1">
                    <span>✏️</span>
                    <span>직접 입력한 수익률 {annualRate}%가 적용됩니다</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRate(annualRate.toString())
                        setIsRateEditing(true)
                      }}
                      className="px-2 py-0.5 bg-coolgray-100 text-coolgray-600 text-xs font-medium rounded-full hover:bg-coolgray-200 transition-colors ml-1"
                    >
                      수정
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 월 투자액 입력 (만원 단위) */}
          <div>
            <div className="relative">
              <input
                type="text"
                value={monthlyAmount}
                onChange={handleAmountChange}
                placeholder="월 100 (만원 단위)"
                className="w-full bg-white rounded-2xl p-5 pr-16 text-coolgray-900 placeholder-coolgray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-coolgray-500 font-medium">
                만원
              </span>
            </div>
            {/* 빠른 조절 버튼 */}
            <div className="flex flex-wrap gap-2 justify-start mt-2">
              <button
                type="button"
                onClick={() => adjustAmount(10)}
                className="rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-sm px-4 py-2 transition-colors"
              >
                +10
              </button>
              <button
                type="button"
                onClick={() => adjustAmount(-10)}
                className="rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-sm px-4 py-2 transition-colors"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => adjustAmount(1)}
                className="rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-sm px-4 py-2 transition-colors"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => adjustAmount(-1)}
                className="rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-sm px-4 py-2 transition-colors"
              >
                -1
              </button>
            </div>
          </div>

          {/* 투자 기간 입력 */}
          <div>
            <input
              type="text"
              value={period}
              onChange={(e) => handleNumericInput(e, setPeriod)}
              placeholder="3년간"
              className="w-full bg-white rounded-2xl p-5 text-coolgray-900 placeholder-coolgray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {/* 빠른 조절 버튼 */}
            <div className="flex flex-wrap gap-2 justify-start mt-2">
              <button
                type="button"
                onClick={() => adjustPeriod(5)}
                className="rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-sm px-4 py-2 transition-colors"
              >
                +5
              </button>
              <button
                type="button"
                onClick={() => adjustPeriod(-5)}
                className="rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-sm px-4 py-2 transition-colors"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => adjustPeriod(1)}
                className="rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-sm px-4 py-2 transition-colors"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => adjustPeriod(-1)}
                className="rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-sm px-4 py-2 transition-colors"
              >
                -1
              </button>
            </div>
          </div>

          {/* 투자 시작일 입력 */}
          <div>
            <label className="block text-sm font-medium text-coolgray-700 mb-2">
              투자 시작일
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white rounded-2xl p-5 text-coolgray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-coolgray-400 mt-1">
              투자를 시작한 날짜를 선택하세요. 기본값은 오늘입니다.
            </p>
          </div>

          {/* 매월 투자일 선택 */}
          <div>
            <label className="block text-sm font-medium text-coolgray-700 mb-2">
              매월 투자일 (선택)
            </label>
            <div className="bg-white rounded-2xl p-4">
              {/* 선택된 날짜 표시 */}
              {investmentDays.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {[...investmentDays].sort((a, b) => a - b).map((day) => (
                    <span
                      key={day}
                      className="inline-flex items-center gap-1 bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {day}일
                      <button
                        type="button"
                        onClick={() => setInvestmentDays(prev => prev.filter(d => d !== day))}
                        className="hover:text-brand-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* 날짜 선택 그리드 */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      if (investmentDays.includes(day)) {
                        setInvestmentDays(prev => prev.filter(d => d !== day))
                      } else {
                        setInvestmentDays(prev => [...prev, day])
                      }
                    }}
                    className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                      investmentDays.includes(day)
                        ? 'bg-brand-600 text-white'
                        : 'bg-coolgray-50 text-coolgray-700 hover:bg-coolgray-100'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-coolgray-400 mt-1">
              매월 투자하는 날짜를 선택하세요. 여러 날 선택 가능합니다.
            </p>
          </div>
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

      {/* 직접 입력 모달 */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 오버레이 */}
          <div 
            className="fixed inset-0 bg-black/50 animate-in fade-in-0"
            onClick={() => {
              setIsManualModalOpen(false)
              setManualStockName('')
              setManualRate('')
            }}
          />
          
          {/* 모달 컨텐츠 */}
          <div className="relative z-50 w-full max-w-md mx-4 bg-white rounded-lg shadow-lg border p-6 animate-in fade-in-0 zoom-in-95">
            {/* 닫기 버튼 */}
            <button
              onClick={() => {
                setIsManualModalOpen(false)
                setManualStockName('')
                setManualRate('')
              }}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-transparent hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="닫기"
            >
              <IconX className="w-5 h-5 text-gray-600" />
            </button>

            {/* 헤더 */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-coolgray-900">
                투자할 종목 직접 입력
              </h2>
            </div>
            
            <div className="space-y-4 py-4">
              {/* 종목명 입력 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-coolgray-900">
                  종목 이름
                </label>
                <input
                  type="text"
                  value={manualStockName}
                  onChange={(e) => setManualStockName(e.target.value)}
                  placeholder="예: 나만의 포트폴리오"
                  className="w-full bg-white border border-coolgray-200 rounded-xl p-3 text-coolgray-900 placeholder-coolgray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* 예상 수익률 입력 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-coolgray-900">
                    예상 연평균 수익률 (%)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsRateHelpModalOpen(true)}
                    className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
                    aria-label="수익률 계산 방식 안내"
                  >
                    <IconInfoCircle className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="number"
                  value={manualRate}
                  onChange={(e) => setManualRate(e.target.value)}
                  placeholder="10"
                  step="0.1"
                  min="0"
                  max="100"
                  className="w-full bg-white border border-coolgray-200 rounded-xl p-3 text-coolgray-900 placeholder-coolgray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-xs text-coolgray-500 leading-relaxed">
                  💡 잘 모르겠다면 S&P500 평균인 <strong>10%</strong>를 입력해보세요. 
                  보수적으로 잡고 싶다면 예금 금리 <strong>3%</strong>를 추천해요.
                </p>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsManualModalOpen(false)
                  setManualStockName('')
                  setManualRate('')
                }}
                className="flex-1 bg-coolgray-100 text-coolgray-700 font-medium py-3 rounded-xl hover:bg-coolgray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleManualConfirm}
                className="flex-1 bg-brand-600 text-white font-medium py-3 rounded-xl hover:bg-brand-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 수익률 계산 방식 안내 모달 */}
      {isRateHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 오버레이 */}
          <div 
            className="fixed inset-0 bg-black/50 animate-in fade-in-0"
            onClick={() => setIsRateHelpModalOpen(false)}
          />
          
          {/* 모달 컨텐츠 */}
          <div className="relative z-50 w-full max-w-md mx-4 bg-white rounded-lg shadow-lg border p-6 animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* 닫기 버튼 */}
            <button
              onClick={() => setIsRateHelpModalOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-transparent hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="닫기"
            >
              <IconX className="w-5 h-5 text-gray-600" />
            </button>

            {/* 헤더 */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-coolgray-900">
                수익률은 어떻게 계산되나요?
              </h2>
            </div>
            
            {/* 본문 내용 */}
            <div className="space-y-4 text-gray-700">
              {/* 1. 데이터 출처 */}
              <div>
                <h3 className="font-semibold text-coolgray-900 mb-2">
                  1. 데이터 출처
                </h3>
                <p>
                  세계적인 금융 데이터 플랫폼 <strong>Yahoo Finance</strong>의 <strong>과거 10년치 월봉 데이터</strong>를 기반으로 분석합니다.
                </p>
              </div>

              {/* 2. 계산 방식 */}
              <div>
                <h3 className="font-semibold text-coolgray-900 mb-2">
                  2. 계산 방식
                </h3>
                <p>
                  들쑥날쑥한 주가 변동을 매끄럽게 다듬은 <strong>연평균 성장률(CAGR)</strong>을 사용해요.
                </p>
              </div>

              {/* 3. 현실적인 안전장치 */}
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="font-semibold text-coolgray-900 mb-2 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>현실적인 안전장치 (중요!)</span>
                </h3>
                <p className="leading-relaxed">
                  과거에 50%, 100%씩 올랐던 종목이라도, 미래까지 그 속도로 오르는 것은 비현실적이에요.
                  <br /><br />
                  <strong>토리치는 '희망 고문' 대신 '현실적인 자산 목표'를 보여드리기 위해, 워렌 버핏의 장기 수익률 수준인 [연 최대 20%]까지만 예측에 반영합니다.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

