# 토리 키우기 (Tory Raising) 기능 분석

> 실제 구현 코드(`app/tory`, `app/components/ToryRaising`, `app/hooks/tory-raising`, `app/hooks/tory`, `app/utils/tory-raising`)를 한 줄씩 읽어 정리한 문서. 수치·공식은 모두 실제 코드에서 인용했다.
> 대조 기준 PRD: `docs/tori-raising/prd.md` (v1.0, 2026-04-29).
> 분석 시점 코드 상태(중요): 두 개의 UI 진입 트리가 공존하며, **실제로 렌더링되는 것은 `ToryRaisingFullScreen` 하나뿐**이다. 나머지(`ToryRaisingSecretGate` → `ToryRaisingPanel` → `Growth/Store/Customize` 섹션)는 정의되어 있으나 **어디서도 import 되지 않는 사문(死文) 트리**다. 이 문서는 "현재 라이브 동작"과 "사문 트리" 양쪽을 모두 명시한다.

---

## 0. TL;DR 핵심 발견

- **라이브 진입점은 하나**: `app/tory/page.tsx` → `ToryRaisingFullScreen`. 이 컴포넌트만 화면에 그려진다.
- **사문 트리**: `ToryRaisingSecretGate`, `ToryRaisingPanel`, `ToryRaisingGrowthSection`, `ToryRaisingStoreSection`, `ToryRaisingCustomizeSection` 는 정의만 존재하고 외부 import가 0건이다(서로만 참조). PRD가 묘사하는 "성장/상점/꾸미기 3탭 패널", "투자 완료 체크 버튼(+10)"은 이 사문 트리에 있다.
- **현재 전체 화면(`/tory`)도 비밀 토큰(`1234`) 잠금 상태**다. 토큰 입력 전엔 모든 액션 버튼이 `disabled`.
- **투자 완료 보상의 "진짜" 경로는 훅이 아니라 유틸 함수**다. 메인 화면의 토리 키우기 버튼(`claimInvestmentComplete`)은 사문 트리에만 연결돼 있고, 실제 투자 완료 행동(달력·예정 투자 체크)은 `awardToryInvestmentComplete()` 유틸을 호출해 `localStorage`를 직접 수정한다. 이 유틸 경로는 **레벨업 모달을 띄우지 않는다.**
- **두 코드 경로가 동일한 `localStorage` 키 `'tory-state'` 를 공유**한다(훅과 유틸이 각자 스키마를 정의·읽기·쓰기). 단, 유틸 쪽 스키마는 `lastPlayAt`/`lastPetAt` 필드를 모른다(읽을 때 spread로 보존은 됨).
- 상점·꾸미기·캐릭터 일러스트는 전부 **이미지 미구현(텍스트 플레이스홀더)**. 토리 캐릭터 1종(`/images/tory-character.png`)만 실제 이미지로 표시된다. PRD가 말한 5단계 외형/레이어 합성/배경 즉시 반영은 데이터 모델로만 존재하고 시각 표현은 없다.
- PRD 경제 항목 중 **명언 공유 +2, 한 달 투자 100% +20, 레벨업(홀수/10단위) 보상은 코드에 존재하지 않는다.**

---

## 1. 기능 개요 — 왜 만들었나

### 1.1 제품적 동기 (PRD §1)

토리치는 적립식 투자 리마인더 서비스로 **핵심 가치는 "매월 정해진 날 투자 완료"**다. 그러나 투자일이 한 달에 1~2회뿐이라 **앱 진입 빈도가 구조적으로 낮다.** 토리 탭에는 이미 "오늘의 명언" 같은 가벼운 매일-진입 동기가 있었지만, **장기·누적되는 동기**가 없었다.

토리 키우기는 이 공백을 두 축으로 메우는 게이미피케이션이다.

1. **매일 진입 동기** — 캐릭터(토리) 성장 + 꾸미기 욕구. 출석/방문/놀아주기/쓰다듬기로 매일 도토리가 쌓인다.
2. **투자 완료 행동 강화** — 본질 행동(투자 완료)에 가장 큰 보상(+10, 출석의 10배)을 명시적으로 부여해 진행도를 가시화한다.

### 1.2 PRD가 못박은 디자인 원칙 (PRD §2.2)

| 원칙 | 설명 | 구현 반영 |
|---|---|---|
| 본질 행동을 가장 크게 보상 | 투자 완료가 출석의 5~10배 | ✅ 투자 +10 vs 출석 +1 (정확히 10배) |
| 가벼운 출석으로도 진행 | 매일 1개씩이라도 쌓임 | ✅ 출석/방문/놀기/쓰다듬기 각 +1 |
| 단계별 시각 변화로 도달감 | 레벨 구간마다 토리/칭호 변화 | ⚠️ 칭호/외형 단계 *데이터*는 있으나 외형 일러스트 미구현 |
| 도토리에 사용처 부여 | 상점 → 꾸미기 | ✅ 구매로 `balance` 차감, 장착 가능 |
| 강제하지 않음 | 안 해도 본 서비스 이용 가능 | ✅ 별도 탭, 잠금 게이트로 분리 |

### 1.3 메타포 (PRD §2.3)

적립식 투자 = 도토리를 꾸준히 모으기 → 다람쥐(토리)는 도토리를 모으는 동물 → 모은 도토리로 토리를 꾸민다(노력의 가시적 결과).

---

## 2. 도토리 경제

### 2.1 누적(totalAcorns) vs 보유(balance) 구분 — 가장 중요한 모델

PRD §4.2가 못박은 이중 화폐 모델이 코드에 그대로 구현돼 있다.

- **`totalAcorns` (누적)**: 모든 획득 도토리의 합. **절대 감소하지 않음. 레벨 계산의 유일한 기준.**
- **`balance` (보유)**: 현재 사용 가능한 도토리. 상점 구매 시에만 감소.

코드상 **모든 획득 액션은 둘을 동시에 증가**시킨다 (`useToryRaisingData.ts:221-223`, 그리고 투자 유틸 `awardToryInvestmentComplete.ts:128-129`):

```ts
const nextTotal = prev.totalAcorns + earned
const nextBalance = prev.balance + earned
```

**구매는 `balance`만 차감하고 `totalAcorns`는 건드리지 않는다** (`useToryRaisingData.ts:359`):

```ts
balance: prev.balance - params.price,
```

그래서 `buyItem` 내부에 주석으로 명시돼 있다 — "구매는 totalAcorns를 늘리지 않으므로 모달은 없음(데모 간소화)" (`useToryRaisingData.ts:374`). 즉 **구매로는 레벨이 절대 떨어지거나 변하지 않는다.**

### 2.2 획득 경로별 금액 — 실제 코드 인용

