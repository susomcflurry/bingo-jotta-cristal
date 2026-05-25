import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, onSnapshot, setDoc, deleteDoc, collection, query, where, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { BINGO_ITEMS } from '../lib/items.js'
import { checkStatus, checkLine, checkBingo } from '../lib/game.js'
import Header from '../components/Header.jsx'
import BottomNav from '../components/BottomNav.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'

export default function GameCards() {
  const navigate = useNavigate()
  const userId = localStorage.getItem('userId')
  const userName = localStorage.getItem('userName')
  const isAdmin = localStorage.getItem('adminOk') === '1'
  const [cards, setCards] = useState([])
  const [marks, setMarks] = useState({})
  const [current, setCurrent] = useState(0)
  const [pending, setPending] = useState(null) // { itemId, action: 'mark' | 'unmark' }
  const winnersChecked = useRef(false)

  useEffect(() => {
    if (!userId) return navigate('/')

    const unsubUser = onSnapshot(doc(db, 'users', userId), snap => {
      if (!snap.exists() || snap.data().status !== 'approved') {
        localStorage.clear()
        navigate('/')
      }
    })

    const unsubMarks = onSnapshot(collection(db, 'marks'), snap => {
      const obj = {}
      snap.forEach(d => { obj[d.id] = d.data() })
      setMarks(obj)
    })

    return () => { unsubUser(); unsubMarks() }
  }, [userId, navigate])

  useEffect(() => {
    if (!userId) return
    const q = query(collection(db, 'cards'), where('ownerIds', 'array-contains', userId))
    const unsub = onSnapshot(q, snap => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      arr.sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0))
      setCards(arr)
    })
    return () => unsub()
  }, [userId])

  // Check if user just won first line or first bingo
  async function maybeRegisterWinner() {
    if (cards.length === 0) return

    for (const card of cards) {
      const cellIds = card.cells
      const markedIds = cellIds.filter(id => marks[String(id)])

      const bingo = checkBingo(cellIds, markedIds)
      if (bingo.has) {
        // Try to claim first bingo
        const ref = doc(db, 'winners', 'firstBingo')
        const existing = await getDoc(ref)
        if (!existing.exists()) {
          await setDoc(ref, {
            userId,
            userName,
            cardLabel: card.label || `Cartón ${card.idx + 1}`,
            type: bingo.type,
            at: Date.now(),
          })
        }
      }

      const line = checkLine(cellIds, markedIds)
      if (line.has) {
        // Try to claim first line
        const ref = doc(db, 'winners', 'firstLine')
        const existing = await getDoc(ref)
        if (!existing.exists()) {
          await setDoc(ref, {
            userId,
            userName,
            cardLabel: card.label || `Cartón ${card.idx + 1}`,
            type: line.type,
            at: Date.now(),
          })
        }
      }
    }
  }

  // Run winner check whenever marks change
  useEffect(() => {
    if (Object.keys(marks).length === 0) return
    if (cards.length === 0) return
    maybeRegisterWinner()
  }, [marks, cards])

  function requestToggle(itemId) {
    const id = String(itemId)
    if (marks[id]) {
      if (!isAdmin) return
      setPending({ itemId, action: 'unmark' })
    } else {
      setPending({ itemId, action: 'mark' })
    }
  }

  async function confirmPending() {
    if (!pending) return
    const { itemId, action } = pending
    const id = String(itemId)
    setPending(null)
    if (action === 'unmark') {
      await deleteDoc(doc(db, 'marks', id))
      await setDoc(doc(collection(db, 'events')), {
        type: 'unmark', itemId, userId, userName, at: Date.now(),
      })
    } else {
      await setDoc(doc(db, 'marks', id), {
        itemId, userId, userName, at: Date.now(),
      })
      await setDoc(doc(collection(db, 'events')), {
        type: 'mark', itemId, userId, userName, at: Date.now(),
      })
    }
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen flex flex-col pb-16">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="text-sm text-goldDark">Aún no tienes cartones asignados.</p>
        </div>
        <BottomNav />
      </div>
    )
  }

  const card = cards[current]
  const cellIds = card.cells
  const markedIds = cellIds.filter(id => marks[String(id)])
  const status = checkStatus(cellIds, markedIds)

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <Header num={card.label || (current + 1)} />

      {cards.length > 1 && (
        <div className="flex justify-center gap-2 py-2 bg-darkBg">
          {cards.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setCurrent(i)}
              className={`text-xs px-3 py-1 rounded ${
                i === current ? 'bg-gold text-darkBg' : 'bg-darkBg text-gold border border-gold'
              }`}
            >
              Cartón {i + 1}
            </button>
          ))}
        </div>
      )}

      <div className="p-3 flex-1">
        {status.state === 'bingo' && (
          <div className="bg-gold text-darkBg text-center font-bold tracking-widest uppercase py-2 rounded mb-2 text-sm">
            ¡BINGO! {status.type}
          </div>
        )}
        {status.state === 'line' && (
          <div className="bg-goldLight text-darkBg text-center font-bold tracking-widest uppercase py-2 rounded mb-2 text-sm">
            ¡LÍNEA! {status.type}
          </div>
        )}
        <div className="grid grid-cols-3 gap-[2px] bg-gold p-[2px] rounded">
          {cellIds.map((id, i) => {
            const item = BINGO_ITEMS.find(it => it.id === id)
            const mark = marks[String(id)]
            return (
              <button
                key={i}
                onClick={() => requestToggle(id)}
                className={`min-h-[110px] flex flex-col items-center justify-center text-center p-2 transition relative ${
                  mark ? 'bg-cream2' : 'bg-cream'
                }`}
              >
                <span className="text-[11px] leading-tight text-brown font-medium">
                  {item?.text}
                </span>
                {mark && (
                  <>
                    <span className="absolute top-1 right-1 text-gold text-xs">✦</span>
                    <span className="text-[8px] text-goldDark mt-1 uppercase tracking-wide">{mark.userName}</span>
                  </>
                )}
              </button>
            )
          })}
        </div>

        <div className="text-center text-[10px] text-goldDark mt-3 tracking-widest uppercase">
          {markedIds.length} / {cellIds.length} marcadas
        </div>
      </div>
      <BottomNav />
      <ConfirmModal
        open={!!pending}
        title={pending?.action === 'unmark' ? 'Desmarcar acontecimiento' : 'Marcar acontecimiento'}
        message={
          pending
            ? `¿Seguro que quieres ${pending.action === 'unmark' ? 'desmarcar' : 'marcar'} "${BINGO_ITEMS.find(it => String(it.id) === String(pending.itemId))?.text}"?`
            : ''
        }
        confirmLabel={pending?.action === 'unmark' ? 'Desmarcar' : 'Marcar'}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
