'use client'
import { useState, useRef } from 'react'

export interface EquipoImportado {
  tipo: 'arnes' | 'polea' | 'casco'
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
}

interface ResumenImport {
  arneses: number
  poleas: number
  cascos: number
  total: number
  fecha: string
}

interface Props {
  onImportar: (equipos: EquipoImportado[], resumen: ResumenImport) => void
  onCerrar: () => void
}

function mapUbicacion(raw: string): EquipoImportado['ubicacion'] {
  const v = String(raw || '').trim().toUpperCase()
  if (v.startsWith('REP') || v === 'R') return 'para_reparar'
  if (v.startsWith('BAJA') || v === 'B') return 'baja'
  if (v === 'DEP' || v === 'D' || v.startsWith('DEP')) return 'deposito'
  if (v === 'EU' || v === 'TUR' || v === 'INSTR' || v === 'T' || v === 'I') return 'en_uso'
  return 'en_uso'
}

function mapUsoActual(raw: string, ubicacion: string): EquipoImportado['uso_actual'] {
  const v = String(raw || '').trim().toUpperCase()
  if (v === 'INSTR') return 'instructor'
  if (ubicacion === 'baja') return 'baja'
  if (ubicacion === 'deposito') return 'deposito'
  return 'turista'
}

function normalizarSector(raw: string): string {
  const v = String(raw || '').trim().toLowerCase()
  if (v.includes('tiro') || v.includes('tirolesa')) return 'tirolesa'
  if (v.includes('parque') || v.includes('aereo') || v.includes('aéreo')) return 'parque'
  if (v.includes('arque') || v.includes('arquería')) return 'arqueria'
  if (v.includes('instr')) return 'tirolesa' // instructores → tirolesa por defecto
  return v || 'tirolesa'
}

