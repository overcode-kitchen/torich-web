// 상태바 Safe Area + 앱바 높이 48px
// 가이드라인: top: calc(env(safe-area-inset-top) + 48px)
export const APP_HEADER_SAFE_AREA = 'env(safe-area-inset-top, 0px)'
const APP_HEADER_BAR_HEIGHT = '48px'

// 전체 헤더 높이 (Safe Area + 헤더 바 48px)
export const APP_HEADER_TOTAL_HEIGHT = `calc(${APP_HEADER_SAFE_AREA} + ${APP_HEADER_BAR_HEIGHT})`

// 헤더 자체에 적용할 padding-top (Safe Area만)
export const APP_HEADER_SAFE_AREA_PADDING = APP_HEADER_SAFE_AREA

// 본문 컨텐츠의 padding-top (헤더 전체 높이 + 여유 8px)
export const APP_HEADER_CONTENT_PADDING_TOP = `calc(${APP_HEADER_SAFE_AREA} + ${APP_HEADER_BAR_HEIGHT} + 8px)`

// 스크롤 헤더 관찰용 rootMargin (현재는 사용 안 함, px 전용이므로 사용 시 주의)
export const APP_HEADER_ROOT_MARGIN = `-52px 0px 0px 0px`

// ── 하단 탭바 높이 (BottomNavigation과 본문 padding-bottom 동기화) ──
/** border 아래 ~ 아이콘 줄 위 여백 */
export const APP_BOTTOM_NAV_PADDING_TOP = '8px'

/** 아이콘·라벨 줄 높이 (Tailwind h-12와 동일) */
export const APP_BOTTOM_NAV_ICON_ROW_PX = 48

/**
 * 홈 인디케이터 영역: OS env에서 Npx만 깎음. 작을수록 env 구역이 더 넓어짐.
 * 0이면 env 전부 사용. 라벨·터치 여유를 주려면 4~8 정도.
 */
export const APP_BOTTOM_NAV_SAFE_AREA_TRIM_PX = 4

/** 빨강 구역 높이 = max(0, env(safe-area-inset-bottom) - TRIM) */
export const APP_BOTTOM_NAV_BOTTOM_HEIGHT = `calc(max(0px, env(safe-area-inset-bottom, 0px) - ${APP_BOTTOM_NAV_SAFE_AREA_TRIM_PX}px))`

/** 탭바 전체(상단 + 아이콘줄 + 하단) — 스크롤 본문 padding-bottom과 동일해야 함 (calc 중첩 없이 한 줄) */
export const APP_BOTTOM_NAV_TOTAL_HEIGHT = `calc(${APP_BOTTOM_NAV_PADDING_TOP} + ${APP_BOTTOM_NAV_ICON_ROW_PX}px + max(0px, env(safe-area-inset-bottom, 0px) - ${APP_BOTTOM_NAV_SAFE_AREA_TRIM_PX}px))`

// 하단 탭이 있는 화면의 본문 하단 패딩 (= 고정 탭바 전체 높이)
export const APP_TAB_CONTENT_PADDING_BOTTOM = APP_BOTTOM_NAV_TOTAL_HEIGHT

/** true면 하단 네비 구역별 디버그 색. 운영은 false */
export const DEBUG_VISUALIZE_BOTTOM_NAV_REGIONS = false

// ── 토스트(sonner) 오프셋 ──
/** 토스트와 탭바 사이 간격 */
const APP_TOAST_GAP_PX = 12

/**
 * 하단 토스트가 탭바 위에 뜨도록 하는 offset.
 * = APP_BOTTOM_NAV_TOTAL_HEIGHT + 간격. 탭바가 없는 서브 페이지에서도 같은 높이로 뜬다.
 * (calc 중첩 없이 한 줄 — APP_BOTTOM_NAV_TOTAL_HEIGHT와 동일한 규칙)
 */
export const APP_TOAST_OFFSET_BOTTOM = `calc(${parseInt(APP_BOTTOM_NAV_PADDING_TOP, 10) + APP_BOTTOM_NAV_ICON_ROW_PX + APP_TOAST_GAP_PX}px + max(0px, env(safe-area-inset-bottom, 0px) - ${APP_BOTTOM_NAV_SAFE_AREA_TRIM_PX}px))`

/** 토스트 좌우 여백 (sonner는 이 값으로 폭도 계산한다: 100% - 좌우*2) */
export const APP_TOAST_OFFSET_X = '16px'
