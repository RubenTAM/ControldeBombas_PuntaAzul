import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../lib/api.js'
import { IconTrash, IconUsers } from '../icons.jsx'

const inputClass = 'h-11 w-full rounded-xl border border-ink-100 bg-white px-3.5 text-sm text-ink-900 outline-none focus:border-live-400 focus:ring-2 focus:ring-live-100'

export default function UsersPage({ token, currentUser }) {
  const [data, setData] = useState({ users: [], logins: [] })
  const [form, setForm] = useState({ username: '', password: '', role: 'viewer' })
  const [message, setMessage] = useState('')

  const load = useCallback(() => {
    apiRequest('/api/users', { token }).then(setData).catch((err) => setMessage(err.message))
  }, [token])

  useEffect(load, [load])

  const create = async (event) => {
    event.preventDefault()
    setMessage('')
    try {
      await apiRequest('/api/users', { method: 'POST', token, body: JSON.stringify(form) })
      setForm({ username: '', password: '', role: 'viewer' })
      setMessage('Usuario creado correctamente.')
      load()
    } catch (err) { setMessage(err.message) }
  }

  const remove = async (user) => {
    if (!window.confirm(`¿Eliminar al usuario ${user.username}?`)) return
    try {
      await apiRequest(`/api/users/${user.id}`, { method: 'DELETE', token })
      load()
    } catch (err) { setMessage(err.message) }
  }

  const admins = data.users.filter((user) => user.role === 'admin').length

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-live-600">Administración</p><h2 className="mt-1 text-2xl font-bold text-ink-900">Usuarios</h2><p className="mt-1 text-sm text-ink-400">Administra quién puede consultar o editar el dashboard compartido.</p></div>
        <div className="flex gap-2"><Stat label="Total" value={data.users.length} /><Stat label="Admins" value={admins} /><Stat label="Accesos" value={data.logins.length} /></div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(300px,0.8fr)_minmax(420px,1.2fr)]">
        <form onSubmit={create} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <h3 className="flex items-center gap-2 text-base font-bold text-navy-900"><IconUsers className="h-5 w-5 text-live-600" />Crear usuario</h3>
          <div className="mt-5 space-y-4">
            <Field label="Usuario"><input required minLength="3" className={inputClass} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
            <Field label="Contraseña"><input required minLength="5" type="password" className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
            <Field label="Rol"><select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="viewer">Visualizador</option><option value="admin">Administrador</option></select></Field>
            <button className="h-11 w-full rounded-xl bg-live-500 text-sm font-bold text-white hover:bg-live-600">+ Crear usuario</button>
            {message && <p className="rounded-xl bg-navy-50 px-3 py-2 text-xs text-ink-500">{message}</p>}
          </div>
        </form>

        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <h3 className="text-base font-bold text-navy-900">Usuarios registrados</h3>
          <div className="mt-4 space-y-2">
            {data.users.map((user) => (
              <div key={user.id} className="flex items-center gap-3 rounded-xl border border-ink-100 bg-navy-50/35 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-live-100 text-xs font-bold uppercase text-live-700">{user.username.slice(0, 2)}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-ink-800">{user.username}</p><p className="text-[11px] text-ink-400">Rol: {user.role === 'admin' ? 'administrador' : 'visualizador'} · Creado {formatDate(user.created_at)}</p></div>
                <button disabled={String(user.id) === String(currentUser.id)} onClick={() => remove(user)} type="button" className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-status-critical hover:bg-status-criticalBg disabled:cursor-not-allowed disabled:opacity-30"><IconTrash className="h-3.5 w-3.5" />Eliminar</button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
        <h3 className="text-base font-bold text-navy-900">Historial de accesos</h3>
        <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
          {data.logins.map((login) => <div key={login.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 px-3.5 py-3"><div><p className="text-sm font-bold text-ink-700">{login.username}</p><p className="text-[11px] text-ink-400">IP: {login.ip || '—'}</p></div><time className="text-xs text-ink-400">{formatDate(login.created_at)}</time></div>)}
          {!data.logins.length && <p className="py-8 text-center text-sm text-ink-300">Aún no hay accesos registrados.</p>}
        </div>
      </section>
    </div>
  )
}

function Field({ label, children }) { return <label className="block"><span className="mb-1.5 block text-xs font-bold text-ink-500">{label}</span>{children}</label> }
function Stat({ label, value }) { return <div className="min-w-20 rounded-xl border border-ink-100 bg-white px-4 py-2 shadow-sm"><p className="text-[9px] font-bold uppercase tracking-wide text-ink-400">{label}</p><p className="font-mono text-lg font-bold text-navy-900">{value}</p></div> }
function formatDate(value) { return new Date(value).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) }
