# 용어 기준 (Wording)

> 사용자에게 보이는 문구에서 쓰는 용어의 단일 기준. **새 문구를 쓰기 전에 읽는다.**
> 배경: [#163](https://github.com/overcode-kitchen/torich-web/issues/163) — 같은 단어 "투자"가
> 상위 개념과 하위 유형 두 가지 뜻으로 혼용돼 적금·현금 사용자에게 틀린 말이 되던 문제.

## 핵심 규칙 — "투자"는 상위 개념이 아니다

앱이 다루는 것은 **투자 · 적금 · 현금** 세 유형이다. 이 셋을 묶어 부를 때는 **"적립 항목"**을 쓴다.
**"투자"는 `record_type: 'investment'`(주식·ETF) 하나만 가리킨다.**

| 뜻 | 쓰는 말 | 쓰지 않는 말 |
|---|---|---|
| 투자·적금·현금 전체 | **적립 항목** | ~~투자~~, ~~투자 기록~~, ~~종목~~ |
| `record_type: 'investment'` | 투자 | — |
| `record_type: 'savings'` | 적금 | — |
| `record_type: 'cash'` | 현금 | — |

## 문장에서 쓰는 방법

- 기본은 **"적립 항목"** 전체 표기를 쓴다. (예: `묶인 적립 항목`, `묶을 수 있는 적립 항목`)
- **한 문장 안에서 두 번째로 가리킬 때만** `항목`으로 줄인다.
  - ✅ `아직 묶인 적립 항목이 없어요. 아래에서 묶을 항목을 골라보세요.`
  - ❌ `아직 묶인 항목이 없어요. 아래에서 묶을 적립 항목을 골라보세요.` (순서가 뒤집힘)
- 금액·행위에는 `적립`을 쓴다. (예: `이번 달 적립금액`, `이번 달 적립 내역`, `적립일`)

## "투자"를 그대로 두는 자리

아래는 **진짜 투자만** 가리키므로 바꾸지 않는다.

| 자리 | 예 |
|---|---|
| 유형 선택지 | `RecordTypeSelector.tsx` 의 `투자` |
| 투자(주식) 전용 폼·상세 | `InvestmentFields`(`GroupB_HowMuch.tsx`)의 `매달 얼마를 투자할까요?`, `InvestmentDetailSections/InfoSection.tsx` 의 `투자 정보`·`매월 투자일` |
| 투자 전용 검증 문구 | `app/utils/validation.ts` (매수 주수·시세 등 투자 전용 경로) |
| 유형별 구성 라벨 | `app/utils/money-composition.ts` 의 `투자` 카테고리 |
| 서비스 소개·브랜드 | 랜딩(`LandingPageSections/*`), 브랜드 스토리, `app/layout.tsx` 메타(`적립식 투자`) |

## 함정 — 파일 이름이 `Investment*`여도 투자 전용이 아니다

DB 테이블이 `investments` 하나라 컴포넌트 이름에도 `Investment`가 붙어 있지만, **세 유형이 공유하는
컴포넌트가 섞여 있다.** 이름만 보고 "투자"라고 쓰면 적금·현금 화면에 틀린 말이 노출된다.
문구를 고칠 때는 **호출부를 먼저 확인한다.**

| 컴포넌트 | 실제 노출 범위 |
|---|---|
| `InvestmentDaysPickerSheet` | `/add`에서 **세 유형 전부** → `매월 적립일 선택` |
| `InvestmentDetailSections/PaymentHistorySection`·`PaymentHistoryTable` | 투자 상세 + `SavingsCashDetailView` → `적립일` |
| `Common/DeleteConfirmModal` | 투자·적금·현금·목적 전부 → `적립 항목` |
| `AddItemSections/GroupC_When` | 세 유형 전부. 투자 전용 필드는 `isInvestment` 분기 안에만 둔다 |
| `InvestmentDetailSections/InfoSection` | **투자 전용** (적금·현금은 `SavingsCashInfoSection`) → `투자` 유지 |
| `AddItemSections/GroupB_HowMuch`의 `InvestmentFields` | **투자 전용** → `투자` 유지 |

## 푸시 알림은 유형별로 다르게 부른다

푸시 문구는 상위 개념을 쓰지 않고 `record_type`별 명사로 분기한다 —
`supabase/functions/_shared/notification-schedule.ts` 의 `getNotificationTerms()`가 정본이다.

| record_type | dateNoun | actionNoun |
|---|---|---|
| `investment` (기본) | 매수일 | 매수 |
| `savings` | 납입일 | 납입 |
| `cash` | 저축일 | 저축 |

반면 **설정 화면처럼 세 유형을 한꺼번에 다루는 자리**는 상위 개념을 쓴다.
(예: `적립 리마인더`, `적립일이 지나도 완료 안 하면 다시 알려드려요.`)

## 새 문구를 쓸 때 자문할 것

1. 이 문구가 적금·현금 사용자에게도 보이는가?
   - 보인다 → **적립 항목 / 적립**
   - 투자 전용 경로에서만 보인다 → 투자
2. 유형별로 다른 명사가 자연스러운 알림·상세인가? → `getNotificationTerms()` 규칙을 따른다.
3. 같은 화면의 다른 자리와 부르는 말이 어긋나지 않는가?
