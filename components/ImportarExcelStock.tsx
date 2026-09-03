'use client'
import { useState, useRef } from 'react'

export interface EquipoImportado {
  tipo: 'arnes' | 'polea' | 'casco' | 'arco'
  sector: string
  marca: string
  modelo: string
  numero_serie: string
  ubicacion: 'en_uso' | 'deposito' | 'para_reparar' | 'baja'
  instructor: string
  uso_actual: 'turista' | 'instructor' | 'deposito' | 'baja'
  comprado: string
  primer_uso: string
  observaciones: string
  caracteristicas?: string
}

export interface ItemVarios {
  sector: string
  nombre: string
  caracteristicas: string
  enUso: number
  deposito: number
  reparar: number
  repuestos: number
}

interface ResumenImport {
  arneses: number
  poleas: number
  cascos: number
  arcos: number
  varios: number
  total: number
  fecha: string
}

interface Props {
  onImportar: (equipos: EquipoImportado[], varios: ItemVarios[], resumen: ResumenImport) => void
  onCerrar: () => void
}

function mapUbicacionStatus(raw: string): EquipoImportado['ubicacion'] {
  const v = String(raw || '').trim().toUpperCase()
  if (v.includes('BAJA')) return 'baja'
  if (v === 'REP' || v.startsWith('REP')) return 'para_reparar'
  if (v === 'DEP') return 'deposito'
  if (v === 'EU' || v === 'INSTR' || v === 'T' || v === 'I') return 'en_uso'
  return 'deposito'
}

function mapUsoActual(raw: string, ubicacion: EquipoImportado['ubicacion']): EquipoImportado['uso_actual'] {
  const v = String(raw || '').trim().toUpperCase()
  if (v === 'INSTR') return 'instructor'
  if (ubicacion === 'baja') return 'baja'
  if (ubicacion === 'deposito') return 'deposito'
  return 'turista'
}

function normalizarSector(raw: string): string {
  const v = String(raw || '').trim().toLowerCase()
  if (v.includes('tiro')) return 'tirolesa'
  if (v.includes('parque') || v.includes('aereo') || v.includes('aéreo')) return 'parque'
  if (v.includes('arque') || v.includes('arquer')) return 'arqueria'
  if (v.includes('instr')) return 'tirolesa'
  if (v.includes('salon') || v.includes('salón')) return 'salon'
  return 'tirolesa'
}

