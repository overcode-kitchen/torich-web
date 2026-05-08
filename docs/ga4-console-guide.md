# 토리치 GA 사용 가이드 (비개발자용)

> **이 문서가 답하는 질문**: GA를 켠 다음 "**나는 어디 페이지를 클릭해서 어떤 숫자를 보면 되는가?**"
>
> 분석을 왜 그렇게 설계했는지(가설/이유)는 [`docs/ga4-events.md`](./ga4-events.md)에 따로 있어. 이 문서는 **클릭 경로**만 담음.

---

## 0. 먼저 알아두면 편한 단어 5개

GA 화면에 자주 나오는 영어 단어들. 외울 필요 없고, 막힐 때만 여기 와서 보면 돼.

| 단어 | 풀이 |
| --- | --- |
| **이벤트(Event)** | 사용자가 한 행동 기록 1개. (예: "로그인 함", "납입 체크함") |
| **전환(Conversion)** | "이게 일어나면 우리가 성공이다" 라고 표시한 가장 중요한 이벤트. 우리는 **납입 완료**가 전환임. |
| **속성 / 스트림 (Property / Stream)** | GA가 데이터를 모으는 단위. 우리는 "Torich Dev" 스트림 1개를 쓰고 있음. |
| **퍼널(Funnel)** | 사용자가 1단계 → 2단계 → ... 를 따라갈 때 **어느 단계에서 가장 많이 빠지는지** 보여주는 도표. |
| **코호트(Cohort)** | "같은 달에 처음 토리치를 시작한 사람들"을 한 그룹으로 묶은 것. 그 그룹이 2달, 3달 뒤에도 남아있는지 보는 데 씀. |

---

## 1. 우리 GA 정보 (한 곳에 정리)

토리치는 **두 개의 GA 속성**을 운영함. 개발자/QA의 테스트 행동이 진짜 사용자 데이터에 섞이지 않도록 분리해둔 것.

| 속성 이름 | 측정 ID | 스트림 URL | 용도 |
| --- | --- | --- | --- |
| **Torich Dev** | `G-C8E4VZ883Y` | `https://torich.vercel.app/` | 로컬 개발·Vercel preview 배포 |
| **Torich Prod** | `G-SC1LBTD65X` | `https://torich.app/` (출시 도메인) | 정식 배포된 웹·앱스토어 빌드 |

GA 콘솔 주소: https://analytics.google.com/

> **항상 어떤 속성을 보고 있는지 확인**: GA 콘솔 좌측 상단의 **속성 선택기**에서 매번 "Torich Dev"인지 "Torich Prod"인지 체크.
> - **매일 KPI 확인** → "Torich Prod"
> - **개발 중 디버깅·내부 테스트** → "Torich Dev"

---

## 2. 매일 30초만 보면 되는 곳 — **딱 1페이지**

매일 아침 GA에 들어가면 이 한 페이지만 30초 보면 됨.

### 보고서(Reports) → 홈(Home)

여기 카드 4개가 떠.

1. **신규 사용자(New users)** — 오늘 처음 들어온 사람 수
2. **전환수(Conversions)** — 오늘 납입 완료된 횟수 (※ 처음 1회 설정 필요, 아래 §4 참고)
3. **활성 사용자 추세(Users in last 30 minutes)** — 지금 이 순간 토리치 켜고 있는 사람
4. **인기 이벤트** — 오늘 가장 많이 일어난 행동 5개

**무엇을 보고 무엇을 판단하나**:
- 신규 사용자가 갑자기 0이면 → "마케팅 채널이 죽었거나 가입이 안 되고 있다" 신호
- 전환수가 평소 대비 절반 이하 → "납입 체크 기능에 문제 있거나 알림이 안 갔다" 신호
- 인기 이벤트에 `app_error`가 갑자기 위로 올라옴 → "앱에 새 버그 발생" 신호

> 그냥 **숫자가 갑자기 이상하면 그날 안에 누군가에게 물어보기**. 30초의 목적은 "이상 신호를 못 놓치기".

---

## 3. 켜자마자 한 번만 검증 — **DebugView**

활성화 첫날, 정말로 데이터가 들어오는지 30분 안에 확인하는 곳.

### 관리(Admin) → DebugView

