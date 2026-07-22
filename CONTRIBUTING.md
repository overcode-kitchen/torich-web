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

## 이슈 · 릴리스 관리

기획/디자인/프론트 경계 없이 2명이 움직이므로, 도구는 **Issue · Milestone · Projects 보드 하나**로 끝낸다.

| 개념 | 도구 |
|---|---|
| 배포 버전 (`v1.2.1`) + 배포 예정일 | **Milestone** (due date = 배포일) |
| 그 버전에 넣을 작업 | 해당 마일스톤에 붙은 **Issue** |
| 담당자 | Issue Assignee (직접 self-assign) |
| 신규 / 진행중 / 완료 | **Projects 보드**의 Status |

보드 최초 세팅 방법은 [docs/github-projects-setup.md](docs/github-projects-setup.md) 참고 (1회성).

### 이슈 작성

- 제목은 커밋 컨벤션과 동일하게: `fix(stats): 손실이 차트에서 0으로 표시됨`
- 템플릿 2종(기능 / 버그)이 자동으로 뜨고, type 라벨도 자동으로 붙는다.
- **배포 버전이 정해진 작업은 마일스톤을 지정한다.** 언젠가 해야 하지만 아직 버전을 못 박을 수 없는 것(리스크가 커서 검증 기간이 필요한 리팩터링 등)은 마일스톤을 비워둔다 — 보드의 `백로그` 뷰가 그것만 모아 보여주고, 다음 버전 계획 때 여기서 끌어온다.

#### 라벨 6개

| 라벨 | 용도 |
|---|---|
| `feat` `fix` `refactor` `docs` | 작업 종류 (커밋 type과 동일) |
| `app-update-required` | **iOS 앱 재빌드·심사가 필요한 변경.** 웹 배포만으로 반영되지 않는 것 |
| `hotfix` | 마일스톤 무시하고 즉시 배포 |

`app-update-required`가 이 저장소에서 가장 중요한 라벨이다. 마일스톤에 이 라벨이 하나라도 있으면 그 릴리스는 앱 심사가 필요한 배포이고, 없으면 웹만 배포하면 끝난다. 릴리스 노트 상단에도 자동으로 표시된다.

### 한 사이클

```
이슈 생성 (마일스톤 + type 라벨)
  → self-assign, Status: 진행중
  → develop/<이름> 에서 작업
  → integration 으로 PR (본문에 "Closes #42")
  → 머지 → Status: 배포대기
  → 릴리스: integration → main 머지 후 v1.2.1 태그 push
  → 이슈 자동 close + 마일스톤 자동 close
```

> `Closes #42`는 **기본 브랜치(`main`)에 머지될 때만** 이슈를 닫는다. `integration` 머지로는 닫히지 않는데, 이게 의도한 동작이다 — integration 머지는 "코드는 들어갔지만 사용자에게는 아직 안 나간" 상태이고, 보드의 `배포대기`가 정확히 그 상태다. 다음 릴리스에 무엇이 나가는지가 이 컬럼에 그대로 보인다.

### 릴리스

1. 마일스톤의 열린 이슈를 정리한다 (남은 건 다음 마일스톤으로 이동).
2. `integration` → `main` PR 머지.
3. `package.json`의 `version`을 올리고 태그를 붙여 push한다. **버전 번호의 단일 소스는 `package.json`이고, 마일스톤명·태그명을 여기에 맞춘다.**

   ```bash
   git checkout main && git pull && git tag v1.2.1 && git push origin v1.2.1
   ```

4. `.github/workflows/release.yml`이 릴리스 노트 생성 + 앱 업데이트 필요 여부 표시 + 마일스톤 close를 처리한다.
5. `app-update-required`가 있었다면 iOS 아카이빙·심사를 진행한다 ([CLAUDE.md의 빌드 함정 섹션](CLAUDE.md) 확인 필수).
6. 다음 버전 마일스톤을 만든다.

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
