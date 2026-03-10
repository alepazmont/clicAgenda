# ClicAgenda - Nueva aplicación multi-instancia (Fase 0)

Proyecto nuevo según **FASE_0_ALCANCE_Y_DEFINICIONES.md** y **DOCUMENTO_MAESTRO_APLICACION_MULTIINSTANCIA.md**.

## Estructura

- **backend/** – Express + MySQL (BBDD maestra + una por instancia), rutas panel e instancia, migraciones.
- **frontend/** – React + Vite: panel general (login superadmin, listado y creación de instancias) e instancia (login, dashboard).

## Requisitos

- Node 18+
- MySQL 8 (maestra y BBDD por instancia)
- Opcional: Redis (colas; en Fase 0 se puede omitir)

## Arranque rápido

1. Tener **MySQL 8** en marcha (local o Docker). El usuario debe poder crear BBDD (o crear a mano la BBDD `citas_master`).
2. Copiar `env.example` a `backend/.env` y ajustar credenciales (`DB_MASTER_*`, `DB_INSTANCE_PREFIX`).
3. **Un solo comando** (crea BBDD maestra, tablas, seeds y BBDD instancia demo):
   ```bash
   npm run setup
   ```
   O por pasos:
   - `npm run install:all`
   - `npm run db:setup`
4. Levantar app: `npm run dev`

- **Backend:** http://localhost:5001  
- **Frontend (panel):** http://localhost:5174  
- **Login panel:** `admin@clicagenda.es` / `changeme`  
- Tras el login verás la instancia **Demo médico**; puedes usar "Entrar" para generar el enlace con token.

## Scripts de BBDD

| Script | Descripción |
|--------|-------------|
| `npm run db:setup` | Crea BBDD maestra, ejecuta migraciones maestra (tablas + superadmin + plan/plantilla/instancia demo), crea BBDD `citas_demo_medico` y migraciones de instancia. |
| `npm run db:create-master` | Solo crea la BBDD maestra si no existe. |
| `npm run migrate:master` | Solo ejecuta migraciones en la BBDD maestra (asume que ya existe). |
| `npm run migrate:instance` | Uso: `cd backend && node migrations/run-migrations.js instance <db_name>`. Al crear una instancia desde el panel se llama internamente. |

## Contenidos mínimos (seeds)

- **Superadmin:** `admin@clicagenda.es` / `changeme`
- **Plan:** Demo (precio 0)
- **Plantilla:** Por defecto (v1.0.0)
- **Instancia:** Demo médico (slug `demo_medico`, BBDD `citas_demo_medico`, dominio `demo_medico.localhost`)

## Subdominios en localhost

Cada instancia puede tener su propio subdominio. En local **sí se puede** usar subdominios:

- **macOS y Windows 10+**: `*.localhost` resuelve a `127.0.0.1` sin configurar nada.
- **Ejemplo:** abrir **http://demo_medico.localhost:5174** (o el puerto de tu frontend). Verás directamente el login de esa instancia (sin elegir slug).
- **Panel:** sigue en **http://localhost:5174**.
- Al crear una instancia desde el panel, se asigna por defecto el dominio `slug.localhost`; el botón "Entrar" abre la instancia en ese subdominio con el token.

Si ya tenías la instancia demo con dominio `localhost`, ejecuta las migraciones maestra para actualizar: `npm run migrate:master` (o `node backend/migrations/run-migrations.js master`).

## Docker

Todo el stack (MySQL + backend + frontend) puede arrancarse en Docker:

```bash
cd nuevaApp
docker-compose up -d
```

- **Panel:** http://localhost:5174 (login: admin@clicagenda.es / changeme)
- **Backend:** http://localhost:5001
- **MySQL:** localhost:3306 (usuario `clicagenda` / contraseña por defecto `clicagenda`)
- **phpMyAdmin:** http://localhost:8080 (usuario `clicagenda` / contraseña `clicagenda`, o root/root). Sirve para revisar la BBDD maestra (`citas_master`) y las BBDD de cada instancia (ej. `citas_demo_medico`). Si quieres otro puerto, define `PMA_PORT` en `.env`.

Al levantar el backend, se ejecutan automáticamente las migraciones (tablas maestra + seeds + BBDD instancia demo). Opcional: copiar `env.docker.example` a `.env` en la raíz para ajustar puertos o contraseñas.

| Comando | Descripción |
|---------|-------------|
| `docker-compose up -d` | Levanta todo el stack |
| `docker-compose up -d mysql` | Solo MySQL (desarrollo con backend/frontend en local) |
| `docker-compose down` | Para y elimina contenedores |
| `docker-compose logs -f backend` | Logs del backend |

## Alcance Fase 0

- Panel: login superadmin, listado de instancias, crear instancia (formulario → crear BBDD → migraciones), botón Entrar (token un solo uso).
- Instancia: resolución por Host, login instancia, dashboard/redirección; una instancia demo (médico) como referencia.
# clicAgenda
