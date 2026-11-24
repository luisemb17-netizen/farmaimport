# Guion de defensa — Base de datos y código

> Acompaña a `docs/Defensa-Base-de-Datos.pdf` (15 diapositivas).
> Tiempo estimado de exposición: **8–10 minutos** + demo de 5 minutos.

---

## Antes de empezar (2 minutos de preparación)

- [ ] Abre la presentación en **pantalla completa** (no el PDF en el explorador con barras).
- [ ] Ten abierta en otra pestaña la app: **https://farmaimport.vercel.app**
- [ ] Ten abierta otra pestaña con **Supabase → Table Editor**.
- [ ] Cierra sesión en la app (para entrar limpio cuando toque).
- [ ] Ten a mano las credenciales: `luisemb.17@gmail.com` / `unidad17*`.
- [ ] Si vas a mostrar un cajero, créalo **antes** (no improvisar en vivo).

**Regla de oro:** nunca digas “eso lo hizo la IA”. Di “lo implementamos”, “lo probamos”,
“lo corregimos cuando falló”. Tú estás defendiendo el trabajo.

---

## Guion por diapositiva

### 1 · Portada
> “Buenos días. Vamos a explicar cómo está construida la base de datos de FarmaImport
> y cómo el código la usa. El sistema ya está desplegado y funcionando.”

*Menciona los 5 integrantes si el profesor no los conoce.*

### 2 · Qué construimos y con qué
> “Usamos PostgreSQL en Supabase, no una base local. Hoy tiene **7 tablas, 1 vista,
> 8 funciones, 23 índices y 13 políticas de seguridad**.”

> “Lo importante: la base no se creó a mano desde un panel. Está toda escrita en
> archivos SQL dentro del repositorio, así que se puede reconstruir desde cero.”

### 3 · Cómo se creó
> “Son seis archivos, y el orden importa: el 002 usa la función del 001, el 003 usa las
> tablas del 002…”

Recórrelos con el dedo, sin leer todo:
1. **001** — usuarios, configuración y seguridad base
2. **002** — inventario y el bucket de imágenes
3. **003** — clientes, ventas y `registrar_venta()`
4. **004** — anulación y reportes
5. **006** — alta de usuarios desde el panel
6. **seed** — datos de prueba

> “Cada archivo se ejecutó en el SQL Editor y quedó guardado en `supabase/migrations/`.”

### 4 · Modelo entidad-relación
> “Siete tablas. La columna vertebral son tres: **ventas** (la factura), **detalle_ventas**
> (las líneas) y **productos**. Alrededor están clientes, perfiles, categorías y la
> configuración del negocio.”

Señala las relaciones: un cliente muchas ventas, una venta muchas líneas, un producto
muchas líneas.

> “`configuracion_negocio` no se relaciona con nada: es una sola fila que todos leen.”

### 5 · Llaves, índices y restricciones
> “La base no confía en el programa: ella misma impide datos inválidos.”

Elige **tres** ejemplos y explícalos:
- **UNIQUE en `numero_factura`** → imposible repetir una factura.
- **CHECK `precio > 0` y `stock >= 0`** → imposible vender a cero o dejar stock negativo.
- **CHECK con expresión regular en el RIF** → `J-12345678-9` o no entra.
- **RESTRICT en el detalle** → no se puede borrar una factura que tiene líneas.

> “Además hay 23 índices para que las búsquedas y los reportes no recorran toda la tabla.”

### 6 · Decisiones de diseño
Explica las cuatro en una frase cada una:

1. **Snapshots** → “La factura guarda una copia del nombre y el precio. Si mañana sube el
   precio, la factura de ayer no cambia.”
2. **Una sola fila de configuración** → “Un índice único sobre una constante hace imposible
   una segunda fila con otro RIF u otro IVA.”
3. **Nada se borra, se anula** → “Si intentas borrar un producto vendido, PostgreSQL
   responde error 23503 y la app ofrece desactivarlo.”
4. **decimal(12,2)** → “Nunca `float`: el dinero se guarda exacto y se redondea a 2 decimales.”

### 7 · RLS
> “Row Level Security significa que **cada fila decide quién la ve**.”

> “Esta política dice: el cajero ve las ventas donde él es el vendedor, o todas si es
> administrador. Y el detalle hereda la visibilidad de su venta.”

> “Fíjense en el detalle: **a propósito no hay políticas de INSERT, UPDATE ni DELETE** en
> ventas. Solo escriben las funciones. El navegador no puede insertar una factura.”

> “Ocultar un botón no protege nada. Si un cajero escribe la URL a mano, el RLS le
> devuelve cero filas.”

### 8 · `es_admin()` y `proteger_rol()`
> “Estas dos funciones sostienen todo el modelo de seguridad.”

- **es_admin()** → “Necesita `SECURITY DEFINER` porque una política de `perfiles` que
  consulte `perfiles` entra en recursión infinita. Con SECURITY DEFINER corre con permisos
  del dueño y corta el ciclo.”
