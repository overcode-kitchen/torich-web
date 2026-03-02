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