**준비물 (한 번만 설치)**:
- PC 크롬 브라우저에 [Google Analytics Debugger 확장](https://chromewebstore.google.com/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) 설치

**해보는 법**:
1. 위 확장을 아이콘 클릭으로 켬 (파란 동그라미)
2. 새 탭에서 `https://torich.vercel.app/` 열고 로그인 → 투자 등록 → 납입 체크 한 번 해봄
3. 다시 GA 콘솔의 DebugView 탭으로 돌아오면 — **방금 한 행동들이 시간순으로 화면 가운데에 떠 있어야 함**
4. 이벤트 이름(예: `payment_complete`)을 클릭하면 그 안에 들어간 정보(파라미터)가 펼쳐짐

**확인할 6가지**:
- ☐ `page_view`가 보임 → GA가 켜진 것
- ☐ 이벤트를 펼쳤을 때 `user_id` 라는 칸에 긴 영숫자(해시)가 채워져 있음 → 사용자 식별 정상
- ☐ `payment_complete`에 `month_offset`, `is_retroactive`, `platform` 셋 다 보임 → 납입 트래킹 정상
- ☐ `login_success`에 `method: google` 또는 `apple`이 보임 → 로그인 트래킹 정상
- ☐ (Edge Function 배포 후) 푸시 1건 발송 시 `notification_sent`가 뜸 → 서버 측 송신 정상
- ☐ 목적 1개 만들면 `goal_create_success`에 `target_amount_bucket`, `preset_used`, `has_deadline` 셋 다 보임 → 목적(Goal) 트래킹 정상

6개 다 보이면 활성화 검증 끝.

---

## 4. 처음에 한 번만 — 콘솔 설정

활성화 직후 1회만 하면 평생 자동.

### A. payment_complete를 "전환"으로 표시

**경로**: 관리(Admin) → 이벤트(Events) → 이벤트 목록에서 `payment_complete` 찾기 → 우측의 **"전환으로 표시(Mark as conversion)"** 토글을 ON

같은 방식으로 켜두면 좋은 것:
- `investment_create_success` (투자 등록)
- `notification_open` (알림 탭)
- `login_success` (로그인 완료)

> 이 토글을 켜야 §2의 홈 화면에 "전환수" 카드 숫자가 채워져.

### B. 데이터 보관 기간 늘리기 (선택, 5분)

**경로**: 관리 → 데이터 설정(Data Settings) → 데이터 보관(Data Retention)

- 기본값: 14개월
- 권장: **26개월(=2년 2개월)** 로 변경
- 왜? KPI 3 "6개월 리텐션"을 보려면 그 데이터가 26개월까진 남아있어야 1년+ 코호트 비교가 가능

---

## 5. 본격 분석은 직접 보고서를 만들어야 함

GA 표준 보고서는 "전체 평균"만 보여주지, 우리가 보고 싶은 깊은 분석(어디서 이탈하는지, 한 달 뒤에도 남는지)은 **직접 만들어야 함.** 처음 만들 때만 어렵고, 한 번 만들어두면 좌측에 저장되어 매번 클릭만 하면 다시 봄.

만드는 곳: **좌측 메뉴 "탐색(Explore)"**

### 보고서 ① 활성화 퍼널 — "사람들이 첫 납입까지 가는가?"

**만들기 5분**:
1. 탐색(Explore) 클릭 → **빈 양식(Blank)** 카드 클릭
2. 화면 가운데 위쪽 **"기법(Technique)"** 드롭다운 → **"깔때기 탐색(Funnel exploration)"** 선택
3. 우측 패널의 **"단계(Steps)"** 옆 연필 아이콘 클릭
4. 단계를 5개 만들고 각각 이렇게 설정:
   - 1단계: "첫 방문" — 이벤트 이름이 `first_visit`인 경우
   - 2단계: "온보딩 완료" — `onboarding_complete`
   - 3단계: "로그인 성공" — `login_success`
   - 4단계: "투자 등록" — `investment_create_success`
   - 5단계: "**첫 납입 완료**" — `payment_complete`
5. "적용(Apply)" 클릭
6. 좌상단의 보고서 이름을 클릭해서 **"활성화 퍼널"** 로 변경 (자동 저장됨)

**볼 화면**: 다섯 개의 막대가 위에서 아래로 줄어드는 그래프. 단계 사이에 **% 숫자**가 떠 있음 — "이 단계에서 다음 단계로 X%가 넘어갔다"는 뜻.

**해석**:
- **가장 큰 % 손실 구간**이 우선 개선 지점
- 예) 3→4 구간만 30% (다른 곳은 70~80%) → "로그인하고 투자 등록을 안 한다" → 등록 화면이 어렵다는 신호

