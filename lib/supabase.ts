import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Rol = 'admin' | 'empleado'

export interface Usuario {
  id: string
  email: string
  nombre: string
  rol: Rol
  activo: boolean
}

export interface Actividad {
  id: string
  nombre: string
  color: string
  icono: string
  slug: string
}

export interface Planilla {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  actividad_id: string
  frecuencia: 'diaria' | 'semanal' | 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'
  tareas: string[]
  materiales: string[]
  instructivo: string
  activa: boolean
}

export interface Ejecucion {
  id: string
  planilla_id: string
  fecha_ejecucion: string
  proxima_fecha: string
  ejecutado_por: string
  tiempo_real_min?: number
  repuestos_usados?: string
  observaciones?: string
  foto_url?: string
  created_at: string
}

export interface Equipo {
  id: string
  tipo: 'arnes' | 'polea' | 'casco' | 'mosqueton' | 'cinta' | 'lentes' | 'guantin'
  numero_interno: string
  marca: string
  modelo: string
  numero_serie?: string
  actividad_id: string
  ubicacion: 'en_uso' | 'deposito' | 'para_reparar' | 'baja'
  uso_actual?: 'turista' | 'instructor' | 'deposito' | 'baja' | 'no_usable'
  estado: 'nuevo' | 'bueno' | 'regular' | 'revisar' | 'baja'
  fecha_ingreso: string
  observaciones_iniciales?: string
  datos_extra?: Record<string, unknown>
}

export interface EquipoHistorial {
  id: string
  equipo_id: string
  fecha: string
  accion: string
  realizado_por: string
  observaciones?: string
}

export interface BitacoraParque {
  id: string
  fecha: string
  inspector_nombre: string
  puntos: { punto_numero: number; correcto: boolean; notas: string }[]
  inspeccion_visual_general: string
  tiene_anomalia: boolean
  cerrado: boolean
  created_at: string
}

export interface Documento {
  id: string
  nombre: string
  descripcion?: string
  categoria: string
  tipo: 'biblioteca' | 'legal'
  archivo_url: string
  fecha_carga: string
  fecha_vencimiento?: string
  subido_por: string
}

// Calcular próxima fecha según frecuencia
export function calcularProximaFecha(fechaEjecucion: string, frecuencia: Planilla['frecuencia']): string {
  const fecha = new Date(fechaEjecucion)
  switch (frecuencia) {
    case 'diaria':      fecha.setDate(fecha.getDate() + 1); break
    case 'semanal':     fecha.setDate(fecha.getDate() + 7); break
    case 'mensual':     fecha.setMonth(fecha.getMonth() + 1); break
    case 'bimestral':   fecha.setMonth(fecha.getMonth() + 2); break
    case 'trimestral':  fecha.setMonth(fecha.getMonth() + 3); break
    case 'semestral':   fecha.setMonth(fecha.getMonth() + 6); break
    case 'anual':       fecha.setFullYear(fecha.getFullYear() + 1); break
  }
  return fecha.toISOString().split('T')[0]
}

export function colorEstadoFecha(proximaFecha: string): 'rojo' | 'naranja' | 'verde' {
  const hoy = new Date()
  const proxima = new Date(proximaFecha)
  const diff = (proxima.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  if (diff < 0) return 'rojo'
  if (diff <= 7) return 'naranja'
  return 'verde'
}
