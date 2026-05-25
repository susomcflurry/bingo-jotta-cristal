import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import Header from '../components/Header.jsx'

export default function Waiting() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('pending')
  const userId = localStorage.getItem('userId')

  useEffect(() => {
    if (!userId) return navigate('/')
    const unsub = onSnapshot(doc(db, 'users', userId), snap => {
      if (!snap.exists()) {
        localStorage.removeItem('userId')
        return navigate('/')
      }
      const data = snap.data()
      setStatus(data.status)
      if (data.status === 'approved' && data.cardsCount > 0) {
        navigate('/lista')
      }
    })
    return () => unsub()
  }, [userId, navigate])

  return (
    <div className="min-h-screen flex flex-col">
      <Header subtitle={status === 'pending' ? 'Esperando aprobación' : 'Esperando cartones'} />
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 text-center">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        {status === 'pending' ? (
          <>
            <p className="text-brown font-semibold">Tu registro está pendiente.</p>
            <p className="text-sm text-goldDark max-w-xs">
              Avisa al administrador para que te apruebe. En cuanto lo haga, esta pantalla cambiará sola.
            </p>
          </>
        ) : (
          <>
            <p className="text-brown font-semibold">Ya estás aprobado.</p>
            <p className="text-sm text-goldDark max-w-xs">
              Esperando a que el admin reparta tus cartones...
            </p>
          </>
        )}
        <button onClick={() => { localStorage.clear(); navigate('/') }} className="text-xs text-goldDark underline mt-8">
          Cancelar y salir
        </button>
      </div>
    </div>
  )
}
