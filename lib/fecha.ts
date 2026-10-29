/**
 * Convierte una fecha ISO (YYYY-MM-DD) a formato dd/mm/yyyy
 * Funciona con strings y objetos Date
 */
export function fmtFecha(fecha: string | Date | null | undefined): string {
  if (!fecha) return '—'
  // Si es string ISO: parsear sin crear objeto Date (evita desfase de timezone)
  if (typeof fecha === 'string') {
    const partes = fecha.split('T')[0].split('-')
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`
  }
  const d = fecha instanceof Date ? fecha : new Date(fecha)
  if (isNaN(d.getTime())) return String(fecha)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Convierte 'YYYY-MM-DD' a Date a las 00:00 hora local.
 * new Date('YYYY-MM-DD') la toma como UTC y en Argentina queda el día anterior.
 */
export function parseFecha(fecha: string): Date {
  const [a, m, d] = fecha.split('T')[0].split('-').map(Number)
  return new Date(a, (m || 1) - 1, d || 1)
}

/** Date → 'YYYY-MM-DD' usando la fecha local (toISOString usa UTC: después de las 21 hs daría mañana) */
export function isoFecha(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Fecha de hoy en hora local como 'YYYY-MM-DD' */
export function hoyISO(): string {
  return isoFecha(new Date())
}
