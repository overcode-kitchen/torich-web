/**
 * 월별 적립 차트(MonthlyTrendSection)의 통나무 막대 리소스 정의.
 *
 * 부품을 아래에서부터 세로로 쌓아 긴 통나무를 만들고, rate(%) 높이에서 윗부분을 잘라
 * 정확한 수치를 표현한다. 이미지를 '늘리지' 않고 '잘라 보여서' 나뭇결이 망가지지 않는다.
 *
 * 리소스를 교체할 때는 파일과 아래 `canvas`·`coreWidth` 실측값을 **함께** 갱신한다.
 * 두 값은 아트워크의 비율만 나타내므로, 파일 해상도를 바꿔도(예: 2배 선명하게)
 * 비율이 같다면 수정할 필요가 없다.
 *
 * 칸 사이 마디(이음매)는 없애지 않는다 — 이 그래픽은 통나무 '스택'이고 마디가 그 언어다.
 * 겹쳐 덮어 지우려 하면 부품 윗면의 둥근 절단면이 드러나 오히려 단차로 커진다.
 * 반복감은 마디가 아니라 '같은 무늬가 같은 자리에 또 나오는 것'이므로 배치로 푼다.
 */

/** 부품 아트워크 실측값 — 캔버스 크기와 몸통(기둥) 폭. 단위는 원본 px. */
const WOOD_ARTWORK = {
  /** 부품 한 칸의 캔버스 크기. 몸통 좌우로 가지·옹이가 튀어나올 투명 여백이 있다. */
  canvas: { width: 541, height: 398 },
  /** 몸통(기둥) 폭. 캔버스 중앙에 있으며, 이 부분이 막대 폭과 일치하게 렌더된다. */
  coreWidth: 317,
} as const

/** 캔버스 종횡비(H/W) — 부품 한 칸의 높이를 구할 때 쓴다. */
export const WOOD_CANVAS_AR = WOOD_ARTWORK.canvas.height / WOOD_ARTWORK.canvas.width

/** 몸통 폭 ÷ 캔버스 폭 — 몸통을 막대 폭에 맞추고 가지는 밖으로 넘치게 하는 배율. */
export const WOOD_CORE_FRAC = WOOD_ARTWORK.coreWidth / WOOD_ARTWORK.canvas.width

const WOOD_BASE = '/icons/3d/wood'

/**
 * 부품 파일 목록.
 * `body`는 무늬가 없어 바닥과 잘리는 윗면에 쓰고, 나머지는 중간 칸을 꾸민다.
 * 파일명에 공백을 쓰지 않는다 — URL 인코딩(`%20`)을 코드에 박게 되기 때문이다.
 */
const WOOD_MODULES = {
  body: `${WOOD_BASE}/wooden-pole-01.webp`, // 민무늬
  crack: `${WOOD_BASE}/wooden-pole-02.webp`, // 결/갈라짐
  knot: `${WOOD_BASE}/wooden-pole-03.webp`, // 옹이
  branch: `${WOOD_BASE}/wooden-pole-04.webp`, // 가지+옹이
} as const

/** 몸통만 있어 어디에나 놓을 수 있는 부품 — 바닥과 잘리는 윗면 전용. */
export const WOOD_PLAIN = WOOD_MODULES.body

/**
 * 몸통 밖으로 형태가 튀어나오는 부품 — 중간 칸을 꾸미는 데 쓴다.
 * 반전해서 쓰지 않는다. 광원과 나뭇결 방향이 그려진 대로 고정이라 뒤집으면 어긋난다.
 */
export const WOOD_DECORATED = [
  WOOD_MODULES.branch,
  WOOD_MODULES.knot,
  WOOD_MODULES.crack,
] as const
