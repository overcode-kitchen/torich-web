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

### 날짜를 부르는 말은 화면 전체에서 `적립일` 하나다

돈을 넣는 날은 **`적립일`**로 통일한다. 같은 날을 두고 화면마다 `투자일`·`납입일`로
달리 부르면, 사용자는 서로 다른 날짜라고 읽는다.

| 자리 | 쓰는 말 |
|---|---|
| 추가 흐름 날짜 시트 (`InvestmentDaysPickerSheet`) | `매월 적립일 선택` |
| 적립 내역 표 헤더 (`PaymentHistoryTable`) | `적립일` |
| 예적금·현금 상세 (`SavingsCashInfoSection`) | `적립일` |
| 알림 설정 (`NotificationReminderSection`) | `적립일이 지나도…` |
| FAQ 등 세 유형 공통 설명 | `적립일` |
| **투자 전용** 상세·검증 (`InvestmentDetailSections/InfoSection`, `validation.ts`) | `투자일` |

유일한 예외는 **푸시 알림**이다. 알림은 받는 사람의 유형이 확정돼 있어 유형별 명사가
자연스럽다 → `getNotificationTerms()` (적금 `납입일` / 현금 `저축일` / 투자 `매수일`).

> `납입`은 **행위·금액**에는 남아 있다 (`납입 기록`, `총 납입액`). 날짜 명사만 `적립일`로
> 모은 것이고, 행위 명사 정리는 아직 하지 않았다.

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
| `SavingsCashDetailSections/SavingsCashInfoSection` | 적금·현금 공용 → `적립일` (푸시처럼 유형별로 나누지 않는다) |
| `InvestmentDetailSections/InfoSection` | **투자 전용** (적금·현금은 `SavingsCashInfoSection`) → `투자` 유지 |
| `AddItemSections/GroupB_HowMuch`의 `InvestmentFields` | **투자 전용** → `투자` 유지 |

## 질문 어투 — 지금 정하는 값인가, 이미 정해진 값인가

폼 라벨의 어미는 **그 값을 사용자가 지금 정하는지**로 갈린다.
배경: [#165](https://github.com/overcode-kitchen/torich-web/issues/165)

| 값의 성격 | 어미 | 예 |
|---|---|---|
| 지금 함께 정하는 값 | **`~할까요?`** (제안형) | `어디에 모을까요?`, `매달 얼마를 모을까요?`, 목적 만들기 전체 |
| 이미 정해져 있어 옮겨 적는 값 | **`~하나요?` / `~인가요?`** (사실 확인형) | `언제부터 시작했나요?`, `언제 만기인가요?`, `약정 연이율이 어떻게 되나요?`, `매월 언제 모으나요?` |

적립 항목 추가는 **이미 가입해 둔 적금을 등록하는 일**이 섞여 있다. 자동이체일·만기일·
연이율처럼 사용자가 정할 수 없는 값에 `~할까요?`를 쓰면, 앱이 없는 선택권을 주는 것처럼
읽힌다. 반대로 목적 만들기는 **지금부터 정하는 일**이라 전체가 제안형이다
(`얼마나 모을까요?`, `언제까지 이룰까요?`).

**흐름 전체를 한 어미로 통일하지 않는다.** 기준은 흐름이 아니라 값의 성격이다.
새 필드를 추가할 때 "이 값을 사용자가 지금 정하는가?"를 자문하고 어미를 고른다.

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
2. 돈 넣는 날을 가리키는가? → **`적립일`** (푸시 알림만 `getNotificationTerms()`로 분기)
3. 질문 라벨인가? → 그 값을 **사용자가 지금 정하면** `~할까요?`, **이미 정해져 있으면** `~하나요?`
4. 같은 화면의 다른 자리와 부르는 말이 어긋나지 않는가?