라이브 화면(`ToryRaisingFullScreen`)에 노출되는 액션과 그 보상은 `useToryRaisingData.ts`의 `claim*` 콜백들이다.

| 행동 | 도토리 | 빈도/제한 | 중복 방지 키 | 코드 |
|---|---|---|---|---|
| **출석** (`claimAttendance`) | 기본 `+1` (+연속 보너스) | 1일 1회 | `lastAttendanceDate` (YYYY-MM-DD) | `useToryRaisingData.ts:201-239` |
| **토리 탭 방문** (`claimToryTabVisit`) | `+1` | 1시간 쿨다운 | `lastToryTabVisit` (ISO 시각) | `useToryRaisingData.ts:241-265` |
| **놀아주기** (`claimPlay`) | `+1` | 30분 쿨다운 | `lastPlayAt` (ISO 시각) | `useToryRaisingData.ts:267-291` |
| **쓰다듬기** (`claimPet`) | `+1` | 30분 쿨다운 | `lastPetAt` (ISO 시각) | `useToryRaisingData.ts:293-317` |
| **투자 완료** (`claimInvestmentComplete`, *사문 트리 버튼만*) | `+10` | 1일 1회 | `lastInvestmentCompleteDate` (YYYY-MM-DD) | `useToryRaisingData.ts:319-343` |
| **투자 완료** (`awardToryInvestmentComplete`, *실제 투자 체크 경로*) | `+10` (`amount ?? 10`) | 결제일 1회 | `lastInvestmentCompleteDate` = `paymentDateYMD` | `awardToryInvestmentComplete.ts:108-153` |

#### 출석 연속 보너스 (정확한 공식)

`claimAttendance` 는 어제(`addDays(today, -1)`) 출석 여부로 연속(streak)을 잇거나 1로 리셋한 뒤, 그 streak 값으로 보너스를 가산한다 (`useToryRaisingData.ts:210-217`):

```ts
const nextStreak = state.lastAttendanceDate === yesterday ? state.attendanceStreak + 1 : 1
const baseEarn = 1
let bonus = 0
if (nextStreak % 30 === 0) bonus = 30
else if (nextStreak % 7 === 0) bonus = 5
const earned = baseEarn + bonus
```

- 7일 단위(7,14,21,28...) → 출석 `+1` + 보너스 `+5` = **그 날 총 +6**
- 30일 단위(30,60...) → 출석 `+1` + 보너스 `+30` = **그 날 총 +31** (30의 배수는 `else if`로 7 보너스를 받지 않음, 30이 우선)
- 성공 토스트: `🌰 +{earned} 출석 도토리 (연속 {nextStreak}일 보너스 포함)` — 보너스가 있을 때만 괄호 문구 추가 (`useToryRaisingData.ts:236`)

> PRD는 "7일 연속 +5 / 30일 연속 +30"을 별도 행동처럼 표로 적었지만(PRD §4.2 표), 실제로는 **출석 액션 내부에 합산되는 보너스**다. 별도 버튼/이벤트가 아니다.

### 2.3 중복 방지 규칙 (세부)

- **일 단위(출석/투자)**: `toYMD(new Date())` 로 만든 로컬 날짜 문자열(`sv-SE` 로케일 = `YYYY-MM-DD`)을 비교. 같으면 거부 (`useToryRaisingData.ts:202-204`, `321-323`).
  - 출석 거부 메시지: "오늘은 이미 출석했어요."
  - 투자 거부 메시지: "오늘은 이미 투자 완료 체크를 했어요."
- **시간 쿨다운(방문/놀기/쓰다듬기)**: `getRemainingCooldownMs(lastIso, cooldownMs)` = `max(0, cooldownMs - (Date.now() - last))`. 남은 시간이 있으면 거부하고 `formatRemaining`으로 "N분 M초" 안내 (`useToryRaisingData.ts:61-74`).
  - 방문 쿨다운 `VISIT_COOLDOWN_MS = 60 * 60 * 1000` (1시간)
  - 놀기/쓰다듬기 `PLAY_COOLDOWN_MS = PET_COOLDOWN_MS = 30 * 60 * 1000` (30분)
- **투자(유틸 경로)**: `beforeState.lastInvestmentCompleteDate === paymentDateYMD` 이면 `awarded: false, amount: 0` 으로 조기 반환 (`awardToryInvestmentComplete.ts:115-124`). 즉 **같은 결제일을 두 번 체크해도 한 번만 적립**된다.

### 2.4 PRD에 있으나 코드에 없는 경제 항목

| PRD 항목(§4.2) | 구현 상태 |
|---|---|
| 토리 탭 진입 +1 (1일 1회) | ⚠️ 구현됐으나 **1시간 쿨다운**으로 동작(1일 1회 아님). 메인 화면에서 캐릭터를 탭하면 `claimToryTabVisit` 호출 |
| 명언 공유 +2 (1일 3회) | ❌ 없음. 공유 버튼·로직 자체가 라이브 화면에 없음 |
| 한 달 투자 100% 완료 +20 (월 1회) | ❌ 없음 |
| 레벨업(홀수 레벨) +5 | ❌ 없음. 레벨업은 모달만 띄우고 추가 도토리 보상 없음 |
| 레벨업(10단위) 한정 아이템 | ❌ 없음 |

---

## 3. 레벨 / 칭호 / 외형 시스템

전부 `app/hooks/tory-raising/toryRaisingLevelModel.ts` 에 있고, `useToryRaisingCalculations.ts` 가 이를 re-export + `useMemo` 래핑한다.

### 3.1 칭호 7단계 — `getTitleForLevel` (`toryRaisingLevelModel.ts:29-37, 102-105`)

```ts
const TITLE_TIERS: ToryTitle[] = [
  { emoji: '🌱', name: '새내기 다람쥐',      minLevel: 1,   maxLevel: 5 },
  { emoji: '🌰', name: '도토리 줍는 다람쥐', minLevel: 6,   maxLevel: 15 },
  { emoji: '📈', name: '꾸준한 투자러',      minLevel: 16,  maxLevel: 30 },
  { emoji: '💰', name: '도토리 사장님',      minLevel: 31,  maxLevel: 50 },
  { emoji: '🎯', name: '적립의 달인',        minLevel: 51,  maxLevel: 70 },
  { emoji: '🧙', name: '복리의 현자',        minLevel: 71,  maxLevel: 99 },
  { emoji: '👑', name: '도토리 황제',        minLevel: 100, maxLevel: null },
]
```

`getTitleForLevel(level)` 은 `level >= minLevel && (maxLevel === null || level <= maxLevel)` 로 매칭, 없으면 마지막 티어(황제) 폴백. **PRD §6.3 칭호 매핑과 100% 일치.**

### 3.2 외형 5단계 — `getAppearanceStageForLevel` (`toryRaisingLevelModel.ts:39-45, 107-110`)

