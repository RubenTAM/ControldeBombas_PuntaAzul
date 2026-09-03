// PuntaAzul API — backend for tank-level history and (soon) LOGO!/MQTT ingest.
//
// Today this only persists readings and serves them back. Next step, when
// the LOGO! is connected, is an MQTT client here that calls
// recordReading() on every message instead of the manual POST endpoint.

import express from 'express'
import cors from 'cors'
import pg from 'pg'
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const { Pool } = pg

const PORT = process.env.PORT || 8080
const DATABASE_URL = process.env.DATABASE_URL
const SESSION_DAYS = 30

if (!DATABASE_URL) {
  console.warn('[puntaazul-api] DATABASE_URL is not set — did you bind the database component in App Platform?')
}

// DigitalOcean's managed Postgres presents a cert from its own CA, which
// Node doesn't trust by default. Its connection string ships with
// "?sslmode=require", and letting pg parse that itself upgrades
// verification to a full CA check that then fails with "self-signed
// certificate in certificate chain". Strip that query param and set TLS
// behavior ourselves instead, so there's only one source of truth for it.
function poolConfig(url) {
  if (!url) return { ssl: false }
  const connectionString = url.replace(/([?&])sslmode=[^&]*&?/i, '$1').replace(/[?&]$/, '')
  return { connectionString, ssl: { rejectUnauthorized: false } }
}

const pool = new Pool(poolConfig(DATABASE_URL))

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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id            BIGSERIAL PRIMARY KEY,
      username      TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS usuarios_username_lower_idx ON usuarios (lower(username));

    CREATE TABLE IF NOT EXISTS sesiones (
      token_hash TEXT PRIMARY KEY,
      user_id    BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS historial_accesos (
      id         BIGSERIAL PRIMARY KEY,
      user_id    BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
      username   TEXT NOT NULL,
      ip         TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS dashboard_estado (
      id         TEXT PRIMARY KEY,
      widgets    JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_by BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)

  const { salt, hash } = passwordRecord('12345')
  const seeded = await pool.query(
    `INSERT INTO usuarios (username, password_hash, password_salt, role)
     VALUES ('admin', $1, $2, 'admin') ON CONFLICT DO NOTHING RETURNING id`,
    [hash, salt],
  )
  if (seeded.rowCount) console.log('[puntaazul-api] usuario inicial admin creado')
}

function passwordRecord(password) {
  const salt = randomBytes(16).toString('hex')
  return { salt, hash: scryptSync(password, salt, 64).toString('hex') }
}

function passwordMatches(password, salt, expectedHex) {
  const actual = scryptSync(password, salt, 64)
  const expected = Buffer.from(expectedHex, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

const hashToken = (token) => createHash('sha256').update(token).digest('hex')

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

async function authenticate(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return res.status(401).json({ message: 'Inicia sesión para continuar.' })
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.role
       FROM sesiones s JOIN usuarios u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now()`,
      [hashToken(token)],
    )
    if (!rows[0]) return res.status(401).json({ message: 'La sesión venció. Inicia sesión nuevamente.' })
    req.user = rows[0]
    next()
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Se requiere acceso de administrador.' })
  next()
}

// App Platform's readiness/liveness checks hit "/" by default.
app.get('/', (_req, res) => res.json({ service: 'puntaazul-api', status: 'ok' }))

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'connected' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const username = String(req.body?.username || '').trim()
  const password = String(req.body?.password || '')
  if (!username || !password) return res.status(400).json({ message: 'Usuario y contraseña son requeridos.' })
  try {
    const { rows } = await pool.query(`SELECT * FROM usuarios WHERE lower(username) = lower($1) LIMIT 1`, [username])
    const user = rows[0]
    if (!user || !passwordMatches(password, user.password_salt, user.password_hash)) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' })
    }
    const token = randomBytes(32).toString('hex')
    await pool.query(
      `INSERT INTO sesiones (token_hash, user_id, expires_at) VALUES ($1, $2, now() + make_interval(days => $3))`,
      [hashToken(token), user.id, SESSION_DAYS],
    )
    await pool.query(`INSERT INTO historial_accesos (user_id, username, ip) VALUES ($1, $2, $3)`, [user.id, user.username, req.ip])
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

app.get('/api/auth/me', authenticate, (req, res) => res.json({ user: req.user }))

app.post('/api/auth/logout', authenticate, async (req, res) => {
  const token = req.headers.authorization.match(/^Bearer\s+(.+)$/i)[1]
  await pool.query(`DELETE FROM sesiones WHERE token_hash = $1`, [hashToken(token)])
  res.status(204).end()
})

app.get('/api/dashboard', authenticate, async (_req, res) => {
  try {
    const { rows } = await pool.query(`SELECT widgets, updated_at FROM dashboard_estado WHERE id = 'principal'`)
    res.json(rows[0] || { widgets: [], updated_at: null })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

app.put('/api/dashboard', authenticate, adminOnly, async (req, res) => {
  if (!Array.isArray(req.body?.widgets)) return res.status(400).json({ message: 'widgets debe ser un arreglo.' })
  try {
    const { rows } = await pool.query(
      `INSERT INTO dashboard_estado (id, widgets, updated_by, updated_at)
       VALUES ('principal', $1::jsonb, $2, now())
       ON CONFLICT (id) DO UPDATE SET widgets = EXCLUDED.widgets, updated_by = EXCLUDED.updated_by, updated_at = now()
       RETURNING updated_at`,
      [JSON.stringify(req.body.widgets), req.user.id],
    )
    res.json({ ok: true, updatedAt: rows[0].updated_at })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

app.get('/api/users', authenticate, adminOnly, async (_req, res) => {
  try {
    const [users, logins] = await Promise.all([
      pool.query(`SELECT id, username, role, created_at FROM usuarios ORDER BY created_at ASC`),
      pool.query(`SELECT id, username, ip, created_at FROM historial_accesos ORDER BY created_at DESC LIMIT 100`),
    ])
    res.json({ users: users.rows, logins: logins.rows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

app.post('/api/users', authenticate, adminOnly, async (req, res) => {
  const username = String(req.body?.username || '').trim()
  const password = String(req.body?.password || '')
  const role = req.body?.role === 'admin' ? 'admin' : 'viewer'
  if (username.length < 3) return res.status(400).json({ message: 'El usuario debe tener al menos 3 caracteres.' })
  if (password.length < 5) return res.status(400).json({ message: 'La contraseña debe tener al menos 5 caracteres.' })
  const { salt, hash } = passwordRecord(password)
  try {
    const { rows } = await pool.query(
      `INSERT INTO usuarios (username, password_hash, password_salt, role) VALUES ($1, $2, $3, $4)
       RETURNING id, username, role, created_at`,
      [username, hash, salt, role],
    )
    res.status(201).json(rows[0])
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Ese nombre de usuario ya existe.' })
    res.status(500).json({ message: err.message })
  }
})

app.delete('/api/users/:id', authenticate, adminOnly, async (req, res) => {
  if (String(req.user.id) === String(req.params.id)) return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta.' })
  try {
    const result = await pool.query(`DELETE FROM usuarios WHERE id = $1`, [req.params.id])
    if (!result.rowCount) return res.status(404).json({ message: 'Usuario no encontrado.' })
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ message: err.message })
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
