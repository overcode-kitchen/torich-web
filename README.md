# 토리치 (Torich)

> 매달 투자, 까먹지 않게

적립식 투자 알림과 납입 관리를 한 곳에서. 매월 투자일을 알려주고, 완료 체크와 투자 현황을 한눈에 확인할 수 있는 서비스입니다.

- **웹**: [torich.vercel.app](https://torich.vercel.app)
- **iOS 앱**: 출시됨 (App Store)

## 주요 기능

- **매월 투자일 알림** — 푸시 알림으로 잊지 않게
- **납입 완료 체크** — 캘린더와 다가오는 투자 카드에서 한 번에
- **투자 현황 통계** — 예상 자산·수익 차트, 기간별 완료율
- **자동 수익률 갱신** — 종목별 시스템 수익률을 자동 반영
- **다크 모드 지원** — 라이트/다크/시스템 테마

## 기술 스택

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Supabase · Capacitor (iOS).

자세한 내용은 [docs/TECH_STACK.md](docs/TECH_STACK.md) 참고.

## 시작하기

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 으로 접속.

### 환경변수

`.env.local` 에 아래 키들이 필요합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_API_URL=        # build:app 빌드 시 필수
```

## 빌드

```bash
npm run build       # 웹용 (Next.js 일반 빌드)
npm run build:app   # iOS 앱용 (정적 export → Capacitor)
```

`build:app` 은 빌드 중 `app/api`, `app/auth` 폴더를 임시 백업 후 정적 export 를 수행합니다. 빌드가 중단된 경우 [CLAUDE.md](CLAUDE.md) 의 "빌드 복구" 섹션을 참고하세요.

## 문서

| 문서 | 내용 |
|------|------|
| [CLAUDE.md](CLAUDE.md) | 아키텍처/디자인 시스템 규칙, Supabase 호환성 룰 (AI/개발자 공통) |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 브랜치 전략, 협업 규칙, 배포 프로세스 |
| [docs/TECH_STACK.md](docs/TECH_STACK.md) | 기술 스택 상세 |
| [docs/oauth-setup.md](docs/oauth-setup.md) | OAuth (Google/Apple) 설정 및 트러블슈팅 |
| [docs/notification-infra.md](docs/notification-infra.md) | 알림 웹훅 + pg_cron 인프라 |
| [docs/ga4-events.md](docs/ga4-events.md) | GA4 이벤트 설계 |
| [docs/screens.md](docs/screens.md) | 화면별 기능명세서 |
| [docs/tori-raising/prd.md](docs/tori-raising/prd.md) | "토리 키우기" 기능 PRD |
