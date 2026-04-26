# Torich 앱 협업/배포 운영 가이드 (2인 팀, Capacitor 기준)

## 1) 전제 (현재 구조)

- iOS 앱은 Capacitor **로컬 번들** 방식 (`webDir: 'out'`, 정적 export)
- `main` 배포 시 웹/서버는 즉시 반영되지만, **출시된 앱은 즉시 반영되지 않음**
- 클라이언트는 Supabase SDK로 **DB에 직접 접근** → Next.js API Route보다 **Supabase 스키마가 진짜 Breaking Change 주체**
- 따라서 운영 중에는 `구버전 앱 + 신버전 DB/API` 조합이 자주 발생함

---

## 2) 브랜치/머지 전략

| 브랜치 | 역할 |
|--------|------|
| `main` | 운영 배포 전용 (안정성 최우선) |
| `integration` | 통합 개발 브랜치 |
| `develop/suni`, `develop/hansol` | 개인 작업 브랜치 (그대로 유지) |

**흐름:** 개인 브랜치 → `integration`으로 PR → 안정화 후 `main`으로 머지

---

## 3) 협업 개발자 필수 준수 규칙

### 규칙 A. Supabase 스키마 Breaking Change 금지 (최우선)

앱이 Supabase SDK로 DB에 직접 접근하므로, **스키마 변경이 곧 API 변경**이다.

- **금지:**
  - 기존 컬럼 삭제
  - 기존 컬럼명 변경
  - 기존 컬럼 타입 변경 (예: `TEXT` → `INTEGER`)
  - NOT NULL 제약 추가 (기존 행 파괴)
  - RLS 정책 강화 (구버전 앱의 조회 범위 축소)

- **허용:**
  - 새 컬럼 추가 (`DEFAULT` 값 필수)
  - 새 테이블 추가
  - NOT NULL → NULL 허용으로 완화
  - 인덱스 추가

- **구조 변경이 꼭 필요하면 순서 고정:**
  1. 새 컬럼/구조 **추가** (구 스펙 병행 유지)
  2. 앱 업데이트 배포 완료 확인
  3. 구 스펙 제거

### 규칙 B. Next.js API Route Breaking Change 금지

- **금지:** 기존 필드 삭제·이름변경·타입변경, 기존 엔드포인트 경로/요청 형식 변경
- **허용:** 새 필드 추가, 새 엔드포인트 추가

### 규칙 C. 마이그레이션 작업 전 팀 공지 필수

두 명이 동시에 마이그레이션을 작성하면 적용 순서 충돌이 발생한다.

- 마이그레이션 파일 생성 전 상대방에게 공지
- 파일명은 **Supabase CLI 표준 타임스탬프** 형식 사용:
  ```
  YYYYMMDDHHMMSS_설명.sql
  예) 20260426153000_add_market_to_records.sql
  ```
- 마이그레이션 포함 PR은 머지 전 상대방 확인 필수

### 규칙 D. 스키마 변경 시 Supabase 타입 재생성 필수

마이그레이션 후 TypeScript 타입을 동기화하지 않으면 런타임까지 에러가 잡히지 않는다.

```bash
# 마이그레이션 적용 후 반드시 실행
supabase gen types typescript --project-id <프로젝트ID> > types/database.types.ts
```

PR 체크리스트 항목으로도 포함됨 (아래 5번 참고).

### 규칙 E. 머지 전 "구버전 앱 호환성" 확인

- 백엔드/스키마 변경 시: 구버전 앱의 쿼리·요청이 깨지지 않는지 확인
- 프론트 변경 시: 현재 운영 API/스키마와 충돌 없는지 확인

### 규칙 F. `main`에는 검증 완료 건만

- 실험성/대규모 리팩토링은 `integration`에서 충분히 검증 후 반영
- 긴급 수정도 최소 체크리스트 통과 후 머지

### 규칙 G. 로컬 환경 통일

