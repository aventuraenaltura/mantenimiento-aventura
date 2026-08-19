// Configuración anual de fechas de inicio de cada planilla
// Se guarda en localStorage hasta integrar Supabase

export interface ConfigPlanilla {
  planilla_id: string
  fecha_inicio: string // YYYY-MM-DD — fecha de la primera ejecución del año
}

export function getConfig(): ConfigPlanilla[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem('config_planillas')
  return raw ? JSON.parse(raw) : []
}

export function setConfig(config: ConfigPlanilla[]) {
  localStorage.setItem('config_planillas', JSON.stringify(config))
}

export function getFechaInicio(planillaId: string): string | null {
  const config = getConfig()
  return config.find(c => c.planilla_id === planillaId)?.fecha_inicio ?? null
}

// Dado fecha de inicio y frecuencia, devuelve todas las fechas programadas para un mes dado
export function getFechasDelMes(
  fechaInicio: string,
  frecuencia: string,
  anio: number,
  mes: number // 0-based
): string[] {
  const inicio = new Date(fechaInicio)
  const fechas: string[] = []
  const primerDia = new Date(anio, mes, 1)
  const ultimoDia = new Date(anio, mes + 1, 0)

  // Avanzar desde inicio hasta llegar al mes objetivo
  const cursor = new Date(inicio)
  // Si la fecha de inicio es posterior al mes, no hay fechas
  if (cursor > ultimoDia) return []

  const avanzar = () => {
    switch (frecuencia) {
      case 'diaria':     cursor.setDate(cursor.getDate() + 1); break
      case 'semanal':    cursor.setDate(cursor.getDate() + 7); break
      case 'mensual':    cursor.setMonth(cursor.getMonth() + 1); break
      case 'bimestral':  cursor.setMonth(cursor.getMonth() + 2); break
      case 'trimestral': cursor.setMonth(cursor.getMonth() + 3); break
      case 'semestral':  cursor.setMonth(cursor.getMonth() + 6); break
      case 'anual':      cursor.setFullYear(cursor.getFullYear() + 1); break
    }
  }

  // Avanzar hasta llegar al mes (o quedarnos en él si ya estamos)
  while (cursor < primerDia) avanzar()

  // Recolectar todas las fechas dentro del mes
  while (cursor <= ultimoDia) {
    fechas.push(cursor.toISOString().split('T')[0])
    if (frecuencia === 'diaria' || frecuencia === 'semanal') {
      avanzar()
    } else {
      break // mensual o mayor: solo una fecha por mes
    }
  }

  return fechas
}

// Próxima fecha desde hoy basada en fecha de inicio y frecuencia
export function getProximaFechaDesdeConfig(fechaInicio: string, frecuencia: string): string {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const cursor = new Date(fechaInicio)

  const avanzar = () => {
    switch (frecuencia) {
      case 'diaria':     cursor.setDate(cursor.getDate() + 1); break
      case 'semanal':    cursor.setDate(cursor.getDate() + 7); break
      case 'mensual':    cursor.setMonth(cursor.getMonth() + 1); break
      case 'bimestral':  cursor.setMonth(cursor.getMonth() + 2); break
      case 'trimestral': cursor.setMonth(cursor.getMonth() + 3); break
      case 'semestral':  cursor.setMonth(cursor.getMonth() + 6); break
      case 'anual':      cursor.setFullYear(cursor.getFullYear() + 1); break
    }
  }

  // Si ya pasó, avanzar hasta la próxima
  while (cursor < hoy) avanzar()
  return cursor.toISOString().split('T')[0]
}
