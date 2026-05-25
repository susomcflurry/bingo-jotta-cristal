import { BINGO_ITEMS, CELLS_PER_CARD } from './items'

const COLS = 3

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

export function generateCard(seed, cellCount = CELLS_PER_CARD) {
  const rng = mulberry32(seed)
  const pool = [...BINGO_ITEMS]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, cellCount).map(item => item.id)
}

// Check if any line (row or column) is complete. Layout: 3 columns, rows derived from length.
export function checkLine(cellIds, markedIds) {
  const set = new Set(markedIds)
  const rows = Math.floor(cellIds.length / COLS)
  for (let r = 0; r < rows; r++) {
    const row = cellIds.slice(r * COLS, r * COLS + COLS)
    if (row.every(id => set.has(id))) return { has: true, type: `fila ${r+1}` }
  }
  for (let c = 0; c < COLS; c++) {
    const col = []
    for (let r = 0; r < rows; r++) col.push(cellIds[r * COLS + c])
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
