# 협업 흐름

이슈 하나가 사용자에게 닿기까지. **사람이 하는 일**과 **자동으로 되는 일**을 나눠 적었다.

규칙의 배경과 예외는 [CONTRIBUTING.md](../CONTRIBUTING.md), 보드 최초 세팅은 [github-projects-setup.md](github-projects-setup.md) 참고.

---

## 전체 그림

| 단계 | 사람이 하는 일 | 자동으로 되는 일 |
|---|---|---|
| **1. 이슈 등록** | 템플릿 채우기 + 마일스톤 지정 | 보드에 `신규`로 등록 |
| **2. 담당자 채택** | 스스로 assign + 카드를 `진행중`으로 | — |
| **3. 작업** | `develop/<이름>`에서 커밋 (`Closes #N`) | — |
| **4. PR** | `integration`으로 PR 생성 | 타입 체크 + 린트 |
| **5. 머지** | **Squash merge** | 카드 → `배포대기` |
| **6. 배포** | `main`으로 **Merge commit** + 버전·태그 | 릴리스 노트 / 마일스톤 닫기 / 이슈 닫기 / 카드 → `완료` |

브랜치는 두 개만 기억하면 된다.

| 브랜치 | 뜻 |
|---|---|
| `main` | **지금 앱스토어에 있는 것** |
| `integration` | **다음에 낼 것** |

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

1. 이슈 우측 **Assignees**에서 자기 자신 선택
2. [보드](https://github.com/orgs/overcode-kitchen/projects/2)에서 그 카드를 **`진행중`으로 드래그**

> 이 두 가지만 수동이다. "누가 뭘 하고 있는지"를 나타내는 정보라 자동화할 근거가 없다.

## 3. 작업

개인 브랜치에서 한다. 이슈마다 새로 파지 않고 **자기 브랜치를 계속 쓴다.**

```bash
git checkout develop/suni && git pull
git merge origin/integration        # 남이 머지한 것 받아오기
```

커밋 메시지 규칙은 `type(scope): 한글 설명 + ~함/~음`이고, **마지막 줄에 `Closes #N`을 넣는다.**

```
fix(stats): 손실 데이터가 차트에서 음수 영역으로 표시되도록 수정함

Closes #42
```

> ⚠️ **`Closes #N`은 반드시 커밋 메시지에.** PR 본문에 쓰면 동작하지 않는다 — 이유는 [자주 틀리는 것](#자주-틀리는-것-3가지) 참고.

## 4. PR 올리기

```bash
git push origin develop/suni
```

**base를 `integration`으로** 지정해 PR을 만든다. PR 템플릿이 자동으로 뜨니 채운다.

**자동**: [CI](../.github/workflows/ci.yml)가 돌아 타입 체크와 린트를 검사한다. 린트는 **이 PR이 건드린 파일만** 본다 (기존 코드에 남은 에러가 새 작업을 막지 않도록).

초록불이 아니면 머지하지 않는다.

## 5. 머지

**Squash merge**를 고른다. 개인 브랜치의 중간 커밋을 `integration`에 남기지 않기 위해서다.

**자동**: [board.yml](../.github/workflows/board.yml)이 커밋 메시지의 `Closes #N`을 읽어 **카드를 `배포대기`로 옮긴다.**

이슈는 아직 **닫히지 않는다.** 코드는 들어갔지만 사용자에게는 안 나갔기 때문이고, `배포대기`가 정확히 그 상태다. **다음 배포에 뭐가 나가는지가 이 컬럼 그대로다.**

> 머지해도 `develop/<이름>` 브랜치는 지워지지 않는다. 계속 쓰는 브랜치라 그렇게 설정해 뒀다.

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
| `develop/<이름>` → `integration` | **Squash** | 중간 커밋을 남기지 않는다 |
| `integration` → `main` | **Merge commit** | Squash하면 두 브랜치가 영구히 갈라진다 |
| `hotfix/*` → `main` | **Merge commit** | 위와 같음 |

### 3. 브랜치를 지우지 않는다

`develop/<이름>`과 `integration`은 **계속 쓰는 브랜치**다. 그래서 "머지 후 자동 삭제"를 꺼 뒀다. `hotfix/*`처럼 진짜 일회용만 머지 후 손으로 지운다.

---

## 자동화가 안 돌 때

| 증상 | 확인할 곳 |
|---|---|
| PR 머지했는데 카드가 `배포대기`로 안 감 | 커밋 메시지에 `Closes #N`이 있나 → [Actions의 Board 워크플로 로그](https://github.com/overcode-kitchen/torich-web/actions/workflows/board.yml) |
| 위 로그에 `PROJECT_TOKEN 시크릿이 없어` 경고 | 토큰 만료. [발급 절차](github-projects-setup.md#project_token-시크릿-boardyml-동작에-필수) |
| 새 이슈가 보드에 안 올라옴 | 보드 `···` → Workflows → **Auto-add to project**가 켜져 있나 |
| 배포했는데 이슈가 안 닫힘 | 커밋 메시지의 `Closes #N`이 `main`까지 갔나 (`git log main --grep "Closes #N"`) |
| CI 린트가 이상한 파일을 잡음 | 변경 파일만 검사한다. base 브랜치가 `integration`이 맞는지 확인 |

보드 카드가 안 보이면 **뷰 필터**를 먼저 의심한다. `v1.3.0` 뷰는 그 마일스톤만, `백로그` 뷰는 마일스톤 없는 것만 보여준다.
