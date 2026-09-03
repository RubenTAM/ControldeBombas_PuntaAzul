import { useState } from 'react'
import { IconLock, IconUsers } from '../icons.jsx'
import puntaAzulLogo from '../assets/puntaazul-logo.png'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onLogin(username, password)
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700 p-5">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-white shadow-pop">
        <div className="flex flex-col items-center bg-navy-950 px-7 py-6 text-white">
          <img
            src={puntaAzulLogo}
            alt="Punta Azul Residencial & Fitness"
            className="h-auto w-full max-w-[255px] object-contain brightness-0 invert drop-shadow-[0_2px_10px_rgba(255,255,255,0.08)]"
          />
          <p className="mt-2 text-sm text-navy-300">Control de bombeo y telemetría</p>
        </div>
        <form onSubmit={submit} className="space-y-4 px-7 py-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-live-600">Acceso al sistema</p>
            <h2 className="mt-1 text-xl font-bold text-navy-900">Iniciar sesión</h2>
          </div>
          <label className="block text-xs font-bold text-ink-500">
            Usuario
            <div className="relative mt-1.5"><IconUsers className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" /><input autoFocus value={username} onChange={(e) => setUsername(e.target.value)} className="h-11 w-full rounded-xl border border-ink-100 pl-10 pr-3 text-sm outline-none focus:border-live-400 focus:ring-2 focus:ring-live-100" autoComplete="username" /></div>
          </label>
          <label className="block text-xs font-bold text-ink-500">
            Contraseña
            <div className="relative mt-1.5"><IconLock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 w-full rounded-xl border border-ink-100 pl-10 pr-3 text-sm outline-none focus:border-live-400 focus:ring-2 focus:ring-live-100" autoComplete="current-password" /></div>
          </label>
          {error && <p className="rounded-xl bg-status-criticalBg px-3 py-2.5 text-xs font-semibold text-status-critical">{error}</p>}
          <button disabled={loading} className="flex h-11 w-full items-center justify-center rounded-xl bg-live-500 text-sm font-bold text-white transition hover:bg-live-600 disabled:opacity-60">{loading ? 'Ingresando…' : 'Entrar'}</button>
        </form>
      </div>
    </main>
  )
}
