// db.ts — funciones Supabase (equipo técnico eliminado)
import { supabase } from './supabase'

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
  if (!error && data && data.length > 0) {
    const result: Record<string, string> = {}
    for (const row of data) result[row.codigo] = row.fecha_inicio
    try { localStorage.setItem('config_fechas_cache', JSON.stringify(result)) } catch { /* skip */ }
    return result
  }
  try {
    const raw = localStorage.getItem('config_fechas_cache')
    if (raw) return JSON.parse(raw) as Record<string, string>
  } catch { /* skip */ }
  return null
}

export async function guardarConfigFecha(codigo: string, fechaInicio: string) {
  try {
    const raw = localStorage.getItem('config_fechas_cache')
    const cache = raw ? JSON.parse(raw) : {}
    cache[codigo] = fechaInicio
    localStorage.setItem('config_fechas_cache', JSON.stringify(cache))
    const rawP = localStorage.getItem('config_planillas')
    const planillas = rawP ? JSON.parse(rawP) : []
    const idx = planillas.findIndex((p: { planilla_id: string }) => p.planilla_id === codigo)
    if (idx >= 0) planillas[idx].fecha_inicio = fechaInicio
    else planillas.push({ planilla_id: codigo, fecha_inicio: fechaInicio })
    localStorage.setItem('config_planillas', JSON.stringify(planillas))
  } catch { /* skip */ }
  const { error } = await supabase.from('config_fechas').upsert({ codigo, fecha_inicio: fechaInicio }, { onConflict: 'codigo' })
  return !error
}
