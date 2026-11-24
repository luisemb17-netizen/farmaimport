# Guía: crear Supabase y dejar FarmaImport funcionando

Tiempo estimado: **15 minutos** (más 2 de espera mientras Supabase aprovisiona).
No necesitas tarjeta de crédito: el plan gratuito alcanza de sobra.

---

## Antes de empezar: decide el correo del administrador

El correo es solo el **nombre de usuario** con el que se entra. La contraseña la
guarda Supabase hasheada; nunca queda en el código.

| Opción | Ventaja | Desventaja |
|---|---|---|
| **A. Un correo real de un integrante** (recomendado) | Puedes recuperar la clave y confirmar el correo | — |
| **B. `elmejorequipo@gmail.com`** (el que pediste) | Ya está puesto en `005_primer_admin.sql` | Si no tienes acceso a esa cuenta, **no podrás recuperar la contraseña**; hay que crearla con «Auto Confirm User» |

Con cualquiera de las dos funciona el login. Si eliges B, **nunca** uses ese
correo para recuperar la cuenta: no llegará el enlace.

> Si eliges A, cambia el correo en `supabase/005_primer_admin.sql` (línea del
> `update ... where email = ...`) antes de ejecutarlo.

---

## Paso 1 — Crear la cuenta en Supabase

1. Entra a **https://supabase.com** → **Start your project**.
2. Regístrate con **GitHub** (más rápido) o con tu correo.
3. Si usas GitHub, autoriza a Supabase.

---

## Paso 2 — Crear el proyecto

1. **New project** (o «New organization» primero si te lo pide).
2. Completa:

   | Campo | Valor |
   |---|---|
   | Name | `farmaimport` |
   | Database Password | una clave fuerte — **cópiala en un lugar seguro** |
   | Region | **East US (North Virginia)** — la más cercana a Venezuela y a Vercel |
   | Plan | **Free** |

3. **Create new project** y espera **1–2 minutos** (verás «Setting up project»).

---

## Paso 3 — Crear las tablas (5 archivos, EN ORDEN)

En el menú izquierdo: **SQL Editor** → **New query**.

Pega el contenido completo de cada archivo y pulsa **Run** (o `Ctrl+Enter`).
**Respeta el orden**, porque las funciones dependen de las tablas anteriores.

| Orden | Archivo | Qué crea |
|---|---|---|
| 1 | `supabase/migrations/001_modulo1.sql` | `perfiles`, `configuracion_negocio`, triggers, `es_admin()`, RLS |
| 2 | `supabase/migrations/002_modulo2.sql` | `categorias`, `productos`, bucket `imagenes` y sus políticas |
| 3 | `supabase/migrations/003_modulo3.sql` | `clientes`, `ventas`, `detalle_ventas`, `registrar_venta()` |
| 4 | `supabase/migrations/004_modulo4.sql` | `anular_venta()`, vista y funciones de reportes |
| 5 | `supabase/seed.sql` | 6 categorías, 30 productos y 3 clientes de prueba |

Cada uno debe terminar en **«Success. No rows returned»**.

> Si ves `relation "..." already exists`, es que ya ejecutaste ese archivo:
> puedes seguir con el siguiente.

---

## Paso 4 — Configurar el login

1. Menú izquierdo: **Authentication** → **Sign In / Providers** (o **Providers**).
2. Abre **Email**.
3. **Desactiva «Confirm email»** para la clase (*Enable email confirmations* → off).
4. **Save**.

> Si lo dejas activo, cada registro necesitará confirmar el correo y el envío
> gratuito de Supabase tiene límites muy bajos.

---

## Paso 5 — Configurar las URLs de autenticación

**Authentication** → **URL Configuration**:

- **Site URL:** `http://localhost:3000` (mientras pruebas) o tu URL de Vercel.
- **Redirect URLs:** agrega
  - `http://localhost:3000/**`
  - `https://tu-app.vercel.app/**`

