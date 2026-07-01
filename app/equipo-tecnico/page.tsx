'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSesion } from '@/lib/usuarios'
import ImportarExcelStock, { type EquipoImportado } from '@/components/ImportarExcelStock'

interface Equipo {
  id: string
  tipo: string
  numero_interno: string
  marca: string
  modelo: string
  numero_serie: string
  ubicacion: string
  sector?: string
  historial?: { fecha: string; accion: string; por: string }[]
}

interface ModeloSimple {
  id: string
  modelo: string
  color: string
  enUso: number
  deposito: number
  reparar: number
}

interface StockSector {
  equipos: Equipo[]
  cascos: ModeloSimple[]
  guantines: ModeloSimple[]
  lentes: ModeloSimple[]
}

interface CargaHistorial {
  id: string
  fecha: string
  fechaDoc: string
  cargadoPor: string
  arneses: number
  poleas: number
  cascos: number
  total: number
}

const SECTORES = [
  { slug: 'tirolesa', nombre: 'Tirolesa',    icono: '🪂', color: '#F5C800', textColor: '#1a1a1a' },
  { slug: 'parque',   nombre: 'Parque Aéreo', icono: '🌲', color: '#4FC3F7', textColor: '#1a1a1a' },
  { slug: 'arqueria', nombre: 'Arquería',     icono: '🎯', color: '#2d8a4e', textColor: '#ffffff' },
]

function loadSector(slug: string): StockSector {
  const parse = (key: string) => { try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] } }
  return {
    equipos:   parse(`inv_${slug}_equipos`),
    cascos:    parse(`inv_${slug}_cascos`),
    guantines: parse(`inv_${slug}_guantines`),
    lentes:    parse(`inv_${slug}_lentes`),
  }
}

