# HANDOFF — 토리치 (torich-web)

> 이 파일은 재진입 노트다. 세션 시작 시 훅이 자동으로 읽어준다.
> 돌아오면 `/catchup` 으로 이 파일 + git 상태를 브리핑받고 시작하라.
> _마지막 갱신: 2026-07-27 21:52 · 브랜치: feat/99-acorn-physics-delight_

## 🎯 지금 목표 (한 줄)
이슈 #99 — 통계 '목표별 페이스' 달성 칸을 **도토리 물리(쏟기·기울임)** 로 채우는 delight. 코드 완료·PR 오픈, 남은 건 **실기기 검증**과 **머지 결정**.

## ✅ 마지막으로 한 것 (이번 세션)
- **도토리 물리 delight 구현**(#99, 스펙 `docs/specs/99-acorn-physics-delight.md`). `AcornFill`(정적)을 canvas 물리 `AcornPhysicsFill`로 교체. 진입 시 도토리가 쏟아져 달성%만큼 쌓이고(권한 불필요·항상), 기기를 기울이면 재정렬(iOS 모션 권한 필요 → 헤더 '기울이기' 옵트인 토글).
- **모듈 분리**: 순수 물리 엔진 `app/utils/acorn-physics.ts` / 틸트 권한·센서 공유 컨텍스트 `app/hooks/stats/useTiltGravity.tsx` / `AcornPhysicsFill.tsx`(canvas 루프+IO/RO) / `AcornStaticFill.tsx`(폴백) / `TiltToggle.tsx`.
- **피드백 반영(2번째 커밋)**: 도토리를 **3D 이미지 `acorn-1.png`** 로 교체(canvas는 `drawImage`, 정적은 `next/image`, 로드 전 벡터 폴백). '달성' 칸 배경을 연녹색→**크림/샌드 베이지** 신규 토큰 `acorn-well-bg`(라이트 `#f1e8da`/다크 `#42382e`).
- **폴백 매트릭스**: reduce-motion·canvas 미지원 → 정적 이미지 배치 / 권한거부·PC → pour만 / 오프스크린·안정 → rAF 정지. 서버·초기 렌더 null이라 하이드레이션 안전.
- 커밋 `e6aa46a`(물리 뼈대) + `5294075`(이미지·배경). PR **#102** 생성(base integration).

## 📍 지금 상태
- 빌드/실행: `tsc --noEmit` ✅, 변경파일 `eslint` ✅, `pnpm run build:app`(정적 export) ✅ — localhost 누출 0, `acorn-well-bg` 토큰 CSS 생성 확인, `out/icons/3d/acorn-1.png` 포함, `app/api`·`app/auth` 복구·백업 잔재 없음. **PR #102 CI verify ✅**.
- 미커밋 변경: **없음** (두 커밋 전부 origin에 푸시됨, ahead/behind 0/0).

## ⏭️ 다음 할 일 (우선순위 순)
1. **실기기 검증 ①(최우선 리스크)**: Capacitor WKWebView에서 `DeviceOrientationEvent.requestPermission()` 프롬프트가 실제로 뜨는지. 안 뜨면 기울기 기능은 죽고 pour-only가 확정 baseline(앱은 정상). 스펙 §5-2.
2. **실기기 검증 ②(튜닝)**: 도토리 크기(`SPRITE_SCALE=2.7` in `app/utils/acorn-physics.ts`)·크림 톤 명도·90%가 "거의 꽉"인지 눈으로 보고 조정.
3. **머지**: 담당자(suni) 판단. 지시 오면 CI 통과 확인 후 **Squash merge**(이슈브랜치→integration).
4. (별건) 통계 v2 Phase C — 전망 신호등(`docs/stats-redesign-plan-v2.md`), 담당 suni.

## 🧭 결정과 이유 (이번 세션)
- **쏟기=기본(권한 불필요) / 기울기=옵트인 토글** — 왜: 권한 없어도 delight의 핵심(쏟기)은 항상 제공, 앱은 완전 정상. iOS 권한은 사용자 제스처 안에서만 요청 가능해 토글이 그 진입점.
- **틸트 권한/센서를 origin 단위 컨텍스트로 공유** — 왜: 권한은 origin 1회, canvas는 목적마다 여러 개. 구독 1개로 모든 canvas에 수평중력 ref 공급, 기울기 켜지면 정지된 canvas를 resume 콜백으로 깨움.
- **폴백=정적 이미지 배치, 서버 렌더는 null** — 왜: 하이드레이션 안전 + `useSyncExternalStore`로 supported 플래그 읽어 불일치 없음. reduce-motion 존중.
- **배경=신규 시맨틱 토큰 `acorn-well-bg`(라이트 크림/다크 웜톤)** — 왜: 3-Layer 규칙 준수 + 다크에서 밝은 크림 눈부심 방지. 버린 대안: `torich-brown-light` 직접 사용(다크 대응 안 됨).

## 🚧 막힌 것 / 열린 질문
- **WKWebView 모션 권한 프롬프트 실효성** — 실기기 스파이크 전까지 미확정(스펙 최우선 리스크). 웹/시뮬레이터로 검증 불가.
- 도토리 스프라이트 크기·크림 배경 명도는 실기기 눈검증 필요(현재 안전 기본값).

## ▶️ 바로 이어가려면
`git checkout feat/99-acorn-physics-delight`(이미 그 브랜치, 클린). Xcode로 앱 빌드 → 통계 탭 '목표별 페이스'에서 도토리 쏟김 확인 → 헤더 '기울이기' 탭 → 권한 프롬프트 뜨는지(핵심) → 기울여 재정렬 확인. 웹만이면 `pnpm run dev` 후 기한 있는 목적 만들어 canvas pour/폴백 확인. 값 조정은 `app/utils/acorn-physics.ts`(SPRITE_SCALE·물리 파라미터), 배경은 `app/globals.css`의 `--acorn-well-bg`.