- **proteger_rol()** → “Es un trigger. Si un cajero edita su perfil y se pone
  `rol = 'administrador'`, el trigger lo detiene antes de guardar.”

> “Desde el SQL Editor no bloquea porque `auth.uid()` es nulo. Así se crea el primer
> administrador.”

### 9 · Flujo de una venta
> “Todo ocurre en una sola transacción. O se guarda todo, o no se guarda nada.”

Recorre el diagrama de izquierda a derecha:
1. El cajero arma el carrito (el navegador solo manda **id y cantidad**).
2. La Server Action llama a `rpc('registrar_venta')`.
3. PostgreSQL bloquea la configuración con `FOR UPDATE`.
4. Inserta la factura con los números consecutivos.
5. Por cada ítem: bloquea el producto, valida stock, descuenta e inserta el detalle.
6. Calcula IVA y total, incrementa las secuencias y hace COMMIT.
7. Vuelve el `venta_id` y el cajero ve la factura.

> “Si algo falla, el bloque rojo: `RAISE EXCEPTION` y PostgreSQL revierte **todo**.”

### 10 · Código de `registrar_venta()`
Señala cuatro puntos, en este orden:

1. **`FOR UPDATE`** → “Dos cajas no pueden leer la misma secuencia: la segunda espera.”
2. **El precio sale de la base** → “Si alguien cambia el precio desde la consola, no sirve.”
3. **`if stock < cantidad then raise exception`** → “Y con eso se revierte la venta completa.”
4. **El total se actualiza al final** → “El navegador nunca manda el total.”

### 11 · Anular y reportar
> “Anular no borra: cambia el estado, guarda quién, cuándo y por qué, y devuelve el stock.”

- Muestra el `UPDATE ventas SET estado = 'anulada'`.
- Muestra el `UPDATE productos … FROM (select sum(cantidad) group by producto_id)`.
  > “Se agrupa por producto porque si el mismo producto aparece en dos líneas, hay que
  > devolver la suma, no una sola línea.”

- **Vista `ventas_por_dia`** → “Agrupa con `AT TIME ZONE 'America/Caracas'` y usa
  `security_invoker`, así respeta el RLS de quien consulta.”
- **top_productos / resumen_periodo** → “Funciones que alimentan el dashboard.”

### 12 · `crear_usuario()`
> “El administrador crea las cuentas del equipo. Podríamos usar la Admin API de Supabase,
> pero exige la `service_role` key, que nunca debe estar en la aplicación.”

> “Entonces lo hicimos con una función `SECURITY DEFINER` que verifica `es_admin()` dentro
> de la base. Si no eres administrador, la función lanza la excepción.”

> “La clave se guarda con `crypt(..., gen_salt('bf'))`, que es bcrypt, el mismo que usa
> Supabase. Nunca en texto plano.”

> “Y hay un detalle que aprendimos probando: hace falta insertar también en
> `auth.identities`. Sin esa fila el login por correo falla con error 500.”

### 13 · Del botón hasta la base
> “El navegador nunca escribe SQL.”

1. **Sesión** → “`@supabase/ssr` guarda el token en cookies y `proxy.ts` lo refresca en cada
   petición, así el servidor sabe quién es `auth.uid()`.”
2. **RPC** → “`supabase.rpc('registrar_venta', …)` ejecuta la función como el usuario
   autenticado: PostgreSQL aplica permisos y RLS.”
3. **Lectura** → “Las listas se leen en el servidor con `supabase.from(...).select(...)`.”

### 14 · Pruebas
> “No lo dimos por bueno porque se veía bien: corrimos más de 45 casos.”

Lee tres o cuatro de la lista y **cuenta las dos fallas que encontraron**:
- “Las tablas existían pero la API devolvía 401: faltaban los `GRANT`. El RLS no basta,
  también hacen falta los permisos.”
- “Un usuario insertado solo en `auth.users` no podía entrar: faltaba la identidad.”

> “Reconocer esos errores y haberlos corregido es lo que demuestra que entendemos la base.”

### 15 · Cierre
> “Tres ideas: la base valida y calcula, la seguridad está en el RLS y las funciones, y
> todo es reconstruible con seis archivos SQL. ¿Preguntas?”

---

## Preguntas probables y respuestas cortas

