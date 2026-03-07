/**
 * 온보딩 스텝별 문구·이미지 설정 (총 3단계).
 * 이미지: /public/images/onboarding/step1.png ~ step3.png
 * 비율 3:4(가로:세로), 권장 640×853px. public/images/onboarding/README.md 참고.
 *
 * [이미지 제안 의미]
 * step1: 적립식 투자 포지셔닝 (젊은 투자자, 가볍게 시작하는 분위기 + 푸시 알림)
 * step2: 일정·납입 관리 (다가오는 투자일 + 납입 여부를 한 번에 보여주는 화면)
 * step3: 투자 루틴·습관 (월급날/자동이체 등, 꾸준함을 지켜주는 느낌)
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
    imageAlt: '핵심 기능',
  },
  {
    showLogo: true,
    title: '작은 돈도 꾸준히, 흔들리지 않게',
    subtitle: '월급날·자동이체 일정에 맞춰\n내 투자 루틴을 지켜줘요.',
    imageSrc: '/images/onboarding/step3.png',
    imageAlt: '투자 루틴',
  },
] as const
