import { NavLink, useNavigate } from 'react-router-dom'

export default function BottomNav() {
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    navigate('/')
  }

  const linkCls = ({ isActive }) =>
    `flex-1 text-center py-3 text-xs uppercase tracking-widest font-semibold border-t-2 ${
      isActive ? 'border-gold text-gold' : 'border-transparent text-goldDark'
    }`

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-darkBg border-t-2 border-gold flex">
      <NavLink to="/lista" className={linkCls}>Lista</NavLink>
      <NavLink to="/cartones" className={linkCls}>Cartones</NavLink>
      <button onClick={handleLogout} className="flex-1 text-center py-3 text-xs uppercase tracking-widest font-semibold text-gray-400 border-t-2 border-transparent">
        Salir
      </button>
    </nav>
  )
}
