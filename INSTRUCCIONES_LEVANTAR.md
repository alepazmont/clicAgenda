# Instrucciones para levantar el sistema (nuevaApp)

**Primera vez:** pasos 1 → 2 → 3 → 4 (o `npm run setup` y luego `npm run dev`).  
**Día a día:** paso 2 (levantar MySQL) y luego `npm run dev`.

Sigue los pasos **en orden** la primera vez.

---

## Requisitos previos

- **Node.js** 18+ y **npm**
- **Docker** y **Docker Compose** (para MySQL)  
  O **MySQL 8** instalado en local (usuario `clicagenda` / contraseña `clicagenda` en `localhost:3306`)

---

## Paso 1: Instalar dependencias

Desde la carpeta **nuevaApp**:

```bash
cd nuevaApp
npm run install:all
```

Instala dependencias de la raíz, del backend y del frontend.

---

## Paso 2: Levantar MySQL

Desde **nuevaApp** (el `docker-compose.yml` está aquí):

```bash
npm run docker:up:infra
```

O manualmente:

```bash
docker-compose up -d mysql
```

Esto deja MySQL en `localhost:3306` con usuario `clicagenda` y contraseña `clicagenda`.  
Si usas MySQL local, asegúrate de tener esa base/usuario o crea la BBDD `citas_master` y un usuario con esos datos.

---

## Paso 3: Crear bases de datos y datos iniciales (solo la primera vez)

Sigue en **nuevaApp**:

```bash
npm run db:setup
```

Este script:

- Crea la BBDD maestra `citas_master`
- Ejecuta migraciones maestra (tablas + superadmin + instancia demo)
- Crea la BBDD de la instancia demo `citas_demo_medico`
- Ejecuta migraciones de instancia (tablas + usuario demo)

Si falla por conexión, comprueba que MySQL esté en marcha (paso 2).

---

## Paso 4: Arrancar backend y frontend

En **nuevaApp**:

```bash
npm run dev
```

Se levantan:

- **Backend** en `http://localhost:5001`
- **Frontend** en `http://localhost:5174`

El frontend hace proxy de `/api` al backend.

---

## Opción: todo en un comando (primera vez)

Si tienes Docker instalado, desde **nuevaApp** puedes hacer:

```bash
npm run setup
```

Eso ejecuta: `install:all` → levanta MySQL con Docker → `db:setup`.  
Si `db:setup` falla por conexión (MySQL aún arrancando), espera unos 15 segundos y ejecuta de nuevo:

```bash
npm run db:setup
```

Luego ya puedes usar `npm run dev`.

---

## Resumen rápido (después del primer setup)

Cada vez que quieras usar la app:

1. **MySQL en marcha** (si lo tienes en Docker):  
   `npm run start:infra` o `docker-compose up -d mysql`
2. **App**:  
   `npm run dev`

---

## URLs y accesos

| Dónde | URL | Usuario | Contraseña |
|-------|-----|--------|------------|
| Panel (superadmin) | http://localhost:5174 (login panel) | admin@clicagenda.es | changeme |
| Instancia demo | http://localhost:5174/app/login | admin@demo.es | changeme |

En local, la app va bajo `/app` (dashboard, citas, pacientes, etc. en `/app/dashboard`, `/app/citas`, etc.).

---

## Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Levanta backend + frontend (desarrollo) |
| `npm run docker:up:infra` | Solo MySQL (y opcionalmente otros servicios de infra) |
| `npm run docker:up` | Todo el stack en Docker (MySQL + backend + frontend + phpMyAdmin) |
| `npm run docker:down` | Para y elimina contenedores |
| `npm run db:setup` | Crea BBDD y ejecuta migraciones (primera vez) |
| `npm run migrate:instance` | Vuelve a ejecutar migraciones de instancia (si cambian) |

---

## Solución de problemas

- **"Panel login error" con `ECONNREFUSED`**  
  MySQL no está en marcha. En **nuevaApp** ejecuta:
  ```bash
  npm run start:infra
  ```
  (o `docker-compose up -d mysql`). Espera unos segundos y vuelve a intentar el login. No hace falta reiniciar `npm run dev` si el backend ya está corriendo.

- **"ECONNREFUSED" o no conecta a MySQL**  
  Sube MySQL: `npm run start:infra` o `docker-compose up -d mysql` y espera unos segundos antes de `npm run db:setup` o `npm run dev`.

- **"Port 5174 is in use, trying another one..."**  
  Vite usará el siguiente puerto (p. ej. 5175). Abre la URL que indique la terminal (ej. `http://localhost:5175/`).

- **Puerto 5174 o 5001 en uso (EADDRINUSE)**  
  Cambia en `nuevaApp/frontend/vite.config.js` (port) y en `nuevaApp/backend` con la variable de entorno `BACKEND_PORT`. Opcionalmente crea `nuevaApp/backend/.env` con `BACKEND_PORT=5002` (o el que uses).

- **Cambios en migraciones**  
  Si añades o modificas migraciones de instancia, ejecuta:  
  `cd backend && node migrations/run-migrations.js instance`  
  (para la BBDD de la instancia que uses; el script puede pedir o usar por defecto `citas_demo_medico` según tu configuración).
