# Telemetría PuntaAzul — Dashboard de bombeo

Primera visualización del dashboard de control (Cabo Viejo): diagrama de
bombas + tanque animado, control automático de arranque/paro por nivel,
histórico de nivel y log de alarmas. Todo con datos simulados por ahora —
sin conexión aún al LOGO!/MQTT.

## Correr en local

```bash
npm install
npm run dev
```

Abre lo que indique la terminal (normalmente http://localhost:5173).

El frontend usa `/api` en el mismo dominio. En desarrollo, Vite lo envía a
`http://127.0.0.1:8080`. El servidor requiere `DATABASE_URL`; al arrancar crea
las tablas necesarias y, si aún no existe, el usuario inicial `admin`.

El lienzo se guarda en PostgreSQL y se comparte entre sesiones y equipos. La
copia anterior de `localStorage` se migra automáticamente la primera vez que
el administrador inicia sesión contra una base vacía.

## Estructura

- `src/hooks/useTelemetry.js` — motor de simulación (nivel, bombas, alarmas,
  control automático). Aquí es donde luego se conecta el feed real del LOGO!/MQTT.
- `src/components/` — cada pieza del dashboard (diagrama, panel de control,
  tarjetas de estadísticas, gráfica de histórico, panel de alarmas).
- `src/icons.jsx` — set de iconos propios en SVG.

## Subir a GitHub

```bash
git remote add origin <URL-de-tu-repo>
git branch -M main
git push -u origin main
```
