# 기여 가이드

토리치 협업 규칙을 정리한 문서입니다. 코드 자체에 적용되는 **아키텍처/스키마 호환성 룰** 은 [CLAUDE.md](CLAUDE.md) 에 있고, 이 문서는 **사람 간 협업 절차** (브랜치 전략, 배포, 환경 설정 등) 를 다룹니다.

---

## 브랜치 전략

| 브랜치 | 역할 |
|--------|------|
| `main` | 운영 배포 전용. 안정성 최우선. |
| `integration` | 통합 개발 브랜치. 기능 통합과 안정화. |
| `develop/<이름>` | 개인 작업 브랜치 (예: `develop/suni`, `develop/hansol`). |

**흐름**: 개인 브랜치 → `integration` 으로 PR → 안정화 후 `main` 으로 머지.

### `main` 머지 원칙

- 실험성/대규모 리팩토링은 `integration` 에서 충분히 검증 후 반영.
- 긴급 수정도 최소 [PR 체크리스트](#pr-체크리스트) 통과 후 머지.

---

## 마이그레이션 작업 협업 규칙

두 명 이상이 동시에 마이그레이션을 작성하면 적용 순서 충돌이 발생합니다.

- 마이그레이션 파일 생성 **전에** 팀에 공지한다.
- 파일명은 Supabase CLI 표준 타임스탬프 형식 사용: `20260426153000_add_market_to_records.sql`.
- 마이그레이션 포함 PR은 머지 전 상대방 확인 필수.
- 마이그레이션 적용 후 `supabase gen types typescript --project-id <프로젝트ID> > types/database.types.ts` 실행 — 타입 동기화 누락 시 런타임까지 에러가 잡히지 않음.

스키마 호환성 규칙(어떤 변경이 금지/허용되는지)은 [CLAUDE.md의 "Supabase / API 호환성" 섹션](CLAUDE.md) 참고.

---

## 머지 전 호환성 확인

- **백엔드/스키마 변경 시**: 구버전 앱의 쿼리·요청이 깨지지 않는지 확인.
- **프론트 변경 시**: 현재 운영 API/스키마와 충돌이 없는지 확인.
- 머지 판단 기준: **"지금 운영 앱 사용자에게 안전한가?"**

---

## 로컬 환경

`.env.local` 의 키는 `.env.example` 을 기준으로 통일합니다. "내 로컬에서만 되는 상태" 를 만들지 않습니다.

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | 서비스 Role Key (서버 전용) |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase 설정 |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 측정 ID |
| `NEXT_PUBLIC_API_URL` | `npm run build:app` 빌드 시 필수 |

---

## 테스트 운영 방식

- **일상**: 각자 로컬에서 테스트.
- **통합**: 주 1~2회 `integration` 기준으로 TestFlight 내부 배포 후 실기기 검증.
- **운영 배포 전**: 핵심 시나리오 스모크 테스트 필수.

> 푸시 알림은 시뮬레이터에서 테스트 불가 — **실기기(TestFlight) 필수**.

### 배포 전 스모크 체크리스트

- [ ] 로그인/토큰 갱신 정상
- [ ] 핵심 조회 API (Supabase 직접 쿼리 포함) 정상
- [ ] 핵심 저장/수정 API 정상
- [ ] 푸시 알림/딥링크 등 네이티브 연동 포인트 정상
- [ ] 주요 에러 처리 (네트워크 실패/권한 거부) 정상

---

## PR 체크리스트

PR 본문 템플릿은 [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) 에 있어, **PR 생성 시 자동으로 채워집니다**. 항목을 채우고 체크박스를 확인한 뒤 머지하세요.

---

## 공통 원칙

- "빠른 개발" 보다 **"운영 호환성"** 우선.
- iOS 앱은 즉시 업데이트되지 않는다는 전제를 항상 유지.
- Supabase 스키마와 Next.js API 모두 **추가 중심으로 진화**, 삭제/변경은 버전 전환 절차 후 진행.

> **요약**: 2인 팀은 `integration + 로컬 테스트` 로 운영하되, Supabase 스키마·API 하위호환을 지키고, 마이그레이션은 사전 공지 + 타입 재생성까지 세트로 처리하며, 주기적 TestFlight 통합 검증을 수행한다.
