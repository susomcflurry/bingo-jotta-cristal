import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Register from './pages/Register.jsx'
import Waiting from './pages/Waiting.jsx'
import GameList from './pages/GameList.jsx'
import GameCards from './pages/GameCards.jsx'
import Admin from './pages/Admin.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/espera" element={<Waiting />} />
      <Route path="/lista" element={<GameList />} />
      <Route path="/cartones" element={<GameCards />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
