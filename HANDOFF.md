# HANDOFF — 토리치 (torich-web)

> 이 파일은 재진입 노트다. 세션 시작 시 훅이 자동으로 읽어준다.
> 돌아오면 `/catchup` 으로 이 파일 + git 상태를 브리핑받고 시작하라.
> _마지막 갱신: 2026-07-18 22:09 · 브랜치: develop/hansol_

## 🎯 지금 목표 (한 줄)
상세 페이지 UX 마감 + 홈/캘린더 미루기·배지 다듬기는 끝났고, **iOS 앱 빌드로 실기기 검증**만 남았다.

## ✅ 마지막으로 한 것 (이번 세션)
- **상세 페이지 마감**: 목적 상세의 묶인/묶을 투자 행을 탭하면 투자 상세로 이동(`/investment?id=`), 묶기=primary·풀기=토널 버튼으로 구분, 목적 제목 `text-2xl→xl` 통일, 납입 캡션 대비 상향(WCAG), 스티키 탭바 뒤 스크롤 비침 수정(`DetailTabs` sticky `top-0`).
- **미루기 사전 허용**: 홈·캘린더 공통으로 `canPostpone`(납입일 도래) 게이트 제거 → 대기 항목이면 납입일 전에도 미루기 노출.
- **D-day 배지 통일**: 일반 D-day를 정산 대기와 동일한 회색 pill 스타일로.
- **iOS 홈 상단 잘림 보강**: `AppLayout`의 스크롤 넛지에 강제 리플로우 + 150ms 지연 폴백 추가.
- **통계 v2 담당 배정**: `docs/stats-redesign-plan-v2.md` 상단에 suni 담당 배너(Phase A·B 완료 / Phase C 잔여).
- button.tsx에 재사용 `tonal`(그린 토널) 변형 추가. 편집을 막던 선재 린트 2건(PaymentHistorySection 조건부 훅, MonthAgendaSection 렌더 중 ref 변경) 동작 보존하며 정리.

## 📍 지금 상태
- 빌드/실행: `tsc --noEmit` ✅, eslint ✅. 정적 export는 배포용 `NEXT_PUBLIC_API_URL`이 이 환경에 없어 **placeholder로만** 검증함(정상 산출). 실배포 빌드는 실제 env로 재확인 필요.
- 미커밋 변경: **없음** (4개 커밋 `bc541b1→5c0c951`, `origin/develop/hansol`에 푸시 완료).

## ⏭️ 다음 할 일 (우선순위 순)
1. **iOS 앱 빌드로 홈 상단 잘림(`5c0c951`) 실기기 검증** — 웹에선 재현 불가한 WKWebView 전용 교정이라 미검증. 안 잡히면 다른 접근(홈 진입 시 `resize` 강제 dispatch, 또는 홈 body-scroll 구조 변경) 필요.
2. `integration`/`main` 머지 전 실제 `NEXT_PUBLIC_API_URL`로 `npm run build:app` 돌려 `out/` 산출물 확인.
3. (별건, 담당 suni) 통계 v2 **Phase C — 전망 신호등** 착수: `GoalOutlookSection.tsx` 신규 + `projectedProgressPercent→신호등 색` 매핑 + IA '행동→결과→전망' 마무리. 상세는 `docs/stats-redesign-plan-v2.md`.

## 🧭 결정과 이유 (이번 세션)
- **미루기를 납입일 전에도 허용** — 왜: 사용자가 "이번 달은 건너뛸게"를 미리 지정하고 싶어함. 버린 대안: 기존 `canPostpone`(오늘≥납입일) 유지. 홈·캘린더 양쪽 게이트 제거.
- **D-day 배지 통일(정산대기와 동일 pill)** — 왜: 사용자 요청(형태 일관성). 트레이드오프: 정산 대기의 시각적 특수함이 다소 희석됨(텍스트 "정산 대기 ·" 로만 구분).
- **투자 행 탭 → 상세 이동** — 왜: 앱 리스트 컨벤션(`InvestmentItem`)과 일치. 버튼 중첩(invalid HTML) 피하려 텍스트=이동버튼 / 우측=액션버튼 형제 구조.

## 🚧 막힌 것 / 열린 질문
- iOS 상단 잘림 수정의 실효성은 실기기 검증 전까지 미확정(위 다음 할 일 1).

## ▶️ 바로 이어가려면
`git checkout develop/hansol` (이미 그 브랜치). iOS 검증부터면 Xcode로 앱 빌드 후 "목적 추가 > 뒤로가기 > 홈 상단" 확인. 통계 v2면 `docs/stats-redesign-plan-v2.md` 열고 Phase C부터.
