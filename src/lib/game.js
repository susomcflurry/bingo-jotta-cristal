import { BINGO_ITEMS, CELLS_PER_CARD } from './items'

// Seeded random for reproducible cards
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = seed
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

export function generateCard(seed) {
  const rng = mulberry32(seed)
  const pool = [...BINGO_ITEMS]
  // Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, CELLS_PER_CARD).map(item => item.id)
}

export function checkBingo(cellIds, markedIds) {
  // 4 rows x 3 cols. Bingo = full row or full column or full card
  const set = new Set(markedIds)
  const all = cellIds.every(id => set.has(id))
  if (all) return { won: true, type: 'cartón completo' }
  // Rows
  for (let r = 0; r < 4; r++) {
    const row = cellIds.slice(r * 3, r * 3 + 3)
    if (row.every(id => set.has(id))) return { won: true, type: `línea fila ${r+1}` }
  }
  // Columns
  for (let c = 0; c < 3; c++) {
    const col = [cellIds[c], cellIds[c+3], cellIds[c+6], cellIds[c+9]]
    if (col.every(id => set.has(id))) return { won: true, type: `línea columna ${c+1}` }
  }
  return { won: false }
}
