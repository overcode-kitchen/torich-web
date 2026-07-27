# 목적·적립항목 화면 UX 일관성 진단 & 리팩터링 작업서

> 작성일: 2026-06-27 · 대상: 목적(goal) 추가/수정/상세, 적립항목(투자·예적금·현금) 추가/수정/상세 6개 플로우
> 목적: "추가는 좋은데 수정·상세가 화면마다 제각각"인 문제를 정리하고, 우선순위대로 손볼 작업 목록을 고정한다.
> 관련 문서: [goal-form-ux.md](goal-form-ux.md), [design-system.md](design-system.md), [architecture.md](architecture.md)

---

## 0. 한 줄 결론

**"추가" 플로우는 토스식으로 잘 빠졌으나, "수정"과 "확인/경고 다이얼로그"가 화면마다 다른 패턴이라 사용자가 같은 동작을 매번 다시 학습해야 한다.** 가장 먼저 손댈 것은 ① 네이티브 다이얼로그 제거(반나절, 체감 큼) ② 목적 추가/수정 폼 통합이다.

---

## 1. 문제 지도 (심각도순)

### 🔴 P0 — 멘탈모델을 깨는 구조 문제

**P0-1. "수정"이 종류마다 완전히 다른 패턴**

| 수정 대상 | 진입 | UI 형태 |
|---|---|---|
| 목적 | `/goal/detail/edit` 별도 페이지 | 모든 필드 펼친 **단일 폼** ([`GoalFormSection.tsx`](../app/components/GoalFormSections/GoalFormSection.tsx)) |
| 예적금/현금 | `/add?editId=...&field=...` | **추가 3단계 위저드 재사용** |
| 투자 | 라우팅 없음, 상세 화면 토글 | **인플레이스 편집** ([`InvestmentDetailHeader.tsx:85`](../app/components/InvestmentDetailSections/InvestmentDetailHeader.tsx#L85)) |

- 목적: 추가는 [3단계 위저드](../app/goal/new/page.tsx#L20-L24) / 수정은 [단일 폼](../app/goal/detail/edit/EditGoalClient.tsx#L79-L84) → 추가 때 배운 조작이 수정 때 무효.
- 적립항목: 예적금은 위저드 수정, 투자는 인라인 토글 수정 → "투자는 왜 화면이 안 바뀌지?" 인지 부조화.

> **2026-07-28 갱신 (#72 완료)** — 위 표의 '투자' 행은 옛 상태다. 인플레이스 토글 편집은 제거되어
> 세 상세 화면 모두 **정보 행을 탭하면 그 필드 편집으로** 들어간다. 행 마크업은 공용
> [`TappableField`](../app/components/Common/TappableField.tsx) 하나를 쓰고(높이·셰브런·hover 동일),
> 진입 경로는 적립항목 `/add?editId=&field=` · 목적 `/goal/detail/edit?id=&field=`.
> 목적은 단일 폼이라 그룹 진입 대신 해당 칸으로 스크롤·포커스한다. 계산값 행(남은 금액·만기 예상 수령액)은 탭 불가.

**P0-2. 투자 수정 시 고칠 수 있는 필드가 추가보다 적다**

- 투자 인플레이스 편집 = 금액/기간/투자일만. 종목명은 ["수정할 수 없습니다"](../app/components/InvestmentDetailSections/InvestmentDetailOverview.tsx#L60), 시장·시작일·연수익률은 편집 UI 자체가 없음.
- 예적금/현금은 `field` 단위로 거의 전 항목 재진입 가능 → 종류 간 수정 범위 불일치.
- 사용자 영향: 종목 잘못 등록 시 **삭제 후 재등록**이 유일한 방법.

### 🟠 P1 — 같은 동작이 매번 다르게 생김 (일관성)

**P1-1. 금액 입력 4가지 변종 + 헬퍼 복붙**

| | 목적 추가 | 목적 수정 | 적립항목 |
|---|---|---|---|
| 컴포넌트 | `FlowInput`(중앙 히어로) | shadcn `Input` | `AmountInput`(좌측) |
| 빠른조정 | ±1,000만/±100만 | ±조정칩 | +10만/-10만/+1만/-1만 |
| 배경·모서리 | `bg-muted/50`·`rounded-xl` | 보더 인풋 | `bg-card`·`rounded-2xl` |

- 만원→원 변환 헬퍼(`manwonInputToWon` 등)가 [`GoalStepAmount.tsx:15-40`](../app/components/GoalFormSections/GoalStepAmount.tsx#L15-L40) ↔ [`GoalFormSection.tsx:29-57`](../app/components/GoalFormSections/GoalFormSection.tsx#L29-L57)에 **복붙** (검증 완료). 한쪽만 고치면 버그 갈림.

**P1-2. CTA 문구 제각각**

| 화면 | 최종 | 진행 |
|---|---|---|
| 목적 추가 | "이대로 만들기" | "다음으로" |
| 목적 수정 | "저장하기" | — |
| 적립항목 | "저장하기" | "다음" |

"다음으로" vs "다음", "이대로 만들기" vs "저장하기". 보조 액션도 적립항목엔 ["나중에 할게요"](../app/add/page.tsx#L93)가 있고 목적엔 없음.

**P1-3. 날짜 바텀시트 3벌 복붙**

- 목적 마감일 + 예적금 만기일 → 공용 [`DateSelectSheet`+`YearMonthWheel`](../app/components/Common/DateSelectSheet.tsx) ✅ (연/월 휠 O)
- 투자 시작일 → [`InvestmentStartDateSheet`](../app/components/AddInvestmentSections/InvestmentStartDateSheet.tsx) (연/월 휠 **X**)
- 매월 납입일 → `InvestmentDaysPickerSheet` (또 다른 셸)
- → 셸 마크업 복붙, 연/월 휠은 한 곳에만 적용.

**P1-4. 확인/경고 다이얼로그가 디자인 시스템 밖 (네이티브 `alert`/`confirm` 9곳, 검증 완료)**

- 목적 삭제 = [`window.confirm`](../app/goal/detail/GoalDetailClient.tsx#L78) / 적립항목 삭제 = 커스텀 `DeleteConfirmModal` → 같은 삭제인데 다름.
- 검증 실패 = [`alert('이름을 입력해주세요')`](../app/hooks/investment/add/useSavingsCashSubmit.ts#L67) 등 → 다른 곳은 `sonner` 토스트.
- 전체 위치: `useInvestmentDetailHandlers.ts:62,66`, `useSavingsCashSubmit.ts:67,72,77,81`, `useAddInvestmentSubmit.ts:87`, `useLoginAuth.ts:132`, `useManualInput.ts:39`, `useAccountDeletion.ts:18`, `GoalDetailClient.tsx:78`.
- iOS 로컬 번들 앱에서 OS 기본 alert은 브랜드 톤을 가장 크게 깸.

**P1-5. 이탈 경고 비대칭**

- 추가 플로우: 첫 단계 뒤로가기 시 [`ExitConfirmDialog`](../app/components/AddItemSections/ExitConfirmDialog.tsx) 경고.
- 수정 화면: 값 바꾸고 뒤로가도 경고 없이 폐기 ([목적 수정 "취소"](../app/goal/detail/edit/EditGoalClient.tsx#L94-L101)는 즉시 goBack). 수정이 손실 위험 더 큰데 보호 없음.

### 🟡 P2 — 정리하면 좋은 부채/디테일

- **P2-1** "투자 정보" 라벨 오용 — 예적금/현금 상세도 [섹션 제목 "투자 정보"](../app/components/SavingsCashDetailSections/SavingsCashInfoSection.tsx#L62), 납입일 "매월 투자일".
- **P2-2** 알림 토글 비대칭 — 투자 상세엔 알림 Bell, 예적금/현금 상세엔 없음.
- **P2-3** 헤더 중복 — [`GoalFlowHeader`](../app/components/GoalFormSections/GoalFlowHeader.tsx) ↔ [`AddItemHeader`](../app/components/AddItemSections/AddItemHeader.tsx) 거의 동일, 채움색 `muted-foreground` vs `foreground` 미세 차이.
- **P2-4** 상세 정보 중복 — 목적 상세에서 마감일이 [헤더 Alert](../app/goal/detail/GoalDetailClient.tsx#L177-L192) + [정보 섹션](../app/components/GoalDetailSections/GoalInfoSection.tsx#L29-L33) 두 곳.
- ~~**P2-5** 목적 추가 시 메모·이미 모은 돈·알림 입력 불가.~~ → **부채가 아니라 결정이다(#70에서 재확인, 이 항목은 닫는다).**
  목적을 만드는 데 꼭 필요한 값이 아닌데 만들기 흐름에서 물으면, **답할 필요 없는 칸 앞에서 사용자가 멈추고 이탈한다.** 만든 뒤 채워도 되는 값이므로 [`GoalOptionalFields`](../app/components/GoalFormSections/fields/GoalOptionalFields.tsx)는 수정 화면에만 둔다. 접이식으로 접어서 넣는 안도 검토했으나 같은 이유로 채택하지 않았다 — 접혀 있어도 "아직 뭔가 남았다"는 신호를 준다.
  ⚠️ 앞으로 "추가엔 없고 수정엔 있으니 불일치"로 보이면, 그건 통일할 대상이 아니다. 통일해야 할 것은 **입력 컴포넌트와 검증 규칙**이고 그건 이미 100% 공유돼 있다.
- **P2-6** 죽은 코드 (검증 완료) — `InvestmentEditSections/`(EditView·EditSheet), `InvestmentView.tsx`+`InvestmentViewSections/`가 import 0. 이 때문에 [`InfoSection.tsx:16-42`](../app/components/InvestmentDetailSections/InfoSection.tsx#L16-L42)가 불필요한 props/try-catch 분기 + `any`를 떠안음.
- **P2-7** 하드코딩 색 — `bg-red-500`(위험), `text-green-600`/`bg-green-500`(성공)이 토큰(`bg-destructive` 등) 미사용.

---

## 2. 작업 순서 (우선순위 = 체감 효과 / 비용)

### ✅ Task 1 — 네이티브 다이얼로그 제거 `[P1-4]` `난이도 下` `반나절`
- `alert()` 9곳 → `sonner` 토스트, `window.confirm` 2곳 → `DeleteConfirmModal`(삭제)/커스텀 confirm.
- 완료 기준: `grep -rn "window.confirm\|[^.]alert(" app` 결과가 의도된 0건. 삭제 UI가 목적/적립 동일 컴포넌트.

### ✅ Task 2 — 목적 추가/수정 폼 통합 `[P0-1, P1-1]` `난이도 中` `1~2일`
- `GoalFormSection`을 `mode: 'create' | 'edit'` 단일 컴포넌트로 만들어 추가/수정 공유. `GoalStepName/Amount/Date`는 이 폼을 단계별로 감싸는 래퍼로 재구성하거나 위저드 vs 단일폼 중 하나로 통일.
- 복붙된 금액 헬퍼(`manwonInputToWon`/`wonToManwonDisplay`/`adjustWonByManwon`)를 `app/utils` 또는 공용 훅으로 1벌화.
- 완료 기준: 금액 변환 헬퍼 정의가 1곳. 목적 추가/수정에서 이름·금액·마감일 입력 UI 동일.

### ✅ Task 3 — 적립항목 수정 경험 통일 `[P0-1, P0-2]` `난이도 中` `2~3일`
- 투자도 종목명/시장/시작일/연수익률 편집 허용(또는 최소한 추가/수정 진입을 한 패턴으로 정렬).
- 결정 필요: **투자/예적금/현금 수정을 모두 `/add?editId` 위저드로 통일** vs **모두 인플레이스로 통일**. → 권장: `/add` 위저드 통일(이미 예적금/현금이 그 패턴이고 필드 커버리지가 넓음).
- 완료 기준: 세 종류 "수정하기"가 동일 진입·동일 화면 패턴. 추가에서 입력 가능한 필드는 수정에서도 가능.

### ✅ Task 4 — 죽은 코드 삭제 + InfoSection 단순화 `[P2-6]` `난이도 下` `반나절`
- `InvestmentEditSections/`, `InvestmentView.tsx`, `InvestmentViewSections/` 삭제. `InfoSection.tsx`의 props/try-catch/`any` 분기 제거.
- 완료 기준: 빌드 통과(`npm run build`), 삭제 대상 참조 0.

### ✅ Task 5 — 공용화 마무리 `[P1-2, P1-3, P2-3]` `난이도 中`
- 금액 입력 단일 컴포넌트화, CTA 문구 통일("다음"/"저장하기"), 날짜 시트 셸 1개로 통합(투자 시작일에도 연/월 휠), 헤더 컴포넌트 1벌화.

### ✅ Task 6 — 라벨/색 토큰 정리 `[P1-5, P2-1, P2-2, P2-7]` `난이도 下`
- 예적금/현금 "투자 정보"→"적립 정보" 류 라벨 보정, 알림 토글 위치 통일, 수정 이탈 확인 추가, 하드코딩 색 → 토큰.

---

## 3. 운영 안전 체크 (이 저장소 특수성)

- `output: 'export'` 정적 빌드 → 새 동적 세그먼트 금지. 폼 통합 시에도 정적 경로 + query param 유지.
- 스키마/API 변경 금지 작업으로 가정(이 작업서는 UI 리팩터링 범위). DB 컬럼 추가가 필요하면 [CLAUDE.md의 Breaking Change 규칙](../CLAUDE.md) 준수.
- 머지 전 `capacitor.config.ts`의 `server.url` 주석·`loggingBehavior: 'production'` 확인.

---

## 4. 근거 데이터 출처

본 진단은 6개 플로우 코드 전수 정밀 분석 + 직접 grep 검증(죽은 코드, 헬퍼 복붙, 네이티브 다이얼로그 9곳)으로 작성됨. 모든 항목에 `file:line` 근거 첨부.
