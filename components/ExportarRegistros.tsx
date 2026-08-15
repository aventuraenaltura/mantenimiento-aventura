'use client'
import { useState } from 'react'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import { PLANILLAS_INICIALES, ACTIVIDADES } from '@/lib/datos-iniciales'

interface Ejecucion {
  id: string
  planilla_id: string
  fecha: string
  proxima_fecha: string
  ejecutado_por: string
  controlo?: string
  ingeniero?: string
  tiempo_min?: number
  repuestos?: string
  observaciones?: string
  archivo_nombre?: string
  archivo_data?: string
  archivo_url?: string
  archivos_agrimensor?: { nombre: string; data: string }[]
}

const ACTIVIDADES_IDS = ['tirolesa', 'arqueria', 'parque', 'salon']

function obtenerTodasEjecuciones(): Ejecucion[] {
  const todas: Ejecucion[] = []
  for (const id of ACTIVIDADES_IDS) {
    try {
      const raw = localStorage.getItem(`ejecuciones_${id}`)
      if (raw) {
        const ejs: Ejecucion[] = JSON.parse(raw)
        todas.push(...ejs)
      }
    } catch { /* skip */ }
  }
  return todas
}

function nombrePlanilla(codigo: string): string {
  return PLANILLAS_INICIALES.find(p => p.codigo === codigo)?.nombre ?? codigo
}

function nombreActividad(codigoPlanilla: string): string {
  const p = PLANILLAS_INICIALES.find(pl => pl.codigo === codigoPlanilla)
  if (!p) return '—'
  return ACTIVIDADES.find(a => a.id === p.actividad_id)?.nombre ?? p.actividad_id
}

function mesLabel(fecha: string): string {
  const [anio, mes] = fecha.split('-')
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return `${anio}-${mes.padStart(2,'0')}-${meses[parseInt(mes)-1]}`
}

