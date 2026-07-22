# 협업 온보딩

> **요약:** 내 브랜치 작업 → `integration` PR → 나머지는 자동화가 챙김. 헷갈리면 "운영 앱 사용자에게 안전한가?".

이 문서 하나로 오늘 작업 시작 가능. 나머지는 필요할 때 아래 "더 볼 문서"에서 확인.

---

## 0. 딱 하나만 기억

> **헷갈리면 이 질문으로 판단** → "지금 운영 앱 사용자에게 안전한가?"

이유: iOS 앱은 사용자가 직접 업데이트해야 반영됨 → 항상 `구버전 앱 + 신버전 DB` 조합이 존재함.

---

## 1. 브랜치 (뜻 2개)

| 브랜치 | 뜻 |
|--------|-----|
| `main` | 지금 앱스토어에 나가 있는 것 |
| `integration` | 다음에 낼 것 |
| `develop/<내이름>` | 내 개인 작업 공간 |

흐름: `develop/나` → `integration` → `main`(+태그) / 급할 땐 `main` → `hotfix/버전` → `main` → 다시 `integration`에 합침.

---

## 2. 개발 흐름 (이것만 매번 챙김)

| 단계 | 내가 할 일 | 자동화 (Action/workflow) |
|---|---|---|
| ① 이슈 | 이슈 생성<br>제목: 커밋 형식에 맞춰<br>마일스톤: 배포 버전 | 템플릿 표시 · 라벨 자동 부착 |
| ② 작업 | `develop/<name>`에서 작업<br>커밋 메시지에 `Closes #이슈번호` | — (여기는 내 몫) |
| ③ PR → `integration` | PR 올리기<br>CI 통과 확인 후 머지 | `ci.yml` 타입체크·린트 / 머지 시 `board.yml`이 보드 '배포대기'로 이동 |
| ④ 릴리스 → `main` | `integration` → `main` 머지<br>태그 push (`v1.3.0` 형태) | 이슈 자동 close·'완료' / `release.yml` 릴리스노트·back-merge 검사·마일스톤 close |

- **`Closes #42`는 "지금 닫기"가 아니라 예약** → `integration`에선 '배포대기'로만, `main` 도달 시 자동 close. (`Refs`·맨 `#42`는 자동화가 못 잡음)
- **이슈 여러 개:** `Closes #1, Closes #2` — 키워드를 이슈마다 붙임 (`Closes #1, #2`는 #1만 닫힘). 여러 커밋에 나눠 써도 됨.
- **어휘 4개:** `feat` `fix` `refactor` `docs` / 형식 `type(scope): 한글 설명 ~함/~음`

---

## 3. 외울 필요 없는 것 (자동화가 잡아줌)

| 잊기 쉬운 일 | 처리 |
|---|---|
| 머지 후 보드 상태 안 옮김 | `board.yml`이 자동 이동 |
| 급한 수정을 `integration`에 안 합침 | `release.yml`이 검사 → 빠지면 이슈 자동 생성 |
| 깨진 코드가 `integration`에 들어감 | `ci.yml`이 타입체크 + 변경파일 린트 |

---

## 4. 사고 나면 큰 것 (조심)

| 항목 | 규칙 |
|---|---|
| Supabase 스키마 = API | 삭제·이름변경·타입변경·NOT NULL 추가 금지. **추가만** (새 컬럼 `DEFAULT` 필수) |
| 마이그레이션 | 만들기 전 상대에게 공지 → 타임스탬프 파일명 → 끝나면 타입 재생성 |
| `capacitor.config.ts`의 `server.url` | 열린 채 배포되면 전체 사용자 앱 먹통. PR 체크리스트에서 확인 |

---

## 더 볼 문서 (그 작업 할 때만)

| 언제 | 문서 |
|---|---|
| 협업 절차 전체(브랜치·릴리스·버전) | [CONTRIBUTING.md](../CONTRIBUTING.md) |
| 호환성·빌드 함정·라우팅 | [CLAUDE.md](../CLAUDE.md) |
| 새 페이지·파일 구조 | [architecture.md](architecture.md) |
| UI(색·다크모드·아이콘) | [design-system.md](design-system.md) |
| 보드 최초 세팅(1회성) | [github-projects-setup.md](github-projects-setup.md) |
