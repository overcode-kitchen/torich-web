/**
 * FAQ 콘텐츠 — 카피 톤 가이드 (정직성 톤 가드 + 사용자 컨벤션)
 *
 * 1. 작성 순서: 원리 → 가정/한계 → 행위 가능성
 *    예) "Yahoo Finance 10년 평균을 자동 조회해요 (원리)."
 *        "조회되지 않으면 기본 10%를 써요 (가정)."
 *        "수익률은 종목 상세에서 직접 바꿀 수 있어요 (행위 가능성)."
 * 2. 능동 톤, 방어적 어휘 회피.
 *    ❌ "이 숫자는 정확하지 않을 수 있습니다."
 *    ✅ "이 숫자는 가정에 기반한 시뮬레이션이에요."
 * 3. "보장하지 않습니다" 같은 부정 표현은 한 항목당 1회 이내.
 * 4. 사용자가 직접 조정 가능한 부분은 명시.
 *    예) "수익률은 종목별로 직접 바꿀 수 있어요."
 * 5. 공식 표기는 Plain text 한국어 풀이로 — 백틱/코드블록 사용 금지 (사용자 결정).
 *    ❌ "PMT × ((1+r)^n − 1) / r × (1+r)"
 *    ✅ "월 납입금을 매달 적립하며 매월 이자가 복리로 붙는 방식이에요."
 */

export type FAQCategoryId = 'rate' | 'fx' | 'formula' | 'caution'

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
  { id: 'rate', label: '수익률' },
  { id: 'fx', label: '환율' },
  { id: 'formula', label: '공식' },
  { id: 'caution', label: '유의사항' },
]

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'how-rate-determined',
    categoryId: 'rate',
    question: '수익률은 어떻게 정해지나요?',
    answer: [
      '종목을 추가하면 Yahoo Finance에서 최근 10년 월봉 데이터를 받아 연평균 수익률(CAGR)을 자동으로 계산해요.',
      '데이터를 받아오지 못한 경우엔 기본값 10%를 써요. 상장 1년 미만이거나 비공개 종목일 때 자주 발생해요.',
      '너무 큰 값이 나오면 20%로 제한해요. 단기간의 급등이 그대로 30~40년에 복리되어 비현실적인 결과가 나오는 걸 막기 위한 장치예요.',
      '수익률은 종목별로 직접 바꿀 수 있어요. 종목 상세에서 수익률을 누르면 바로 편집할 수 있어요.',
    ],
  },
  {
    id: 'edit-rate',
    categoryId: 'rate',
    question: '수익률을 직접 바꾸려면 어떻게 하나요?',
    answer: [
      '홈 또는 투자 목록에서 종목을 선택하고, 종목 상세 화면에서 수익률을 누르면 바로 편집할 수 있어요.',
      '직접 입력한 수익률은 자동 갱신되지 않고 그대로 유지돼요. 다시 자동값으로 돌리고 싶으면 편집 화면에서 초기화할 수 있어요.',
    ],
  },
  {
    id: 'fx-handling',
    categoryId: 'fx',
    question: '미국 주식의 환율은 어떻게 적용되나요?',
    answer: [
      '환율 변환을 적용하지 않아요. 미국 주식의 달러 금액을 원화처럼 그대로 합산하고 있어요.',
      '예를 들어 매월 100달러를 투자한다고 입력하면, 시뮬레이션은 매월 100원을 투자하는 것과 같은 방식으로 계산돼요.',
      '환율 변동까지 정확히 반영한 시뮬레이션을 원하면, 금액을 원화 환산해서 입력해보는 방법을 권해드려요.',
    ],
  },
  {
    id: 'formula',
    categoryId: 'formula',
    question: '예상 자산은 어떤 공식으로 계산되나요?',
    answer: [
      '매월 같은 금액을 납입하며 매월 이자가 복리로 붙는 방식이에요. 적금에 익숙하다면 월복리 적금 개념과 비슷해요.',
      '구체적으로는 매달 납입한 돈이 다음 달부터 함께 이자를 받기 시작하고, 이렇게 누적된 잔액에 매월 수익률의 12분의 1만큼 이자가 더해져요.',
      '투자 기간이 끝나면 그 이후에는 추가 이자 없이 현금으로 보관한다고 가정하고 계산해요.',
    ],
  },
  {
    id: 'after-maturity',
    categoryId: 'formula',
    question: '만기 후에는 어떻게 계산되나요?',
    answer: [
      '투자 기간이 끝난 시점의 자산을 그대로 현금으로 보관한다고 가정해요. 만기 이후로는 추가 이자가 붙지 않아요.',
      '실제로는 만기 후에도 보유 종목을 계속 들고 있을 수도, 다른 곳에 재투자할 수도 있어요. 그 부분은 시뮬레이션에 반영되지 않아요.',
    ],
  },
  {
    id: 'past-no-guarantee',
    categoryId: 'caution',
    question: '과거 수익률이 미래를 보장하나요?',
    answer: [
      '수익률은 지난 10년의 평균치예요. 같은 흐름이 앞으로도 이어진다는 뜻은 아니에요.',
      '시장 상황과 종목 펀더멘털은 계속 바뀌기 때문에, 시뮬레이션 결과는 대략 이 정도 그림이겠구나 정도의 참고치로 봐주세요.',
      '낙관·비관 시나리오를 동시에 보고 싶다면, 수익률을 직접 낮춰서 다시 시뮬레이션해보는 것도 좋은 방법이에요.',
    ],
  },
  {
    id: 'tax-and-fee',
    categoryId: 'caution',
    question: '세금이나 수수료는 반영되나요?',
    answer: [
      '지금은 세금과 거래 수수료를 반영하지 않아요. 실제로 받는 금액은 양도소득세·배당세·거래 수수료만큼 줄어들 수 있어요.',
      '구체적인 세후 금액이 궁금하다면, 보유 중인 증권사 앱이나 세금 계산기를 함께 활용해주세요.',
    ],
  },
  {
    id: 'why-simulation-differs',
    categoryId: 'caution',
    question: '시뮬레이션이 실제와 다를 수 있는 이유',
    answer: [
      '이 화면의 모든 숫자는 가정에 기반한 시뮬레이션이에요. 실제 결과와 차이가 날 수 있는 주된 이유는 세 가지예요.',
      '첫째, 환율 변동이 반영되지 않아요. 둘째, 세금과 수수료가 빠져 있어요. 셋째, 수익률은 지난 10년 평균이라 앞으로의 시장 흐름과 다를 수 있어요.',
      '이 한계를 알고 보면 시뮬레이션은 여전히 유용해요. 같은 금액을 매월 꾸준히 넣었을 때 대략 이 정도 그림이 나오는구나 라는 감을 잡는 데는 충분해요.',
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
