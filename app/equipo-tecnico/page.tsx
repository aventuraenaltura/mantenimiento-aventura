'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSesion } from '@/lib/usuarios'
import ImportarExcelStock, { type EquipoImportado, type ItemVarios } from '@/components/ImportarExcelStock'
import {
  cargarEquiposSector, upsertEquiposSector, borrarEquiposTodos,
  upsertVariosSector, borrarVariosTodos,
  cargarHistorialCargas, insertarCargaHistorial, borrarHistorialCargas,
} from '@/lib/db'

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
  fecha_doc?: string
  fechaDoc?: string
  cargado_por?: string
  cargadoPor?: string
  arneses: number
  poleas: number
  cascos: number
  arcos?: number
  varios?: number
  total: number
}

const SECTORES = [
  { slug: 'tirolesa', nombre: 'Tirolesa',    icono: '🪂', color: '#F5C800', textColor: '#1a1a1a' },
  { slug: 'parque',   nombre: 'Parque Aéreo', icono: '🌲', color: '#4FC3F7', textColor: '#1a1a1a' },
  { slug: 'arqueria', nombre: 'Arquería',     icono: '🎯', color: '#2d8a4e', textColor: '#ffffff' },
]

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

function getNombreCarga(c: CargaHistorial): string {
  return c.cargadoPor ?? c.cargado_por ?? 'Sistema'
}

function getFechaDoc(c: CargaHistorial): string {
  return c.fechaDoc ?? c.fecha_doc ?? ''
}

