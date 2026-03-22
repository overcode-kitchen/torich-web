/**
 * 온보딩 스텝별 문구·이미지 설정 (총 3단계).
 * 이미지: /public/images/onboarding/step1.png ~ step3.png
 * 비율 3:4(가로:세로), 권장 640×853px. public/images/onboarding/README.md 참고.
 *
 * [이미지 제안 의미]
 * step1: 홈 대시보드 (다가오는 투자·이번 달 요약 등 앱 첫 화면)
 * step2: 캘린더·납입 일정 (투자일·완료 여부를 한 화면에서 확인)
 * step3: 통계·예상 자산 (장기 복리·예상 수익 차트)
 */
export const ONBOARDING_STEPS = [
  {
    showLogo: true,
    title: '적립식 투자, 토리치로 가볍게 시작',
    subtitle: '매달 넣을 날짜와 금액을 정리해주고,\n까먹지 않게 푸시로 챙겨줘요.',
    imageSrc: '/images/onboarding/step1.png',
    imageAlt: '토리치 소개',
  },
  {
    showLogo: true,
    title: '이번 달 넣을 날, 한 번에 확인',
    subtitle: '다가오는 투자일과 납입 여부를\n캘린더 한 화면에서 확인해요.',
    imageSrc: '/images/onboarding/step2.png',
    imageAlt: '캘린더·납입 일정',
  },
  {
    showLogo: true,
    title: '작은 돈도 꾸준히, 흔들리지 않게',
    subtitle: '월급날·자동이체 일정에 맞춰\n내 투자 루틴을 지켜줘요.',
    imageSrc: '/images/onboarding/step3.png',
    imageAlt: '통계·예상 자산',
  },
] as const
