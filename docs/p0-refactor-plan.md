# P0 리팩터링 설계서 — 목적·적립항목 "수정" 경험 통일

> 작성일: 2026-06-27 · 상위 문서: [ux-consistency-audit.md](ux-consistency-audit.md)
> 범위: UI/플로우 리팩터링만. DB 스키마·API 변경 없음.
> 확정된 의사결정 2건을 구현으로 옮기기 위한 파일 단위 계획.

## 확정된 의사결정

| 항목 | 결정 | 의미 |
|---|---|---|
| **P0-1** 목적 폼 통일 | **C안** | 추가=위저드 / 수정=단일 폼 유지하되, **이름·금액·마감일 입력 컴포넌트를 100% 공유** |
| **P0-2** 적립항목 수정 통일 | **`/add` 위저드로 통일** | 투자 수정도 `/add?editId=`로 이동. 상세 화면 인플레이스 편집 제거 |

---

## P0-2 — 적립항목 수정을 `/add` 위저드로 통일

### 사전 확인 결과 (중요)
`/add` 페이지는 **이미 투자 편집을 지원**한다. ([useAddRecordPage.ts:31-59](../app/hooks/investment/add/useAddRecordPage.ts#L31-L59))
- `editId`로 `useAddItemEditInit`이 record 테이블에서 종류 무관하게 fetch ([useAddItemEditInit.ts:42-77](../app/hooks/investment/add/useAddItemEditInit.ts#L42-L77))
- `recordType`은 `getRecordType(initData)`로 파생 → 투자도 자동 분기
- `useAddInvestmentForm({ mode: 'edit', recordId: editId })` 이미 wiring됨 ([useAddRecordPage.ts:55-59](../app/hooks/investment/add/useAddRecordPage.ts#L55-L59))

→ **결론: 투자 상세의 진입 경로만 바꾸면 위저드 편집이 곧바로 동작.** 신규 화면 제작 불필요.

### 변경 작업

**① 투자 상세 "수정하기" → `/add?editId=`로 변경**
- [InvestmentDetailHeader.tsx:85](../app/components/InvestmentDetailSections/InvestmentDetailHeader.tsx#L85) 부근: `setIsEditMode(true)` → `router.push('/add?editId=${item.id}')`
- 예적금/현금과 동일 패턴([SavingsCashDetailView.tsx:88](../app/components/SavingsCashDetailView.tsx#L88))으로 맞춤. 정보 행 탭 시 `&field=` 지정도 동일하게 추가 가능.

**② 투자 인플레이스 편집 machinery 제거**
- `InvestmentDetailContext`의 `isEditMode` / `investmentData`(편집 상태) / `handlers.onSave·onCancel` 제거
- [InfoSection.tsx](../app/components/InvestmentDetailSections/InfoSection.tsx): `isEditMode` 분기(편집 입력 UI) 전부 제거 → **읽기 전용 표시만** 남김 (방금 죽은코드 정리로 이미 context-only가 됨, 다음 단계로 편집분기 제거)
- `InvestmentDetailContent.tsx`: 하단 `InvestmentDetailActions`(취소/저장) 렌더 제거
- `useInvestmentDetailHandlers.ts`: `handleSave`/편집 검증(`alert`)/`setIsEditMode` 관련 로직 제거 → 삭제 핸들러만 잔존
- `useInvestmentDetailUI.ts`: editMode state 제거
- 관련 `InvestmentDetailActions`, 편집 전용 필드 컴포넌트가 다른 데서 안 쓰이면 삭제

**③ 구현 중 검증 필요 항목**
- [ ] `/add?editId=<투자id>` 진입 시 종목명·시장·시작일·금액·기간·투자일이 폼에 정확히 프리필되는가 (`useAddInvestmentForm` edit init 확인)
- [ ] 편집 모드에서 종목명/시장 변경이 실제 저장되는가 (`GroupA_Investment`가 edit 모드에서 입력 허용하는지 — 현재 `RecordTypeSelector`만 disabled)
- [ ] 저장 후 복귀 경로: `/investment?id=` 로 일관되게 (예적금과 동일)
- [ ] 운영 앱 딥링크/이전 동선이 인플레이스를 가정하지 않는지

### ⚠️ 구현 착수 후 발견된 결정적 사실 (2026-06-27)

`/add`의 투자 편집은 **저장(submit)만 배선돼 있고 프리필(기존 값 로드)은 구현된 적이 없다.**
- 저장: [useAddInvestmentSubmit.ts:115-126](../app/hooks/investment/add/useAddInvestmentSubmit.ts#L115-L126) — `mode==='edit'`이면 `updateInvestment(recordId, formattedData)` ✅
- 프리필: [useAddInvestmentUI.ts:52-61](../app/hooks/investment/add/useAddInvestmentUI.ts#L52-L61) — 모든 state를 `''`/`new Date()`/`[]`/`'shares'`로 빈 초기화. `initData`를 받지 않음 ❌
- 대조: 예적금/현금은 [useAddItemFormState.ts:51-69](../app/hooks/investment/add/useAddItemFormState.ts#L51-L69)에서 `initData`로 프리필됨.

**데이터 손실 위험 (그냥 진입 경로만 바꾸면 발생):**
1. 빈 폼이 떠서 저장 시 기존 record를 빈 값으로 덮어씀.
2. `determineStockSymbol`([investment-formatter.ts:80-85](../app/utils/investment-formatter.ts#L80-L85))은 `selectedStock` 없으면 `symbol=null` 반환 → **종목 ticker 소실**.
3. `unit_type:'shares'` 투자는 저장 시 `sharePrice`로 주수→원 환산([:98-102](../app/utils/investment-formatter.ts#L98-L102)). 종목 재선택 없으면 `sharePrice` 없어 **monthly_amount=0** 으로 파괴.

**따라서 P0-2는 "투자 편집 프리필" 신규 구현이 선행돼야 한다:**
- [ ] `useAddInvestmentForm`/`useAddInvestmentUI`가 `initData`(투자) 수용 → stockName/market/monthlyAmount(원→만원)/period·habit/startDate/investmentDays/annualRate/unitType/monthlyShares 복원
- [ ] **selectedStock 복원**: symbol으로 시세 재조회하거나, 편집 시 기존 symbol/price를 보존해 저장 시 ticker·sharePrice 유실 방지 (가장 위험)
- [ ] manual-input 투자(symbol 없음) 분기 처리
- [ ] 검증: 검색종목·수동입력·주수모드·금액모드 각각 편집→저장 후 record 무결성

### 기대 효과
- 투자/예적금/현금 "수정"이 **동일한 화면·인터랙션**으로 통일
- 투자에서 막혔던 종목명·시장·시작일·연수익률 수정이 **자동으로 풀림** (P0-2의 두 번째 문제 동시 해결)
- 인플레이스 편집 코드 + `alert()` 검증 제거 → 부채 감소

> 단, 위 프리필 신규 구현이 선행돼야 하며 이는 금융 데이터 무결성 작업이라 충분한 검증 필요.

---

## P0-1 — 목적 추가/수정 입력 컴포넌트 공유 (C안)

### 현재 문제 (중복 구현)
같은 데이터(이름/금액/마감일)인데 추가와 수정이 별도 구현 + 헬퍼 복붙:
- 추가: [GoalStepName/Amount/Date](../app/components/GoalFormSections/) (`FlowInput` 사용)
- 수정: [GoalFormSection.tsx](../app/components/GoalFormSections/GoalFormSection.tsx) (shadcn `Input` 사용)
- 금액 변환 헬퍼(`manwonInputToWon` 등)가 [GoalStepAmount.tsx:15-40](../app/components/GoalFormSections/GoalStepAmount.tsx#L15-L40) ↔ [GoalFormSection.tsx:29-57](../app/components/GoalFormSections/GoalFormSection.tsx#L29-L57) **복붙**, `applyPreset`도 중복

### 변경 작업 (C안 = 셸은 둘, 알맹이는 하나)

**① 공유 입력 컴포넌트 3종 추출** (`app/components/GoalFormSections/fields/` 신설 권장)
- `GoalNameField` — 아이콘 슬롯 + 이름 입력 + 프리셋 칩
- `GoalAmountField` — 금액 입력 + 빠른조정 칩 (만원↔원 변환 내장)
- `GoalDateField` — 마감일 `DateSelectField` + 헬프텍스트
- 시각 스타일(컴포넌트·배경·모서리·칩 레이아웃·헬프텍스트 문구)을 **한 곳에서 결정** → 추가/수정 자동 일치

**② 금액/프리셋 헬퍼 단일화**
- `manwonInputToWon`/`wonToManwonDisplay`/`adjustWonByManwon`/`applyPreset`/`TARGET_QUICK_ADJUSTS`를 `app/utils/goal-format.ts`(기존 파일 존재) 또는 전용 util로 이동, 양쪽이 import

**③ 두 셸은 유지, 알맹이만 교체**
- 추가 위저드(`GoalStepName/Amount/Date`)는 각 스텝에서 위 공유 필드를 1개씩 렌더
- 수정 폼(`GoalFormSection`)은 공유 필드 3개를 한 화면에 + 보조필드(메모/이미 모은 돈/알림) 추가
- CTA/이탈 등은 P1에서 통일(이 단계 범위 밖)

**④ (선택, 권장) 헬프텍스트·프리셋 표기 불일치 정리**
- 마감일 헬프텍스트 문구 통일 ([GoalStepDate.tsx:33](../app/components/GoalFormSections/GoalStepDate.tsx#L33) vs [GoalFormSection.tsx:168](../app/components/GoalFormSections/GoalFormSection.tsx#L168))
- preset 매칭이 `name` 정확일치라 깨지기 쉬움 — placeholder `'예: 결혼자금'` vs preset `'결혼 자금'` 표기 정렬

### 기대 효과
- 목적 추가/수정의 입력 UI가 **시각·동작 100% 일치**
- 금액 변환 버그가 한 곳으로 수렴(복붙 분기 제거)

---

## 운영 안전 체크 (이 저장소 특수성 — 머지 전 필수)

- [ ] `output: 'export'` 정적 빌드 — 새 동적 세그먼트 추가 없음, `/add`·`/goal/detail/edit` 정적 경로 유지
- [ ] DB 스키마/API 무변경 (UI 리팩터링 한정)
- [ ] `npm run build:app` 산출물 `out/`에 진입 경로 HTML 존재 확인
- [ ] `capacitor.config.ts` `server.url` 주석 + `loggingBehavior: 'production'`
- [ ] 구버전 앱 호환: 투자 수정이 인플레이스→`/add`로 바뀌어도 구버전 앱은 기존 코드로 동작(클라 전용 변경이라 안전), 신버전만 통일된 경험

## 구현 순서 (2026-06-27 확정 — P0-2 프리필 미구현 발견으로 순서 변경)

1. **P0-1 먼저** (UI 리팩터링, 금융 데이터 무관, 리스크 낮음 + 일관성 효과 큼)
2. **P0-2는 전용 작업으로 후속 진행** — 투자 편집 프리필 신규 구현 + 종목/시세 복원 + 메인 QA가 선행돼야 안전. 한 PR에 묶지 않는다.
3. 각 단계 후 `tsc --noEmit` + `npm run build:app` 검증
4. 이후 P1(금액입력/CTA/날짜시트/네이티브 다이얼로그)로 진행

## 진행 상황

- [x] 죽은 코드 3덩이 삭제 + `InfoSection`/`types.ts` 정리 (2026-06-27)
- [x] **P0-1** 목적 추가/수정 입력 컴포넌트 공유 (공용 필드 3종 + `goal-amount` 유틸)
- [x] **P0-2** 적립항목 수정 `/add` 위저드 통일 — 별도 브랜치에서 프리필(종목코드·수익률 보존 포함) 구현 완료, `integration`에 반영됨
- [x] **P1 전체** — 네이티브 다이얼로그 제거 / CTA 문구 통일 / 수정 이탈 확인 / 날짜 시트 통일
- [x] **P2 전체** — "적립 정보" 라벨 / 알림 토글 / 헤더 통합 / 마감일 중복 제거 / 하드코딩 색 토큰화 (※ 목적 추가 선택입력(P2-5)은 의도적으로 제외)
- [x] 입력칸 디자인 다듬기 — 배경(near-white)·약한 보더·금액>연이율>만기 3단 크기 위계

### 남은 선택적 후속(블로킹 아님)
- [ ] 캘린더·납입기록·진행바의 완료↔미완료 상태색을 시맨틱 토큰(`--status-*`)으로 정리
- [ ] 전역 알림 OFF일 때 항목 알림 아이콘 표시 개선(현재 투자 상세와 동일 동작)
- [ ] 연이율 입력의 크기 지정을 FlowInput 정식 size 변형으로 정리(현재 className 오버라이드)