function imprimirStockActual(equiposTodos: Equipo[], historial: CargaHistorial[]) {
  const ultima = historial[0]
  const hoy = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const filasSectores = SECTORES.map(s => {
    const equiposSector = equiposTodos.filter(e => e.sector === s.slug)
    const arneses = equiposSector.filter(e => e.tipo === 'arnes').length
    const poleas  = equiposSector.filter(e => e.tipo === 'polea').length
    const enUso   = equiposSector.filter(e => e.ubicacion === 'en_uso').length
    const reparar = equiposSector.filter(e => e.ubicacion === 'para_reparar').length
    return `<tr>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-weight:700">${s.icono} ${s.nombre}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;color:#16a34a;font-weight:700">${arneses}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;color:#2563eb;font-weight:700">${poleas}</td>
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
      ${ultima ? `<span>📥 Última carga: <strong>${ultima.fecha}</strong> por ${getNombreCarga(ultima)}</span>` : ''}
    </div>
    <table>
      <thead><tr>
        <th>Sector</th><th>Arneses</th><th>Poleas</th><th>En uso</th><th>Para reparar</th>
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
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)
  const [vistaActiva, setVistaActiva] = useState<'resumen' | 'reparar' | 'historial'>('resumen')
  const [mostrarImport, setMostrarImport] = useState(false)
  const [historialCargas, setHistorialCargas] = useState<CargaHistorial[]>([])
  const [sesion, setSesion] = useState<{ nombre: string; rol: string } | null>(null)

  useEffect(() => {
    setSesion(getSesion())
    async function cargar() {
      const sectores = ['tirolesa', 'parque', 'arqueria', 'salon']
      const todosEquipos: Equipo[] = []
      for (const s of sectores) {
        const eq = await cargarEquiposSector(s)
        todosEquipos.push(...(eq as Equipo[]))
      }
      setEquipos(todosEquipos)

      const hist = await cargarHistorialCargas()
      setHistorialCargas(hist as CargaHistorial[])

      setLoading(false)
    }
    cargar()
  }, [])

  // Build StockSector per slug for display (cascos/guantines/lentes not in Supabase equipos — keep zeros)
  const stocks: Record<string, StockSector> = {}
  for (const s of SECTORES) {
    const eq = equipos.filter(e => e.sector === s.slug)
    stocks[s.slug] = { equipos: eq, cascos: [], guantines: [], lentes: [] }
  }

  const equiposReparar: (Equipo & { sectorSlug: string })[] = []
  for (const s of SECTORES) {
    for (const e of (stocks[s.slug]?.equipos ?? [])) {
      if (e.ubicacion === 'para_reparar') equiposReparar.push({ ...e, sectorSlug: s.slug })
    }
  }

  async function handleImportar(equiposNuevos: EquipoImportado[], varios: ItemVarios[], resumen: { arneses: number; poleas: number; cascos: number; arcos?: number; varios?: number; total: number; fecha: string }) {
    const sectores = ['tirolesa', 'parque', 'arqueria', 'salon']

    for (const sector of sectores) {
      const equiposSector = equiposNuevos.filter(e => e.sector === sector)
      if (equiposSector.length === 0) continue

      const existentes = await cargarEquiposSector(sector)
      const existentesPorSerie = new Map((existentes as Record<string, unknown>[]).map(e => [e.numero_serie, e]))

      const merged = [...existentes] as Record<string, unknown>[]
      for (const eq of equiposSector) {
        if (!existentesPorSerie.has(eq.numero_serie)) {
          merged.push({
            id: `${sector}_${eq.tipo}_${eq.numero_serie || Date.now()}_${Math.random().toString(36).slice(2,6)}`,
            tipo: eq.tipo,
            sector,
            marca: eq.marca,
            modelo: eq.modelo,
            numero_serie: eq.numero_serie,
            ubicacion: eq.ubicacion,
            instructor: eq.instructor,
            uso_actual: eq.uso_actual,
            comprado: eq.comprado,
            primer_uso: eq.primer_uso,
            observaciones: eq.observaciones,
            caracteristicas: eq.caracteristicas || '',
            historial: eq.instructor ? [{ fecha: resumen.fecha, accion: `Asignado a instructor: ${eq.instructor}`, por: 'Sistema' }] : [],
          })
        }
      }

      await upsertEquiposSector(merged, sector)

      const variosSector = varios.filter(v => v.sector === sector)
      if (variosSector.length > 0) {
        await upsertVariosSector(variosSector, sector)
      }
    }

    const cargadoPor = sesion?.nombre ?? 'Sistema'
    const nuevaCarga = {
      id: `carga_${Date.now()}`,
      fecha: new Date().toISOString().split('T')[0],
      fecha_doc: resumen.fecha,
      cargado_por: cargadoPor,
      arneses: resumen.arneses,
      poleas: resumen.poleas,
      cascos: resumen.cascos,
      arcos: resumen.arcos ?? 0,
      varios: resumen.varios ?? 0,
      total: resumen.total,
    }
    await insertarCargaHistorial(nuevaCarga)

    const hist = await cargarHistorialCargas()
    setHistorialCargas(hist as CargaHistorial[])

    const todosEq: Equipo[] = []
    for (const s of ['tirolesa', 'parque', 'arqueria', 'salon']) {
      const eq = await cargarEquiposSector(s)
      todosEq.push(...(eq as Equipo[]))
    }
    setEquipos(todosEq)
    setMostrarImport(false)
    setVistaActiva('historial')
  }

  const esAdmin = sesion?.rol === 'admin'

  async function borrarTodo() {
    if (!confirm('¿Borrar todo el stock importado? Esta acción no se puede deshacer.')) return
    await borrarEquiposTodos()
    await borrarVariosTodos()
    await borrarHistorialCargas()
    setEquipos([])
    setHistorialCargas([])
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
      <div className="text-center">
        <div className="text-4xl mb-3">⏳</div>
        <p style={{ color: 'var(--text-muted)', fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}>Cargando stock...</p>
      </div>
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
              <button onClick={borrarTodo} className="text-xs font-bold px-3 py-2 rounded-xl"
                style={{ background: '#fff5f5', color: '#dc2626', border: '1px solid #fecaca' }}>
                🗑️ Borrar stock
              </button>
              <button onClick={() => imprimirStockActual(equipos, historialCargas)}
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
                const totalEquipos = arneses.length + poleas.length
                const enUso   = st?.equipos.filter(e => e.ubicacion === 'en_uso').length ?? 0
                const reparar = st?.equipos.filter(e => e.ubicacion === 'para_reparar').length ?? 0

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
                  { label: 'Total arneses', color: '#16a34a', val: equipos.filter(e => e.tipo === 'arnes').length },
                  { label: 'Total poleas',  color: '#2563eb', val: equipos.filter(e => e.tipo === 'polea').length },
                  { label: 'En uso ahora', color: 'var(--c-teal)', val: equipos.filter(e => e.ubicacion === 'en_uso').length },
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
                {historialCargas.map((c, i) => (
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
                          Importado por <strong>{getNombreCarga(c)}</strong>
                          {getFechaDoc(c) && <> · Fecha doc: {getFechaDoc(c)}</>}
                        </p>
                        <div className="flex gap-4 mt-2 flex-wrap">
                          <span className="text-xs font-semibold" style={{ color: '#16a34a' }}>🦺 {c.arneses} arneses</span>
                          <span className="text-xs font-semibold" style={{ color: '#2563eb' }}>⚙️ {c.poleas} poleas</span>
                          <span className="text-xs font-semibold" style={{ color: '#7c3aed' }}>⛑️ {c.cascos} cascos</span>
                          {(c.arcos ?? 0) > 0 && <span className="text-xs font-semibold" style={{ color: '#92400e' }}>🏹 {c.arcos} arcos</span>}
                          {(c.varios ?? 0) > 0 && <span className="text-xs font-semibold" style={{ color: '#64748b' }}>📦 {c.varios} varios</span>}
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