Si esto queda mal, los enlaces de confirmación abren `localhost` y el login
falla en producción.

---

## Paso 6 — Copiar las llaves

1. **Project Settings** (engranaje) → **API Keys**.
2. Copia:
   - **Project URL** → `https://xxxxxxxx.supabase.co`
   - **Publishable key** → empieza por `sb_publishable_...`

> La *publishable key* es pública y la protege el RLS. **Nunca** copies la
> `service_role` / secret key a una variable `NEXT_PUBLIC_`.

---

## Paso 7 — Conectar la app

En la carpeta `farmaimport`, crea el archivo **`.env.local`**:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxx
```

Reinicia el servidor:

```bash
npm run dev
```

Abre `http://localhost:3000`. Ya debería aparecer el **login**.

---

## Paso 8 — Crear la cuenta de administrador

**Opción rápida (panel):**

1. **Authentication** → **Users** → **Add user** → **Create new user**.
2. Email: `elmejorequipo@gmail.com` · Password: `unidad17*`
3. Marca **Auto Confirm User** (así no hace falta el correo).
4. **Create user**.

**Opción desde la app:** entra a `/registro` y crea la cuenta con esos datos.

---

## Paso 9 — Darle el rol de administrador

**SQL Editor** → **New query** → pega `supabase/005_primer_admin.sql` → **Run**.

Al final debe mostrar tu usuario con `rol = administrador` y `activo = true`.

---

## Paso 10 — Entrar

1. Ve a `http://localhost:3000/login`.
2. Correo `elmejorequipo@gmail.com`, clave `unidad17*`.
3. Deberías ver el **Panel de control**.

---

## Revisar que quedó todo bien

Ejecuta esto en el SQL Editor:

```sql
select count(*) as categorias from public.categorias;   -- 6
select count(*) as productos  from public.productos;    -- 30
select count(*) as stock_bajo from public.productos where stock <= 5; -- 6
select nombre_completo, email, rol from public.perfiles;
```

Y en la app:

- [ ] El login entra y aparece el panel.
- [ ] **Productos** muestra 30 ítems y se puede paginar.
- [ ] **POS** deja agregar al carrito y cobrar.
- [ ] Al cobrar se genera la factura con `FAC-000001`.
- [ ] **Reportes** muestra el gráfico y el top 5.
- [ ] El botón de luna cambia a modo oscuro.

---

## Errores frecuentes

| Mensaje | Qué hacer |
|---|---|
| `relation "perfiles" already exists` | Ese archivo ya se ejecutó: sigue con el siguiente. |
| `must be owner of table objects` | El plan gratuito no dejó crear las políticas del bucket. Ve a **Storage → Policies** y créalas a mano (lectura pública; escritura solo admin). |
| «Email not confirmed» al entrar | Desactiva «Confirm email» (paso 4) o crea el usuario con **Auto Confirm User**. |
| El panel no carga y sale el aviso de configuración | Revisa `.env.local` y **reinicia** `npm run dev`. Las variables se leen al arrancar. |
| «Ventas de hoy» sale en 0 | Todo se calcula en hora de Venezuela (UTC−4). Si acabas de vender, refresca. |
| Supabase dice **Paused** | Los proyectos gratis se pausan tras ~7 días sin uso. Entra el día antes de la defensa y pulsa **Restore**. |

---

## Cuando ya funcione: GitHub y Vercel

1. **GitHub:** crea un repositorio **público** (el plan gratis de Vercel no
   despliega repos privados de terceros) y sube la carpeta `farmaimport`.
   - `.env.local` **no** se sube (ya está en `.gitignore`).
2. **Vercel:** vercel.com → **Add New → Project** → importa el repositorio.
3. En **Environment Variables** agrega las dos variables `NEXT_PUBLIC_...`
   (y `RESEND_API_KEY` si vas a usar el envío por correo).
4. **Deploy**. Copia la URL resultante y pégala en Supabase (paso 5) y en el
   README.
