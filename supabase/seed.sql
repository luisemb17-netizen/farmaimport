-- ============================================================================
-- seed.sql — Datos de prueba realistas (FarmaImport, C.A.)
-- Ejecutar DESPUÉS de 001 → 004.
-- Es idempotente: se puede correr varias veces sin duplicar.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Categorías (6)
-- ---------------------------------------------------------------------------
insert into public.categorias (nombre, descripcion) values
  ('Analgésicos y Antiinflamatorios', 'Dolor, fiebre e inflamación'),
  ('Antibióticos',                    'Tratamientos antibacterianos con récipe'),
  ('Vitaminas y Suplementos',         'Complementos nutricionales y defensas'),
  ('Cuidado Personal',                'Higiene, dermocosmética y protección solar'),
  ('Primeros Auxilios',               'Curaciones, vendajes y botiquín'),
  ('Bebés y Maternal',                'Pañales, fórmulas y cuidado del bebé')
on conflict (nombre) do nothing;

-- ---------------------------------------------------------------------------
-- Productos (30) — incluye stock bajo (<= 5) y uno agotado (0)
-- ---------------------------------------------------------------------------
insert into public.productos (
  codigo, nombre, descripcion, laboratorio, presentacion,
  precio_unitario, stock, exento, categoria_id
)
select v.codigo, v.nombre, v.descripcion, v.laboratorio, v.presentacion,
       v.precio::numeric(12, 2), v.stock::integer, v.exento::boolean, c.id