export default function ImportarExcelStock({ onImportar, onCerrar }: Props) {
  const [paso, setPaso] = useState<'subir' | 'preview' | 'procesando' | 'ok' | 'error'>('subir')
  const [equipos, setEquipos] = useState<EquipoImportado[]>([])
  const [varios, setVarios] = useState<ItemVarios[]>([])
  const [error, setError] = useState('')
  const [fechaDoc, setFechaDoc] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function procesarArchivo(file: File) {
    setPaso('procesando')
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const XLSX = (window as any).XLSX
      if (!XLSX) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('No se pudo cargar el parser de Excel'))
          document.head.appendChild(script)
        })
      }

      const buffer = await file.arrayBuffer()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const XLSXLib = (window as any).XLSX
      const wb = XLSXLib.read(buffer, { type: 'array', cellDates: true })

      const resultado: EquipoImportado[] = []
      const resultadoVarios: ItemVarios[] = []
      let fechaArchivo = new Date().toLocaleDateString('es-AR')

      // Helper: normalizar UBIC → ubicacion + instructor
      function parseUbic(ubic: string, juego: string, uso: string): { ubicacion: EquipoImportado['ubicacion']; instructor: string } {
        const u = String(ubic || '').trim()
        const j = String(juego || '').trim().toUpperCase()
        const us = String(uso || '').trim().toUpperCase()
        if (us === 'NO') return { ubicacion: 'baja', instructor: '' }
        if (j === 'REPARAR') return { ubicacion: 'para_reparar', instructor: u }
        if (['EU', 'eu', 'E.U.'].includes(u) || u.toLowerCase() === 'eu') return { ubicacion: 'en_uso', instructor: '' }
        if (['DEP', 'dep', 'D', 'd'].includes(u)) return { ubicacion: 'deposito', instructor: '' }
        if (u === '') return { ubicacion: 'deposito', instructor: '' }
        // Es un nombre de instructor → en uso
        return { ubicacion: 'en_uso', instructor: u }
      }

      function sectorDeJuego(juego: string): string {
        const j = String(juego || '').trim().toUpperCase()
        if (j.includes('PARQUE') || j.includes('AEREO') || j.includes('AÉREO')) return 'parque'
        if (j.includes('TIRO')) return 'tirolesa'
        if (j.includes('INSTR')) return 'tirolesa'
        if (j.includes('REP')) return 'tirolesa'
        if (j.includes('DEP')) return 'tirolesa'
        return 'tirolesa'
      }

      // --- ARNESES (hoja 'stock arneses', datos desde fila 3 = índice 2) ---
      // A: nro_interno, B: marca, C: modelo, D: JUEGO, E: serie, F: ingreso, G: USO, H: UBIC, I: OBS
      const sheetArn = wb.Sheets['stock arneses']
      if (sheetArn) {
        const rows: unknown[][] = XLSXLib.utils.sheet_to_json(sheetArn, { header: 1, defval: '' })
        for (let i = 2; i < rows.length; i++) {
          const r = rows[i] as unknown[]
          const marca = String(r[1] || '').trim()
          const modelo = String(r[2] || '').trim()
          if (!marca && !modelo) continue
          const juego = String(r[3] || '').trim()
          const serie = String(r[4] || '').trim() || String(r[0] || i).trim()
          const ingreso = String(r[5] || '').trim()
          const uso = String(r[6] || '').trim()
          const ubicRaw = String(r[7] || '').trim()
          const obs = String(r[8] || '').trim()
          const sector = sectorDeJuego(juego)
          const { ubicacion, instructor } = parseUbic(ubicRaw, juego, uso)

          resultado.push({
            tipo: 'arnes',
            sector,
            marca,
            modelo,
            numero_serie: serie,
            ubicacion,
            instructor,
            uso_actual: uso.toUpperCase() === 'INSTR' ? 'instructor' : ubicacion === 'baja' ? 'baja' : ubicacion === 'deposito' ? 'deposito' : 'turista',
            comprado: ingreso,
            primer_uso: '',
            observaciones: obs,
          })
        }
      }

      // --- POLEAS (hoja 'stock ploeas' — typo en el Excel original) ---
      // B: n°, C: marca, D: modelo, E: JUEGO, F: serie, H: UBIC, I: actual
      const sheetPol = wb.Sheets['stock ploeas'] || wb.Sheets['stock poleas']
      if (sheetPol) {
        const rows: unknown[][] = XLSXLib.utils.sheet_to_json(sheetPol, { header: 1, defval: '' })
        for (let i = 2; i < rows.length; i++) {
          const r = rows[i] as unknown[]
          const marca = String(r[2] || '').trim()
          const modelo = String(r[3] || '').trim()
          if (!marca && !modelo) continue
          const juego = String(r[4] || '').trim()
          const serie = String(r[5] || '').trim() || String(r[1] || i).trim()
          const ubicRaw = String(r[7] || '').trim()
          const { ubicacion, instructor } = parseUbic(ubicRaw, juego, '')
          const sector = sectorDeJuego(juego)

          resultado.push({
            tipo: 'polea',
            sector,
            marca,
            modelo,
            numero_serie: serie,
            ubicacion,
            instructor,
            uso_actual: instructor ? 'instructor' : ubicacion === 'deposito' ? 'deposito' : 'turista',
            comprado: '',
            primer_uso: '',
            observaciones: '',
          })
        }
      }

      // --- CASCOS (hoja 'Stock cascos', datos desde fila 3 = índice 2) ---
      // B: color/nombre, C: marca, D: uso, E: instructor count, F: tirolesa, G: parque, H: deposito OK, I: reparar, J: total
      const sheetCasc = wb.Sheets['Stock cascos']
      if (sheetCasc) {
        const rows: unknown[][] = XLSXLib.utils.sheet_to_json(sheetCasc, { header: 1, defval: '' })
        for (let i = 2; i < rows.length; i++) {
          const r = rows[i] as unknown[]
          const nombre = String(r[1] || '').trim()
          const marca = String(r[2] || '').trim()
          if (!nombre && !marca) continue
          const uso = String(r[3] || '').trim().toLowerCase()
          const enUsoTirolesa = Number(r[5]) || 0
          const enUsoParque = Number(r[6]) || 0
          const deposito = Number(r[7]) || 0
          const reparar = Number(r[8]) || 0

          // Tirolesa
          for (let n = 0; n < enUsoTirolesa; n++) {
            resultado.push({ tipo: 'casco', sector: 'tirolesa', marca, modelo: nombre, numero_serie: `casco-${nombre}-tiro-eu${n}`, ubicacion: 'en_uso', instructor: '', uso_actual: uso.includes('instr') ? 'instructor' : 'turista', comprado: '', primer_uso: '', observaciones: '' })
          }
          // Parque
          for (let n = 0; n < enUsoParque; n++) {
            resultado.push({ tipo: 'casco', sector: 'parque', marca, modelo: nombre, numero_serie: `casco-${nombre}-parque-eu${n}`, ubicacion: 'en_uso', instructor: '', uso_actual: uso.includes('instr') ? 'instructor' : 'turista', comprado: '', primer_uso: '', observaciones: '' })
          }
          // Depósito
          for (let n = 0; n < deposito; n++) {
            resultado.push({ tipo: 'casco', sector: 'tirolesa', marca, modelo: nombre, numero_serie: `casco-${nombre}-dep${n}`, ubicacion: 'deposito', instructor: '', uso_actual: 'deposito', comprado: '', primer_uso: '', observaciones: '' })
          }
          // Reparar
          for (let n = 0; n < reparar; n++) {
            resultado.push({ tipo: 'casco', sector: 'tirolesa', marca, modelo: nombre, numero_serie: `casco-${nombre}-rep${n}`, ubicacion: 'para_reparar', instructor: '', uso_actual: 'deposito', comprado: '', primer_uso: '', observaciones: '' })
          }
        }
      }

      // --- ARCOS (hoja 'stock arcos', datos desde fila 4 = índice 3) ---
      // B: modelo, C: marca, D: dureza, E: uso, F: derecho, G: zurdo, H: ambidiestro, I: deposito, J: en_uso, K: total
      const sheetArc = wb.Sheets['stock arcos']
      if (sheetArc) {
        const rows: unknown[][] = XLSXLib.utils.sheet_to_json(sheetArc, { header: 1, defval: '' })
        for (let i = 3; i < rows.length; i++) {
          const r = rows[i] as unknown[]
          const modelo = String(r[1] || '').trim()
          const marca = String(r[2] || '').trim()
          if (!modelo && !marca) continue
          const dureza = String(r[3] || '').trim()
          const uso = String(r[4] || '').trim()
          const derechos = Number(r[5]) || 0
          const zurdos = Number(r[6]) || 0
          const ambidestros = Number(r[7]) || 0
          const deposito = Number(r[8]) || 0
          const enUso = Number(r[9]) || 0
          const caracteristicas = [dureza, uso].filter(Boolean).join(' — ')

          for (let n = 0; n < derechos; n++) resultado.push({ tipo: 'arco', sector: 'arqueria', marca, modelo, numero_serie: `arco-${modelo}-${marca}-der${n}`, ubicacion: 'en_uso', instructor: '', uso_actual: 'turista', comprado: '', primer_uso: '', observaciones: '', caracteristicas: caracteristicas + ' derecho' })
          for (let n = 0; n < zurdos; n++) resultado.push({ tipo: 'arco', sector: 'arqueria', marca, modelo, numero_serie: `arco-${modelo}-${marca}-zur${n}`, ubicacion: 'en_uso', instructor: '', uso_actual: 'turista', comprado: '', primer_uso: '', observaciones: '', caracteristicas: caracteristicas + ' zurdo' })
          for (let n = 0; n < ambidestros; n++) resultado.push({ tipo: 'arco', sector: 'arqueria', marca, modelo, numero_serie: `arco-${modelo}-${marca}-amb${n}`, ubicacion: 'en_uso', instructor: '', uso_actual: 'turista', comprado: '', primer_uso: '', observaciones: '', caracteristicas })
          for (let n = 0; n < deposito; n++) resultado.push({ tipo: 'arco', sector: 'arqueria', marca, modelo, numero_serie: `arco-${modelo}-${marca}-dep${n}`, ubicacion: 'deposito', instructor: '', uso_actual: 'deposito', comprado: '', primer_uso: '', observaciones: '', caracteristicas })
        }
      }

      // --- VARIOS (hoja 'stock varios', datos desde fila 4 = índice 3) ---
      // B: nombre, C: marca, D: turista, E: instructor, F: mantenimiento, G: depositoOK, H: deposito reparar, I: total
      const sheetVar = wb.Sheets['stock varios'] || wb.Sheets['stock  varios']
      if (sheetVar) {
        const rows: unknown[][] = XLSXLib.utils.sheet_to_json(sheetVar, { header: 1, defval: '' })
        for (let i = 3; i < rows.length; i++) {
          const r = rows[i] as unknown[]
          const nombre = String(r[1] || '').trim()
          if (!nombre || nombre.toLowerCase().includes('material')) continue
          const marca = String(r[2] || '').trim()
          const turista = Number(r[3]) || 0
          const instructor = Number(r[4]) || 0
          const mantenimiento = Number(r[5]) || 0
          const depositoOK = Number(r[6]) || 0
          const depositoRep = Number(r[7]) || 0

          resultadoVarios.push({
            sector: 'tirolesa',
            nombre: `${nombre}${marca ? ` (${marca})` : ''}`,
            caracteristicas: marca,
            enUso: turista + instructor + mantenimiento,
            deposito: depositoOK,
            reparar: depositoRep,
            repuestos: 0,
          })
        }
      }


      setFechaDoc(fechaArchivo)
      setEquipos(resultado)
      setVarios(resultadoVarios)
      setPaso('preview')
    } catch (e) {
      setError(String(e))
      setPaso('error')
    }
  }

  function confirmar() {
    const resumen: ResumenImport = {
      arneses: equipos.filter(e => e.tipo === 'arnes').length,
      poleas: equipos.filter(e => e.tipo === 'polea').length,
      cascos: equipos.filter(e => e.tipo === 'casco').length,
      arcos: equipos.filter(e => e.tipo === 'arco').length,
      varios: varios.length,
      total: equipos.length,
      fecha: new Date().toISOString().split('T')[0],
    }
    onImportar(equipos, varios, resumen)
    setPaso('ok')
  }

  const arneses = equipos.filter(e => e.tipo === 'arnes')
  const poleas = equipos.filter(e => e.tipo === 'polea')
  const cascos = equipos.filter(e => e.tipo === 'casco')
  const arcos = equipos.filter(e => e.tipo === 'arco')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full flex flex-col"
        style={{ maxWidth: 680, maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ background: '#1a202c', borderRadius: '16px 16px 0 0' }}>
          <div>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 16, color: 'white' }}>
              📥 Importar Stock desde Excel
            </p>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 }}>
              Formato: Stock General AEA.xlsx
            </p>
          </div>
          <button onClick={onCerrar} className="w-8 h-8 rounded-full flex items-center justify-center text-white"
            style={{ background: 'rgba(255,255,255,0.15)' }}>✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">

          {/* PASO: subir */}
          {paso === 'subir' && (
            <div>
              <div className="rounded-2xl p-5 mb-5" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#92400e' }}>📋 Formato esperado</p>
                <p className="text-xs" style={{ color: '#78350f', lineHeight: 1.6 }}>
                  El archivo debe ser el Excel <strong>Stock General AEA.xlsx</strong> con las hojas:<br />
                  • <strong>stock arneses</strong> — datos desde fila 4, col[11]=status<br />
                  • <strong>stock poleas</strong> — misma estructura<br />
                  • <strong>Stock cascos</strong> — con columnas EN USO / DEPOSITO / PARA REPARAR / BAJA<br />
                  • <strong>stock arcos</strong> — arcos individuales de arquería<br />
                  • <strong>stock  varios</strong> — guantines, lentes, protectores por sector
                </p>
              </div>

              <div
                className="rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all"
                style={{ border: '2px dashed var(--border)', padding: '48px 24px', background: 'var(--bg-subtle)' }}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) procesarArchivo(f) }}>
                <div className="text-5xl mb-3">📂</div>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--text-main)' }}>
                  Arrastrá el archivo o hacé click
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Acepta .xlsx y .xls</p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) procesarArchivo(f) }} />
              </div>
            </div>
          )}

          {/* PASO: procesando */}
          {paso === 'procesando' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-4xl mb-4">⏳</div>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, color: 'var(--text-main)' }}>Procesando Excel...</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Leyendo arneses, poleas, cascos, arcos y varios</p>
            </div>
          )}

          {/* PASO: preview */}
          {paso === 'preview' && (
            <div>
              {fechaDoc && (
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                  📅 Fecha del documento: <strong>{fechaDoc}</strong>
                </p>
              )}

              {/* Resumen */}
              <div className="grid grid-cols-5 gap-2 mb-5">
                {[
                  { n: arneses.length, label: 'Arneses',  color: 'var(--c-teal)',   emoji: '🦺' },
                  { n: poleas.length,  label: 'Poleas',   color: '#1d4ed8',          emoji: '⚙️' },
                  { n: cascos.length,  label: 'Cascos',   color: '#7c3aed',          emoji: '⛑️' },
                  { n: arcos.length,   label: 'Arcos',    color: '#92400e',          emoji: '🏹' },
                  { n: varios.length,  label: 'Varios',   color: '#64748b',          emoji: '📦' },
                ].map(({ n, label, color, emoji }) => (
                  <div key={label} className="rounded-2xl p-3 text-center" style={{ border: '1px solid var(--border)', background: 'white' }}>
                    <p className="text-2xl font-black" style={{ color }}>{n}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{emoji} {label}</p>
                  </div>
                ))}
              </div>

              {/* Preview arneses */}
              {arneses.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    🦺 Arneses (primeros {Math.min(arneses.length, 8)} de {arneses.length})
                  </p>
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    {arneses.slice(0, 8).map((e, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5 text-sm"
                        style={{ borderBottom: i < 7 ? '1px solid var(--border-light)' : 'none', background: i % 2 ? 'white' : 'var(--bg-subtle)' }}>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: e.ubicacion === 'en_uso' ? '#dcfce7' : e.ubicacion === 'para_reparar' ? '#fff7ed' : '#f1f5f9', color: e.ubicacion === 'en_uso' ? '#16a34a' : e.ubicacion === 'para_reparar' ? '#c2410c' : '#64748b' }}>
                          {e.ubicacion === 'en_uso' ? 'Uso' : e.ubicacion === 'deposito' ? 'Dep' : e.ubicacion === 'para_reparar' ? 'Rep' : 'Baja'}
                        </span>
                        <span style={{ color: 'var(--text-sub)', flexShrink: 0, fontSize: 11 }}>{e.sector}</span>
                        <span className="flex-1 truncate" style={{ color: 'var(--text-main)' }}>{e.marca} {e.modelo}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>S/N {e.numero_serie}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview poleas */}
              {poleas.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    ⚙️ Poleas (primeros {Math.min(poleas.length, 5)} de {poleas.length})
                  </p>
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    {poleas.slice(0, 5).map((e, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5 text-sm"
                        style={{ borderBottom: i < 4 ? '1px solid var(--border-light)' : 'none', background: i % 2 ? 'white' : 'var(--bg-subtle)' }}>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: e.ubicacion === 'en_uso' ? '#dcfce7' : e.ubicacion === 'para_reparar' ? '#fff7ed' : '#f1f5f9', color: e.ubicacion === 'en_uso' ? '#16a34a' : e.ubicacion === 'para_reparar' ? '#c2410c' : '#64748b' }}>
                          {e.ubicacion === 'en_uso' ? 'Uso' : e.ubicacion === 'deposito' ? 'Dep' : e.ubicacion === 'para_reparar' ? 'Rep' : 'Baja'}
                        </span>
                        <span style={{ color: 'var(--text-sub)', flexShrink: 0, fontSize: 11 }}>{e.instructor || e.sector}</span>
                        <span className="flex-1 truncate" style={{ color: 'var(--text-main)' }}>{e.marca} {e.modelo}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>S/N {e.numero_serie}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview arcos */}
              {arcos.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    🏹 Arcos ({arcos.length})
                  </p>
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    {arcos.slice(0, 5).map((e, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5 text-sm"
                        style={{ borderBottom: i < Math.min(arcos.length, 5) - 1 ? '1px solid var(--border-light)' : 'none', background: i % 2 ? 'white' : 'var(--bg-subtle)' }}>
                        <span className="flex-1 truncate" style={{ color: 'var(--text-main)' }}>{e.marca} {e.modelo}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{e.caracteristicas}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview varios */}
              {varios.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    📦 Varios ({varios.length} ítems)
                  </p>
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    {varios.slice(0, 5).map((v, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5 text-sm"
                        style={{ borderBottom: i < Math.min(varios.length, 5) - 1 ? '1px solid var(--border-light)' : 'none', background: i % 2 ? 'white' : 'var(--bg-subtle)' }}>
                        <span style={{ color: 'var(--text-sub)', flexShrink: 0, fontSize: 11 }}>{v.sector}</span>
                        <span className="flex-1 truncate" style={{ color: 'var(--text-main)' }}>{v.nombre}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>uso:{v.enUso} dep:{v.deposito}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO: ok */}
          {paso === 'ok' && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-5xl mb-4">✅</div>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--text-main)' }}>
                {equipos.length} equipos importados
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>
                {arneses.length} arneses · {poleas.length} poleas · {cascos.length} cascos · {arcos.length} arcos · {varios.length} items varios
              </p>
            </div>
          )}

          {/* PASO: error */}
          {paso === 'error' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-5xl mb-4">❌</div>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, color: '#dc2626' }}>Error al procesar</p>
              <p className="text-sm mt-2 max-w-xs" style={{ color: 'var(--text-muted)' }}>{error}</p>
              <button onClick={() => setPaso('subir')} className="mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--bg-subtle)', color: 'var(--text-sub)', border: '1px solid var(--border)' }}>
                Intentar de nuevo
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onCerrar}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
            {paso === 'ok' ? 'Cerrar' : 'Cancelar'}
          </button>
          {paso === 'preview' && (
            <button onClick={confirmar}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'var(--c-teal)' }}>
              ✓ Cargar {equipos.length} equipos + {varios.length} varios
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
