# 기술스택 명세서

## 개발 환경
| 항목 | 버전 | 설명 |
|------|------|------|
| Node.js | 20+ | JavaScript 런타임 |
| Next.js | 16.1.1 | React 풀스택 프레임워크 |
| React | 19.2.3 | UI 라이브러리 |
| TypeScript | 5.x | 정적 타입 체커 |
| iOS 지원 | 17.0+ | iOS 최소 지원 버전 |
| Xcode | - | iOS 개발 환경 (Capacitor 통해 빌드) |

## 아키텍처 패턴
- **Next.js App Router** + **React Server Components**
- **MVVM 패턴** (Custom Hooks 분리)
- **Capacitor** 하이브리드 앱 아키텍처

## 프론트엔드 프레임워크
| 프레임워크 | 버전 | 용도 |
|-----------|------|------|
| Next.js | 16.1.1 | 풀스택 React 프레임워크 |
| React | 19.2.3 | UI 컴포넌트 라이브러리 |
| Tailwind CSS | 4.x | CSS 유틸리티 프레임워크 |

## UI 컴포넌트 라이브러리
| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| shadcn/ui | latest | Radix UI 기반 컴포넌트 라이브러리 |
| Radix UI | 1.4.3 | 접근성 높은 UI 프리미티브 |
| @phosphor-icons/react | 2.1.10 | 아이콘 라이브러리 |
| @tabler/icons-react | 3.36.1 | 추가 아이콘 라이브러리 |

## 상태 관리 및 데이터 처리
| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| @supabase/supabase-js | 2.89.0 | 백엔드 통합 (인증, 데이터베이스) |
| @supabase/ssr | 0.8.0 | 서버사이드 Supabase 지원 |
| date-fns | 4.1.0 | 날짜 처리 라이브러리 |

## 차트 및 데이터 시각화
| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| recharts | 3.7.0 | React 차트 라이브러리 |
| yahoo-finance2 | 3.11.2 | 금융 데이터 API |

## 날짜 처리
| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| react-day-picker | 9.13.0 | 날짜 선택기 컴포넌트 |

## 모바일 앱 (Capacitor)
| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| @capacitor/core | 8.0.2 | Capacitor 코어 라이브러리 |
| @capacitor/ios | 8.0.2 | iOS 네이티브 기능 |
| @capacitor/cli | 7.4.5 | Capacitor CLI 도구 |

## 개발 도구
| 도구 | 버전 | 용도 |
|------|------|------|
| ESLint | 9.x | 코드 린팅 |
| eslint-config-next | 16.1.1 | Next.js ESLint 설정 |
| TypeScript | 5.x | 정적 타입 체킹 |
| CocoaPods | - | iOS 의존성 관리 |

## 스타일링 시스템
| 항목 | 설명 |
|------|------|
| CSS 프레임워크 | Tailwind CSS v4 |
| 디자인 토큰 | 커스텀 CSS 변수 시스템 |
| 폰트 | Pretendard (한글), Geist Sans (영문) |
| 컬러 시스템 | Brand, CoolGray, Torich 컬러 팔레트 |

## 빌드 및 배포
| 항목 | 설명 |
|------|------|
| 웹 빌드 | Next.js 정적 내보내기 (output: 'export') |
| 앱 빌드 | Capacitor를 통한 iOS 앱 패키징 |
| 배포 대상 | 웹 + iOS 하이브리드 앱 |

## 프로젝트 특이사항
- **하이브리드 앱**: Next.js 웹 앱을 Capacitor로 감싸 iOS 앱으로 배포
- **커스텀 아키텍처**: Custom Hooks를 통한 로직 분리 (use{Domain}Data, use{Domain}Calculations)
- **디자인 시스템**: 3레이어 컬러 시스템과 통합된 Tailwind CSS
- **타입스크립트**: 엄격한 타입 체킹 적용
- **코드 품질**: ESLint와 Next.js 권장 사항 준수
