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

export async function fichasExisten() {
  const { count } = await supabase.from('fichas_equipo').select('*', { count: 'exact', head: true })
  return (count ?? 0) > 0
}

export async function importarStockInicial(equipos: Record<string, unknown>[]) {
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

// ── CONFIG FECHAS ─────────────────────────────────────────────────────

export async function cargarConfigFechas() {
  const { data, error } = await supabase.from('config_fechas').select('*')
  if (error) return null
  const result: Record<string, string> = {}
  for (const row of data ?? []) result[row.codigo] = row.fecha_inicio
  return result
}

export async function guardarConfigFecha(codigo: string, fechaInicio: string) {
  const { error } = await supabase.from('config_fechas').upsert({ codigo, fecha_inicio: fechaInicio }, { onConflict: 'codigo' })
  return !error
}