function BarraStat({ label, valor, total, color }: { label: string; valor: number; total: number; color: string }) {
  const pct = total > 0 ? (valor / total) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span className="font-bold" style={{ color }}>{valor}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'var(--border-light)' }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function imprimirStockActual(stocks: Record<string, StockSector>, historial: CargaHistorial[]) {
  const ultima = historial[historial.length - 1]
  const hoy = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const filasSectores = SECTORES.map(s => {
    const st = stocks[s.slug]
    const arneses = st?.equipos.filter(e => e.tipo === 'arnes').length ?? 0
    const poleas  = st?.equipos.filter(e => e.tipo === 'polea').length ?? 0
    const cascos  = st?.cascos.reduce((a, c) => a + c.enUso + c.deposito + c.reparar, 0) ?? 0
    const enUso   = st?.equipos.filter(e => e.ubicacion === 'en_uso').length ?? 0
    const reparar = st?.equipos.filter(e => e.ubicacion === 'para_reparar').length ?? 0
    return `<tr>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-weight:700">${s.icono} ${s.nombre}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;color:#16a34a;font-weight:700">${arneses}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;color:#2563eb;font-weight:700">${poleas}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;color:#7c3aed;font-weight:700">${cascos}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;color:#0d9e96;font-weight:700">${enUso}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;color:#f97316;font-weight:700">${reparar}</td>
    </tr>`
  }).join('')

  const ventana = window.open('', '_blank', 'width=900,height=700')
  if (!ventana) return
  ventana.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>
    <title>Control de Stock — Aventura en Altura</title>
    <style>
      * { box-sizing:border-box; margin:0; padding:0; }
      body { font-family:Arial,sans-serif; color:#1a202c; padding:0; }
      .header { background:#0d9e96; color:white; padding:24px 32px 20px; }
      .header h1 { font-size:22px; font-weight:900; }
      .header p { font-size:12px; opacity:.75; margin-top:4px; }
      .meta { padding:14px 32px; background:#f8fafb; border-bottom:1px solid #e2e8f0; font-size:12px; color:#4a5568; display:flex; gap:24px; }
      table { width:100%; border-collapse:collapse; margin:24px 32px; width:calc(100% - 64px); }
      th { background:#f0fdfb; color:#0a8880; padding:10px 14px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.5px; border-bottom:2px solid #0d9e96; }
      th:not(:first-child) { text-align:center; }
      .firma { margin:32px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:32px; }
      .firma-box { border-top:1px solid #cbd5e0; padding-top:6px; font-size:11px; color:#718096; }
      .footer { margin-top:32px; padding:12px 32px; border-top:1px solid #e2e8f0; font-size:10px; color:#a0aec0; display:flex; justify-content:space-between; }
      @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
    </style></head><body>
    <div class="header">
      <h1>📦 Control Semestral de Stock</h1>
      <p>Aventura en Altura · Ptatanka SRL · Villa Carlos Paz, Córdoba</p>
    </div>
    <div class="meta">
      <span>📅 Fecha de control: <strong>${hoy}</strong></span>
      ${ultima ? `<span>📥 Última carga: <strong>${ultima.fecha}</strong> por ${ultima.cargadoPor}</span>` : ''}
    </div>
    <table>
      <thead><tr>
        <th>Sector</th><th>Arneses</th><th>Poleas</th><th>Cascos</th><th>En uso</th><th>Para reparar</th>
      </tr></thead>
      <tbody>${filasSectores}</tbody>
    </table>
    <div class="firma">
      <div class="firma-box">Responsable de control</div>
      <div class="firma-box">Firma</div>
      <div class="firma-box">Fecha próximo control</div>
    </div>
    <div class="footer">
      <span>Aventura en Altura · Sistema de Mantenimiento</span>
      <span>Impreso el ${hoy}</span>
    </div>
    <script>window.onload=function(){window.print()}<\/script>
  </body></html>`)
  ventana.document.close()
}

export default function EquipoTecnicoPage() {
  const [stocks, setStocks] = useState<Record<string, StockSector>>({})
  const [cargado, setCargado] = useState(false)
  const [vistaActiva, setVistaActiva] = useState<'resumen' | 'reparar' | 'historial'>('resumen')
  const [mostrarImport, setMostrarImport] = useState(false)
  const [historialCargas, setHistorialCargas] = useState<CargaHistorial[]>([])
  const [sesion, setSesion] = useState<{ nombre: string; rol: string } | null>(null)

  useEffect(() => {
    setSesion(getSesion())
    const result: Record<string, StockSector> = {}
    for (const s of SECTORES) result[s.slug] = loadSector(s.slug)
    setStocks(result)
    try {
      const raw = localStorage.getItem('historial_cargas_stock')
      if (raw) setHistorialCargas(JSON.parse(raw))
    } catch { /* noop */ }
    setCargado(true)
  }, [])

  const equiposReparar: (Equipo & { sectorSlug: string })[] = []
  for (const s of SECTORES) {
    for (const e of (stocks[s.slug]?.equipos ?? [])) {
      if (e.ubicacion === 'para_reparar') equiposReparar.push({ ...e, sectorSlug: s.slug })
    }
  }

  function handleImportar(equipos: EquipoImportado[], resumen: { arneses: number; poleas: number; cascos: number; total: number; fecha: string }) {
    // Guardar equipos separados por sector
    const porSector: Record<string, EquipoImportado[]> = {}
    for (const e of equipos) {
      if (!porSector[e.sector]) porSector[e.sector] = []
      porSector[e.sector].push(e)
    }

    // Guardar en localStorage por sector
    for (const [sector, items] of Object.entries(porSector)) {
      const arnesesPol = items.filter(e => e.tipo === 'arnes' || e.tipo === 'polea').map((e, i) => ({
        id: `${e.tipo}-${e.numero_serie || i}-${sector}`,
        tipo: e.tipo,
        numero_interno: String(i + 1),
        marca: e.marca,
        modelo: e.modelo,
        numero_serie: e.numero_serie,
        actividad: sector,
        ubicacion: e.ubicacion,
        uso_actual: e.uso_actual,
        estado: 'bueno',
        fecha_ingreso: e.primer_uso || '',
        observaciones: e.observaciones,
        historial: e.instructor ? [{ fecha: resumen.fecha, accion: `Asignado a instructor: ${e.instructor}`, por: 'Sistema' }] : [],
      }))
      const existing = JSON.parse(localStorage.getItem(`inv_${sector}_equipos`) || '[]')
      const merged = [...existing]
      for (const eq of arnesesPol) {
        if (!merged.find((x: Equipo) => x.numero_serie === eq.numero_serie)) merged.push(eq)
      }
      localStorage.setItem(`inv_${sector}_equipos`, JSON.stringify(merged))
    }

    // Registrar en historial
    const nueva: CargaHistorial = {
      id: `carga-${Date.now()}`,
      fecha: new Date().toLocaleDateString('es-AR'),
      fechaDoc: resumen.fecha,
      cargadoPor: sesion?.nombre ?? 'Sistema',
      arneses: resumen.arneses,
      poleas: resumen.poleas,
      cascos: resumen.cascos,
      total: resumen.total,
    }
    const nuevoHistorial = [...historialCargas, nueva]
    setHistorialCargas(nuevoHistorial)
    localStorage.setItem('historial_cargas_stock', JSON.stringify(nuevoHistorial))

    // Recargar stocks
    const result: Record<string, StockSector> = {}
    for (const s of SECTORES) result[s.slug] = loadSector(s.slug)
    setStocks(result)
    setMostrarImport(false)
    setVistaActiva('historial')
  }

  const esAdmin = sesion?.rol === 'admin'

  if (!cargado) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
      <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>

      {/* Header */}
      <div style={{ background: 'var(--c-teal)', color: 'white', padding: '16px 20px' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/home" className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)' }}>←</Link>
            <div>
              <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18 }}>🎽 Equipo Técnico</h1>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Stock consolidado de todos los sectores</p>
            </div>
          </div>
          {esAdmin && (
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => imprimirStockActual(stocks, historialCargas)}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
                🖨️ <span className="hidden sm:inline">Imprimir stock</span>
              </button>
              <button onClick={() => setMostrarImport(true)}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl"
                style={{ background: 'var(--c-yellow)', color: '#1a1a1a' }}>
                📥 <span className="hidden sm:inline">Importar Excel</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {([
            ['resumen',  '📊 Resumen'],
            ['reparar',  `🔧 Para reparar (${equiposReparar.length})`],
            ['historial',`📋 Historial cargas (${historialCargas.length})`],
          ] as const).map(([v, l]) => (
            <button key={v} onClick={() => setVistaActiva(v)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={vistaActiva === v
                ? { background: 'var(--c-teal)', color: 'white' }
                : { background: 'white', color: 'var(--text-sub)', border: '1px solid var(--border)' }}>
              {l}
            </button>
          ))}
        </div>

        {/* ── RESUMEN ── */}
        {vistaActiva === 'resumen' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {SECTORES.map(s => {
                const st = stocks[s.slug]
                const arneses = st?.equipos.filter(e => e.tipo === 'arnes') ?? []
                const poleas  = st?.equipos.filter(e => e.tipo === 'polea') ?? []
                const cascos  = st?.equipos.filter(e => e.tipo === 'casco') ?? []
                const totalEquipos = arneses.length + poleas.length
                const enUso   = st?.equipos.filter(e => e.ubicacion === 'en_uso').length ?? 0
                const reparar = st?.equipos.filter(e => e.ubicacion === 'para_reparar').length ?? 0
                const totalCascosAcc    = st?.cascos.reduce((a, c) => a + c.enUso + c.deposito + c.reparar, 0) ?? 0
                const totalGuantines = st?.guantines.reduce((a, g) => a + g.enUso + g.deposito + g.reparar, 0) ?? 0
                const totalLentes    = st?.lentes.reduce((a, l) => a + l.enUso + l.deposito + l.reparar, 0) ?? 0
                const totalCascosCombined = cascos.length + totalCascosAcc

                return (
                  <div key={s.slug} className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div className="px-4 py-3 flex items-center justify-between" style={{ background: s.color }}>
                      <div>
                        <p className="font-bold text-sm" style={{ color: s.textColor, fontFamily: "'Montserrat', sans-serif" }}>{s.icono} {s.nombre}</p>
                        <p className="text-xs" style={{ color: s.textColor, opacity: 0.7 }}>{totalEquipos} equipos individuales</p>
                      </div>
                      <Link href={`/inventario/${s.slug}`}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.85)', color: '#1a1a1a' }}>
                        Ver →
                      </Link>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Arneses', count: arneses.length, color: '#16a34a', bg: '#f0fdf4' },
                          { label: 'Poleas',  count: poleas.length,  color: '#2563eb', bg: '#eff6ff' },
                          { label: 'Reparar', count: reparar,        color: '#f97316', bg: '#fff7ed' },
                        ].map(({ label, count, color, bg }) => (
                          <div key={label} className="rounded-xl p-2 text-center" style={{ background: bg }}>
                            <p className="text-xl font-black" style={{ color }}>{count}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                          </div>
                        ))}
                      </div>

                      <BarraStat label="En uso" valor={enUso} total={totalEquipos} color="#16a34a" />
                      <BarraStat label="Para reparar" valor={reparar} total={totalEquipos} color="#f97316" />

                      {(totalCascosCombined + totalGuantines + totalLentes) > 0 && (
                        <div className="pt-2 mt-1 space-y-1" style={{ borderTop: '1px solid var(--border-light)' }}>
                          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Accesorios</p>
                          {totalCascosCombined > 0 && <div className="flex justify-between text-xs"><span style={{ color: 'var(--text-muted)' }}>⛑️ Cascos</span><span className="font-bold" style={{ color: 'var(--text-main)' }}>{totalCascosCombined}</span></div>}
                          {totalGuantines > 0 && <div className="flex justify-between text-xs"><span style={{ color: 'var(--text-muted)' }}>🧤 Guantines</span><span className="font-bold" style={{ color: 'var(--text-main)' }}>{totalGuantines}</span></div>}
                          {totalLentes > 0 && <div className="flex justify-between text-xs"><span style={{ color: 'var(--text-muted)' }}>🥽 Lentes</span><span className="font-bold" style={{ color: 'var(--text-main)' }}>{totalLentes}</span></div>}
                        </div>
                      )}

                      {totalEquipos === 0 && (
                        <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>Sin equipos cargados</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Totales globales */}
            <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--border)' }}>
              <p className="section-label mb-2">TOTALES CONSOLIDADOS</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total arneses', color: '#16a34a', val: SECTORES.reduce((s, sec) => s + (stocks[sec.slug]?.equipos.filter(e => e.tipo === 'arnes').length ?? 0), 0) },
                  { label: 'Total poleas',  color: '#2563eb', val: SECTORES.reduce((s, sec) => s + (stocks[sec.slug]?.equipos.filter(e => e.tipo === 'polea').length ?? 0), 0) },
                  { label: 'En uso ahora', color: 'var(--c-teal)', val: SECTORES.reduce((s, sec) => s + (stocks[sec.slug]?.equipos.filter(e => e.ubicacion === 'en_uso').length ?? 0), 0) },
                  { label: 'Para reparar', color: '#f97316', val: equiposReparar.length },
                ].map(({ label, color, val }) => (
                  <div key={label} className="rounded-xl p-4 text-center" style={{ background: 'var(--bg-subtle)' }}>
                    <p className="font-black" style={{ fontSize: 32, color, lineHeight: 1, fontFamily: "'Montserrat', sans-serif" }}>{val}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── PARA REPARAR ── */}
        {vistaActiva === 'reparar' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--border)' }}>
            <div className="px-5 py-4" style={{ background: '#fff7ed', borderBottom: '1px solid #fed7aa' }}>
              <p className="font-bold" style={{ color: '#c2410c', fontFamily: "'Montserrat', sans-serif" }}>🔧 Equipos para reparar — todos los sectores</p>
              <p className="text-xs mt-0.5" style={{ color: '#ea580c' }}>{equiposReparar.length} equipos</p>
            </div>
            {equiposReparar.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay equipos para reparar</p>
              </div>
            ) : equiposReparar.map((eq, i) => {
              const s = SECTORES.find(x => x.slug === eq.sectorSlug)
              const ultimaRep = [...(eq.historial ?? [])].reverse()[0]
              return (
                <div key={eq.id} className="flex items-center gap-3 px-5 py-3"
                  style={{ borderBottom: i < equiposReparar.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: '#fff7ed' }}>
                    {eq.tipo === 'arnes' ? '🦺' : eq.tipo === 'casco' ? '⛑️' : '⚙️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded font-bold"
                        style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>#{eq.numero_interno}</span>
                      <span className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>{eq.marca} {eq.modelo}</span>
                    </div>
                    {ultimaRep && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{ultimaRep.accion}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: s?.color, color: s?.textColor }}>
                      {s?.icono} {s?.nombre}
                    </span>
                    <Link href={`/inventario/${eq.sectorSlug}`} className="block text-xs mt-1" style={{ color: 'var(--c-teal)' }}>Ver →</Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── HISTORIAL CARGAS ── */}
        {vistaActiva === 'historial' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--border)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--text-main)' }}>
                📋 Historial de importaciones de stock
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Cada vez que se importa el Excel de stock queda registrado aquí
              </p>
            </div>

            {historialCargas.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="font-semibold" style={{ color: 'var(--text-main)' }}>Sin importaciones registradas</p>
                {esAdmin && (
                  <button onClick={() => setMostrarImport(true)}
                    className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: 'var(--c-teal)' }}>
                    📥 Importar primer stock
                  </button>
                )}
              </div>
            ) : (
              <div>
                {[...historialCargas].reverse().map((c, i) => (
                  <div key={c.id} className="px-5 py-4"
                    style={{ borderBottom: i < historialCargas.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--text-main)' }}>
                            📅 {c.fecha}
                          </span>
                          {i === 0 && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--c-teal-bg)', color: 'var(--c-teal)' }}>
                              Última carga
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          Importado por <strong>{c.cargadoPor}</strong>
                          {c.fechaDoc && <> · Fecha doc: {c.fechaDoc}</>}
                        </p>
                        <div className="flex gap-4 mt-2">
                          <span className="text-xs font-semibold" style={{ color: '#16a34a' }}>🦺 {c.arneses} arneses</span>
                          <span className="text-xs font-semibold" style={{ color: '#2563eb' }}>⚙️ {c.poleas} poleas</span>
                          <span className="text-xs font-semibold" style={{ color: '#7c3aed' }}>⛑️ {c.cascos} cascos</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 24, color: 'var(--c-teal)', lineHeight: 1 }}>
                          {c.total}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>equipos</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Modal importar */}
      {mostrarImport && (
        <ImportarExcelStock
          onImportar={handleImportar}
          onCerrar={() => setMostrarImport(false)}
        />
      )}
    </div>
  )
}