export default function ImportarExcelStock({ onImportar, onCerrar }: Props) {
  const [paso, setPaso] = useState<'subir' | 'preview' | 'procesando' | 'ok' | 'error'>('subir')
  const [equipos, setEquipos] = useState<EquipoImportado[]>([])
  const [error, setError] = useState('')
  const [fechaDoc, setFechaDoc] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function procesarArchivo(file: File) {
    setPaso('procesando')
    try {
      // Usamos FileReader para leer como ArrayBuffer y luego parseamos con SheetJS (si disponible)
      // Como SheetJS no está instalado, parseamos CSV básico o pedimos al usuario usar el xlsx parser
      // Verificar si xlsx está disponible
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const XLSX = (window as any).XLSX
      if (!XLSX) {
        // Cargar SheetJS dinámicamente
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
      let fechaArchivo = ''

      // --- ARNESES (hoja 'stock arneses') ---
      const sheetArn = wb.Sheets['stock arneses']
      if (sheetArn) {
        const rows: unknown[][] = XLSXLib.utils.sheet_to_json(sheetArn, { header: 1, defval: '' })
        // Fila 2 (índice 1) tiene la fecha en col 5
        const fechaRaw = rows[1]?.[5]
        if (fechaRaw instanceof Date) fechaArchivo = fechaRaw.toLocaleDateString('es-AR')
        else if (fechaRaw) fechaArchivo = String(fechaRaw)

        // Datos desde fila 5 (índice 4)
        for (let i = 4; i < rows.length; i++) {
          const r = rows[i] as unknown[]
          const marca = String(r[2] || '').trim()
          const modelo = String(r[3] || '').trim()
          if (!marca && !modelo) continue
          const serie = String(r[4] || '').trim()
          const ubicRaw = String(r[5] || '').trim()
          const ubicacion = mapUbicacion(ubicRaw)
          const instrRaw = String(r[6] || '').trim()
          const sector = normalizarSector(String(r[1] || '').trim())

          resultado.push({
            tipo: 'arnes',
            sector,
            marca,
            modelo,
            numero_serie: serie,
            ubicacion,
            instructor: instrRaw,
            uso_actual: mapUsoActual(instrRaw || ubicRaw, ubicacion),
            comprado: String(r[7] || ''),
            primer_uso: String(r[8] || ''),
            observaciones: String(r[9] || ''),
          })
        }
      }

      // --- POLEAS (hoja 'stock poleas') ---
      const sheetPol = wb.Sheets['stock poleas']
      if (sheetPol) {
        const rows: unknown[][] = XLSXLib.utils.sheet_to_json(sheetPol, { header: 1, defval: '' })
        for (let i = 4; i < rows.length; i++) {
          const r = rows[i] as unknown[]
          const marca = String(r[2] || '').trim()
          const modelo = String(r[3] || '').trim()
          if (!marca && !modelo) continue
          const serie = String(r[4] || '').trim()
          const ubicRaw = String(r[5] || '').trim()
          const ubicacion = mapUbicacion(ubicRaw)
          const instrRaw = String(r[6] || '').trim()
          const sector = normalizarSector(String(r[1] || '').trim())

          resultado.push({
            tipo: 'polea',
            sector,
            marca,
            modelo,
            numero_serie: serie,
            ubicacion,
            instructor: instrRaw,
            uso_actual: mapUsoActual(instrRaw || ubicRaw, ubicacion),
            comprado: String(r[7] || ''),
            primer_uso: String(r[8] || ''),
            observaciones: String(r[9] || ''),
          })
        }
      }

      // --- CASCOS (hoja 'Stock cascos') ---
      const sheetCasc = wb.Sheets['Stock cascos']
      if (sheetCasc) {
        const rows: unknown[][] = XLSXLib.utils.sheet_to_json(sheetCasc, { header: 1, defval: '' })
        // Datos desde fila 6 (índice 5): Ficha, INGRESO, SECTOR, USO, MARCA, MODELO, TALLE, COLOR, EN USO, DEPOSITO, PARA REPARAR, BAJA, obs
        for (let i = 5; i < rows.length; i++) {
          const r = rows[i] as unknown[]
          const marca = String(r[5] || '').trim()
          const modelo = String(r[6] || '').trim()
          if (!marca && !modelo) continue
          const enUso = Number(r[9]) || 0
          const deposito = Number(r[10]) || 0
          const reparar = Number(r[11]) || 0
          const baja = Number(r[12]) || 0
          const sector = normalizarSector(String(r[3] || '').trim())
          const obs = String(r[13] || '').trim()
          const talle = String(r[7] || '').trim()
          const color = String(r[8] || '').trim()

          // Expandir en filas individuales según cantidades
          for (let n = 0; n < enUso; n++) resultado.push({ tipo: 'casco', sector, marca, modelo: `${modelo} ${talle} ${color}`.trim(), numero_serie: `${marca}-${modelo}-${i}-eu-${n}`, ubicacion: 'en_uso', instructor: '', uso_actual: 'turista', comprado: '', primer_uso: '', observaciones: obs })
          for (let n = 0; n < deposito; n++) resultado.push({ tipo: 'casco', sector, marca, modelo: `${modelo} ${talle} ${color}`.trim(), numero_serie: `${marca}-${modelo}-${i}-dep-${n}`, ubicacion: 'deposito', instructor: '', uso_actual: 'deposito', comprado: '', primer_uso: '', observaciones: obs })
          for (let n = 0; n < reparar; n++) resultado.push({ tipo: 'casco', sector, marca, modelo: `${modelo} ${talle} ${color}`.trim(), numero_serie: `${marca}-${modelo}-${i}-rep-${n}`, ubicacion: 'para_reparar', instructor: '', uso_actual: 'deposito', comprado: '', primer_uso: '', observaciones: obs })
          for (let n = 0; n < baja; n++) resultado.push({ tipo: 'casco', sector, marca, modelo: `${modelo} ${talle} ${color}`.trim(), numero_serie: `${marca}-${modelo}-${i}-baja-${n}`, ubicacion: 'baja', instructor: '', uso_actual: 'baja', comprado: '', primer_uso: '', observaciones: obs })
        }
      }

      setFechaDoc(fechaArchivo)
      setEquipos(resultado)
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
      total: equipos.length,
      fecha: new Date().toISOString().split('T')[0],
    }
    onImportar(equipos, resumen)
    setPaso('ok')
  }

  const arneses = equipos.filter(e => e.tipo === 'arnes')
  const poleas = equipos.filter(e => e.tipo === 'polea')
  const cascos = equipos.filter(e => e.tipo === 'casco')

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
                  • <strong>stock arneses</strong> — datos desde fila 5, columnas: Ficha, Sector, Marca, Modelo, Serie, Ubicación...<br />
                  • <strong>stock poleas</strong> — misma estructura<br />
                  • <strong>Stock cascos</strong> — con columnas EN USO / DEPOSITO / PARA REPARAR / BAJA
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
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Leyendo arneses, poleas y cascos</p>
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
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { n: arneses.length, label: 'Arneses',  color: 'var(--c-teal)',   emoji: '🦺' },
                  { n: poleas.length,  label: 'Poleas',   color: '#1d4ed8',          emoji: '⚙️' },
                  { n: cascos.length,  label: 'Cascos',   color: '#7c3aed',          emoji: '⛑️' },
                ].map(({ n, label, color, emoji }) => (
                  <div key={label} className="rounded-2xl p-4 text-center" style={{ border: '1px solid var(--border)', background: 'white' }}>
                    <p className="text-3xl font-black" style={{ color }}>{n}</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{emoji} {label}</p>
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
                <div>
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
                {arneses.length} arneses · {poleas.length} poleas · {cascos.length} cascos
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
              ✓ Cargar {equipos.length} equipos al sistema
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
