# ClicAgenda

SaaS multi-clínica de gestión de citas. Demo de portfolio con **PostgreSQL (Neon)** y despliegue en **Vercel**.

**Demo en vivo:** https://clicagenda.vercel.app

## Demo incluida

| Slug | Especialidad |
|------|----------------|
| `demo_dental` | Clínica Dental Sonrisa |
| `demo_psicologia` | Centro Psicológico Equilibrio |
| `demo_fisioterapia` | FisioSalud |

**Superadmin (panel):** `admin@clicagenda.es` / `changeme`  
**Cada clínica:** `admin@demo.es` / `changeme`

## Stack

- **Backend:** Express + PostgreSQL (multi-tenant con RLS por `instance_id`)
- **Frontend:** React + Vite + MUI
- **Deploy:** Vercel (API serverless + estáticos)

## Local

1. Crear proyecto en [Neon](https://neon.tech) y copiar la connection string.
2. `cp env.example backend/.env` y pegar `DATABASE_URL`.
3. Setup:

```bash
npm run install:all
npm run db:setup
npm run dev
```

- Panel: http://localhost:5174  
- API: http://localhost:5001  

## Vercel + Neon

1. Importar repo en Vercel.
2. Variables de entorno:
   - `DATABASE_URL` — connection string de Neon (con `?sslmode=require`)
   - `JWT_SECRET` — secreto aleatorio
   - `SUPERADMIN_TOKEN_SECRET` — otro secreto
   - `FRONTEND_URL` / `PANEL_URL` — `https://tu-proyecto.vercel.app`
3. Deploy. Tras el primer deploy, ejecutar seed una vez (desde local con la misma `DATABASE_URL`):

```bash
cd backend && npm run db:setup
```

## Capturas sugeridas

1. Login panel superadmin  
2. Grid de 3 instancias  
3. Dashboard de cada clínica (colores distintos)  
4. Listado de citas / pacientes  

## Notas

- MySQL multi-BBDD del repo original migrado a Postgres unificado.
- Subidas de archivos en Vercel usan `/tmp`; en demo no son críticas.
- Repositorio privado: `alepazmont/clicAgenda`.
