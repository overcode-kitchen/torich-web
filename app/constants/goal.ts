export interface PurposeIcon {
  key: string
  src: string
  label: string
  /** 구버전 데이터에 저장된 이모지 → 같은 아이콘으로 매핑하기 위한 별칭 */
  emojiAliases: string[]
}

export const PURPOSE_ICONS: PurposeIcon[] = [
  {
    key: 'ring',
    src: '/icons/3d/purpose/ring.png',
    label: '결혼',
    emojiAliases: ['💍'],
  },
  {
    key: 'house',
    src: '/icons/3d/purpose/house.png',
    label: '주택',
    emojiAliases: ['🏠', '🏡'],
  },
  {
    key: 'airplane',
    src: '/icons/3d/purpose/airplane.png',
    label: '여행',
    emojiAliases: ['✈️', '✈'],
  },
  {
    key: 'car',
    src: '/icons/3d/purpose/car.png',
    label: '차',
    emojiAliases: ['🚗', '🚙'],
  },
  {
    key: 'box',
    src: '/icons/3d/purpose/box.png',
    label: '이사',
    emojiAliases: ['📦'],
  },
  {
    key: 'siren',
    src: '/icons/3d/purpose/siren.png',
    label: '비상금',
    emojiAliases: ['🚨'],
  },
  {
    key: 'money-bag',
    src: '/icons/3d/purpose/money-bag.png',
    label: '자금',
    emojiAliases: ['💰', '💵', '💴'],
  },
]

const PURPOSE_ICON_BY_KEY: Record<string, PurposeIcon> = Object.fromEntries(
  PURPOSE_ICONS.map((icon) => [icon.key, icon]),
)

const PURPOSE_ICON_BY_EMOJI: Record<string, PurposeIcon> = Object.fromEntries(
  PURPOSE_ICONS.flatMap((icon) =>
    icon.emojiAliases.map((emoji) => [emoji, icon] as const),
  ),
)

/**
 * goals.emoji 값(아이콘 키 또는 구버전 이모지)을 받아 3D 아이콘 메타데이터를 돌려준다.
 * 매칭되는 게 없으면 null.
 */
export function resolvePurposeIcon(value: string | null | undefined): PurposeIcon | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return PURPOSE_ICON_BY_KEY[trimmed] ?? PURPOSE_ICON_BY_EMOJI[trimmed] ?? null
}

export interface GoalPreset {
  name: string
  /** goals.emoji 컬럼에 그대로 저장되는 3D 아이콘 키 */
  iconKey: string
}

export const GOAL_PRESETS: GoalPreset[] = [
  { name: '결혼 자금', iconKey: 'ring' },
  { name: '주택 자금', iconKey: 'house' },
  { name: '여행', iconKey: 'airplane' },
  { name: '차', iconKey: 'car' },
  { name: '이사', iconKey: 'box' },
]

export const GOAL_PRESET_NAMES: string[] = GOAL_PRESETS.map((p) => p.name)
