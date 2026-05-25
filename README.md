# 🎴 Bingo Boda · Jotta & Cristal

Webapp de bingo en tiempo real para la boda. Soporta jugadores individuales y en pareja, panel admin, y sincronización entre todos los dispositivos.

## 🚀 Setup completo (10 min)

### 1. Crear proyecto en Firebase (5 min)

1. Entra en https://console.firebase.google.com
2. Pulsa **"Añadir proyecto"** → ponle un nombre (ej. `bingo-jotta-cristal`) → continuar (puedes desactivar Google Analytics)
3. Una vez creado, en el menú izquierdo: **Build → Firestore Database** → "Crear base de datos"
   - Modo: **Iniciar en modo de prueba** (luego lo cambiamos)
   - Ubicación: `eur3 (europe-west)` u otra europea
4. Ve a **Reglas** (pestaña arriba) y pega esto:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
   (Reglas abiertas — perfecto para un evento de un día. Bórralo todo después de la boda.)

5. Ve a **Configuración del proyecto** (icono de engranaje arriba izquierda) → bajar a "Tus apps" → pulsa el icono **`</>`** (web)
6. Pon nombre cualquiera (ej. "Bingo Web") → "Registrar app"
7. Copia el bloque `firebaseConfig` que aparece (apiKey, authDomain, etc.)

### 2. Pegar credenciales en el código

Abre `src/lib/firebase.js` y reemplaza el objeto `firebaseConfig` con el que copiaste. Cambia también:

- `ADMIN_PIN`: tu PIN secreto de administrador (solo tú lo sabes)
- `GUEST_PIN`: el PIN que darás a los invitados

### 3. Probar en local (opcional)

```bash
npm install
npm run dev
```

Abre http://localhost:5173

### 4. Subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/susomcflurry/bingo-jotta-cristal.git
git push -u origin main
```

### 5. Activar GitHub Pages

1. Ve a tu repo en GitHub → **Settings** → **Pages**
2. Source: **GitHub Actions**
3. Espera 2 min: en la pestaña **Actions** verás cómo se construye y despliega
4. ¡Listo! Tu web estará en: `https://susomcflurry.github.io/bingo-jotta-cristal/`

## 📱 Cómo usar el día de la boda

1. **Tú (admin):** entra en la web → "Acceso administrador" → introduce tu PIN → quédate en la pestaña Usuarios
2. **Invitados:** comparte el enlace por WhatsApp + el PIN de invitado
3. Cada uno se registra con su nombre y el PIN → quedan en "pendientes"
4. Tú los apruebas uno a uno desde el panel
5. En la pestaña **Parejas**: marca quién va en pareja seleccionando dos usuarios y pulsando "Emparejar"
6. En la pestaña **Cartones**: elige 1 o 2 cartones por jugador → "Generar y repartir"
7. ¡A jugar! Cada invitado ve en su pantalla la lista general y sus cartones
8. Cualquier marca se sincroniza al instante en todos los dispositivos

## 🔄 Reset

- **Borrar solo marcas:** mantiene parejas y cartones, limpia las marcas
- **Reset total:** borra parejas, cartones, marcas y eventos (los usuarios siguen registrados)

## 🛠️ Estructura

- `src/pages/Landing.jsx` — Pantalla inicio
- `src/pages/Register.jsx` — Registro de invitado
- `src/pages/Waiting.jsx` — Sala de espera (aprobación)
- `src/pages/GameList.jsx` — Lista de 18 acontecimientos
- `src/pages/GameCards.jsx` — Cartones del jugador
- `src/pages/Admin.jsx` — Panel admin
- `src/lib/firebase.js` — Config Firebase + PINs
- `src/lib/items.js` — Los 18 acontecimientos del bingo
- `src/lib/game.js` — Generación de cartones y detección de bingo

## ⚠️ Importante

- El proyecto usa GitHub Pages (URL con `/bingo-jotta-cristal/`). Si renombras el repo, edita la propiedad `base` en `vite.config.js` y `homepage` en `package.json`.
- Las reglas de Firestore son abiertas para simplificar — borra el proyecto Firebase después de la boda.
