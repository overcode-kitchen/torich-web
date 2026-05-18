/**
 * FAQ 콘텐츠 — 카피 톤 가이드
 *
 * 1. 작성 순서: 원리 → 한계/가정 → 행위 가능성
 * 2. 능동 톤, 방어적 어휘 회피.
 *    ❌ "이 숫자는 정확하지 않을 수 있습니다."
 *    ✅ "진행률은 실제로 넣은 원금을 기준으로 해요."
 * 3. "보장하지 않습니다" 같은 부정 표현은 한 항목당 1회 이내.
 * 4. 공식·숫자는 plain text 한국어로 풀어 쓴다 — 백틱/코드블록 금지.
 * 5. 토리치 = 목적 중심 적립 습관 앱. 미래 수익 예측은 다루지 않는다.
 */

export type FAQCategoryId = 'basic' | 'usage' | 'caution'

export interface FAQCategory {
  id: FAQCategoryId
  label: string
}

export interface FAQItem {
  id: string
  categoryId: FAQCategoryId
  question: string
  /**
   * 답변 paragraph 배열. 각 paragraph는 plain text.
   * 인라인 코드/공식 사용 금지 (사용자 컨벤션).
   */
  answer: string[]
}

export const FAQ_CATEGORIES: FAQCategory[] = [
  { id: 'basic', label: '토리치 기본' },
  { id: 'usage', label: '사용법' },
  { id: 'caution', label: '유의사항' },
]

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'what-is-torich',
    categoryId: 'basic',
    question: '토리치는 어떤 앱인가요?',
    answer: [
      '토리치는 목적을 정하고, 그 목적을 위해 매달 꾸준히 돈을 모으는 적립 습관 앱이에요.',
      '결혼자금·내 집 마련처럼 모으고 싶은 목적을 만들고, 거기에 적립 항목을 연결해요.',
      '이번 달 넣어야 할 적립을 체크리스트로 보면서 빠뜨리지 않고 실행하는 게 핵심이에요.',
    ],
  },
  {
    id: 'what-is-goal',
    categoryId: 'basic',
    question: '목적이 뭔가요?',
    answer: [
      '목적은 돈을 모으는 이유예요. 예를 들어 결혼자금 5천만원 같은 거예요.',
      '하나의 목적에 여러 적립 항목을 묶을 수 있어요. 적금으로 일부, 적립식 투자로 일부 모으는 식이에요.',
      '목적은 이름만 있으면 만들 수 있어요. 목표 금액과 날짜는 나중에 채워도 돼요.',
    ],
  },
  {
    id: 'what-is-record',
    categoryId: 'basic',
    question: '적립 항목은 뭔가요?',
    answer: [
      '적립 항목은 목적을 위해 매달 일정 금액을 넣는 단위예요.',
      '매달 얼마를, 며칠에 넣을지 정해두면 이번 달 체크리스트에 나타나요.',
      '납입일이 되면 알림으로 알려드려요.',
    ],
  },
  {
    id: 'how-progress',
    categoryId: 'usage',
    question: '진행률은 어떻게 계산되나요?',
    answer: [
      '지금까지 넣은 원금을 목표 금액과 비교해서 보여줘요.',
      '예를 들어 목표 5천만원에 2천7백만원을 넣었다면 진행률은 54%예요.',
      '수익이나 평가금액이 아니라 실제로 넣은 돈을 기준으로 해서, 진행률이 시장 흐름에 따라 출렁이지 않아요.',
    ],
  },
  {
    id: 'why-no-rate',
    categoryId: 'usage',
    question: '수익률이나 예상 자산은 왜 안 보여주나요?',
    answer: [
      '토리치는 얼마나 벌까보다 얼마나 꾸준히 모았나에 집중하는 앱이에요.',
      '미래 수익률은 누구도 정확히 알 수 없는 추정이에요. 추정 숫자를 크게 보여주면 꾸준한 적립이라는 본래 목적이 흐려져요.',
      '그래서 진행률과 통계 모두 실제로 넣은 원금을 기준으로 보여드려요.',
    ],
  },
  {
    id: 'us-stock-amount',
    categoryId: 'usage',
    question: '미국 주식 금액은 어떻게 처리되나요?',
    answer: [
      '환율 변환을 적용하지 않아요. 미국 주식에 입력한 달러 금액을 원화처럼 그대로 합산해요.',
      '예를 들어 매달 100달러를 넣는다고 입력하면, 100원을 넣는 것과 같은 방식으로 누적돼요.',
      '환율까지 맞춰 기록하고 싶다면, 금액을 원화로 환산해서 입력하는 걸 권해드려요.',
    ],
  },
  {
    id: 'data-manual',
    categoryId: 'caution',
    question: '납입 기록은 자동으로 되나요?',
    answer: [
      '토리치는 은행·증권 계좌와 연동되지 않아요. 매달 넣었는지는 이번 달 체크리스트에서 직접 완료 표시해요.',
      '대신 자동 연동 앱이 못 잡는 현금·외부 송금 같은 적립도 자유롭게 기록할 수 있어요.',
      '완료 표시한 납입은 목적 진행률에 바로 반영돼요.',
    ],
  },
  {
    id: 'future-features',
    categoryId: 'caution',
    question: '수익률이나 평가금액은 앞으로도 안 보여주나요?',
    answer: [
      '지금은 컨셉을 명확히 하는 데 집중하고 있어서 빼두었어요.',
      '적립식 투자의 현재 평가금액처럼 추정이 아닌 사실인 정보는, 나중에 종목 상세 화면에서 따로 보여드릴 수 있어요.',
      '다만 진행률 같은 핵심 화면은 앞으로도 원금 기준을 유지할 거예요.',
    ],
  },
]

export function groupFAQByCategory(): Array<{
  category: FAQCategory
  items: FAQItem[]
}> {
  return FAQ_CATEGORIES.map((category) => ({
    category,
    items: FAQ_ITEMS.filter((item) => item.categoryId === category.id),
  }))
}