| Pregunta | Respuesta |
|---|---|
| **¿Por qué Supabase y no MySQL?** | Es PostgreSQL, open source, con autenticación, almacenamiento y RLS integrados. Evita montar un servidor propio y cumple el requisito de desplegar en Vercel. |
| **¿Qué es RLS?** | Row Level Security: políticas que filtran filas según el usuario. Se aplica en la base, no en el frontend, así que no se puede saltar. |
| **¿Por qué `SECURITY DEFINER`?** | Para que la función corra con permisos del dueño. En `es_admin()` evita la recursión infinita del RLS; en las funciones de escritura permite tocar tablas que el usuario no puede modificar directamente. |
| **¿Qué hace `FOR UPDATE`?** | Bloquea la fila mientras dura la transacción. Otra caja que intente leerla espera su turno, así no se repiten números de factura. |
| **¿Qué pasa si dos cajeros venden justo a la vez?** | Ambos llaman a `registrar_venta()`. El primero bloquea la fila de configuración; el segundo espera y recibe la secuencia siguiente. Se probó con la lógica de bloqueo. |
| **¿Por qué no calcular el total en el navegador?** | Porque el usuario puede modificarlo con las herramientas del navegador. El total se calcula dentro de PostgreSQL. |
| **¿Cómo evitas que un cajero se haga administrador?** | Tres capas: no puede acceder a la pantalla, el RLS no se lo permite y el trigger `proteger_rol` lanza una excepción si intenta cambiar su rol. |
| **¿Qué es un snapshot?** | Una copia del dato en el momento de la venta (nombre y precio del producto; nombre, RIF y dirección del cliente). Así la factura histórica no cambia. |
| **¿Por qué no se borran las facturas?** | Porque un comprobante emitido no se elimina. Se anula: cambia de estado, guarda autor, fecha y motivo, y devuelve el stock. El detalle usa `ON DELETE RESTRICT`. |
| **¿Cómo devuelve el stock?** | Un `UPDATE` que suma las unidades agrupadas por producto desde `detalle_ventas`. Se agrupa para no devolver de menos si el producto está en dos líneas. |
| **¿Qué es una migración?** | Un archivo SQL versionado que transforma la base de un estado a otro. Permite reconstruirla o replicarla en otro entorno. |
| **¿Por qué `America/Caracas`?** | Vercel corre en UTC. Sin la zona horaria, “ventas de hoy” saldría corrido 4 horas. Todas las agrupaciones usan `AT TIME ZONE`. |
| **¿Cómo saben que funciona?** | Más de 45 casos automáticos en una réplica, más pruebas contra la base real: login, RLS de cajeros, numeración, anulación y alta de usuarios. |
| **¿Dónde está la contraseña de la base?** | No está en el repositorio. La app usa la `publishable key`, que es pública, y el RLS protege los datos. La contraseña de la base solo la usa el administrador. |
| **¿Qué pasa si Supabase se cae?** | El plan gratuito pausa el proyecto tras días de inactividad y se restaura desde el panel. Los datos no se pierden. |
| **¿Por qué 23 índices?** | Uno por cada llave y adicionales en `vendedor_id`, `created_at`, `estado`, `categoria_id` y `codigo`, que son las columnas por las que se filtra y ordena. |
| **¿Se puede vender sin stock?** | No: la función compara `stock < cantidad` y lanza excepción. Además el `CHECK (stock >= 0)` lo impide a nivel de tabla. |
| **¿Por qué la función se llama `SECURITY DEFINER` y no `INVOKER`?** | Porque necesita escribir en tablas donde el usuario no tiene permiso. Las de solo lectura (`top_productos`, `resumen_periodo`) son INVOKER, para que respeten el RLS. |

---

## Demo en vivo (5 minutos)

Orden pensado para que no falle nada:

1. **Panel** → señala las métricas del día y el gráfico de 7 días.
   > “Estos datos vienen de `ventas_por_dia`, agrupado en hora de Venezuela.”
2. **Productos** → “30 productos, uno agotado y varios con stock bajo.”
3. **POS** → agrega 2 productos y muestra el total.
   > “Esto es solo la vista previa; el total real lo calcula la función.”
4. **Cobrar** → se genera `FAC-0000xx`. Abre la factura.
   > “Número de factura y de control consecutivos, IVA y total en Bs.”
5. **Anular** (con un motivo) → vuelve a **Productos** y muestra que el stock subió.
   > “La factura no se borró: cambió de estado y el stock volvió.”
6. **Supabase → Table Editor** → muestra `ventas`, `detalle_ventas` y `perfiles`.
7. **Supabase → Authentication → Policies** → muestra las políticas de `ventas`.
   > “Aquí está la regla: el cajero solo ve sus ventas.”

**Cierre de la demo:**
> “Todo esto corre sobre la misma base, sin datos de mentira.”

---

## Si te quedas en blanco

- “Ese detalle lo resolvimos en la función SQL; si quieres lo abrimos y lo vemos.”
- “Esa decisión está documentada en el README, en la sección de decisiones técnicas.”
- “No lo tengo en este momento, pero lo verifico y te lo confirmo.” *(nunca inventes)*

**Nunca digas:** “no sé”, “eso no lo hice yo”, “lo hizo la IA”.

---

## Frases que suenan seguras

- “La base es la que manda: el frontend solo muestra.”
- “Esa regla vive en PostgreSQL, no en el navegador.”
- “Lo probamos y falló; lo corregimos y aquí está la prueba.”
- “Si borras la base, la reconstruyo con seis archivos.”