### 보고서 ② 월간 코호트 — "한 달 뒤에도 사람들이 남아있는가?"

**만들기 5분**:
1. 탐색 → **빈 양식** 클릭
2. "기법" 드롭다운 → **"코호트 탐색(Cohort exploration)"** 선택
3. 우측 설정에 차례로 입력:
   - **코호트 포함 기준(Cohort inclusion)**: "이벤트 = `payment_complete`" (= 첫 납입을 한 사람들로 묶음)
   - **재방문 기준(Return criteria)**: "이벤트 = `payment_complete`" (= 다시 납입을 했는가)
   - **코호트 단위(Cohort granularity)**: **"월별(Monthly)"**
   - **계산(Calculation)**: "표준(Standard)"
4. "적용" 클릭
5. 이름을 **"월간 행동 리텐션"** 으로 변경

**볼 화면**: 큰 표.
- **행** = 사람들이 첫 납입 한 월 (예: 2026년 5월 코호트)
- **열** = M0(그 달), M1(다음 달), M2(2달 뒤), ..., M6(6달 뒤)
- 각 칸의 % = "그 코호트 중 그 달에도 납입한 비율"

**예상 모양**:
```
        M0    M1    M2    M3    M4    M5    M6
5월     100%  50%   38%   27%   23%   19%   15%   ← 부드러운 감쇠 = 정상
```

**비정상 사인**:
```
        M0    M1    M2    M3
3월     100%  45%   18%   13%   ← M2에서 갑자기 절벽! 4월에 무슨 일?
```

→ 그 월에 알림 사고가 있었나, 새 배포가 회귀 일으켰나 등을 추적

> ⚠️ 활성화 직후엔 표가 텅 비어 보임 — **시간이 지나야 채워짐.** 6달 뒤에 진짜 의미 있어짐.

### 보고서 ③ 알림 가치 funnel — "푸시 알림이 진짜 행동을 만드는가?"

**조건**: Edge Function이 배포되어 `notification_sent`가 GA에 들어와야 의미 있음. 안 보이면 개발자에게 §7 작업이 됐는지 확인.

**만들기**:
1. 탐색 → 빈 양식 → 기법 = **깔때기 탐색**
2. 단계 3개:
   - 1단계: "푸시 발송됨" — `notification_sent`
   - 2단계: "푸시 탭" — `notification_open` (이 단계 우측 톱니바퀴 → "조건/필터" 추가 → 파라미터 `source` = `push`)
   - 3단계: "그 결과 납입 완료" — `payment_complete`
3. **단계 사이 시간 윈도우 24시간 설정**: 각 단계 우측 톱니바퀴 → "Time between steps" → 24h
4. 이름: **"알림 가치 funnel"**

**해석**:
- 1→2 단계가 낮으면 → "알림 보내도 안 누른다" → 카피/시간대 개선
- 2→3 단계가 낮으면 → "알림 누르고 들어왔는데 납입을 안 함" → 알림 누르면 도착하는 화면이 잘못됨

### 보고서 ④ 본인 활동으로 검증 — User Explorer

GA 활성화 직후 **본인 토리치 사용 기록이 정확히 잡혔는지** 직접 확인할 때.

**경로**: 탐색 → "사용자 탐색기(User Explorer)" 템플릿 클릭

본인 user_id (해시값) 행을 클릭하면 그 사람(본인)의 시간순 이벤트 타임라인이 보임. "내가 푸시 받고 → 탭하고 → 납입 체크 했다"가 다 잡혔는지 한 줄 한 줄 확인 가능.

### 보고서 ⑤ 목적(Goal) 보조 분석 — "목적 기능을 진짜 쓰는가?" (선택, 데이터 1주 후)

> **언제 보면 되는가**: 목적(Goal)은 KPI가 아닌 **보조 신호**라 매일 볼 필요는 없음. 데이터 1주~1달 쌓이고 나서, 또는 폼 디자인을 바꾸기 전에 "지금 어떤 패턴인지" 한 번 보는 용도.

