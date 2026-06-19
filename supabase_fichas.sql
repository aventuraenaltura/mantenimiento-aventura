-- FICHAS DE EQUIPO (inmutables, solo alta/baja)
CREATE TABLE IF NOT EXISTS fichas_equipo (
  id TEXT PRIMARY KEY,
  numero_ficha TEXT UNIQUE NOT NULL,
  tipo TEXT NOT NULL,
  numero_interno TEXT,
  marca TEXT,
  modelo TEXT,
  numero_serie TEXT,
  actividad TEXT,
  uso_actual TEXT,
  fecha_ingreso TEXT,
  observaciones TEXT,
  estado TEXT DEFAULT 'alta',
  fecha_baja TEXT,
  motivo_baja TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTROLES: cada sesión de control de stock
CREATE TABLE IF NOT EXISTS controles_stock (
  id TEXT PRIMARY KEY,
  fecha TEXT NOT NULL,
  realizado_por TEXT NOT NULL,
  tipo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ITEMS de control: rating de cada equipo en cada sesión
CREATE TABLE IF NOT EXISTS control_items (
  id TEXT PRIMARY KEY,
  control_id TEXT NOT NULL REFERENCES controles_stock(id),
  ficha_id TEXT NOT NULL REFERENCES fichas_equipo(id),
  uso_actual TEXT,
  ratings JSONB DEFAULT '{}',
  observaciones TEXT
);

-- Policies RLS
ALTER TABLE fichas_equipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE controles_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY allow_all_fichas ON fichas_equipo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_controles ON controles_stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_items ON control_items FOR ALL USING (true) WITH CHECK (true);
