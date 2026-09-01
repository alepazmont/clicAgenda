# ClicAgenda

SaaS multi-centro de **gestión de citas** para sectores médicos, estéticos y negocios que viven de la agenda. Proyecto en desarrollo (portfolio).

**Demo:** https://clicagenda.vercel.app

## Qué hace

- **Panel superadmin:** alta de centros, listado de instancias y acceso a cada una.
- **App de clínica:** citas (lista y calendario), pacientes, servicios/bonos, tratamientos, configuración y portales.
- **Multi-sector:** el catálogo y el día a día se adaptan al sector (fisio, psicología, dental, estética…).
- **Aislamiento:** datos separados por `instance_id` (PostgreSQL + RLS).

## Demo incluida

| Slug | Sector |
|------|--------|
| `demo_fisioterapia` | FisioSalud |
| `demo_psicologia` | Centro Psicológico Equilibrio |
| `demo_dental` | Clínica Dental Sonrisa |

| Rol | Email | Contraseña |
|-----|-------|------------|
| Panel | `admin@clicagenda.es` | `changeme` |
| Clínica | `admin@demo.es` | `changeme` |

## Stack

| Capa | Tecnología |
|------|------------|
| API | Express (serverless en Vercel) |
| Base de datos | PostgreSQL (Neon), RLS por tenant |
| Front | React · Vite · MUI |
| Deploy | Vercel |

## Estructura

```
clicagenda/
├── api/              # Entry serverless Vercel
├── backend/          # Express, migraciones, rutas panel/instance
├── frontend/         # SPA React
├── scripts/          # Utilidades de deploy
├── env.example       # Plantilla de variables
└── vercel.json
```

## Local

1. Proyecto en [Neon](https://neon.tech) → copiar `DATABASE_URL`.
2. `cp env.example backend/.env` y pegar la connection string.
3. Instalar y arrancar:

```bash
npm run install:all
npm run db:setup
npm run dev
```

- Panel / front: http://localhost:5174  
- API: http://localhost:5001  

## Vercel + Neon

1. Importar repo en Vercel.
2. Variables: `DATABASE_URL`, `JWT_SECRET`, `SUPERADMIN_TOKEN_SECRET`, `FRONTEND_URL`, `PANEL_URL` (misma URL del deploy).
3. Tras el primer deploy, seed una vez con la misma `DATABASE_URL`:

```bash
cd backend && npm run db:setup
```

## Notas

- `docker-compose.yml` es el stack **legacy MySQL** de la fase anterior; el camino actual es Postgres/Neon.
- Subidas en Vercel usan `/tmp` (suficiente para demo).
- Repo privado: `alepazmont/clicAgenda`.