```ts
const APPEARANCE_STAGES: ToryAppearanceStage[] = [
  { stageIndex: 1, minLevel: 1,  maxLevel: 5 },
  { stageIndex: 2, minLevel: 6,  maxLevel: 15 },
  { stageIndex: 3, minLevel: 16, maxLevel: 30 },
  { stageIndex: 4, minLevel: 31, maxLevel: 60 },
  { stageIndex: 5, minLevel: 61, maxLevel: null },
]
```

> 주의: **칭호 구간과 외형 구간의 경계가 다르다.** 칭호 4단계(💰 사장님)는 31~50인데 외형 4단계는 31~60, 칭호 5단계(🎯 달인)는 51~70인데 외형 5단계는 61부터다. 즉 Lv 51~60 구간은 "칭호=적립의 달인 / 외형=4단계"로 칭호와 외형이 엇갈린다. PRD §4.1 외형 표(`Lv 61+`)와 일치하고, 의도된 설계다.
> 외형 단계는 데이터로만 존재하고 **실제 일러스트는 미구현**(섹션 7·11 참조). 라이브 화면은 외형 스테이지 숫자조차 노출하지 않는다(사문 트리 `ToryRaisingGrowthSection`만 "외형 스테이지 N/5" 텍스트 표시).

### 3.3 레벨 임계값 구성 — `buildLevelThresholds` (`toryRaisingLevelModel.ts:54-97`)

PRD §4.1의 "레벨업 곡선(구간별 누적 도토리 필요량)"을 **구간 내부 선형 분배(올림)**로 레벨별 임계값으로 펼친다. `thresholdsByLevel[i]` = i레벨이 되기 위한 최소 누적값. `thresholdsByLevel[1] = 0`.

구간 정의 (`toryRaisingLevelModel.ts:56-64`):

```ts
const segments = [
  { from: 1,  to: 5,   totalAdditional: 30 },
  { from: 5,  to: 10,  totalAdditional: 100 },
  { from: 10, to: 20,  totalAdditional: 300 },
  { from: 20, to: 35,  totalAdditional: 800 },
  { from: 35, to: 60,  totalAdditional: 2000 },
  { from: 60, to: 100, totalAdditional: 5000 }, // PRD: Lv60+ = 5000+. 데모는 60->100을 5000으로 가정.
]
```

분배 공식 (`toryRaisingLevelModel.ts:76-81`): 구간 `[from, to]`에서 레벨 `lv`의 추가 누적량 =
```
additional = ceil(totalAdditional * (stepIndex / steps))   // stepIndex = lv - from, steps = to - from
thresholdsByLevel[lv] = lastThreshold + additional
```

100 초과 구간(`maxLevel > 100`)은 **1레벨당 고정 `ceil(5000/(100-60)) = 125`** 씩 증가 (`toryRaisingLevelModel.ts:89-94`).

상수: `DEFAULT_MAX_LEVEL = 150`, `DEFAULT_THRESHOLDS = buildLevelThresholds(150)` (`toryRaisingLevelModel.ts:99-100`).

#### 실제 산출 임계값 (위 알고리즘을 그대로 재현해 계산한 값)

| 레벨 | 누적 필요 도토리(totalAcorns) | 비고 |
|---|---|---|
| 1 | 0 | 시작 |
| 2 | 8 | 1→5 구간(+30) 선형 분배 |
| 3 | 15 | |
| 4 | 23 | |
| 5 | 30 | 구간1 끝(PRD 30 일치) |
| 6 | 50 | 5→10 구간(+100) 시작 |
| 7 | 70 | |
| 10 | 130 | 구간2 끝(PRD 100 누적과는 분배 방식 차이로 130) |
| 15 | 280 | |
| 16 | 310 | 칭호 "꾸준한 투자러" 시작 |
| 20 | 430 | 구간3 끝 |
| 30 | 964 | |
| 31 | 1017 | 칭호 "도토리 사장님" 시작 |
| 35 | 1230 | 구간4 끝 |
| 50 | 2430 | |
| 60 | 3230 | 구간5 끝 |
| 61 | 3355 | 외형 5단계 시작 |
| 100 | 8230 | 칭호 "도토리 황제" 시작 |
| 101 | 8355 | 이후 +125/레벨 고정 |
| 150 | 14480 | maxLevel |

체감 예시(계산 검증): `totalAcorns 10 → Lv 2`, `30 → Lv 5`, `100 → Lv 8`, `130 → Lv 10`.

### 3.4 레벨 계산 — `calculateToryLevel` (`toryRaisingLevelModel.ts:112-122`)

```ts
if (!Number.isFinite(totalAcorns) || totalAcorns <= 0) return 1
let level = 1
for (let lv = 1; lv <= t.maxLevel; lv += 1) {
  if (totalAcorns >= t.thresholdsByLevel[lv]) level = lv
}
return level
```

선형 스캔으로 "누적값이 도달한 가장 높은 레벨"을 찾는다. 0 이하/비유한수는 Lv1.

### 3.5 진행도 계산 — `calculateToryLevelProgress` (`toryRaisingLevelModel.ts:124-166`)

반환 타입 `ToryLevelProgress` (`toryRaisingLevelModel.ts:14-22`): `{ level, title, appearanceStage, nextLevel, progressPercent, acornsToNext, nextAppearanceStageLevelsRemaining }`.

핵심 계산 (`toryRaisingLevelModel.ts:144-155`):
```ts
const fromThreshold = thresholds[level]
const toThreshold   = thresholds[nextLevel]
const earnedInLevel = max(0, totalAcorns - fromThreshold)
const neededInLevel = max(1, toThreshold - fromThreshold)
const progressPercent = min(100, max(0, (earnedInLevel / neededInLevel) * 100))
const acornsToNext = max(0, toThreshold - totalAcorns)
// 다음 외형 단계까지 남은 레벨
const nextStage = APPEARANCE_STAGES.find(s => s.stageIndex === currentStageIndex + 1) ?? null
const nextAppearanceStageLevelsRemaining = nextStage === null ? null : max(0, nextStage.minLevel - level)
```

`level >= DEFAULT_MAX_LEVEL(150)` 이면 `nextLevel: null, progressPercent: 100, acornsToNext: null` (`toryRaisingLevelModel.ts:130-142`).

`useToryRaisingCalculations(totalAcorns)` 는 위를 `useMemo`로 감싼 얇은 훅 (`useToryRaisingCalculations.ts:16-18`).

---

## 4. 액션별 로직 (라이브 화면 기준)

