// PuntaAzul API — backend for tank-level history and (soon) LOGO!/MQTT ingest.
//
// Today this only persists readings and serves them back. Next step, when
// the LOGO! is connected, is an MQTT client here that calls
// recordReading() on every message instead of the manual POST endpoint.

import express from 'express'
import cors from 'cors'
import pg from 'pg'

const { Pool } = pg

const PORT = process.env.PORT || 8080
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.warn('[puntaazul-api] DATABASE_URL is not set — did you bind the database component in App Platform?')
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL ? { rejectUnauthorized: false } : false,
})

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nivel_historico (
      id         SERIAL PRIMARY KEY,
      ts         TIMESTAMPTZ NOT NULL DEFAULT now(),
      zona       TEXT NOT NULL DEFAULT 'cabo-viejo',
      nivel_pct  NUMERIC NOT NULL,
      volumen_m3 NUMERIC
    );
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS nivel_historico_ts_idx ON nivel_historico (zona, ts DESC);
  `)
}

async function recordReading({ zona = 'cabo-viejo', nivel_pct, volumen_m3 }) {
  const { rows } = await pool.query(
    `INSERT INTO nivel_historico (zona, nivel_pct, volumen_m3) VALUES ($1, $2, $3)
     RETURNING id, ts, zona, nivel_pct, volumen_m3`,
    [zona, nivel_pct, volumen_m3 ?? null],
  )
  return rows[0]
}

const RANGE_TO_INTERVAL = {
  '6h': '6 hours',
  '24h': '24 hours',
  '7d': '7 days',
}

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'connected' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// GET /api/historicos?zona=cabo-viejo&range=24h
app.get('/api/historicos', async (req, res) => {
  const zona = req.query.zona || 'cabo-viejo'
  const interval = RANGE_TO_INTERVAL[req.query.range] || RANGE_TO_INTERVAL['24h']
  try {
    const { rows } = await pool.query(
      `SELECT id, ts, zona, nivel_pct, volumen_m3
       FROM nivel_historico
       WHERE zona = $1 AND ts >= now() - $2::interval
       ORDER BY ts ASC`,
      [zona, interval],
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/historicos  { zona, nivel_pct, volumen_m3 }
// Manual write for now — the future MQTT bridge calls recordReading() the same way.
app.post('/api/historicos', async (req, res) => {
  const { zona, nivel_pct, volumen_m3 } = req.body ?? {}
  if (typeof nivel_pct !== 'number') {
    return res.status(400).json({ message: 'nivel_pct (number) es requerido' })
  }
  try {
    const row = await recordReading({ zona, nivel_pct, volumen_m3 })
    res.status(201).json(row)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

ensureSchema()
  .then(() => {
    app.listen(PORT, () => console.log(`[puntaazul-api] escuchando en :${PORT}`))
  })
  .catch((err) => {
    console.error('[puntaazul-api] no se pudo preparar la base de datos:', err.message)
    process.exit(1)
  })
