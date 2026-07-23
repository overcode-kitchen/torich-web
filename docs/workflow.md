# 협업 흐름

이슈 하나가 사용자에게 닿기까지. **사람이 하는 일**과 **자동으로 되는 일**을 나눠 적었다.

규칙의 배경과 예외는 [CONTRIBUTING.md](../CONTRIBUTING.md), 보드 최초 세팅은 [github-projects-setup.md](github-projects-setup.md) 참고.

---

## 전체 그림

| 단계 | 사람이 하는 일 | 자동으로 되는 일 |
|---|---|---|
| **1. 이슈 등록** | 템플릿 채우기 + 마일스톤 지정 | 보드에 `신규`로 등록 |
| **2. 담당자 채택** | 스스로 assign | 카드 → `진행중` + `진행중` 라벨 |
| **3. 작업** | 이슈 브랜치(`type/#-설명`)에서 커밋 (`Closes #N`) | — |
| **4. PR** | `integration`으로 PR 생성 | 타입 체크 + 린트 |
| **5. 머지** | **Squash merge** | 카드 → `배포대기` + `배포대기` 라벨 |
| **6. 배포** | `main`으로 **Merge commit** + 버전·태그 | 릴리스 노트 / 마일스톤 닫기 / 이슈 닫기 / 카드 → `완료` |

### 상태는 라벨로도 보인다