라이브 화면 `ToryRaisingFullScreen` 에서 노출되는 액션은 **출석 / 놀아주기 / 쓰다듬기 / 캐릭터 탭(=방문) / 구매 / 착용** 이다. **"투자 완료" 버튼은 라이브 화면에 없다**(사문 트리 `ToryRaisingGrowthSection`에만 있음). 모든 액션 버튼은 `disabled={!isUnlocked}` — 비밀 토큰 해제 전엔 막혀 있다.

### 4.1 출석 (`claimAttendance`, `useToryRaisingData.ts:201-239`)
- 트리거: 하단 "출석" 버튼 (`ToryRaisingFullScreen.tsx:399-406`)
- 검증: 오늘 이미 출석했으면 거부
- 보상: `+1` (+streak 보너스 §2.2). `totalAcorns`/`balance` 둘 다 증가, `lastAttendanceDate`/`attendanceStreak` 갱신, `recentEarnings`에 `attendance` 기록
- 레벨업 시 모달 payload 동봉

### 4.2 방문 (`claimToryTabVisit`, `useToryRaisingData.ts:241-265`)
- 트리거: **중앙 토리 캐릭터를 탭** (`handleCharacterTap`, `ToryRaisingFullScreen.tsx:155-163`). 동시에 랜덤 말풍선(`showBubble`) 표시
- 쿨다운: 1시간. 남았으면 거부(단, `handleCharacterTap`은 `result.ok`가 false면 토스트조차 띄우지 않고 조용히 무시 — `ToryRaisingFullScreen.tsx:159`)
- 보상: `+1`, `lastToryTabVisit` 갱신, `recentEarnings`에 `visit_hour` 기록, 토스트 "🌰 +1 방문 보상"

### 4.3 놀아주기 (`claimPlay`, `useToryRaisingData.ts:267-291`)
- 트리거: 하단 "놀아주기" 버튼 (`ToryRaisingFullScreen.tsx:407-414`)
- 쿨다운: 30분
- 보상: `+1`, `lastPlayAt` 갱신, `recentEarnings`에 `play` 기록, 토스트 "🐿️ 놀아줬어요! +1"

### 4.4 쓰다듬기 (`claimPet`, `useToryRaisingData.ts:293-317`)
- 트리거: 하단 "쓰다듬기" 버튼 (`ToryRaisingFullScreen.tsx:415-422`)
- 쿨다운: 30분
- 보상: `+1`, `lastPetAt` 갱신, `recentEarnings`에 `pet` 기록, 토스트 "🤲 쓰다듬어줬어요! +1"

### 4.5 투자 완료 — 두 경로 (중요)

#### (A) 훅 버튼 `claimInvestmentComplete` — 사문 트리에만 존재 (`useToryRaisingData.ts:319-343`)
- 트리거: `ToryRaisingGrowthSection`의 "✅ 투자 완료 체크 (+10)" 버튼 → 그러나 이 섹션을 쓰는 `ToryRaisingPanel`이 import되지 않으므로 **현재 사용자에게 노출되지 않음**
- 검증: 오늘 이미 체크했으면 거부 (`lastInvestmentCompleteDate === today`)
- 보상: `+10`, 토스트 "🎉 이번 달 납입 완료! 🌰 +10", 레벨업 시 모달

#### (B) 유틸 `awardToryInvestmentComplete` — 실제 투자 완료 행동의 경로 (`awardToryInvestmentComplete.ts:108-153`)
- **이쪽이 실서비스에서 도는 경로다.** 호출처 2곳:
  - `app/hooks/payment/usePaymentCompletion.ts:37` — 달력/홈의 결제 완료 토글 시. `awardToryInvestmentComplete({ paymentDateYMD: dateStr, amount: 10 })`, `reward.awarded`면 토스트 `🌰 +{amount} 도토리` (`usePaymentCompletion.ts:38`)
  - `app/hooks/upcoming/useUpcomingInvestmentsCompletion.ts:43` — 예정 투자 완료 토글 시. 동일 패턴
- 동작: `localStorage 'tory-state'` 를 **직접 읽고/쓴다** (React 상태 우회). `safeReadState`/`safeWriteState` (`awardToryInvestmentComplete.ts:82-106`)
- 중복 방지: `lastInvestmentCompleteDate === paymentDateYMD` (결제일 단위)
- 보상: `amount ?? 10`을 `totalAcorns`/`balance`에 가산, `recentEarnings`에 `investment` 기록(상한 12)
- 반환: `{ awarded, amount, levelBefore, levelAfter, titleAfter }` — 레벨 전후를 계산해 돌려주지만 **호출처는 토스트만 띄우고 레벨업 모달은 띄우지 않는다.**
- 한계: 이 유틸의 자체 `ToryRaisingState` 타입에는 `lastPlayAt`/`lastPetAt`이 없다(`awardToryInvestmentComplete.ts:40-50`). 다만 spread(`...beforeState`)로 기존 필드를 보존하므로 다른 액션 데이터를 덮어쓰진 않는다.

### 4.6 구매 (`buyItem`, `useToryRaisingData.ts:345-378`)
- 트리거: 상점 탭 각 아이템의 "구매" 버튼 (`ToryRaisingFullScreen.tsx:313-324`)
- 검증: `balance < price` → "도토리가 부족해요." / 이미 보유 → "이미 가지고 있는 아이템이에요."
- 효과: `balance -= price`, `ownedItems[category]`에 추가. **`background` 카테고리는 구매 즉시 자동 장착** (`equipped.background = itemId`, `useToryRaisingData.ts:360-366`)
- `totalAcorns` 불변 → 레벨 변동·모달 없음. 토스트 "구매 완료! {itemId}를 얻었어요."

### 4.7 착용/벗기 (`equipItem`, `useToryRaisingData.ts:380-394`)
- 트리거: 꾸미기 탭 각 아이템의 "장착"/"벗기" 버튼 (`ToryRaisingFullScreen.tsx:369-382`)
- 동작: `equipped[category] = itemId`. **배경은 `null`을 넘기면 `'default'`로 치환**(`resolvedItemId = category === 'background' ? itemId ?? 'default' : itemId`), 그 외 카테고리는 `null`(=벗김) 허용
- 비용 없음, 항상 성공(`{ ok: true }`)

### 4.8 쿨다운 표시 유틸
- `getRemainingCooldownMs(lastIso, cooldownMs)` (`useToryRaisingData.ts:61-66`): 빈 문자열·`NaN`이면 0 반환(=즉시 가능)
- `formatRemaining(ms)` (`useToryRaisingData.ts:68-74`): `ceil(ms/1000)`초 → "N분 M초" 또는 "M초"

---

## 5. 레벨업 모달 — `ToryRaisingModalPayload`

### 5.1 Payload 타입 (`useToryRaisingData.ts:76-85`)
```ts
export type ToryRaisingModalPayload = {
  kind: 'growth'                                   // 현재 유일한 종류 ('title_change' 등 없음)
  fromLevel: number
  toLevel: number
  title: { emoji: string; name: string }
  nextAppearanceStageLevelsRemaining: number | null
}
```

