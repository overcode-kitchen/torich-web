# #99 — 목표별 페이스 '달성' 칸 도토리 물리 delight

> 작업 착수용 핸드오프 스펙. 이 문서만 보고 바로 구현 시작할 수 있게 정리함.
> 이 파일은 아직 **untracked** (PR #100엔 안 섞임). #99 작업 브랜치에서 커밋하거나 삭제해도 됨.

- 이슈: https://github.com/overcode-kitchen/torich-web/issues/99
- 선행(머지되어야 함): #27 / PR #100 — 목표별 페이스 섹션 + **정적 도토리 채움**
- 대상 파일: `app/components/StatsSections/GoalPaceSection.tsx` (안의 `AcornFill`을 물리 버전으로 교체)

---

## 1. 한 줄 요약

통계 '목표별 페이스'의 좌측 **달성 칸**을, 진입 시 도토리가 **쏟아져 달성%만큼 쌓이고**, 기기를 **기울이면 굴러 재정렬**되는 물리 인터랙션으로 업그레이드한다. 정적 버전(#27) 위에 얹는 **progressive enhancement**.

## 2. 원하는 UX

- 통계 진입 → 도토리가 위에서 **우다다 쏟아져** 바닥에 쌓임
  - 8% → 바닥에 **몇 알만**, 90% → **거의 꽉**
- 기기를 좌우로 **기울이면** 도토리가 굴러 다시 자리 잡음 (찰랑이는 느낌)
- 높이는 **대략** 달성%, 정확한 값은 옆의 **숫자**가 담당 (꾸밈이 이해를 돕는 구조 — 정밀 게이지가 아님)
- 데이터 왜곡 금지: 기울여도 **도토리 개수(=달성%)는 불변**, 위치만 재배치

## 3. 왜 도토리인가 (물이 아니라)

물은 "왜 갑자기 물?"이 생김. 도토리는 마스코트 **토리(다람쥐)가 모으는 것** = 저축의 상징이라 브랜드에서 자연스럽게 나온 꾸밈. 색도 임의색이 아니라 브랜드 보조색(`torich-brown`) 계열.

## 4. 스택 전제 — Capacitor 로컬 번들(WKWebView)

iOS 앱은 `output: 'export'` 정적 번들을 WKWebView가 로드. **네이티브 경로는 전부 해당 없음**:

- ❌ SwiftUI / Core Motion `CMMotionManager` / Metal 셰이더(`.distortionEffect`) / Inferno / Rive / SpriteKit — 전부 네이티브 전용
- ✅ 웹 표준(`DeviceOrientationEvent` / `DeviceMotionEvent`) + canvas

## 5. 기술 설계

### 5-1. 센서 입력
- `@capacitor/motion` 플러그인(공식) 또는 웹 `DeviceOrientationEvent` 직접 사용. 둘 다 iOS에선 아래 권한 모델 동일.
- iOS 13+: `DeviceOrientationEvent.requestPermission()` / `DeviceMotionEvent.requestPermission()` 을 **사용자 제스처(버튼 탭) 콜백 안에서** 호출. HTTPS 필수. 페이지 로드 시점엔 못 부름.
- 좌우 기울기 = `event.gamma` (deg). 이걸 수평 중력으로 변환.

### 5-2. ⚠️ 최우선 검증 리스크 — WKWebView 권한 프롬프트
- WKWebView는 `WKUIDelegate`가 세팅돼 있지 않으면 **권한 프롬프트 자체가 안 뜸**.
- Capacitor 브리지가 이걸 물려주는지 **실기기에서 제일 먼저 확인**할 것. (스파이크 1개로 검증)
- 안 뜨면: 기울기 기능은 죽음 → **"쏟기만(권한 불필요)" 폴백**으로 확정하고 그 이상 파지 말 것.
- `Info.plist`에 `NSMotionUsageDescription` 문구 추가 필요할 수 있음.

### 5-3. 렌더 / 물리
- **canvas** 에 2D 물리 (달성 칸마다 1개). 두 갈래:
  - (권장 시작) **경량 커스텀 물리** — 중력 + 원-원 충돌(relaxation). 의존성 0, 이 효과에 딱 맞게 재단. 아래 §8에 검증된 프로토타입 코드 있음.
  - (승격) **matter.js** — 쌓임 거동이 더 필요하면. 번들 비용 있음.
- framer-motion은 값 주입용 → '쌓임 물리'엔 부적합.

### 5-4. 분할 (중요)
- **쏟아져 쌓이기(중력 down)** = 권한 불필요 → 무조건 됨. **이걸 기본으로 항상 제공.**
- **기울여 재정렬** = 모션 권한 필요 → **옵트인**(작은 토글/버튼). 권한 없어도 앱은 완전히 정상.

## 6. 통합 지점 — GoalPaceSection.tsx

현재(#27) 정적 버전은 `AcornFill`이 seed 기반으로 도토리를 흩어 놓음. 물리 버전은 이 컴포넌트만 canvas 물리로 **교체**하면 됨. 나머지(레이아웃·달성% 계산·숫자·기한 바)는 그대로.

현재 정적 `AcornFill` (교체 대상, 참고용):

```tsx
function AcornFill({ level, seed }: { level: number; seed: number }) {
  const count = Math.min(46, Math.max(2, Math.round(level * 0.5) + 2))
  const fillTop = Math.max(6, level)
  const acorns = Array.from({ length: count }, (_, i) => {
    const s = seed * 131 + i * 7
    return {
      key: i,
      size: 12 + pseudoRandom(s + 1) * 4,
      left: 3 + pseudoRandom(s + 2) * 82,
      bottom: pseudoRandom(s + 3) * fillTop,
      rot: -30 + pseudoRandom(s + 4) * 60,
    }
  })
  // ...absolute positioned <Acorn/> 들
}
```

- `level` = `clampPercent(progress.progressPercent)` (달성%). 물리 버전도 이 값으로 도토리 개수 산정.
- **reduce-motion / 권한 미허용 / 저성능 폴백 = 지금 이 정적 배치를 그대로 렌더**. 즉 물리 버전은 정적 버전을 "감싸는" 형태가 이상적.

## 7. 구현 체크리스트

- [ ] **스파이크**: Capacitor WKWebView에서 `DeviceOrientationEvent.requestPermission()` 프롬프트가 뜨는지 실기기 검증 (§5-2). 결과에 따라 기울기 기능 여부 확정.
- [ ] `AcornPhysicsFill` 컴포넌트: canvas + 물리 루프. props `{ level, seed }` 로 `AcornFill` 시그니처 유지.
- [ ] 진입 시 pour 애니메이션(중력 down), `level`로 도토리 개수 산정.
- [ ] 옵트인 버튼 → 권한 요청 → 성공 시 `deviceorientation` 구독, `gamma`→수평 중력.
- [ ] **저역통과 필터** + **진입 시점 기준 상대각**(누워서 봐도 안 깨지게).
- [ ] `IntersectionObserver`로 **화면 벗어나면 rAF·센서 정지**, 다시 보이면 재개.
- [ ] `prefers-reduced-motion` → 물리 off, **정적 배치만** 렌더.
- [ ] 폴백: PC/권한거부/센서없음 → 정적 배치(또는 pour만) — 크래시·빈 화면 없어야.
- [ ] 실기기 테스트(iOS 시뮬레이터는 센서 없음).
- [ ] 성능: 도토리 최대 개수 cap, 갱신 30~60Hz, 달성 칸 여러 개일 때 총 부하 확인.

## 8. 검증된 프로토타입 물리 (경량 커스텀, 데모에서 동작 확인)

canvas 하나에 대한 최소 물리. 실제 구현의 출발점으로 사용.

```js
// 파라미터 (데모 캘리브레이션)
const GY = 0.34            // 기본 중력(아래)
let gx = 0                 // 기울기 → 수평 중력. gamma(deg): gx = clamp(sin(gamma*π/180)*0.55, -0.5, 0.5)
const r = 6.5              // 도토리 반지름(px, CSS)
// 개수: level%와 칸 넓이로 산정 (packing ~0.72), cap 64
// target = min(64, max(2, round(level/100 * W * H / (π r²) * 0.72)))

// 매 프레임 step():
//  1) 스폰: spawned<target 이면 2프레임마다 1알씩 위(y<0)에서 떨어뜨림
//  2) 각 파티클: vy+=GY; vx+=gx; vx*=0.99; vy*=0.99; x+=vx; y+=vy
//  3) 벽/바닥 클램프: x∈[r,W-r](충돌 시 vx*=-0.3), y≤H-r(vy*=-0.18, vx*=0.88)
//  4) 원-원 충돌(relaxation 2회): 겹치면 절반씩 밀어냄
//  5) draw: clear 후 각 도토리 그림
```

도토리 그리기(canvas):

```js
function drawAcorn(ctx, p) {
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
  ctx.fillStyle = '#CDA067';                                  // 몸통(탄)
  ctx.beginPath(); ctx.ellipse(0, p.r*0.18, p.r*0.82, p.r, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#744F2F';                                  // 캡(브라운)
  ctx.beginPath(); ctx.ellipse(0, -p.r*0.5, p.r*0.92, p.r*0.5, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#5C3E24'; ctx.fillRect(-1, -p.r*1.05, 2, p.r*0.5); // 꼭지
  ctx.restore();
}
```

- O(n²) 충돌 × cap 64 × 칸 몇 개 = 프레임당 수천~1.4만 연산 → 폰에서 감당 가능. cap·오프스크린 정지로 여유 확보.
- reduce-motion 폴백: rAF 없이 `step()`을 ~200회 동기 실행 후 1회 draw = 즉시 쌓인 최종 상태.

## 9. 폴백 매트릭스

| 상황 | 동작 |
|---|---|
| 정상(iOS, 권한 허용) | pour + 기울기 재정렬 |
| 권한 거부 / 미옵트인 | pour만 (기울기 없음) |
| PC / 센서 없음 | pour만 (기울기 없음) |
| `prefers-reduced-motion` | 정적 최종 배치만 |
| 저성능 / 오프스크린 | 정지 / 정적 배치 |

## 10. 캘리브레이션 · 디자인 튜닝(구현 중 조정)

- 도토리 색/모양/크기(현재 캡 `#744F2F`, 몸통 `#CDA067`, 꼭지 `#5C3E24`), 밀도(packing 0.72), 쏟기 속도(스폰 간격), 90%가 "거의 꽉"으로 보이는지.
- 달성 칸 높이(현재 `min-h-[84px]`)가 도토리 쌓임에 충분한지 — 필요 시 상향.

## 11. 참고

- 물리 데모(느낌 확인용, 세션 아티팩트): canvas 물리 + 기울기 + reduce-motion 폴백 구현본. 위 §8이 그 핵심 로직.
- 설계 맥락: 통계 탭은 "행동 유도(넛지)"가 아니라 "돌아보며 이해"하는 자리 → 판정 없이 달성 vs 기한만 보여줌. 도토리는 그 위의 delight일 뿐, 정보(숫자)는 항상 명시.