#### A. 어떤 프리셋이 인기인가? (3분, 매일 보지 않음)

**경로**: 보고서(Reports) → 참여도(Engagement) → 이벤트(Events) → 이벤트 목록에서 **`goal_create_success`** 클릭

화면 하단의 **"이벤트 매개변수 키" 섹션**을 찾고 → **`preset_used`** 행을 클릭하면 분포가 뜸:

```
preset_used        이벤트 수
결혼 자금          37
주택 자금          28
custom            21    ← 직접 입력한 사람
여행              12
차                 6
이사               4
```

**해석**:
- 한쪽에 **90%+ 쏠리면** → 나머지 프리셋은 숨겨도 손실 거의 없음. 폼 단순화 결정 근거.
- `custom`이 압도적이면 → 프리셋이 별 도움 안 됨. 다른 형태(예: 이름 추천 자동완성)로 대체 검토.
- 골고루 분산되면 → 그대로 유지.

#### B. "목적만 만들고 방치"하는 사람 비율 (5분)

**핵심 질문**: 목적을 만든 사람 중 **30일 안에 투자를 한 번이라도 묶은 비율**은? 50% 미만이면 "유령 목적" 비율이 너무 높다는 신호.

**경로**: 탐색(Explore) → 빈 양식 → **기법 = 깔때기 탐색**

**단계 2개**:
1. 1단계: `goal_create_success`
2. 2단계: `goal_record_linked` (※ 우측 톱니바퀴 → "Time between steps" → **30일** 설정)

이름을 **"목적 활성화율"**로 저장.

**해석**:
- 70%+ 정상
- 50% 미만 → 폼에서 투자 연결 단계를 강제하거나 가이드 강화 검토
- 30% 이하 → 기능 자체를 접거나 폼을 통째로 다시 설계

#### C. 목적 달성에 평균 며칠 걸리는가? (5분)

**경로**: 보고서 → 참여도 → 이벤트 → **`goal_completed`** 클릭 → 매개변수 **`days_to_complete`** 분포 확인

**예상 결과**: 큰 목적(`target_amount_bucket=>=10m`)은 1년+, 작은 목적(`<=300k_500k`)은 한두 달. 너무 빨리 끝나면(평균 7일 미만) "목적 자체가 너무 작다 → 기능 의도 어긋남" 신호일 수 있음.

> **솔직한 한계**: 활성 유저 수가 작을 때(월 신규 100명 미만)는 위 보고서들 모두 **표본이 너무 작아 의미 있는 결론이 안 남**. 데이터가 어느 정도 쌓이기 전엔 그냥 한 달에 한 번 잠깐 보는 정도면 충분.

---

## 6. 자주 가는 곳 북마크 5개

브라우저 즐겨찾기에 박아두면 매일 5초 안에 도달.

| 이름 | 링크 |
| --- | --- |
| 1. 홈 (매일 30초) | https://analytics.google.com/analytics/web/?authuser=2#/p518945484/reports/intelligenthome |
| 2. DebugView (검증) | https://analytics.google.com/analytics/web/?authuser=2#/a379810235p518945484/admin/debugview/ |
| 3. 실시간(Realtime) | https://analytics.google.com/analytics/web/?authuser=2#/p518945484/reports/realtime |
| 4. 이벤트 보고서 | https://analytics.google.com/analytics/web/?authuser=2#/p518945484/reports/explorer?r=engagement-events |
| 5. 탐색 (보고서 만들기) | https://analytics.google.com/analytics/web/?authuser=2#/p518945484/explore |

---

## 7. **개발자에게 맡길 일** (본인이 안 해도 됨)

GA를 실제로 켜려면 코드 외에 시스템 설정이 필요한데, 이건 본인 손이 닿지 않는 작업이야. 활성화 결정 시 개발자에게 이 목록을 그대로 전달:

- [ ] **Vercel 환경변수 주입** — Production/Preview를 **다른 ID로 분리**:

  | Vercel 환경 | `NEXT_PUBLIC_GA_ID` |
  | --- | --- |
  | Production | `G-SC1LBTD65X` (Torich Prod) |
  | Preview | `G-C8E4VZ883Y` (Torich Dev) |
  | Development | (없거나 dev) |