### 5.2 트리거 조건 — `computeModalIfLevelChanged` (`useToryRaisingData.ts:157-176`)
```ts
const fromLevel = calculateToryLevel(beforeTotalAcorns)
const toLevel   = calculateToryLevel(afterTotalAcorns)
if (toLevel <= fromLevel) return null               // 레벨이 올라간 경우에만 모달
```
- **레벨이 실제로 증가한 액션에서만** payload 생성. `claimAttendance`/`claimToryTabVisit`/`claimPlay`/`claimPet`/`claimInvestmentComplete(훅)` 모두 액션 끝에서 `computeModalIfLevelChanged({ before, after })`를 호출해 `modal`로 동봉
- **구매(`buyItem`)는 호출하지 않음** (totalAcorns 불변)
- **유틸 경로(`awardToryInvestmentComplete`)도 모달을 만들지 않음** → 실제 투자 완료로 레벨업해도 모달은 안 뜨고 토스트만 뜬다(누락 가능성 있는 갭)

### 5.3 모달 UI (`ToryRaisingModal.tsx`)
- 헤더 "🌟 레벨업!", 제목 "토리가 Lv.{toLevel}가 됐어요"
- 칭호 `{emoji} {name}` 표시
- `nextAppearanceStageLevelsRemaining !== null` → "다음 외형 단계까지 N레벨 남았어요!" / `null`이면 "더 성장 중이에요!"
- 일러스트 영역은 "이미지 자리 (MVP 데모)" 텍스트 플레이스홀더
- `state`로 끌어올린 `modalPayload`를 `ToryRaisingFullScreen.tsx:438`에서 렌더, "확인" 또는 배경 클릭으로 닫음
- **칭호 변경 전용 모달은 없음**(PRD §4.5의 "🏆 새 칭호 획득!" 모달 미구현). 레벨업 모달이 칭호를 함께 보여주는 것으로 대체

---

## 6. 상점 카탈로그 — `TORY_SHOP_CATALOG`

`app/components/ToryRaising/toryShopCatalog.ts` 의 정적 배열(타입 `ToryShopItem[]`). **PRD §6.2가 말한 `public/data/shop-catalog.json` 파일은 존재하지 않는다** — 카탈로그는 TS 상수로 인라인돼 있다.

`ToryShopItem` 타입 (`ToryRaisingStoreSection.tsx:5-13`): `{ id, category, emoji, name, price, limited?, minLevel? }`. 카테고리 타입 `ToryShopCategory = 'all' | 'hat' | 'glasses' | 'outfit' | 'background'` (**`prop`/소품은 카탈로그 카테고리에 없음** — 상태 모델에는 `prop` 슬롯이 있으나 판매 아이템 0개).

| 카테고리 | 아이템 수 | 가격대 | 아이템(가격) |
|---|---|---|---|
| 🎩 모자(hat) | 5 | 50~500 | 실크햇(200), 야구모(80), 비니(50), 왕관(500, `minLevel:0`), 베레모(250) |
| 👓 안경(glasses) | 5 | 80~250 | 동그란 안경(100), 선글라스(150), 모노클(250), 스퀘어 안경(120), 작은 돋보기(80) |
| 👔 의상(outfit) | 5 | 200~600 | 후드티(200), 정장(400), 한복(350), 도복(300), 우주복(600) |
| 🌅 배경(background) | 4 | 300~1200 | 사무실(300), 해변(600), 도서관(900), 카페(1200) |

- 총 **19개 아이템** (모자5 + 안경5 + 의상5 + 배경4). PRD MVP 최소 라인업(모자5+안경5+의상5=15)을 충족하고 배경 4종이 추가됨.
- `minLevel`은 왕관에만 `0`으로 적혀 있고(사실상 무의미), **구매 로직에서 `minLevel`을 검사하지 않는다**(`buyItem`은 `balance`와 보유 여부만 확인). `limited`도 코드 어디서도 사용 안 함.
- 라이브 상점은 카테고리당 **앞 4개만** 노출(`filteredShopItems = ...filter(category).slice(0, 4)`, `ToryRaisingFullScreen.tsx:113-116`). 모자/안경/의상이 5개라 **각 카테고리 5번째 아이템(베레모/작은 돋보기/우주복)은 라이브에서 구매 불가**. 사문 트리 `ToryRaisingPanel`은 `slice` 없이 전체를 보여주고 'all' 카테고리도 지원.

---

## 7. 꾸미기

### 7.1 상태 모델 (`useToryRaisingData.ts:12-26`)
```ts
type ToryOwnedItems   = { hat: string[]; glasses: string[]; outfit: string[]; prop: string[]; background: string[] }
type ToryEquippedItems = { hat: string|null; glasses: string|null; outfit: string|null; prop: string|null; background: string }
```
- **소유(`ownedItems`)**: 카테고리별 보유 아이템 ID 배열. 구매 시 push
- **착용(`equipped`)**: 카테고리별 1개. `hat/glasses/outfit/prop`는 `null` 가능(=미착용), **`background`만 `null` 불가**(기본값 문자열 `'default'`)

### 7.2 카테고리당 1개 착용 / 벗기
- `equipItem({ category, itemId })` 가 해당 카테고리 슬롯을 통째로 교체 → **자동으로 카테고리당 1개만 유지**
- "벗기"는 같은 아이템이 이미 착용 중일 때 `itemId: null`을 넘김 (`ToryRaisingFullScreen.tsx:376-378`: `isEquipped ? null : item.id`)
- 배경 벗기는 `'default'`로 환원(§4.7)

### 7.3 라이브 꾸미기 UI (`ToryRaisingFullScreen.tsx:332-393`)
- 카테고리 탭: 배경/모자/안경/의상 (소품 없음). 기본 선택 `background`
- 보유 목록(`equippedListByCategory[customizeCategory]`)을 `slice(0, 4)`로 최대 4개 표시
- 각 아이템에 "장착"/"벗기" 토글 버튼. 보유 0개면 "보유한 아이템이 없어요. 상점에서 구매해보세요."

### 7.4 착용 요약 표시 — `getEquippedSummary` (`ToryRaisingFullScreen.tsx:45-52`)
- 상단/캐릭터 하단에 텍스트로: `모자 {n} · 안경 {n} · 의상 {n} · 배경 {n}` (없으면 "없음"/"기본")
- **배경이 `'default'`면 "기본"으로 표시**(아이템명 조회 생략)

