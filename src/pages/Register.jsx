import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, GUEST_PIN } from '../lib/firebase.js'
import Header from '../components/Header.jsx'

export default function Register() {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Pon tu nombre')
    if (pin.toUpperCase() !== GUEST_PIN.toUpperCase()) return setError('PIN incorrecto')
    setBusy(true)
    try {
      const ref = await addDoc(collection(db, 'users'), {
        name: name.trim(),
        status: 'pending',
        role: null,
        partnerId: null,
        cardsCount: 0,
        createdAt: serverTimestamp(),
      })
      localStorage.setItem('userId', ref.id)
      localStorage.setItem('userName', name.trim())
      navigate('/espera')
    } catch (err) {
      setError('Error: ' + err.message)
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header subtitle="Registro" />
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
        <input
          type="text"
          placeholder="Tu nombre"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full max-w-xs px-4 py-3 border-2 border-gold rounded-md bg-cream font-sans text-brown text-center text-lg"
        />
        <input
          type="text"
          placeholder="PIN de invitado"
          value={pin}
          onChange={e => setPin(e.target.value)}
          className="w-full max-w-xs px-4 py-3 border-2 border-gold rounded-md bg-cream font-sans text-brown text-center text-lg uppercase tracking-widest"
        />
        {error && <div className="text-red-700 text-sm">{error}</div>}
        <button type="submit" disabled={busy} className="btn-gold w-full max-w-xs">
          {busy ? 'Enviando...' : 'Enviar registro'}
        </button>
        <p className="text-xs text-goldDark text-center mt-2 max-w-xs">
          Tras enviarlo, espera a que el administrador te apruebe.
        </p>
      </form>
    </div>
  )
}