보드 Status는 Projects 안에서만 보이고 [Issues 리스트](https://github.com/overcode-kitchen/torich-web/issues)에는 나오지 않는다. 그래서 같은 정보를 라벨로 복사해 둔다.

| 라벨 | 뜻 |
|---|---|
| (없음) | `신규` — 아직 아무도 안 잡음 |
| `진행중` (노랑) | 담당자가 작업 중 |
| `배포대기` (파랑) | `integration` 머지 완료, 배포를 기다림 |

**손으로 붙이지 않는다.** [board.yml](../.github/workflows/board.yml)이 보드와 라벨을 함께 바꾼다. 리스트에서 `label:배포대기`로 필터하면 다음 배포에 나갈 것만 볼 수 있다.

| 무엇을 하면 | 언제 반영되나 |
|---|---|
| 담당자 지정·해제 | 즉시 |
| **이슈 브랜치 생성** (`fix/58-...`) | 즉시 — 브랜치 이름의 번호를 읽는다 |
| PR 머지 · 이슈 닫힘 | 즉시 |
| **보드에서 드래그 / 이슈 사이드바에서 Status 변경** | **최대 10분** |

마지막 줄만 느린 이유가 있다. GitHub은 **보드 카드를 옮겨도 저장소 워크플로에 알려주지 않는다** — Projects v2의 항목 변경은 Actions 트리거로 존재하지 않는다. 그래서 10분마다 보드를 훑어 라벨을 맞춘다. 기다리기 싫으면 [Board 워크플로](https://github.com/overcode-kitchen/torich-web/actions/workflows/board.yml)에서 **Run workflow**를 누르면 즉시 돈다.

> 어느 경로로 바꾸든 결국 맞춰지므로 편한 방법을 쓰면 된다. **보드가 항상 기준이고 라벨이 따라간다.**

오래 사는 브랜치는 둘뿐이다. **실제 작업은 이슈마다 판 브랜치**에서 하고, 그 브랜치는 `integration`에서 딴다.

| 브랜치 | 뜻 |
|---|---|
| `main` | **지금 앱스토어에 있는 것** |
| `integration` | **다음에 낼 것 (이슈 브랜치는 여기서 판다)** |
| `type/#-설명` | **이슈 하나짜리 작업 브랜치 (일회용)** |

---

## 1. 이슈 등록

버그나 개선점을 발견한 사람이 등록한다. 고칠 사람이 아니어도 된다.

[New issue](https://github.com/overcode-kitchen/torich-web/issues/new/choose) → **기능 / 개선** 또는 **버그** 템플릿

- **제목은 커밋 컨벤션과 같게**: `fix(stats): 손실이 차트에서 0으로 표시됨`
- **마일스톤을 고른다** — 판단 기준은 하나, **"지금 나가야 하나?"**

| 상황 | 마일스톤 |
|---|---|
| 다음 배포에 넣을 것 | `v1.3.0` (진행 중인 버전) |
| 운영 장애라 지금 당장 | patch 버전 — [급한 수정](#급한-수정이-생겼을-때) 참고 |
| 언젠가는 해야 하는데 버전은 미정 | **비워둔다** → 보드 `백로그` 뷰에 쌓인다 |

> 라벨은 템플릿이 알아서 붙인다. `feat` `fix` `refactor` `docs` 4개뿐이고 커밋 type과 같다.

**자동**: 이슈를 만들면 보드에 `신규`로 올라간다. 손으로 추가할 필요 없다.

## 2. 담당자 채택

올라온 이슈를 보고 **본인이 판단해서 가져간다.** 배정해주는 사람은 없다.

이슈 우측 **Assignees**에서 자기 자신을 선택하면 끝이다.

**자동**: 카드가 `진행중`으로 옮겨지고 `진행중` 라벨이 붙는다. 담당자를 다시 떼면 `신규`로 되돌아간다.

> 이미 `배포대기`까지 간 이슈는 담당자를 붙여도 되돌아가지 않는다.

## 3. 작업

**이슈마다 새 브랜치를 판다.** `integration`에서 최신을 받아 딴다.

이름은 `type/이슈번호-설명` — prefix는 커밋 type과 같고, 이슈번호로 추적하며, 설명은 짧게 붙인다.

```bash
git checkout integration && git pull
git checkout -b fix/58-chart-loss   # type/이슈번호-설명
```

| 브랜치 이름 | 뜻 |
|---|---|
| `feat/42-goal-reorder` | 기능 이슈 #42 |
| `fix/58-chart-loss` | 버그 이슈 #58 |
| `chore/17-husky-branch-hook` | 잡무 이슈 #17 |

> 작업이 길어져 `integration`에 남이 머지한 게 쌓이면 `git merge origin/integration`으로 받아온다.
> 이슈 브랜치가 아닌 `main`·`integration`·`develop/*`에서 커밋하면 `commit-msg` 훅이 **경고**를 띄운다(커밋은 통과).

커밋 메시지 규칙은 `type(scope): 한글 설명 + ~함/~음`이고, **마지막 줄에 `Closes #N`을 넣는다.**

```
fix(stats): 손실 데이터가 차트에서 음수 영역으로 표시되도록 수정함

Closes #42
```

> ⚠️ **`Closes #N`은 반드시 커밋 메시지에.** PR 본문에 쓰면 동작하지 않는다 — 이유는 [자주 틀리는 것](#자주-틀리는-것-3가지) 참고.

## 4. PR 올리기

```bash
git push -u origin fix/58-chart-loss
```

**base를 `integration`으로** 지정해 PR을 만든다. PR 템플릿이 자동으로 뜨니 채운다.

**자동**: [CI](../.github/workflows/ci.yml)가 돌아 타입 체크와 린트를 검사한다. 린트는 **이 PR이 건드린 파일만** 본다 (기존 코드에 남은 에러가 새 작업을 막지 않도록).

초록불이 아니면 머지하지 않는다.

## 5. 머지

**Squash merge**를 고른다. 개인 브랜치의 중간 커밋을 `integration`에 남기지 않기 위해서다.

**자동**: [board.yml](../.github/workflows/board.yml)이 커밋 메시지의 `Closes #N`을 읽어 **카드를 `배포대기`로 옮긴다.**

이슈는 아직 **닫히지 않는다.** 코드는 들어갔지만 사용자에게는 안 나갔기 때문이고, `배포대기`가 정확히 그 상태다. **다음 배포에 뭐가 나가는지가 이 컬럼 그대로다.**

> 머지가 끝난 이슈 브랜치는 **지운다** (GitHub 머지 화면의 "Delete branch"). 일회용이다.

## 6. 배포

배포 담당자가 진행한다.

**① 마일스톤 정리** — [v1.3.0 마일스톤](https://github.com/overcode-kitchen/torich-web/milestones)의 열린 이슈를 다음 마일스톤이나 백로그로 옮긴다.

**② `integration` → `main` PR 머지** — 반드시 **Merge commit**으로 (Squash 아님).

**③ 버전 3군데를 올려 커밋**

| 위치 | 예시 | 규칙 |
|---|---|---|
| `package.json` 의 `version` | `1.3.0` | 단일 소스 |
| `MARKETING_VERSION` (`ios/App/App.xcodeproj/project.pbxproj`) | `1.3.0` | package.json과 항상 동일 |
| `CURRENT_PROJECT_VERSION` (같은 파일) | `4` | **심사 제출마다 +1.** 버전과 무관, 되돌리면 안 됨 |

**④ 태그 push**

```bash
git checkout main && git pull && git tag v1.3.0 && git push origin v1.3.0
```

**자동**: [release.yml](../.github/workflows/release.yml)이 릴리스 노트를 만들고, 마일스톤을 닫고, `main`에만 있고 `integration`에 없는 커밋이 있으면 이슈를 만들어 알려준다. 커밋 메시지의 `Closes #N`으로 **이슈가 닫히고, 카드가 `완료`로 넘어간다.**

**⑤ iOS 아카이빙·심사** — [CLAUDE.md의 빌드 함정 섹션](../CLAUDE.md)을 반드시 확인한다. 특히 아카이빙 직전:

```bash
grep -ro "localhost:3000" out/ | wc -l   # 반드시 0
```

**⑥ 다음 마일스톤 생성**

---

## 급한 수정이 생겼을 때

운영 장애는 `integration`에서 시작하면 안 된다. 거기엔 **아직 안 내보낼 다음 버전 기능이 섞여 있기 때문이다.**

```bash
git checkout main && git pull && git checkout -b hotfix/1.2.1
```

고쳐서 **`main`으로** PR → 머지 → 버전 올리고 태그 `v1.2.1` push. 그리고 **잊지 말고:**

```bash
git checkout integration && git pull && git merge origin/main && git push origin integration
```

이걸 빠뜨리면 **다음 배포에서 그 버그가 되살아난다.** `release.yml`이 자동으로 검사해서 누락되면 이슈를 만들어주니 외울 필요는 없다.

> `v1.2.1`을 배포해도 `v1.3.0` 작업은 그대로 굴러간다. 마일스톤 두 개가 동시에 열려 있는 게 정상이다.

---

## 자주 틀리는 것 3가지

### 1. `Closes #N`은 커밋 메시지에 쓴다

깃헙은 **PR의 base가 기본 브랜치(`main`)일 때만** 닫기 링크를 만든다. 우리 PR은 base가 `integration`이라, 본문에 `Closes #42`를 써도 **단순 텍스트로만 남는다.**

커밋 메시지에 쓰면 두 가지가 다 된다 — `board.yml`이 읽어 카드를 옮기고, `main` 머지 때 이슈가 닫힌다.

### 2. 머지 방식이 두 가지다

| 무엇을 → 어디로 | 방식 | 이유 |
|---|---|---|
| 이슈 브랜치(`type/#-설명`) → `integration` | **Squash** | 중간 커밋을 남기지 않는다 |
| `integration` → `main` | **Merge commit** | Squash하면 두 브랜치가 영구히 갈라진다 |
| `hotfix/*` → `main` | **Merge commit** | 위와 같음 |

### 3. 이슈 브랜치는 머지 후 지운다

작업 브랜치(`type/#-설명`)와 `hotfix/*`는 **일회용**이다. 머지되면 지운다. 오래 남는 건 `main`·`integration` 둘뿐이다.

---

## 자동화가 안 돌 때

| 증상 | 확인할 곳 |
|---|---|
| PR 머지했는데 카드가 `배포대기`로 안 감 | 커밋 메시지에 `Closes #N`이 있나 → [Actions의 Board 워크플로 로그](https://github.com/overcode-kitchen/torich-web/actions/workflows/board.yml) |
| 상태 라벨과 보드 Status가 어긋남 | 보드 드래그·사이드바 변경은 **10분 주기 동기화**로 반영된다. 급하면 [Board 워크플로](https://github.com/overcode-kitchen/torich-web/actions/workflows/board.yml) → **Run workflow** |
| 작업 중인데 `진행중`이 안 붙음 | **담당자가 비어 있는지 확인.** 작업을 시작하면 self-assign 하는 게 규칙이다 (브랜치를 `type/이슈번호-설명`으로 파도 자동으로 붙는다) |
| 위 로그에 `PROJECT_TOKEN 시크릿이 없어` 경고 | 토큰 만료. [발급 절차](github-projects-setup.md#project_token-시크릿-boardyml-동작에-필수) |
| 새 이슈가 보드에 안 올라옴 | 보드 `···` → Workflows → **Auto-add to project**가 켜져 있나 |
| 배포했는데 이슈가 안 닫힘 | 커밋 메시지의 `Closes #N`이 `main`까지 갔나 (`git log main --grep "Closes #N"`) |
| CI 린트가 이상한 파일을 잡음 | 변경 파일만 검사한다. base 브랜치가 `integration`이 맞는지 확인 |

보드 카드가 안 보이면 **뷰 필터**를 먼저 의심한다. `v1.3.0` 뷰는 그 마일스톤만, `백로그` 뷰는 마일스톤 없는 것만 보여준다.