### 7.5 시각 반영의 한계 (중요)
- PRD §4.4가 말한 "레이어 합성(베이스 토리 + 모자 + 안경 + 의상 PNG 합성)", "배경 화면 전체 채움", "장착 즉시 메인 반영"은 **시각적으로 구현돼 있지 않다.** 착용 결과는 오직 **텍스트 요약**으로만 보인다. 토리 일러스트는 고정 1종(`/images/tory-character.png`)이며 착용/외형단계/배경에 따라 변하지 않는다.

---

## 8. 상태 저장 (localStorage)

### 8.1 키와 스키마
- 키: `STORAGE_KEY = 'tory-state'` (훅: `useToryRaisingData.ts:91`, 유틸: `awardToryInvestmentComplete.ts:16`) — **두 코드가 동일 키 공유**
- 비밀 해제 별도 키: `'tory-raising-secret-unlocked'` (`useToryRaisingSecretUnlock.ts:5`)

전체 스키마 `ToryRaisingState` (`useToryRaisingData.ts:43-55`, 기본값 `getDefaultToryRaisingState` `:124-150`):

| 필드 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `totalAcorns` | number | `0` | 누적 도토리(레벨 기준, 감소 X) |
| `balance` | number | `0` | 보유 도토리(구매 시 감소) |
| `lastAttendanceDate` | string | `''` | 출석 중복방지 (YYYY-MM-DD) |
| `attendanceStreak` | number | `0` | 연속 출석 일수 |
| `lastToryTabVisit` | string | `''` | 방문 보상 쿨다운 기준 (ISO 시각) |
| `lastInvestmentCompleteDate` | string | `''` | 투자 완료 중복방지 (YYYY-MM-DD) |
| `lastPlayAt` | string | `''` | 놀아주기 쿨다운 (ISO 시각) |
| `lastPetAt` | string | `''` | 쓰다듬기 쿨다운 (ISO 시각) |
| `ownedItems` | `ToryOwnedItems` | 5개 빈 배열 | 카테고리별 보유 ID |
| `equipped` | `ToryEquippedItems` | hat/glasses/outfit/prop=`null`, background=`'default'` | 카테고리별 착용 |
| `recentEarnings` | `ToryRecentEarning[]` | `[]` | 최근 획득 로그(최대 12) |

> **PRD §6.1 스키마와의 차이**: 코드에는 PRD에 없는 `lastPlayAt`/`lastPetAt`이 추가됐고, `lastToryTabVisit`이 PRD는 "YYYY-MM-DD"라 했으나 실제로는 **ISO 시각(1시간 쿨다운)**으로 운용된다. PRD §6.1에 있던 `level`/`title` 필드는 **저장하지 않는다**(항상 `totalAcorns`에서 파생 계산 — 단일 진실원). `recentEarnings.type`은 PRD보다 확장(`visit_hour`/`play`/`pet` 추가).

### 8.2 `recentEarnings` 타입 (`useToryRaisingData.ts:28-41`)
`type`: `'attendance' | 'investment' | 'streak' | 'shop_buy' | 'levelup' | 'title_change' | 'visit_hour' | 'play' | 'pet'`. 실제로 기록되는 건 `attendance`/`investment`/`visit_hour`/`play`/`pet`뿐(streak/shop_buy/levelup/title_change는 타입만 존재, write 코드 없음). `appendEarning`이 `[entry, ...prev].slice(0, 12)`로 최신 12개 유지 (`useToryRaisingData.ts:152-155`).

### 8.3 SSR-safe Hydration (`useToryRaisingData.ts:178-191`)
```ts
const [isHydrated, setIsHydrated] = useState(false)
const [state, setState] = useState(() => getDefaultToryRaisingState())   // 서버/최초엔 항상 기본값
useEffect(() => {                                                         // 클라이언트 마운트 후에만 읽기
  const stored = safeParseState(localStorage.getItem(STORAGE_KEY))
  if (stored) setState(stored)
  setIsHydrated(true)
}, [])
useEffect(() => {                                                         // hydrate 이후에만 저장
  if (!isHydrated) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}, [state, isHydrated])
```
- 첫 렌더는 서버/클라 모두 기본값 → **hydration mismatch 방지**. `localStorage` 접근은 항상 `useEffect`(클라 전용) 안에서만.
- `safeParseState` (`:105-122`): JSON 파싱 실패/비객체면 `null`. 성공 시 **기본값과 deep-merge**(`ownedItems`/`equipped`는 객체 spread, `recentEarnings`는 배열 검사 후 폴백) → 신규 필드 추가에 대한 forward-compat 확보.
- 유틸 쪽 `safeReadState` (`awardToryInvestmentComplete.ts:82-102`)는 `typeof window === 'undefined'` 가드로 SSR-safe, 동일한 merge 전략(단 자체 타입에 `lastPlayAt/lastPetAt` 없음).
- 로딩 표시: `ToryRaisingFullScreen.tsx:165-171` — `!toryHydrated && quoteLoading` 일 때만 스피너(`CircleNotch`). (두 조건의 AND라 둘 중 하나만 끝나도 본문 렌더)

---

## 9. 비밀 해제 / 일일 컨텐츠

### 9.1 비밀 해제 — `useToryRaisingSecretUnlock` (`useToryRaisingSecretUnlock.ts`)
- 고정 데모 토큰 `DEFAULT_TORY_RAISE_DEMO_TOKEN = '1234'` (`:8`). 주석: "실제 배포에서는 env로 옮기거나 서버 검증 필요"
- 저장 키 `'tory-raising-secret-unlocked'`, 해제 시 값 `'1'` 저장 (`:17, 26`)
- `unlock()`: 입력 토큰 `trim()` 후 `'1234'`와 일치하면 해제, 아니면 "코드가 올바르지 않아요." (`:22-32`)
- `lock()`: 키 제거 + 상태 초기화 (`:34-39`)
- 반환에 `demoToken`까지 포함 → UI에 "현재 데모 토큰: 1234 (개발용)" 노출 (`ToryRaisingFullScreen.tsx:473`)
- 라이브 적용: `ToryRaisingFullScreen`이 `unlockHydrated && !isUnlocked` 일 때 **전면 잠금 오버레이**(z-80)를 띄우고, 그 전까지 모든 액션 버튼·탭이 `disabled` (`ToryRaisingFullScreen.tsx:441-478`). 즉 **현재 `/tory`는 토큰을 모르는 사용자에겐 사실상 동작하지 않는 비밀 데모 화면**이다.

