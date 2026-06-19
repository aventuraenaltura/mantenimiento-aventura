'use client'
import { supabase } from './supabase'

// ── EQUIPOS ──────────────────────────────────────────────────────────

export async function cargarEquipos() {
  const { data, error } = await supabase.from('equipos').select('*').order('numero_interno')
  if (error) return null
  return data
}

export async function guardarEquipos(equipos: object[]) {
  // Upsert completo — reemplaza todo
  const { error } = await supabase.from('equipos').upsert(equipos as never[], { onConflict: 'id' })
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
