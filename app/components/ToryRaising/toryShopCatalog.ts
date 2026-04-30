import type { ToryShopItem } from './ToryRaisingStoreSection'

export const TORY_SHOP_CATALOG: ToryShopItem[] = [
  // hats (5)
  { id: 'silk_hat', category: 'hat', emoji: '🎩', name: '실크햇', price: 200 },
  { id: 'baseball_cap', category: 'hat', emoji: '🧢', name: '야구모', price: 80 },
  { id: 'beanie', category: 'hat', emoji: '🧶', name: '비니', price: 50 },
  { id: 'crown_hat', category: 'hat', emoji: '👑', name: '왕관', price: 500, minLevel: 0 },
  { id: 'beret_hat', category: 'hat', emoji: '🎨', name: '베레모', price: 250 },

  // glasses (5)
  { id: 'round_glasses', category: 'glasses', emoji: '👓', name: '동그란 안경', price: 100 },
  { id: 'sunglasses', category: 'glasses', emoji: '🕶️', name: '선글라스', price: 150 },
  { id: 'monocle', category: 'glasses', emoji: '🥸', name: '모노클', price: 250 },
  { id: 'square_glasses', category: 'glasses', emoji: '📐', name: '스퀘어 안경', price: 120 },
  { id: 'tiny_glasses', category: 'glasses', emoji: '🔍', name: '작은 돋보기', price: 80 },

  // outfits (5)
  { id: 'hoodie', category: 'outfit', emoji: '🧥', name: '후드티', price: 200 },
  { id: 'suit', category: 'outfit', emoji: '👔', name: '정장', price: 400 },
  { id: 'kimono', category: 'outfit', emoji: '👘', name: '한복', price: 350 },
  { id: 'do_bok', category: 'outfit', emoji: '🥋', name: '도복', price: 300 },
  { id: 'space_suit', category: 'outfit', emoji: '🚀', name: '우주복', price: 600 },

  // backgrounds (4) - MVP 포함
  { id: 'office_bg', category: 'background', emoji: '🏢', name: '사무실', price: 300 },
  { id: 'beach_bg', category: 'background', emoji: '🌊', name: '해변', price: 600 },
  { id: 'library_bg', category: 'background', emoji: '📚', name: '도서관', price: 900 },
  { id: 'cafe_bg', category: 'background', emoji: '☕', name: '카페', price: 1200 },
]