### 9.2 일일 컨텐츠 — `useDailyContent` (`useDailyContent.ts`)
- `/data/rich-quotes.json`을 `cache: 'force-cache'`로 fetch (`:42`). 실제 파일 존재, **명언 100개** (`{id, text, author}`, 예: 아인슈타인 "복리는 세계 8대 불가사의…")
- 오늘의 명언 선택: `dayOfYear % quoteList.length` (`:52`). `getDayOfYear`는 1/1=1 기준 로컬 타임존 일수 (`:21-26`)
- 실패 시 `toastError(TOAST_MESSAGES.dataLoadFailed)` + 빈 상태 폴백 (`:54-57`)
- 라이브 화면 메인 탭의 보라색 명언 카드(`#ece4f7`)에 `text`/`author` 표시, 로딩 중 "명언을 불러오는 중..." (`ToryRaisingFullScreen.tsx:233-244`)
- 반환: `{ richQuote, isLoading }`

### 9.3 캐릭터 말풍선 (라이브 부가 요소, `ToryRaisingFullScreen.tsx:22-35, 94-98`)
- `TORY_BUBBLE_LINES` 8종("오늘도 와줘서 고마워!", "쓰다듬어줄래?", "도토리 모으자!" 등) 중 랜덤
- 캐릭터 탭 시 표시, 3초 후 자동 사라짐(`setTimeout 3000`). 언마운트 시 타이머 정리

---

## 10. 사용 훅 / 유틸 표 (입력 / 출력 / 책임)

| 이름 | 파일 | 입력 | 출력 | 책임 |
|---|---|---|---|---|
| `useToryRaisingData` | `app/hooks/tory-raising/useToryRaisingData.ts:178` | (없음) | `{ isHydrated, state, progress, resetDemo, claimAttendance, claimToryTabVisit, claimInvestmentComplete, claimPlay, claimPet, buyItem, equipItem }` | 상태의 단일 소유자. localStorage 동기화, 모든 획득/구매/착용 로직, 레벨 파생 |
| `useToryRaisingCalculations` | `app/hooks/tory-raising/useToryRaisingCalculations.ts:16` | `totalAcorns: number` | `ToryLevelProgress` | 누적 도토리 → 레벨/칭호/외형/진행도 메모이즈 (레벨 모델 re-export 허브) |
| `toryRaisingLevelModel` (모듈) | `app/hooks/tory-raising/toryRaisingLevelModel.ts` | — | `calculateToryLevel`, `calculateToryLevelProgress`, `getTitleForLevel`, `getAppearanceStageForLevel`, `buildLevelThresholds`, 타입들 | 레벨 곡선·칭호·외형의 순수 로직(상수+계산). React 비의존 |
| `useToryRaisingPanelTabs` | `app/hooks/tory-raising/useToryRaisingPanelTabs.ts:7` | (없음) | `{ activeTab, selectTab }` | 사문 트리 `ToryRaisingPanel`의 3탭(growth/store/customize) 상태. **라이브 미사용** |
| `useToryRaisingSecretUnlock` | `app/hooks/tory-raising/useToryRaisingSecretUnlock.ts:10` | (없음) | `{ isHydrated, isUnlocked, unlockToken, setUnlockToken, errorMessage, unlock, lock, demoToken }` | 비밀 토큰 게이트(localStorage `'1'`) |
| `useDailyContent` | `app/hooks/tory/useDailyContent.ts:33` | (없음) | `{ richQuote, isLoading }` | 오늘의 명언(dayOfYear 인덱싱) fetch |
| `awardToryInvestmentComplete` | `app/utils/tory-raising/awardToryInvestmentComplete.ts:108` | `{ paymentDateYMD: string; amount?: number }` | `{ awarded, amount, levelBefore, levelAfter, titleAfter }` | **실제 투자 완료 보상**. localStorage 직접 read/write, 결제일 중복방지. (모달 X) |
| `usePaymentCompletion` | `app/hooks/payment/usePaymentCompletion.ts:12` | (없음) | `{ isEventCompleted, handleComplete, handleUndo, pendingUndo }` | 결제 완료 토글 → 위 유틸 호출(보상 +10) |
| `useUpcomingInvestmentsCompletion` | `app/hooks/upcoming/useUpcomingInvestmentsCompletion.ts:24` | (없음) | `{ pendingUndo, toggleComplete, handleUndo }` | 예정 투자 완료 토글 → 위 유틸 호출(보상 +10) |

### 컴포넌트 트리 (라이브 vs 사문)

```
[라이브]  app/tory/page.tsx (ToryPage)
            └─ ToryRaisingFullScreen          ← 유일하게 렌더되는 UI
                 ├─ useDailyContent
                 ├─ useToryRaisingSecretUnlock (전면 잠금 오버레이)
                 ├─ useToryRaisingData (claim*/buy/equip)
                 └─ ToryRaisingModal (레벨업)

[사문]   ToryRaisingSecretGate  ─(import 0건)
            └─ ToryRaisingPanel  ─(import 0건; useToryRaisingPanelTabs 사용)
                 ├─ ToryRaisingGrowthSection    (투자완료 +10 버튼은 여기에만 존재)
                 ├─ ToryRaisingStoreSection
                 ├─ ToryRaisingCustomizeSection
                 └─ ToryRaisingModal
```

---

## 11. PRD 대비 구현 현황

| PRD 명세 | 구현 상태 | 비고 |
|---|---|---|
| 출석/투자 시 도토리 획득 | ✅ | 출석 +1, 투자 +10 |
| 누적 도토리로 레벨/칭호 자동 계산 | ✅ | `calculateToryLevel`, `totalAcorns` 단일 기준 |
| 칭호 7종 | ✅ | PRD §6.3과 100% 일치 |
| 외형 5단계 *데이터* | ✅(데이터) / ❌(일러스트) | 단계 계산은 있으나 일러스트 없음, 라이브엔 단계 숫자도 미노출 |
| 단계별 토리 일러스트(5종) | ❌ | "이미지 자리" 텍스트 플레이스홀더. 캐릭터 1종 고정 이미지만 |
| 도토리 획득 토스트 | ✅ | `toastSuccess` |
| 투자 완료 풀스크린 피드백 모달 | ⚠️ | 토스트만(`🌰 +N 도토리`). 모달 없음 |
| 레벨업 축하 모달 | ✅(부분) | `ToryRaisingModal`. 단 유틸 투자경로 레벨업엔 안 뜸 |
| 칭호 변경 전용 모달 | ❌ | 레벨업 모달이 칭호를 함께 표시하는 것으로 대체 |
| 상점(모자/안경/의상/배경) | ✅ | 19아이템(5/5/5/4). `prop`은 슬롯만 |
| 꾸미기(장착/해제/저장) | ✅(상태) / ❌(시각) | 카테고리당 1개, 벗기, localStorage 저장 OK. 시각 반영은 텍스트 요약뿐 |
| 배경 즉시 반영 | ⚠️ | 구매 시 자동 장착·상태 반영. **화면 배경 시각 변경은 없음** |
| 보유 아이템 메인 화면 반영 | ⚠️ | 텍스트 요약(`getEquippedSummary`)으로만 |
| 연속 출석 보너스 | ✅ | 7일 +5, 30일 +30 (출석에 합산) |
| 토리 탭 진입 +1(1일 1회) | ⚠️ | 1시간 쿨다운으로 구현(캐릭터 탭) |
| 명언 공유 +2 | ❌ | 미구현 |
| 한 달 투자 100% +20 | ❌ | 미구현 |
| 레벨업(홀수) +5 / 10단위 한정아이템 | ❌ | 미구현 |
| 일일 명언 | ✅ | `useDailyContent`, 100개 |
| 상점 카탈로그 `public/data/shop-catalog.json` | ❌(파일)/✅(TS) | JSON 대신 `toryShopCatalog.ts` 상수 |
| `minLevel` 구매 제한 | ❌ | 필드만 있고 검사 안 함 |
| 비밀 토큰 게이트 | ➕(PRD 외) | PRD에 없는 추가. 현재 전체 화면이 토큰 잠금 상태 |
| 놀아주기/쓰다듬기 | ➕(PRD 외) | PRD에 없는 추가 매일-진입 액션(각 +1, 30분 쿨다운) |
| MVP 데모 단계 | — | 코드 곳곳 "MVP 데모", "데모 초기화" 버튼(`resetDemo`) 존재 → **현 단계는 잠금된 내부 데모** |