export default function ExportarRegistros() {
  const [abierto, setAbierto] = useState(false)
  const hoy = new Date().toISOString().split('T')[0]
  const hace6meses = new Date(); hace6meses.setMonth(hace6meses.getMonth() - 6)
  const [desde, setDesde] = useState(hace6meses.toISOString().split('T')[0])
  const [hasta, setHasta] = useState(hoy)
  const [exportando, setExportando] = useState(false)
  const [progreso, setProgreso] = useState('')

  async function exportar() {
    setExportando(true)
    setProgreso('Recopilando registros...')

    const todas = obtenerTodasEjecuciones()
    const filtradas = todas.filter(e => e.fecha >= desde && e.fecha <= hasta)

    if (filtradas.length === 0) {
      setProgreso('No hay registros en ese rango de fechas.')
      setExportando(false)
      return
    }

    const zip = new JSZip()

    // Agrupar por mes
    const porMes: Record<string, Ejecucion[]> = {}
    for (const ej of filtradas) {
      const mes = ej.fecha.substring(0, 7) // YYYY-MM
      if (!porMes[mes]) porMes[mes] = []
      porMes[mes].push(ej)
    }

    // Crear Excel global con todos los registros
    setProgreso('Generando planilla Excel...')
    const filas = filtradas
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map(ej => ({
        'Fecha': ej.fecha,
        'Actividad': nombreActividad(ej.planilla_id),
        'Planilla': nombrePlanilla(ej.planilla_id),
        'Código': ej.planilla_id,
        'Ejecutado por': ej.ejecutado_por,
        'Controló': ej.controlo ?? '',
        'Ingeniero': ej.ingeniero ?? '',
        'Tiempo (min)': ej.tiempo_min ?? '',
        'Repuestos': ej.repuestos ?? '',
        'Observaciones': ej.observaciones ?? '',
        'Próxima fecha': ej.proxima_fecha,
        'Archivo adjunto': ej.archivo_url ?? (ej.archivo_nombre ? '(local)' : ''),
      }))

    const ws = XLSX.utils.json_to_sheet(filas)
    // Ancho de columnas
    ws['!cols'] = [
      { wch: 12 }, { wch: 18 }, { wch: 30 }, { wch: 12 },
      { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 12 },
      { wch: 25 }, { wch: 35 }, { wch: 14 }, { wch: 50 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Registros')

    // Hoja resumen por mes
    const resMes = Object.entries(porMes).map(([mes, ejs]) => ({
      'Mes': mesLabel(mes),
      'Registros': ejs.length,
      'Archivos adjuntos': ejs.filter(e => e.archivo_url || e.archivo_nombre).length,
    }))
    const wsRes = XLSX.utils.json_to_sheet(resMes)
    wsRes['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, wsRes, 'Resumen por mes')

    const excelBuf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    zip.file('Registros de Mantenimiento.xlsx', excelBuf)

    // Descargar PDFs adjuntos de Supabase y agregarlos al ZIP
    let pdfCount = 0
    for (const [mes, ejs] of Object.entries(porMes)) {
      const mesNombre = mesLabel(mes)
      const carpetaMes = zip.folder(mesNombre)!

      for (const ej of ejs) {
        const planillaNombre = nombrePlanilla(ej.planilla_id).replace(/[/\\?%*:|"<>]/g, '-')

        // PDF firmado
        if (ej.archivo_url) {
          pdfCount++
          setProgreso(`Descargando PDF ${pdfCount}...`)
          try {
            const resp = await fetch(ej.archivo_url)
            if (resp.ok) {
              const buf = await resp.arrayBuffer()
              const ext = ej.archivo_nombre?.split('.').pop() ?? 'pdf'
              carpetaMes.file(`${ej.fecha}-${planillaNombre}.${ext}`, buf)
            }
          } catch { /* si falla, se omite */ }
        } else if (ej.archivo_data && ej.archivo_data.startsWith('data:')) {
          // legacy base64
          const base64 = ej.archivo_data.split(',')[1]
          const ext = ej.archivo_nombre?.split('.').pop() ?? 'pdf'
          carpetaMes.file(`${ej.fecha}-${planillaNombre}.${ext}`, base64, { base64: true })
        }

        // Archivos agrimensor (solo MP01-005)
        if (ej.archivos_agrimensor?.length) {
          const subcarpeta = carpetaMes.folder('agrimensor')!
          for (let agIdx = 0; agIdx < ej.archivos_agrimensor.length; agIdx++) {
            const ag = ej.archivos_agrimensor[agIdx]
            const ext = ag.nombre.split('.').pop() ?? 'pdf'
            const nombreBase = ag.nombre.replace(`.${ext}`, '')
            // índice garantiza unicidad aunque dos archivos tengan el mismo nombre
            const nombreZip = `${ej.fecha}-${planillaNombre}-medicion-${agIdx + 1}-${nombreBase}.${ext}`
            if (ag.data.startsWith('http')) {
              try {
                const resp = await fetch(ag.data)
                if (resp.ok) {
                  const buf = await resp.arrayBuffer()
                  subcarpeta.file(nombreZip, buf)
                }
              } catch { /* omitir */ }
            } else if (ag.data.startsWith('data:')) {
              const base64 = ag.data.split(',')[1]
              subcarpeta.file(nombreZip, base64, { base64: true })
            }
          }
        }
      }
    }

    setProgreso('Comprimiendo archivos...')
    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })

    // Descargar
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Mantenimiento_${desde}_${hasta}.zip`
    a.click()
    URL.revokeObjectURL(url)

    setProgreso(`✅ Listo — ${filtradas.length} registros exportados.`)
    setTimeout(() => {
      setExportando(false)
      setProgreso('')
      setAbierto(false)
    }, 2500)
  }

  return (
    <>
      {/* Botón en home */}
      <button
        onClick={() => setAbierto(true)}
        className="rounded-2xl p-4 flex items-center gap-3 cursor-pointer w-full text-left"
        style={{ background: 'white', border: '1px solid var(--border)' }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: '#f0fdf4' }}>📦</div>
        <div className="flex-1 min-w-0">
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--text-main)' }}>
            Exportar registros
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>ZIP con Excel + PDFs adjuntos</p>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>↓</span>
      </button>

      {/* Modal */}
      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18 }}>
                  📦 Exportar registros
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Excel + PDFs adjuntos comprimidos</p>
              </div>
              {!exportando && (
                <button onClick={() => setAbierto(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Desde</label>
                <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  style={{ border: '1.5px solid #e5e7eb' }} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Hasta</label>
                <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  style={{ border: '1.5px solid #e5e7eb' }} />
              </div>

              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500">
                El ZIP incluye:<br />
                📊 <strong>Excel</strong> con todos los registros del período<br />
                📁 <strong>Carpetas por mes</strong> con los PDFs firmados adjuntos
              </div>

              {progreso && (
                <div className="bg-teal-50 rounded-xl p-3 text-xs text-teal-700 font-medium text-center">
                  {exportando && progreso !== '✅ Listo — ' && (
                    <span className="inline-block mr-2 animate-spin">⏳</span>
                  )}
                  {progreso}
                </div>
              )}

              <button
                onClick={exportar}
                disabled={exportando || !desde || !hasta || desde > hasta}
                className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: '#1e3a3a' }}
              >
                {exportando ? 'Exportando...' : '⬇️ Descargar ZIP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
