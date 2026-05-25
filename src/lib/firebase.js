// Firebase config — copia tus credenciales aquí desde la consola de Firebase
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// ⚠️ REEMPLAZA ESTOS VALORES CON LOS DE TU PROYECTO FIREBASE
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "0000000",
  appId: "1:000:web:000"
}

// ⚠️ CAMBIA ESTA CLAVE DE ADMIN — Solo tú deberías conocerla
export const ADMIN_PIN = "BODA2026"

// ⚠️ CAMBIA ESTE PIN GENERAL PARA INVITADOS
export const GUEST_PIN = "JOTTACRISTAL"

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