### 종합 판단
레벨/칭호/외형/도토리 경제의 **로직 골격은 PRD를 충실히 구현**했고 오히려 확장(놀기/쓰다듬기, 외형↔칭호 분리)했다. 반면 **(1) 모든 일러스트/배경 시각 표현, (2) 칭호변경·투자완료 전용 모달, (3) 명언공유·월100%·레벨업 도토리 보상**은 미구현이다. 결정적으로 **현재 라이브 진입점 두 갈래가 분기**되어 있어, 사용자에게 보이는 화면(`ToryRaisingFullScreen`)에는 "투자 완료" 버튼이 없고(투자 보상은 달력/예정 투자 체크라는 별도 경로의 유틸이 담당), 그 유틸 경로는 레벨업 모달을 띄우지 않는다. 또한 전체가 비밀 토큰(`1234`)으로 잠긴 **내부 데모 상태**다.

---

## 12. 파일 경로 인덱스 (file_path:line)

### 진입 / 페이지
- `app/tory/page.tsx:8` — `ToryPage` (헤더+뒤로가기, `ToryRaisingFullScreen` 마운트)
- `app/components/AppLayout.tsx:14,37-38` — `/tory` 경로를 풀스크린/탭 노출 대상으로 등록

### 라이브 UI
- `app/components/ToryRaising/ToryRaisingFullScreen.tsx:54` — 라이브 메인 컴포넌트
  - `:45-52` `getEquippedSummary`, `:94-98` `showBubble`, `:155-163` `handleCharacterTap`(=방문)
  - `:141-153` `handleActionResult`, `:165-171` 로딩 스피너, `:283-330` 상점 탭, `:332-393` 꾸미기 탭, `:396-435` 하단 액션, `:438` 레벨업 모달, `:441-478` 잠금 오버레이
- `app/components/ToryRaising/ToryRaisingModal.tsx:6` — 레벨업 모달

### 사문 트리(정의만, import 0)
- `app/components/ToryRaising/ToryRaisingSecretGate.tsx:8`
- `app/components/ToryRaising/ToryRaisingPanel.tsx:31` (`:120` 투자완료 +10 버튼 배선)
- `app/components/ToryRaising/ToryRaisingGrowthSection.tsx:4` (`:88-90` "투자 완료 체크 (+10)")
- `app/components/ToryRaising/ToryRaisingStoreSection.tsx:15` (타입 `ToryShopCategory:3`, `ToryShopItem:5`)
- `app/components/ToryRaising/ToryRaisingCustomizeSection.tsx:4`

### 상점 데이터
- `app/components/ToryRaising/toryShopCatalog.ts:3` — `TORY_SHOP_CATALOG` (19아이템)

### 훅 — tory-raising
- `app/hooks/tory-raising/useToryRaisingData.ts`
  - `:43-55` 상태 타입, `:57-59` 쿨다운 상수, `:61-74` 쿨다운 유틸, `:76-89` 모달/결과 타입
  - `:91` `STORAGE_KEY='tory-state'`, `:93-103` 날짜 유틸, `:105-122` `safeParseState`, `:124-150` 기본값, `:152-155` `appendEarning`, `:157-176` `computeModalIfLevelChanged`
  - `:178` `useToryRaisingData`, `:182-191` hydration, `:195-199` `resetDemo`
  - `:201-239` `claimAttendance`(연속보너스 `:210-217`), `:241-265` `claimToryTabVisit`, `:267-291` `claimPlay`, `:293-317` `claimPet`, `:319-343` `claimInvestmentComplete`, `:345-378` `buyItem`(배경 자동장착 `:360-366`), `:380-394` `equipItem`
- `app/hooks/tory-raising/toryRaisingLevelModel.ts`
  - `:29-37` `TITLE_TIERS`, `:39-45` `APPEARANCE_STAGES`, `:54-97` `buildLevelThresholds`, `:99-100` 상수(maxLevel 150), `:102-105` `getTitleForLevel`, `:107-110` `getAppearanceStageForLevel`, `:112-122` `calculateToryLevel`, `:124-166` `calculateToryLevelProgress`
- `app/hooks/tory-raising/useToryRaisingCalculations.ts:16` — `useToryRaisingCalculations`
- `app/hooks/tory-raising/useToryRaisingPanelTabs.ts:7` — `useToryRaisingPanelTabs` (사문 패널용)
- `app/hooks/tory-raising/useToryRaisingSecretUnlock.ts:10` — `useToryRaisingSecretUnlock` (`:8` 토큰 `'1234'`)

### 훅 — tory / 투자 연동
- `app/hooks/tory/useDailyContent.ts:33` — `useDailyContent` (`:21-26` `getDayOfYear`, `:42` fetch)
- `app/utils/tory-raising/awardToryInvestmentComplete.ts:108` — `awardToryInvestmentComplete` (`:16` 키, `:82-106` read/write, `:115-124` 중복방지)
- `app/hooks/payment/usePaymentCompletion.ts:37` — 결제 완료 시 보상 호출
- `app/hooks/upcoming/useUpcomingInvestmentsCompletion.ts:43` — 예정 투자 완료 시 보상 호출

### 정적 자산
- `public/images/tory-character.png` — 토리 캐릭터(고정 1종, 337KB)
- `public/data/rich-quotes.json` — 명언 100개
- (없음) `public/data/shop-catalog.json` — PRD가 언급했으나 미존재

### 참고 문서
- `docs/tori-raising/prd.md` — PRD v1.0
