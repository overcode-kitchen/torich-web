/**
 * 온보딩 스텝별 문구·이미지 설정 (총 3단계).
 * 이미지: /public/images/onboarding/step1.png ~ step3.png
 * 비율 3:4(가로:세로), 권장 640×853px. public/images/onboarding/README.md 참고.
 *
 * [이미지 제안 의미]
 * step1: 목적 만들기 (결혼자금·내 집 마련 같은 목적부터 시작)
 * step2: 이번 달 체크리스트 (목적별 이번 달 적립 항목을 확인·체크)
 * step3: 목적 진행 현황 (목적에 얼마나 가까워졌는지 확인)
 */
export const ONBOARDING_STEPS = [
  {
    showLogo: true,
    title: '목적을 정하고, 그 목적을 위해 모아요',
    subtitle: '결혼자금·내 집 마련 같은\n모으고 싶은 목적부터 시작해요.',
    imageSrc: '/images/onboarding/step1.png',
    imageAlt: '목적 만들기',
  },
  {
    showLogo: true,
    title: '이번 달 넣을 적립, 한눈에 체크',
    subtitle: '목적마다 매달 넣을 항목을\n체크리스트처럼 확인하고 챙겨요.',
    imageSrc: '/images/onboarding/step2.png',
    imageAlt: '이번 달 체크리스트',
  },
  {
    showLogo: true,
    title: '꾸준함이 쌓이는 게 보여요',
    subtitle: '내가 넣은 돈이 목적에\n얼마나 가까워졌는지 보여줘요.',
    imageSrc: '/images/onboarding/step3.png',
    imageAlt: '목적 진행 현황',
  },
] as const