from (values
  -- Analgésicos y Antiinflamatorios
  ('ANL-001', 'Acetaminofén 500 mg',        'Analgésico y antipirético de venta libre', 'Genven',   'Caja x 10 tabletas',      12.50, 120, true,  'Analgésicos y Antiinflamatorios'),
  ('ANL-002', 'Ibuprofeno 400 mg',          'Antiinflamatorio no esteroideo',           'Genven',   'Caja x 10 tabletas',      18.90,  85, false, 'Analgésicos y Antiinflamatorios'),
  ('ANL-003', 'Diclofenac 50 mg',           'Antiinflamatorio para dolor muscular',     'Meyer',    'Caja x 20 tabletas',      24.00,  60, false, 'Analgésicos y Antiinflamatorios'),
  ('ANL-004', 'Aspirina 100 mg',            'Antiagregante plaquetario',                'Bayer',    'Caja x 30 tabletas',      15.00,   4, true,  'Analgésicos y Antiinflamatorios'),
  ('ANL-005', 'Ketoprofeno gel 2.5%',       'Gel antiinflamatorio de uso tópico',       'Tubes',    'Tubo x 60 g',             42.00,  22, false, 'Analgésicos y Antiinflamatorios'),
  ('ANL-006', 'Naproxeno 500 mg',           'Analgésico de larga duración',             'Genven',   'Caja x 10 tabletas',      21.50,   0, false, 'Analgésicos y Antiinflamatorios'),

  -- Antibióticos
  ('ANT-001', 'Amoxicilina 500 mg',         'Antibiótico de amplio espectro',           'Genven',   'Cápsulas x 12',           38.00,  45, false, 'Antibióticos'),
  ('ANT-002', 'Azitromicina 500 mg',        'Antibiótico macrólido de 3 días',          'Roemmers', 'Caja x 3 tabletas',       65.00,  30, false, 'Antibióticos'),
  ('ANT-003', 'Cefalexina 500 mg',          'Antibiótico cefalosporínico',              'Meyer',    'Cápsulas x 12',           52.00,  18, false, 'Antibióticos'),
  ('ANT-004', 'Metronidazol 500 mg',        'Antibiótico y antiparasitario',            'Genven',   'Caja x 10 tabletas',      19.50,   3, false, 'Antibióticos'),
  ('ANT-005', 'Amoxicilina + Ác. Clavulánico','Antibiótico de amplio espectro reforzado','Roemmers', 'Caja x 14 tabletas',      98.00,  12, false, 'Antibióticos'),

  -- Vitaminas y Suplementos
  ('VIT-001', 'Vitamina C 500 mg',          'Defensas y antioxidante',                  'Nature''s Garden', 'Frasco x 60 tabletas', 35.00, 70, false, 'Vitaminas y Suplementos'),
  ('VIT-002', 'Multivitamínico adulto',     'Complejo vitamínico diario',               'Centrum',  'Frasco x 30 tabletas',    89.00,  25, false, 'Vitaminas y Suplementos'),
  ('VIT-003', 'Vitamina D3 1000 UI',        'Salud ósea e inmunidad',                   'Nature''s Garden', 'Frasco x 60 cápsulas', 48.00,  5, false, 'Vitaminas y Suplementos'),
  ('VIT-004', 'Hierro + Ácido Fólico',      'Prevención de anemia',                     'Genven',   'Caja x 30 tabletas',      28.00,  40, false, 'Vitaminas y Suplementos'),
  ('VIT-005', 'Omega 3 1000 mg',            'Ácidos grasos esenciales',                 'Nature''s Garden', 'Frasco x 50 cápsulas', 76.00, 15, false, 'Vitaminas y Suplementos'),
  ('VIT-006', 'Zinc 50 mg',                 'Apoyo inmunológico',                       'Nature''s Garden', 'Frasco x 60 tabletas', 32.00,   8, false, 'Vitaminas y Suplementos'),

  -- Cuidado Personal
  ('CUI-001', 'Alcohol isopropílico 70%',   'Desinfectante de superficies',             'Farmatodo','Frasco x 500 ml',         14.00,  90, false, 'Cuidado Personal'),
  ('CUI-002', 'Jabón antibacterial',        'Limpieza profunda de manos',               'Protex',   'Barra x 110 g',            9.50, 150, false, 'Cuidado Personal'),
  ('CUI-003', 'Crema dental',               'Protección anticaries',                    'Colgate',  'Tubo x 100 ml',           22.00,  60, false, 'Cuidado Personal'),
  ('CUI-004', 'Protector solar FPS 50',     'Protección UVA/UVB',                       'Neutrogena','Frasco x 120 ml',        120.00,   2, false, 'Cuidado Personal'),
  ('CUI-005', 'Shampoo anticaspa',          'Control de caspa y sebo',                  'Head & Shoulders', 'Frasco x 375 ml', 68.00,  20, false, 'Cuidado Personal'),

  -- Primeros Auxilios
  ('PRI-001', 'Gasas estériles',            'Gasas de algodón estériles',               'BSN',      'Paquete x 10 unidades',   11.00, 100, false, 'Primeros Auxilios'),
  ('PRI-002', 'Vendas elásticas 10 cm',     'Vendaje de compresión',                    'BSN',      'Unidad',                   8.50,  75, false, 'Primeros Auxilios'),
  ('PRI-003', 'Curitas',                    'Apósitos adhesivos',                       'BSN',      'Caja x 30 unidades',       7.00,   4, false, 'Primeros Auxilios'),
  ('PRI-004', 'Suero fisiológico 0.9%',     'Solución salina estéril',                  'Fresenius', 'Frasco x 500 ml',        19.00,  35, true,  'Primeros Auxilios'),
  ('PRI-005', 'Termómetro digital',         'Medición de temperatura corporal',         'Omron',    'Unidad',                  95.00,  10, false, 'Primeros Auxilios'),

  -- Bebés y Maternal
  ('BEB-001', 'Pañales talla M',            'Pañales desechables',                      'Huggies',  'Paquete x 30 unidades',  145.00,  24, false, 'Bebés y Maternal'),
  ('BEB-002', 'Fórmula infantil 0-6 meses', 'Leche de fórmula etapa 1',                 'Similac',  'Lata x 400 g',           210.00,   9, false, 'Bebés y Maternal'),
  ('BEB-003', 'Crema antipañalitis',        'Protección contra la dermatitis',          'Desitin',  'Tubo x 100 g',            54.00,  16, false, 'Bebés y Maternal')
) as v(codigo, nombre, descripcion, laboratorio, presentacion, precio, stock, exento, categoria)
join public.categorias c on c.nombre = v.categoria
on conflict (codigo) do nothing;

-- ---------------------------------------------------------------------------
-- Clientes de ejemplo (3)
-- ---------------------------------------------------------------------------
insert into public.clientes (nombre, rif_cedula, direccion, telefono, email) values
  ('Juan Pérez',                'V-12345678',   'Av. Libertador, Caracas',            '0414-1234567', 'juan.perez@ejemplo.com'),
  ('Distribuidora XYZ, C.A.',   'J-40123456-7', 'Zona Industrial, Valencia, Carabobo', '0241-1234567', 'compras@xyz-ejemplo.com'),
  ('María Rodríguez',           'V-18765432',   'Urb. La Trinidad, Baruta, Miranda',   '0424-7654321', 'maria.rodriguez@ejemplo.com')
on conflict (rif_cedula) do nothing;

-- ---------------------------------------------------------------------------
-- Verificación rápida
-- ---------------------------------------------------------------------------
-- select count(*) as categorias from public.categorias;   -- 6
-- select count(*) as productos  from public.productos;    -- 30
-- select count(*) as stock_bajo from public.productos where stock <= 5; -- 6
