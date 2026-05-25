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
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, CELLS_PER_CARD).map(item => item.id)
}

// Check if any line (row or column) is complete on a 4x3 card
export function checkLine(cellIds, markedIds) {
  const set = new Set(markedIds)
  // Rows
  for (let r = 0; r < 4; r++) {
    const row = cellIds.slice(r * 3, r * 3 + 3)
    if (row.every(id => set.has(id))) return { has: true, type: `fila ${r+1}` }
  }
  // Columns
  for (let c = 0; c < 3; c++) {
    const col = [cellIds[c], cellIds[c+3], cellIds[c+6], cellIds[c+9]]
    if (col.every(id => set.has(id))) return { has: true, type: `columna ${c+1}` }
  }
  return { has: false }
}

// Check if full card is complete
export function checkBingo(cellIds, markedIds) {
  const set = new Set(markedIds)
  if (cellIds.every(id => set.has(id))) return { has: true, type: 'cartón completo' }
  return { has: false }
}

// Combined check (returns 'bingo', 'line', or null)
export function checkStatus(cellIds, markedIds) {
  const b = checkBingo(cellIds, markedIds)
  if (b.has) return { state: 'bingo', type: b.type }
  const l = checkLine(cellIds, markedIds)
  if (l.has) return { state: 'line', type: l.type }
  return { state: null }
}
