import { useEffect, useState } from 'react'
import { IconCheck, IconPencil, IconX } from '../../icons.jsx'

const inputClass = 'h-10 w-full rounded-xl border border-ink-100 bg-white px-3 text-sm text-ink-800 outline-none transition focus:border-live-400 focus:ring-2 focus:ring-live-100'

const TYPE_COPY = {
  tank: ['Tag de nivel', 'Lectura numérica de nivel (0–100). Ej. planta/tanque_1/nivel'],
  levelbar: ['Tag de nivel', 'Lectura numérica de nivel (0–100).'],
  pump: ['Tag de estado', 'Lectura del PLC: running/true/1 para indicar bomba en marcha.'],
  modeselect: ['Tag de modo', 'Lectura del PLC: AUTO o MANUAL.'],
  setpoint: ['Tag de escritura', 'Al mover el setpoint se publicará el nuevo valor en este topic.'],
}

export default function TagConfigModal({ widget, widgets, onSave, onClose }) {
  const [draft, setDraft] = useState(widget.config || {})
  const tanks = widgets.filter((item) => item.type === 'tank')
  const isHistory = widget.type === 'levelhistory' || widget.type === 'history-table'
  const copy = TYPE_COPY[widget.type]

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }))
  const submit = (event) => {
    event.preventDefault()
    onSave(draft)
    onClose()
  }

  const tagKey = widget.type === 'pump' ? 'runningTag'
    : widget.type === 'modeselect' ? 'modeTag'
      : widget.type === 'setpoint' ? 'writeTag'
        : 'readTag'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/35 p-4 backdrop-blur-[2px]" onMouseDown={onClose}>
      <form onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-2xl border border-white/70 bg-white shadow-pop">
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-live-100 text-live-600"><IconPencil className="h-4 w-4" /></span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-live-600">Fuente de datos</p>
              <h3 className="truncate text-base font-bold text-navy-900">Configurar {widget.label}</h3>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-300 hover:bg-navy-50 hover:text-ink-600" aria-label="Cerrar"><IconX className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4 px-5 py-5">
          {widget.type === 'tank' && (
            <Field label="Nombre del tanque">
              <input className={inputClass} value={draft.label || ''} onChange={(event) => update('label', event.target.value)} placeholder="Tanque principal" autoFocus />
            </Field>
          )}

          {(widget.type === 'pump' || widget.type === 'modeselect') && (
            <Field label="Equipo">
              <select className={inputClass} value={draft.pumpId || 'p1'} onChange={(event) => update('pumpId', event.target.value)} autoFocus>
                <option value="p1">Bomba 1</option>
                <option value="p2">Bomba 2</option>
              </select>
            </Field>
          )}

          {widget.type === 'setpoint' && (
            <Field label="Función del setpoint">
              <select className={inputClass} value={draft.key || 'start'} onChange={(event) => update('key', event.target.value)} autoFocus>
                <option value="start">Nivel bajo (arranque)</option>
                <option value="stop">Nivel alto (paro)</option>
              </select>
            </Field>
          )}

          {isHistory ? (
            <Field label="Tanque asociado" hint="Usará la misma tag de nivel configurada en ese tanque.">
              <select className={inputClass} value={draft.sourceTankId || ''} onChange={(event) => update('sourceTankId', event.target.value)} autoFocus>
                <option value="">Telemetría general (demo)</option>
                {tanks.map((tank, index) => (
                  <option key={tank.id} value={tank.id}>{tank.config?.label || `Tanque ${index + 1}`}{tank.config?.readTag ? ` · ${tank.config.readTag}` : ' · sin tag'}</option>
                ))}
              </select>
            </Field>
          ) : copy ? (
            <Field label={copy[0]} hint={copy[1]}>
              <input className={`${inputClass} font-mono`} value={draft[tagKey] || ''} onChange={(event) => update(tagKey, event.target.value)} placeholder="planta/equipo/variable" autoFocus={widget.type === 'levelbar'} spellCheck="false" />
            </Field>
          ) : null}

          <div className="rounded-xl bg-navy-50 px-3.5 py-3 text-xs leading-5 text-ink-500">
            {isHistory
              ? 'El histórico seguirá automáticamente la tag del tanque. Si luego cambias la tag del tanque, no tendrás que reconfigurar esta gráfica o tabla.'
              : 'La asignación se guarda con el lienzo. Al conectar el broker MQTT, el dashboard se suscribe automáticamente a esta tag.'}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-ink-100 bg-navy-50/50 px-5 py-3.5">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-ink-500 hover:bg-white">Cancelar</button>
          <button type="submit" className="flex items-center gap-2 rounded-xl bg-navy-600 px-4 py-2 text-sm font-bold text-white hover:bg-navy-700"><IconCheck className="h-4 w-4" />Guardar</button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-ink-600">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[11px] leading-4 text-ink-400">{hint}</span>}
    </label>
  )
}
