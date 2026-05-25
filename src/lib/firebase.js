// Firebase config — credenciales del proyecto bingo-jotta-cristal
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBoU0XoYhQDjunLLj-i3SLJyRPBp1RHr7k",
  authDomain: "bingo-jotta-cristal.firebaseapp.com",
  projectId: "bingo-jotta-cristal",
  storageBucket: "bingo-jotta-cristal.firebasestorage.app",
  messagingSenderId: "977998671896",
  appId: "1:977998671896:web:41898798d030b0217fd36d"
}

// ⚠️ CAMBIA ESTOS PINs SI QUIERES
// PIN del administrador — SOLO tú lo conoces
export const ADMIN_PIN = "Gestion2020"

// PIN general para invitados — lo das a todos los que vayan a jugar
export const GUEST_PIN = "JOTTACRISTAL"

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
