# Hooks 폴더 구조 가이드

## 📁 제안된 폴더 구조

```
app/hooks/
├── auth/                    # 인증 관련 훅
│   ├── useAuth.ts
│   ├── useLoginAuth.ts
│   ├── useSettingsAuth.ts
│   ├── useAuthNavigation.ts
│   └── useUserData.ts
│
├── investment/              # 투자 관련 훅
│   ├── data/               # 데이터 fetching
│   │   ├── useInvestments.ts
│   │   ├── useInvestmentsFetch.ts
│   │   ├── useInvestmentsUpdate.ts
│   │   ├── useInvestmentsDelete.ts
│   │   ├── useInvestmentData.ts
│   │   └── useStatsData.ts
│   │
│   ├── detail/             # 투자 상세 관련
│   │   ├── useInvestmentDetailHandlers.ts
│   │   ├── useInvestmentDetailUI.ts
│   │   ├── useInvestmentDetailEdit.ts
│   │   └── useInvestmentTabs.ts
│   │
│   ├── add/                # 투자 추가 관련
│   │   ├── useAddInvestmentForm.ts
│   │   ├── useAddInvestmentUI.ts
│   │   ├── useAddInvestmentCalculations.ts
│   │   └── useAddInvestmentSubmit.ts
│   │
│   ├── calculations/       # 계산 로직
│   │   ├── useInvestmentCalculations.ts
│   │   ├── useStatsCalculations.ts
│   │   └── useMonthlyContribution.ts
│   │
│   └── filter/             # 필터링
│       └── useInvestmentFilter.ts
│
├── stock/                   # 주식 검색/선택 관련
│   ├── useStockSearch.ts
│   ├── useStockSearchQuery.ts
│   ├── useStockRate.ts
│   ├── useStockDropdown.ts
│   ├── useManualInput.ts
│   ├── useRateEditor.ts
│   └── useRateUpdate.ts
│
├── payment/                # 납입 관련
│   ├── usePaymentHistory.ts
│   ├── usePaymentCompletion.ts
│   └── usePaymentPagination.ts
│
├── chart/                  # 차트 관련
│   ├── useChartData.ts
│   ├── useChartColors.ts
│   ├── useCompoundChartData.ts
│   └── useAssetGrowthChart.ts
│
├── stats/                  # 통계 관련
│   ├── useStatsData.ts
│   ├── useStatsCalculations.ts
│   ├── useStatsPageUI.ts
│   └── usePeriodFilter.ts
│
├── notification/           # 알림 관련
│   ├── useNotificationSettings.ts
│   ├── useNotificationSettingsData.ts
│   ├── useNotificationToggle.ts
│   ├── useNotificationInbox.ts
│   ├── useGlobalNotification.ts
│   └── useFCMToken.ts
│
├── upcoming/               # 다가오는 투자 관련
│   ├── useUpcomingInvestments.ts
│   ├── useUpcomingInvestmentsFilter.ts
│   └── useUpcomingInvestmentsCompletion.ts
│
├── calendar/               # 캘린더 관련
│   ├── useCalendar.ts
│   └── useCalendarEvents.ts
│
├── ui/                     # UI 상태 관리 (페이지별)
│   ├── useHomePageUI.ts
│   ├── useDashboardUI.ts
│   ├── useSettingsPageUI.ts
│   ├── useInvestmentDetailUI.ts
│   ├── useModalState.ts
│   ├── useToast.ts
│   ├── useScrollHeader.ts
│   └── useDesignSystem.ts
│
├── common/                 # 공통 유틸리티 훅
│   ├── useInvestmentDaysPicker.ts
│   └── useLandingScroll.ts
│
└── types/                  # 타입 정의
    ├── useInvestmentData.ts
    ├── useStockSearch.ts
    ├── useRateUpdate.ts
    ├── useNotificationSettings.ts
    ├── useInvestments.ts
    └── useAddInvestmentForm.ts
```

## 🎯 분류 기준

### 1. **도메인별 분류 (Domain-Driven)**
- 각 비즈니스 도메인별로 폴더 분리
- 관련된 훅들을 함께 그룹화하여 찾기 쉬움

### 2. **책임별 세부 분류**
- `data/`: 데이터 fetching 전용
- `detail/`: 특정 기능의 상세 로직
- `calculations/`: 계산 로직 전용
- `filter/`: 필터링 로직

### 3. **공통 훅 분리**
- `ui/`: 페이지별 UI 상태 관리
- `common/`: 여러 곳에서 사용되는 공통 훅

## 📋 마이그레이션 계획

### Phase 1: 도메인별 폴더 생성
1. 각 도메인 폴더 생성 (auth, investment, stock 등)
2. 파일 이동 및 import 경로 수정

### Phase 2: 세부 분류 적용
1. investment 도메인 내부 세부 폴더 생성
2. 관련 파일들을 적절한 폴더로 이동

### Phase 3: 타입 정리
1. types 폴더는 유지하되, 각 도메인별로 분리 고려
2. 또는 각 도메인 폴더 내부에 types.ts 파일 생성

## ✅ 장점

1. **가독성 향상**: 관련 파일들이 함께 있어 찾기 쉬움
2. **유지보수성 향상**: 특정 도메인 수정 시 해당 폴더만 확인
3. **확장성**: 새로운 도메인 추가 시 새 폴더만 생성
4. **명확한 책임 분리**: 각 폴더의 역할이 명확함

## ⚠️ 주의사항

1. **Import 경로 변경**: 모든 사용처의 import 경로 수정 필요
2. **점진적 마이그레이션**: 한 번에 모든 파일을 이동하지 말고 단계적으로 진행
3. **타입 export**: 각 폴더에서 타입을 적절히 export하여 사용성 유지
