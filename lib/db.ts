'use client'
import { supabase } from './supabase'

// ── EQUIPOS ──────────────────────────────────────────────────────────

export async function cargarEquipos(sector?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase.from('equipos').select('*').order('numero_interno')
  if (sector) q = q.eq('sector', sector)
  const { data, error } = await q
  if (error) return null
  return data
}

export async function guardarEquipos(equipos: object[], sector?: string) {
  const rows = sector
    ? (equipos as Record<string, unknown>[]).map(e => ({ ...e, sector }))
    : equipos
  const { error } = await supabase.from('equipos').upsert(rows as never[], { onConflict: 'id' })
  return !error
}

export async function actualizarEquipo(id: string, campos: object) {
  const { error } = await supabase.from('equipos').update(campos).eq('id', id)
  return !error
}

export async function eliminarEquipo(id: string) {
  const { error } = await supabase.from('equipos').delete().eq('id', id)
  return !error
}

export async function cargarEquiposSector(sector: string) {
  const { data, error } = await supabase
    .from('equipos')
    .select('*')
    .eq('sector', sector)
    .order('tipo')
  if (error) { console.error('cargarEquiposSector:', error); return [] }
  return data ?? []
}

export async function upsertEquiposSector(equipos: object[], sector: string) {
  if (equipos.length === 0) return true
  const rows = (equipos as Record<string, unknown>[]).map(e => ({ ...e, sector }))
  const { error } = await supabase.from('equipos').upsert(rows as never[], { onConflict: 'id' })
  if (error) console.error('upsertEquiposSector:', error)
  return !error
}

export async function actualizarEquipoDb(id: string, campos: Record<string, unknown>) {
  const { error } = await supabase
    .from('equipos')
    .update({ ...campos, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) console.error('actualizarEquipoDb:', error)
  return !error
}

export async function borrarEquiposTodos() {
  const { error } = await supabase.from('equipos').delete().neq('id', 'x-never')
  return !error
}

// ── EJECUCIONES ───────────────────────────────────────────────────────

export async function cargarEjecuciones(actividadId: string) {
  const { data, error } = await supabase
    .from('ejecuciones')
    .select('*')
    .eq('actividad_id', actividadId)
    .order('fecha', { ascending: false })
  if (error) return null
  return data
}

export async function insertarEjecucion(actividadId: string, ej: Record<string, unknown>) {
  const { error } = await supabase.from('ejecuciones').insert({ ...ej, actividad_id: actividadId })
  return !error
}

export async function actualizarEjecucion(id: string, campos: object) {
  const { error } = await supabase.from('ejecuciones').update(campos).eq('id', id)
  return !error
}

// ── FICHAS DE EQUIPO ─────────────────────────────────────────────────

export async function fichasExisten(sector?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase.from('fichas_equipo').select('*', { count: 'exact', head: true })
  if (sector) q = q.eq('sector', sector)
  const { count } = await q
  return (count ?? 0) > 0
}

export async function importarStockInicial(equipos: Record<string, unknown>[], sector?: string) {
  const fichas = equipos.map(e => ({
    id: e.id as string,
    numero_ficha: (e.numero_serie as string) || (e.numero_interno as string),
    tipo: e.tipo,
    numero_interno: e.numero_interno,
    marca: e.marca,
    modelo: e.modelo,
    numero_serie: e.numero_serie,
    actividad: e.actividad,
    uso_actual: e.uso_actual,
    fecha_ingreso: e.fecha_ingreso || new Date().toISOString().split('T')[0],
    observaciones: e.observaciones,
    estado: 'alta',
    sector: sector ?? 'tirolesa',
  }))
  const { error } = await supabase.from('fichas_equipo').upsert(fichas, { onConflict: 'id' })
  return !error
}

export async function guardarControlStock(sesion: {
  id: string; fecha: string; realizado_por: string; tipo: string
}, items: { ficha_id: string; uso_actual: string; ratings: Record<string, string>; observaciones: string }[]) {
  const { error: e1 } = await supabase.from('controles_stock').insert(sesion)
  if (e1) return false
  const rows = items.map((item, i) => ({ id: `${sesion.id}_${i}`, control_id: sesion.id, ...item }))
  const { error: e2 } = await supabase.from('control_items').insert(rows)
  return !e2
}

// ── STOCK VARIOS ──────────────────────────────────────────────────────

export async function cargarVariosSector(sector: string) {
  const { data, error } = await supabase
    .from('stock_varios')
    .select('*')
    .eq('sector', sector)
    .order('nombre')
  if (error) { console.error('cargarVariosSector:', error); return [] }
  return data ?? []
}

export async function upsertVariosSector(items: object[], sector: string) {
  if (items.length === 0) return true
  // Primero borrar los existentes del sector, luego insertar
  await supabase.from('stock_varios').delete().eq('sector', sector)
  const rows = (items as Record<string, unknown>[]).map(item => ({
    id: `${sector}_${String(item.nombre).replace(/\s+/g, '_').toLowerCase()}_${String(item.caracteristicas || '').replace(/\s+/g, '_').toLowerCase()}`,
    sector,
    nombre: item.nombre,
    caracteristicas: item.caracteristicas || '',
    en_uso: item.enUso ?? 0,
    deposito: item.deposito ?? 0,
    reparar: item.reparar ?? 0,
    repuestos: item.repuestos ?? 0,
  }))
  const { error } = await supabase.from('stock_varios').upsert(rows as never[], { onConflict: 'id' })
  if (error) console.error('upsertVariosSector:', error)
  return !error
}

export async function borrarVariosTodos() {
  await supabase.from('stock_varios').delete().neq('id', 'x-never')
}

// ── HISTORIAL CARGAS ──────────────────────────────────────────────────

export async function cargarHistorialCargas() {
  const { data, error } = await supabase
    .from('historial_cargas')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error('cargarHistorialCargas:', error); return [] }
  return data ?? []
}

