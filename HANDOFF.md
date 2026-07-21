# HANDOFF — 토리치 (torich-web)

> 이 파일은 재진입 노트다. 세션 시작 시 훅이 자동으로 읽어준다.
> 돌아오면 `/catchup` 으로 이 파일 + git 상태를 브리핑받고 시작하라.
> _마지막 갱신: 2026-07-19 17:01 · 브랜치: develop/hansol_

## 🎯 지금 목표 (한 줄)
완료 목표를 **삭제 대신 보관**하는 기능 구현이 끝났다(코드·커밋 완료). 남은 건 **실기기 검증**.

## ✅ 마지막으로 한 것 (이번 세션)
- **보관/복원/삭제 분리**: `useGoalUpdate`에 `archiveGoal`(=`archived_at` 세팅, **투자 링크 유지**)·`unarchiveGoal` 추가. "삭제"는 영구 삭제(`useGoalDelete`, hard delete)로 분리. 구버전 앱 호환 위해 `archive_goal` RPC는 DB에 존치.
- **보관함 신규**: 설정 › 보관한 목표(`/settings/archived-goals`) — 목록·복원·영구삭제. `SettingsView`에 진입점 추가. (정적 라우트, `out/settings/archived-goals.html` 산출 확인)
- **홈 완료 카드 UX 정리**(GoalGroupCard): ① 상태를 **헤더 pill**(`완료`/`기간 종료`)로 선언(D-day·% 대체) ② 박스 배너 → 하단 **무채색 보관 액션**(헤어라인+아이콘)으로 de-box ③ "적립 추가" 드로어 숨김 ④ 완료 목표 항목은 월 납입 완료 토글·미루기 **비활성**(GoalGroupItemRow `frozen`).
- **상세 메뉴**: 보관하기/삭제하기 분리 + 각 확인 모달. `DeleteConfirmModal`에 `tone`(primary/destructive)·라벨 옵션 추가(하위 호환).
- **분석 이벤트**: `goal_archive`/`goal_restore`/`goal_delete`(진짜 삭제) 구분.
- 커밋 `fcf15c1` (10파일, +346/-38).

## 📍 지금 상태
- 빌드/실행: `tsc --noEmit` ✅, `eslint` ✅. `npm run build:app`(placeholder env) ✅ — 정적 export 정상, `app/api`·`app/auth` 복구 확인, 백업 잔재 없음, `capacitor.config.ts` 안전(server.url 주석·`loggingBehavior:'production'`).
- 미커밋 변경: **없음** (피처 `fcf15c1` + 이 HANDOFF 커밋).

## ⏭️ 다음 할 일 (우선순위 순)
1. **실기기 검증(이번 기능)**: 완료 목표 카드 → 헤더 `기간 종료` pill·프로즌 행 → `보관하기` → 설정 보관함 → **복원/영구삭제** 왕복. 특히 복원 시 투자 링크가 온전히 되살아나는지.
2. **iOS 상단 잘림 실기기 검증**(이전 세션 이월, `5c0c951`) — WKWebView 전용 교정이라 웹 미검증. 안 잡히면 홈 진입 시 `resize` 강제 dispatch / 홈 body-scroll 구조 변경.
3. `integration`/`main` 머지 전 **실제 `NEXT_PUBLIC_API_URL`**로 `npm run build:app` 돌려 `out/` 재확인.
4. (별건, 담당 suni) 통계 v2 **Phase C — 전망 신호등** (`docs/stats-redesign-plan-v2.md`).

## 🧭 결정과 이유 (이번 세션)
- **보관 = 링크 유지 / 삭제 = 영구삭제로 분리** — 왜: 완료 목표는 되살릴 수 있어야 하고(복원 시 투자 온전), 실수 목표는 완전 제거+투자 회수가 맞음. 버린 대안: 기존 `archive_goal`(unlink)을 보관에 재사용(복원 시 투자 유실).
- **보관 시점 = 수동 + 완료 배너 유도**(자동 이동 X) — 왜: 완료 순간을 홈에 남겨 성취감 유지, 보관함이 설정 안이라 자동 이동 시 "사라졌다" 혼란.
- **완료 신호를 헤더 pill로 끌어올림** — 왜: `D+45·0%`는 "연체/실패"로 읽혀 완료 톤과 충돌. 헤더가 먼저 "끝남"을 선언하면 아래 투자 행이 자연히 "지난 기록"이 됨(카드 문법=헤더→리스트→하단액션 유지, 리스트 순서는 안 뒤집음).
- **완료 목표 항목 `frozen`** — 왜: 기간 종료된 목표에 이번 달 납입/미루기 조작은 모순.

## 🚧 막힌 것 / 열린 질문
- **완료 목표에 "진행 중 투자"가 묶인 경우**: 지금은 월 납입 토글을 일괄 `frozen` 처리. 아직 납입 중인 적금이 완료 목표에 묶여 있으면 체크가 막히는데, 이게 맞는지(복원/재연결 유도가 필요한지)는 열린 질문.
- iOS 상단 잘림(`5c0c951`) 실효성은 실기기 검증 전까지 미확정(이전 세션 이월).

## ▶️ 바로 이어가려면
`git checkout develop/hansol`(이미 그 브랜치). Xcode로 앱 빌드 → 홈에서 완료 목표 카드 보관 → 설정 › 보관한 목표에서 복원/영구삭제 확인. 웹으로만 볼 거면 `npm run dev` 후 완료 상태 목표를 만들어 카드/보관함 흐름 확인.
