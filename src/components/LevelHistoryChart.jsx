// Histórico de nivel — dejado en blanco a propósito por ahora. La lógica de
// series/rango sigue disponible más abajo en el archivo original si se
// necesita reactivar; aquí solo se muestra un placeholder vacío.
export default function LevelHistoryChart({ telemetry: _telemetry }) {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-ink-500">Nivel del tanque</h2>
        </div>
      </div>

      <div className="min-h-0 flex-1 rounded-xl border border-dashed border-ink-200 bg-navy-50/40" />
    </section>
  )
}
