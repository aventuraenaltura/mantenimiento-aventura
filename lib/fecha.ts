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
