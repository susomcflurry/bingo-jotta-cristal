import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, onSnapshot, setDoc, deleteDoc, collection, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { BINGO_ITEMS } from '../lib/items.js'
import { checkBingo } from '../lib/game.js'
import Header from '../components/Header.jsx'
import BottomNav from '../components/BottomNav.jsx'

export default function GameCards() {
  const navigate = useNavigate()
  const userId = localStorage.getItem('userId')
  const userName = localStorage.getItem('userName')
  const [cards, setCards] = useState([])
  const [marks, setMarks] = useState({})
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!userId) return navigate('/')

    // listen to user (to detect role/partner)
    const unsubUser = onSnapshot(doc(db, 'users', userId), snap => {
      if (!snap.exists() || snap.data().status !== 'approved') {
        localStorage.clear()
        navigate('/')
      }
    })

    // listen all marks
    const unsubMarks = onSnapshot(collection(db, 'marks'), snap => {
      const obj = {}
      snap.forEach(d => { obj[d.id] = d.data() })
      setMarks(obj)
    })

    return () => { unsubUser(); unsubMarks() }
  }, [userId, navigate])

  useEffect(() => {
    if (!userId) return
    // load cards belonging to user OR to partner (shared)
    const q = query(collection(db, 'cards'), where('ownerIds', 'array-contains', userId))
    const unsub = onSnapshot(q, snap => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      arr.sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0))
      setCards(arr)
    })
    return () => unsub()
  }, [userId])

  async function toggle(itemId) {
    const id = String(itemId)
    if (marks[id]) {
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
  const bingoState = checkBingo(cellIds, markedIds)

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <Header num={card.label || (current + 1)} />

      {/* Card switcher */}
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
        {bingoState.won && (
          <div className="bg-gold text-darkBg text-center font-bold tracking-widest uppercase py-2 rounded mb-2 text-sm">
            ¡BINGO! {bingoState.type}
          </div>
        )}
        <div className="grid grid-cols-3 gap-[2px] bg-gold p-[2px] rounded">
          {cellIds.map((id, i) => {
            const item = BINGO_ITEMS.find(it => it.id === id)
            const mark = marks[String(id)]
            return (
              <button
                key={i}
                onClick={() => toggle(id)}
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
    </div>
  )
}