export async function insertarCargaHistorial(carga: Record<string, unknown>) {
  const { error } = await supabase.from('historial_cargas').insert(carga as never)
  if (error) console.error('insertarCargaHistorial:', error)
  return !error
}

export async function borrarHistorialCargas() {
  await supabase.from('historial_cargas').delete().neq('id', 'x-never')
}

// ── GUANTINES ────────────────────────────────────────────────────────

export async function cargarGuantinesSector(sector: string) {
  const { data, error } = await supabase
    .from('guantines')
    .select('*')
    .eq('sector', sector)
    .order('modelo')
  if (error) { console.error('cargarGuantinesSector:', error); return [] }
  // Mapear nombres de columnas snake_case a camelCase
  return (data ?? []).map((g: Record<string, unknown>) => ({
    id: g.id,
    sector: g.sector,
    modelo: g.modelo,
    color: g.color,
    enUso: g.en_uso ?? 0,
    deposito: g.deposito ?? 0,
    reparar: g.reparar ?? 0,
    repuestos: g.repuestos ?? 0,
    baja: g.baja ?? 0,
    historial: g.historial ?? [],
  }))
}

export async function upsertGuantin(g: Record<string, unknown>, sector: string) {
  const row = {
    id: g.id,
    sector,
    modelo: g.modelo,
    color: g.color,
    en_uso: g.enUso ?? 0,
    deposito: g.deposito ?? 0,
    reparar: g.reparar ?? 0,
    repuestos: g.repuestos ?? 0,
    baja: g.baja ?? 0,
    historial: g.historial ?? [],
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('guantines').upsert(row as never, { onConflict: 'id' })
  if (error) console.error('upsertGuantin:', error)
  return !error
}

export async function eliminarGuantin(id: string) {
  const { error } = await supabase.from('guantines').delete().eq('id', id)
  return !error
}

// ── CASCOS MODELOS ────────────────────────────────────────────────────

export async function cargarCascosSector(sector: string) {
  const { data, error } = await supabase
    .from('cascos_modelos')
    .select('*')
    .eq('sector', sector)
    .order('modelo')
  if (error) { console.error('cargarCascosSector:', error); return [] }
  return (data ?? []).map((c: Record<string, unknown>) => ({
    id: c.id,
    sector: c.sector,
    modelo: c.modelo,
    marca: c.marca,
    color: c.color,
    talle: c.talle,
    enUso: c.en_uso ?? 0,
    deposito: c.deposito ?? 0,
    reparar: c.reparar ?? 0,
    baja: c.baja ?? 0,
    historial: c.historial ?? [],
  }))
}

export async function upsertCasco(c: Record<string, unknown>, sector: string) {
  const row = {
    id: c.id,
    sector,
    modelo: c.modelo,
    marca: c.marca,
    color: c.color,
    talle: c.talle,
    en_uso: c.enUso ?? 0,
    deposito: c.deposito ?? 0,
    reparar: c.reparar ?? 0,
    baja: c.baja ?? 0,
    historial: c.historial ?? [],
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('cascos_modelos').upsert(row as never, { onConflict: 'id' })
  if (error) console.error('upsertCasco:', error)
  return !error
}

export async function eliminarCasco(id: string) {
  const { error } = await supabase.from('cascos_modelos').delete().eq('id', id)
  return !error
}

// ── CONFIG FECHAS ─────────────────────────────────────────────────────

export async function cargarConfigFechas() {
  // Intentar Supabase primero
  const { data, error } = await supabase.from('config_fechas').select('*')
  if (!error && data && data.length > 0) {
    const result: Record<string, string> = {}
    for (const row of data) result[row.codigo] = row.fecha_inicio
    // Sincronizar a localStorage como respaldo
    localStorage.setItem('config_fechas_cache', JSON.stringify(result))
    return result
  }
  // Fallback: localStorage
  try {
    const raw = localStorage.getItem('config_fechas_cache')
    if (raw) return JSON.parse(raw) as Record<string, string>
  } catch { /* skip */ }
  return null
}

export async function guardarConfigFecha(codigo: string, fechaInicio: string) {
  // Guardar siempre en localStorage primero (instantáneo, sin dependencia de red)
  try {
    const raw = localStorage.getItem('config_fechas_cache')
    const cache = raw ? JSON.parse(raw) : {}
    cache[codigo] = fechaInicio
    localStorage.setItem('config_fechas_cache', JSON.stringify(cache))
    // También guardar en config_planillas (usado por lib/config.ts)
    const rawP = localStorage.getItem('config_planillas')
    const planillas = rawP ? JSON.parse(rawP) : []
    const idx = planillas.findIndex((p: { planilla_id: string }) => p.planilla_id === codigo)
    if (idx >= 0) planillas[idx].fecha_inicio = fechaInicio
    else planillas.push({ planilla_id: codigo, fecha_inicio: fechaInicio })
    localStorage.setItem('config_planillas', JSON.stringify(planillas))
  } catch { /* skip */ }
  // Intentar Supabase también (en segundo plano)
  const { error } = await supabase.from('config_fechas').upsert({ codigo, fecha_inicio: fechaInicio }, { onConflict: 'codigo' })
  return !error
}
