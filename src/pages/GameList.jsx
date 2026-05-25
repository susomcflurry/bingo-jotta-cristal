import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, onSnapshot, setDoc, deleteDoc, collection, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { BINGO_ITEMS } from '../lib/items.js'
import Header from '../components/Header.jsx'
import BottomNav from '../components/BottomNav.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'

export default function GameList() {
  const navigate = useNavigate()
  const userId = localStorage.getItem('userId')
  const userName = localStorage.getItem('userName')
  const isAdmin = localStorage.getItem('adminOk') === '1'
  const [marks, setMarks] = useState({}) // { itemId: { userId, userName, at } }
  const [events, setEvents] = useState([])
  const [pending, setPending] = useState(null) // { itemId, action: 'mark' | 'unmark' }

  useEffect(() => {
    if (!userId) return navigate('/')

    // Verify user still exists & approved
    const unsubUser = onSnapshot(doc(db, 'users', userId), snap => {
      if (!snap.exists() || snap.data().status !== 'approved') {
        localStorage.clear()
        navigate('/')
      }
    })

    // Listen marks
    const unsubMarks = onSnapshot(collection(db, 'marks'), snap => {
      const obj = {}
      snap.forEach(d => { obj[d.id] = d.data() })
      setMarks(obj)
    })

    // Listen events (last 20)
    const unsubEvents = onSnapshot(query(collection(db, 'events'), orderBy('at', 'desc')), snap => {
      setEvents(snap.docs.slice(0, 20).map(d => ({ id: d.id, ...d.data() })))
    })

    return () => { unsubUser(); unsubMarks(); unsubEvents() }
  }, [userId, navigate])

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
        type: 'unmark',
        itemId,
        userId,
        userName,
        at: Date.now(),
      })
    } else {
      await setDoc(doc(db, 'marks', id), {
        itemId,
        userId,
        userName,
        at: Date.now(),
      })
      await setDoc(doc(collection(db, 'events')), {
        type: 'mark',
        itemId,
        userId,
        userName,
        at: Date.now(),
      })
    }
  }

  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000)
    if (s < 60) return `${s}s`
    if (s < 3600) return `${Math.floor(s/60)}min`
    return `${Math.floor(s/3600)}h`
  }

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <Header subtitle={`Hola, ${userName}`} />
      <div className="p-3">
        <div className="text-center text-xs text-goldDark tracking-widest uppercase mb-2">
          Lista de Acontecimientos
        </div>
        <div className="space-y-2">
          {BINGO_ITEMS.map(item => {
            const mark = marks[String(item.id)]
            return (
              <button
                key={item.id}
                onClick={() => requestToggle(item.id)}
                className={`w-full text-left px-3 py-3 rounded-md border-2 transition flex items-center justify-between gap-2 ${
                  mark ? 'bg-cream2 border-gold' : 'bg-cream border-gold/40 hover:border-gold'
                }`}
              >
                <span className="text-sm text-brown leading-tight">{item.text}</span>
                {mark && (
                  <span className="text-[10px] text-goldDark whitespace-nowrap font-semibold">
                    ✦ {mark.userName}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Event log */}
        <div className="mt-6 bg-darkBg rounded-md p-3">
          <div className="text-xs text-gold tracking-widest uppercase mb-2 text-center">
            Últimos eventos
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {events.length === 0 && (
              <div className="text-xs text-gray-500 text-center py-2">Aún no hay eventos</div>
            )}
            {events.map(e => {
              const item = BINGO_ITEMS.find(i => i.id === e.itemId)
              return (
                <div key={e.id} className="text-[11px] text-goldLight flex justify-between gap-2">
                  <span>
                    <span className="text-gold">{e.userName}</span>{' '}
                    {e.type === 'mark' ? 'marcó' : 'desmarcó'}{' '}
                    <span className="text-cream">{item?.text}</span>
                  </span>
                  <span className="text-goldDark whitespace-nowrap">{timeAgo(e.at)}</span>
                </div>
              )
            })}
          </div>
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
