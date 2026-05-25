import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-center text-brown text-sm max-w-xs leading-relaxed">
          Un juego para vivir la boda con humor.<br/>
          Marca acontecimientos que ocurran durante el día y completa tus cartones.
        </p>
        <Link to="/registro" className="btn-gold w-full max-w-xs text-center mt-4">
          Empezar a jugar
        </Link>
        <Link to="/admin" className="text-xs text-goldDark mt-8 underline">
          Acceso administrador
        </Link>
      </div>
    </div>
  )
}