- [ ] **iOS 앱 빌드** — 빌드 수행하는 머신의 `.env.production`이 prod ID(`G-SC1LBTD65X`)로 되어 있는지 확인. 이 파일은 git에 커밋되지 않으니 빌드 머신마다 직접 작성 필요
- [ ] **Edge Function secret 설정** (서버에서 알림 발송 데이터를 GA에 보내려면 필요):
  - `supabase secrets set GA_MEASUREMENT_ID=G-SC1LBTD65X`
  - `supabase secrets set GA_API_SECRET=<§8에서 본인이 발급한 prod 값>`
  - `supabase functions deploy send-push`

> Edge Function은 **항상 prod 속성으로 송신**함 (Supabase 프로젝트가 dev/prod 단일이라). dev 환경에서 푸시 발송 테스트는 거의 안 일어나니 실용적으로 문제 없음.

## 8. 본인이 직접 한 번만 할 일 — Measurement Protocol API secret 발급

위 §7의 `GA_API_SECRET`을 만들려면 GA 콘솔에서 직접 발급 받아야 함. **prod 속성 쪽에서 발급**해야 하니 주의.

**경로**:
1. GA 콘솔 좌측 상단 속성 선택기 → **Torich Prod** 선택 확인
2. 관리(Admin) → 데이터 스트림(Data Streams) → **Torich Prod Web** 스트림 클릭
3. **"Measurement Protocol API secrets"** 항목 클릭
4. 우상단 **만들기(Create)** 버튼 → 별칭 `send-push` 입력 → 만들기

**나오는 결과**: 긴 영숫자 secret 값 1개. **한 번만 보여지므로 즉시 안전한 곳에 복사** (1Password, 비밀 메모). 보안상 개발자에게 직접 공유하지 말고, 본인이 직접 위 §7의 `supabase secrets set` 명령에 넣어 사용.

---

## 9. 트러블슈팅 — "숫자가 안 보여요"

| 증상 | 가장 흔한 원인 |
| --- | --- |
| 실시간/DebugView에 아무것도 없음 | Vercel/iOS에 환경변수가 안 들어가 있음 → 개발자 확인 |
| 이벤트는 들어오는데 `user_id`가 비어 있음 | 비로그인 상태이거나, 로그인 직후가 아닐 때 잠시 비어 있을 수 있음. 로그인 후 다시 행동해보고 확인 |
| `notification_sent`만 0건 | Edge Function 배포 안 됐거나 §8의 API secret이 누락됨 |
| 코호트 표가 비어 보임 | **이건 정상** — 시간이 지나야 채워짐. 활성화 1달 뒤 M1 칸이, 6달 뒤 M6 칸이 채워짐 |
| 전환수 카드가 0 | §4 A의 "전환으로 표시" 토글을 안 켰거나, 켠 지 24시간이 안 됐음 |
| 데이터가 어디 있는지 모르겠음 | GA 콘솔 좌측 상단 속성 선택기에서 **Torich Prod**(진짜 사용자) vs **Torich Dev**(테스트) 중 어느 쪽을 보고 있는지 먼저 확인 |

---

## 10. 환경별 ID 매트릭스 (어떤 데이터가 어디로 가는가)

| 사용자/환경 | GA 속성 | 측정 ID |
| --- | --- | --- |
| 정식 출시된 iOS 앱 (앱스토어) | Torich Prod | `G-SC1LBTD65X` |
| 정식 도메인 `https://torich.app` 웹 | Torich Prod | `G-SC1LBTD65X` |
| Vercel preview 배포 (`*.vercel.app`) | Torich Dev | `G-C8E4VZ883Y` |
| 로컬 개발 (`npm run dev`) | Torich Dev | `G-C8E4VZ883Y` |
| 푸시 발송 (Edge Function) | Torich Prod | `G-SC1LBTD65X` |

> 즉 "**진짜 KPI는 Torich Prod에서만 본다**"가 원칙. 본인이 토리치를 평소 본인 폰에서 dev 빌드로 테스트한 거라면 그건 Dev에 들어가 있음.

---

## 11. 한 줄 요약

> **매일은 §2 홈 30초만**, 처음에 §3 DebugView로 검증, 한 번에 §4 토글 키고, 시간 날 때 §5 보고서 4개 만들어두기. 막히면 §9 트러블슈팅. 어느 속성을 보고 있는지(§10) 항상 체크.