팀 공통으로 아래를 고정 (`.env.example` 기준):

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | 서비스 Role Key (서버 전용) |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase 설정 |
| `NEXT_PUBLIC_API_URL` | 앱 빌드(`build:app`) 전용 필수 변수 |

"내 로컬에서만 되는 상태" 금지.

---

## 4) 빌드 관련 주의사항

### `build:app` 실패 시 복구 방법

`npm run build:app`은 빌드 중 `app/api`, `app/auth` 폴더를 `server-routes.backup/`으로 임시 이동한다.
빌드가 중간에 실패하면 이 폴더가 복구되지 않은 채로 남는다.

```bash
# build:app 실패 후 API 라우트가 사라진 경우 수동 복구
mv server-routes.backup/api app/api
mv server-routes.backup/auth app/auth
rm -rf server-routes.backup
```

### `capacitor.config.ts` 서버 URL 확인

개발 시 주석 해제하는 `server.url`이 **커밋되지 않았는지** 항상 확인:

```typescript
server: {
  // 이 줄이 주석 해제된 채로 커밋되면 운영 앱이 로컬 서버를 바라봄
  // url: 'http://localhost:3000',
}
```

PR 머지 전 `capacitor.config.ts` diff 확인 필수.

---

## 5) 테스트 운영 방식

- **일상:** 각자 로컬 테스트
- **통합:** 주 1~2회 `integration` 기준 TestFlight 내부 배포로 실기기 검증
- **운영 배포 전:** 핵심 시나리오 스모크 테스트 필수

### 배포 전 스모크 체크리스트

- 로그인/토큰 갱신 정상
- 핵심 조회 API (Supabase 직접 쿼리 포함) 정상
- 핵심 저장/수정 API 정상
- 푸시 알림/딥링크 등 네이티브 연동 포인트 정상
- 주요 에러 처리 (네트워크 실패/권한 거부) 정상

> 푸시 알림은 시뮬레이터에서 테스트 불가 — 실기기(TestFlight) 필수

---

## 6) PR 체크리스트 (복붙용)

```
- [ ] Supabase 스키마 Breaking Change 없음 (컬럼 삭제·이름변경·타입변경·NOT NULL 추가 X)
- [ ] Next.js API Route Breaking Change 없음 (삭제/이름변경/타입변경/경로변경 X)
- [ ] 마이그레이션 포함 시: 작업 전 팀 공지 완료 + 타임스탬프 파일명 사용
- [ ] 마이그레이션 포함 시: supabase gen types 재생성 완료
- [ ] capacitor.config.ts의 server.url이 주석처리 상태인지 확인
- [ ] 구버전 앱 호환성 확인 완료
- [ ] 필수 env/설정 변경사항 .env.example 업데이트
- [ ] 로컬 핵심 시나리오 테스트 완료
- [ ] 배포 영향도/롤백 방법 PR에 기재
- [ ] main 반영 전 스모크 체크리스트 통과
```

---

## 7) Edge Function 배포

`supabase/functions/`의 함수는 코드 변경 후 **별도로 배포해야 반영**된다.

```bash
# 특정 함수 배포
supabase functions deploy <함수명>

# 예시
supabase functions deploy schedule-notification
supabase functions deploy send-push
```

함수 변경이 포함된 PR은 머지 후 **배포까지 완료해야 작업 완료**로 간주한다.

---

## 8) 장애 예방 팀 공통 원칙

- "빠른 개발"보다 "운영 호환성" 우선
- 앱은 즉시 업데이트되지 않는다는 전제를 항상 유지
- **Supabase 스키마와 Next.js API 모두** 추가 중심으로 진화, 삭제/변경은 버전 전환 절차 후 진행
- 머지 판단 기준: "지금 운영 앱 사용자에게 안전한가?"

---

## 9) 한 줄 결론

**2인 팀은 `integration + 로컬 테스트`로 운영하되, Supabase 스키마·API 하위호환을 지키고, 마이그레이션은 사전 공지 + 타입 재생성까지 세트로 처리하며, 주기적 TestFlight 통합 검증을 수행한다.**
