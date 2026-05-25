import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, onSnapshot, doc, updateDoc, deleteDoc,
  setDoc, addDoc, getDocs, writeBatch, query, orderBy
} from 'firebase/firestore'
import { db, ADMIN_PIN } from '../lib/firebase.js'
import { BINGO_ITEMS } from '../lib/items.js'
import { generateCard } from '../lib/game.js'
import Header from '../components/Header.jsx'

export default function Admin() {
  const navigate = useNavigate()
  const [auth, setAuth] = useState(localStorage.getItem('adminOk') === '1')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')

  const [users, setUsers] = useState([])
  const [marks, setMarks] = useState({})
  const [events, setEvents] = useState([])
  const [tab, setTab] = useState('users') // users | partners | cards | events
  const [cardsPerPlayer, setCardsPerPlayer] = useState(1)
  const [selectedForPair, setSelectedForPair] = useState([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!auth) return
    const u1 = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'asc')), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    const u2 = onSnapshot(collection(db, 'marks'), snap => {
      const obj = {}; snap.forEach(d => obj[d.id] = d.data()); setMarks(obj)
    })
    const u3 = onSnapshot(query(collection(db, 'events'), orderBy('at', 'desc')), snap => {
      setEvents(snap.docs.slice(0, 100).map(d => ({ id: d.id, ...d.data() })))
    })
    return () => { u1(); u2(); u3() }
  }, [auth])

  function handleLogin(e) {
    e.preventDefault()
    if (pin.toUpperCase() === ADMIN_PIN.toUpperCase()) {
      localStorage.setItem('adminOk', '1')
      setAuth(true)
      setPinError('')
    } else setPinError('PIN incorrecto')
  }

  function logout() {
    localStorage.removeItem('adminOk')
    setAuth(false)
    navigate('/')
  }

  async function approveUser(id) {
    await updateDoc(doc(db, 'users', id), { status: 'approved', role: 'individual' })
  }
  async function rejectUser(id) {
    if (!confirm('¿Eliminar este usuario?')) return
    await deleteDoc(doc(db, 'users', id))
  }
  async function setRole(id, role) {
    await updateDoc(doc(db, 'users', id), { role, partnerId: role === 'individual' ? null : undefined })
  }

  function togglePairSel(uid) {
    setSelectedForPair(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : prev.length < 2 ? [...prev, uid] : prev)
  }
  async function makePair() {
    if (selectedForPair.length !== 2) return
    const [a, b] = selectedForPair
    await updateDoc(doc(db, 'users', a), { role: 'pareja', partnerId: b })
    await updateDoc(doc(db, 'users', b), { role: 'pareja', partnerId: a })
    setSelectedForPair([])
    setMsg('Pareja creada')
    setTimeout(() => setMsg(''), 2000)
  }
  async function breakPair(uid) {
    const u = users.find(x => x.id === uid)
    if (!u) return
    const updates = []
    updates.push(updateDoc(doc(db, 'users', uid), { role: 'individual', partnerId: null }))
    if (u.partnerId) {
      updates.push(updateDoc(doc(db, 'users', u.partnerId), { role: 'individual', partnerId: null }))
    }
    await Promise.all(updates)
  }

  async function generateAllCards() {
    setBusy(true)
    setMsg('Generando cartones...')
    try {
      // Delete previous cards
      const prev = await getDocs(collection(db, 'cards'))
      const batchDel = writeBatch(db)
      prev.forEach(d => batchDel.delete(d.ref))
      await batchDel.commit()

      // Build groups: each pareja counted once, each individual once
      const handled = new Set()
      const groups = [] // { ownerIds: [], label: '' }
      const approved = users.filter(u => u.status === 'approved')
      for (const u of approved) {
        if (handled.has(u.id)) continue
        if (u.role === 'pareja' && u.partnerId) {
          const p = approved.find(x => x.id === u.partnerId)
          if (p) {
            groups.push({ ownerIds: [u.id, p.id], label: `${u.name} & ${p.name}` })
            handled.add(u.id); handled.add(p.id)
            continue
          }
        }
        groups.push({ ownerIds: [u.id], label: u.name })
        handled.add(u.id)
      }

      // Generate cardsPerPlayer cards per group
      const batchAdd = writeBatch(db)
      let seedBase = Math.floor(Math.random() * 1e9)
      let idx = 0
      for (const g of groups) {
        for (let c = 0; c < cardsPerPlayer; c++) {
          const ref = doc(collection(db, 'cards'))
          batchAdd.set(ref, {
            ownerIds: g.ownerIds,
            label: g.label,
            idx,
            cells: generateCard(seedBase + idx * 7919),
            createdAt: Date.now(),
          })
          idx++
        }
        // update cardsCount for users
        for (const uid of g.ownerIds) {
          batchAdd.update(doc(db, 'users', uid), { cardsCount: cardsPerPlayer })
        }
      }
      await batchAdd.commit()
      setMsg(`Generados ${idx} cartones para ${groups.length} jugadores/parejas`)
    } catch (err) {
      setMsg('Error: ' + err.message)
    } finally {
      setBusy(false)
      setTimeout(() => setMsg(''), 4000)
    }
  }

  async function resetGame() {
    if (!confirm('¿Seguro? Se borrarán parejas, cartones, marcas y eventos. Los USUARIOS se mantienen.')) return
    setBusy(true)
    setMsg('Reseteando...')
    try {
      // Delete cards, marks, events
      for (const col of ['cards', 'marks', 'events']) {
        const snap = await getDocs(collection(db, col))
        const batch = writeBatch(db)
        snap.forEach(d => batch.delete(d.ref))
        await batch.commit()
      }
      // Reset users
      const us = await getDocs(collection(db, 'users'))
      const batch = writeBatch(db)
      us.forEach(d => {
        if (d.data().status === 'approved') {
          batch.update(d.ref, { role: 'individual', partnerId: null, cardsCount: 0 })
        }
      })
      await batch.commit()
      setMsg('Reseteado')
    } catch (err) {
      setMsg('Error: ' + err.message)
    } finally {
      setBusy(false)
      setTimeout(() => setMsg(''), 3000)
    }
  }

  async function resetMarksOnly() {
    if (!confirm('¿Borrar solo marcas y eventos (mantener parejas y cartones)?')) return
    setBusy(true)
    try {
      for (const col of ['marks', 'events']) {
        const snap = await getDocs(collection(db, col))
        const batch = writeBatch(db)
        snap.forEach(d => batch.delete(d.ref))
        await batch.commit()
      }
      setMsg('Marcas borradas')
    } finally {
      setBusy(false)
      setTimeout(() => setMsg(''), 2500)
    }
  }

  if (!auth) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header subtitle="Admin" />
        <form onSubmit={handleLogin} className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <input
            type="password"
            placeholder="PIN admin"
            value={pin}
            onChange={e => setPin(e.target.value)}
            className="w-full max-w-xs px-4 py-3 border-2 border-gold rounded-md bg-cream font-sans text-brown text-center text-lg uppercase tracking-widest"
          />
          {pinError && <div className="text-red-700 text-sm">{pinError}</div>}
          <button type="submit" className="btn-gold w-full max-w-xs">Entrar</button>
        </form>
      </div>
    )
  }

  const pending = users.filter(u => u.status === 'pending')
  const approved = users.filter(u => u.status === 'approved')

  return (
    <div className="min-h-screen flex flex-col">
      <Header subtitle="Panel Admin" />

      {/* Tabs */}
      <div className="flex bg-darkBg border-b-2 border-gold">
        {[
          ['users', `Usuarios (${pending.length}/${approved.length})`],
          ['partners', 'Parejas'],
          ['cards', 'Cartones'],
          ['events', 'Eventos'],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 py-2 text-[11px] uppercase tracking-widest font-semibold ${
              tab === k ? 'text-gold border-b-2 border-gold' : 'text-goldDark'
            }`}
          >{label}</button>
        ))}
      </div>

      {msg && <div className="bg-gold text-darkBg text-center text-sm py-2 font-semibold">{msg}</div>}

      <div className="flex-1 p-3 overflow-y-auto pb-24">
        {/* USERS */}
        {tab === 'users' && (
          <>
            <h3 className="text-xs text-goldDark uppercase tracking-widest mb-2">Pendientes ({pending.length})</h3>
            <div className="space-y-2 mb-5">
              {pending.length === 0 && <div className="text-xs text-gray-500">Sin pendientes</div>}
              {pending.map(u => (
                <div key={u.id} className="bg-cream border-2 border-gold/40 rounded p-3 flex items-center justify-between">
                  <span className="text-sm text-brown font-semibold">{u.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => approveUser(u.id)} className="bg-green-700 text-white text-xs px-3 py-1 rounded font-semibold">Aprobar</button>
                    <button onClick={() => rejectUser(u.id)} className="bg-red-700 text-white text-xs px-3 py-1 rounded font-semibold">Rechazar</button>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-xs text-goldDark uppercase tracking-widest mb-2">Aprobados ({approved.length})</h3>
            <div className="space-y-2">
              {approved.map(u => {
                const partner = u.partnerId ? users.find(x => x.id === u.partnerId) : null
                return (
                  <div key={u.id} className="bg-cream border-2 border-gold/40 rounded p-3 flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <div className="text-sm text-brown font-semibold">{u.name}</div>
                      <div className="text-[10px] text-goldDark uppercase tracking-wide">
                        {u.role === 'pareja' && partner ? `Pareja con ${partner.name}` : (u.role || 'individual')}
                        {u.cardsCount > 0 && ` · ${u.cardsCount} cartón${u.cardsCount>1?'es':''}`}
                      </div>
                    </div>
                    <button onClick={() => rejectUser(u.id)} className="text-red-700 text-xs underline">Eliminar</button>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* PARTNERS */}
        {tab === 'partners' && (
          <>
            <p className="text-xs text-goldDark mb-3">Selecciona 2 usuarios para emparejarlos. Toca un usuario emparejado para deshacer.</p>
            <div className="space-y-2 mb-3">
              {approved.map(u => {
                const partner = u.partnerId ? users.find(x => x.id === u.partnerId) : null
                const isSelected = selectedForPair.includes(u.id)
                return (
                  <div key={u.id} className={`p-3 rounded border-2 flex items-center justify-between gap-2 ${
                    partner ? 'bg-cream2 border-gold' : isSelected ? 'bg-yellow-100 border-gold' : 'bg-cream border-gold/40'
                  }`}>
                    <div>
                      <div className="text-sm text-brown font-semibold">{u.name}</div>
                      {partner && <div className="text-[10px] text-goldDark">con {partner.name}</div>}
                    </div>
                    {partner ? (
                      <button onClick={() => breakPair(u.id)} className="text-red-700 text-xs underline">Deshacer</button>
                    ) : (
                      <button onClick={() => togglePairSel(u.id)} className={`text-xs px-3 py-1 rounded font-semibold ${
                        isSelected ? 'bg-gold text-darkBg' : 'border border-gold text-gold'
                      }`}>
                        {isSelected ? 'Quitar' : 'Seleccionar'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            {selectedForPair.length === 2 && (
              <button onClick={makePair} className="btn-gold w-full">Emparejar seleccionados</button>
            )}
          </>
        )}

        {/* CARDS */}
        {tab === 'cards' && (
          <>
            <div className="bg-darkBg rounded-md p-4 mb-3">
              <label className="text-xs text-gold uppercase tracking-widest block mb-2">Cartones por jugador / pareja</label>
              <div className="flex gap-2 mb-3">
                {[1, 2].map(n => (
                  <button key={n} onClick={() => setCardsPerPlayer(n)} className={`flex-1 py-2 rounded text-sm font-semibold ${
                    cardsPerPlayer === n ? 'bg-gold text-darkBg' : 'border border-gold text-gold'
                  }`}>{n}</button>
                ))}
              </div>
              <button onClick={generateAllCards} disabled={busy} className="btn-gold w-full">
                {busy ? 'Generando...' : `Generar y repartir ${cardsPerPlayer} cartón${cardsPerPlayer>1?'es':''}`}
              </button>
              <p className="text-[10px] text-goldDark mt-2 text-center">
                Esto borra los cartones anteriores y crea nuevos.
              </p>
            </div>

            <div className="bg-darkBg rounded-md p-4">
              <h3 className="text-xs text-gold uppercase tracking-widest mb-3">Reseteo</h3>
              <button onClick={resetMarksOnly} disabled={busy} className="btn-outline w-full mb-2">
                Borrar solo marcas
              </button>
              <button onClick={resetGame} disabled={busy} className="w-full bg-red-700 text-white font-semibold uppercase tracking-wider text-sm px-5 py-3 rounded-md">
                Reset total (mantiene usuarios)
              </button>
            </div>
          </>
        )}

        {/* EVENTS */}
        {tab === 'events' && (
          <>
            <h3 className="text-xs text-goldDark uppercase tracking-widest mb-2">Marcas actuales</h3>
            <div className="grid grid-cols-1 gap-1 mb-5">
              {BINGO_ITEMS.map(item => {
                const m = marks[String(item.id)]
                return (
                  <div key={item.id} className={`text-xs p-2 rounded border ${m ? 'bg-cream2 border-gold' : 'bg-cream border-gold/30'}`}>
                    <div className="text-brown">{item.text}</div>
                    {m && <div className="text-[10px] text-goldDark mt-1">✦ marcado por {m.userName}</div>}
                  </div>
                )
              })}
            </div>

            <h3 className="text-xs text-goldDark uppercase tracking-widest mb-2">Log completo</h3>
            <div className="bg-darkBg rounded p-3 text-[11px] space-y-1 max-h-96 overflow-y-auto">
              {events.length === 0 && <div className="text-gray-500 text-center">Sin eventos</div>}
              {events.map(e => {
                const item = BINGO_ITEMS.find(i => i.id === e.itemId)
                return (
                  <div key={e.id} className="text-goldLight">
                    <span className="text-gold">{e.userName}</span>{' '}
                    {e.type === 'mark' ? 'marcó' : 'desmarcó'}{' '}
                    <span className="text-cream">{item?.text}</span>{' '}
                    <span className="text-goldDark">— {new Date(e.at).toLocaleTimeString('es-ES')}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-darkBg border-t-2 border-gold flex">
        <button onClick={() => navigate('/')} className="flex-1 py-3 text-[11px] uppercase tracking-widest text-gold">Inicio</button>
        <button onClick={logout} className="flex-1 py-3 text-[11px] uppercase tracking-widest text-gray-400">Salir</button>
      </div>
    </div>
  )
}
