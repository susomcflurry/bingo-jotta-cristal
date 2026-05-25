import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from './firebase.js'

export function useItems() {
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const q = query(collection(db, 'items'), orderBy('order', 'asc'))
    const unsub = onSnapshot(q, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoaded(true)
    })
    return () => unsub()
  }, [])
  return { items, loaded }
}
