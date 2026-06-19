'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

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

const SECTORES = [
  { slug: 'tirolesa', nombre: 'Tirolesa',    icono: '🪂', color: '#F5C800', textColor: '#1a1a1a' },
  { slug: 'parque',   nombre: 'Parque Aéreo', icono: '🌲', color: '#4FC3F7', textColor: '#1a1a1a' },
  { slug: 'arqueria', nombre: 'Arquería',     icono: '🎯', color: '#C8956A', textColor: '#ffffff' },
]

const UBICACION_COLOR: Record<string, string> = {
  en_uso:       '#16a34a',
  deposito:     '#2563eb',
  para_reparar: '#f97316',
  baja:         '#dc2626',
}
const UBICACION_LABEL: Record<string, string> = {
  en_uso:       'En uso',
  deposito:     'Depósito',
  para_reparar: 'Reparar',
  baja:         'Baja',
}

interface StockSector {
  equipos: Equipo[]
  cascos: ModeloSimple[]
  guantines: ModeloSimple[]
  lentes: ModeloSimple[]
}

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
        <span style={{ color: '#6b7280' }}>{label}</span>
        <span className="font-bold" style={{ color }}>{valor}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: '#f3f4f6' }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function EquipoTecnicoPage() {
  const [stocks, setStocks] = useState<Record<string, StockSector>>({})
  const [cargado, setCargado] = useState(false)
  const [vistaActiva, setVistaActiva] = useState<'resumen' | 'reparar'>('resumen')

  useEffect(() => {
    const result: Record<string, StockSector> = {}
    for (const s of SECTORES) result[s.slug] = loadSector(s.slug)
    setStocks(result)
    setCargado(true)
  }, [])

  // Equipos que necesitan reparación (todos los sectores)
  const equiposReparar: (Equipo & { sectorSlug: string })[] = []
  for (const s of SECTORES) {
    const eqs = stocks[s.slug]?.equipos ?? []
    for (const e of eqs) {
      if (e.ubicacion === 'para_reparar') equiposReparar.push({ ...e, sectorSlug: s.slug })
    }
  }

  if (!cargado) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0ede6' }}>
      <p className="text-gray-500">Cargando...</p>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#f0ede6' }}>

      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #1d4ed8 100%)', color: 'white' }}>
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-4">
          <Link href="/home" className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
            style={{ background: 'rgba(255,255,255,0.15)' }}>←</Link>
          <div>
            <h1 className="font-bold text-xl">🎽 Equipo Técnico</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>Stock consolidado de todos los sectores</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Tabs */}
        <div className="flex gap-2">
          {([['resumen', '📊 Resumen general'], ['reparar', `🔧 Para reparar (${equiposReparar.length})`]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setVistaActiva(v)}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={vistaActiva === v
                ? { background: '#1d4ed8', color: 'white' }
                : { background: 'white', color: '#4b5563', border: '1px solid #e5e7eb' }}>
              {l}
            </button>
          ))}
        </div>

        {vistaActiva === 'resumen' && (
          <>
            {/* Tarjetas por sector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SECTORES.map(s => {
                const st = stocks[s.slug]
                const arneses = st?.equipos.filter(e => e.tipo === 'arnes') ?? []
                const poleas  = st?.equipos.filter(e => e.tipo === 'polea') ?? []
                const totalEquipos = arneses.length + poleas.length
                const enUso   = st?.equipos.filter(e => e.ubicacion === 'en_uso').length ?? 0
                const reparar = st?.equipos.filter(e => e.ubicacion === 'para_reparar').length ?? 0
                const totalCascos    = st?.cascos.reduce((a, c) => a + c.enUso + c.deposito + c.reparar, 0) ?? 0
                const totalGuantines = st?.guantines.reduce((a, g) => a + g.enUso + g.deposito + g.reparar, 0) ?? 0
                const totalLentes    = st?.lentes.reduce((a, l) => a + l.enUso + l.deposito + l.reparar, 0) ?? 0

                return (
                  <div key={s.slug} className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
                    {/* Cabecera sector */}
                    <div className="px-4 py-3 flex items-center justify-between"
                      style={{ background: s.color }}>
                      <div>
                        <p className="font-bold text-base" style={{ color: s.textColor }}>{s.icono} {s.nombre}</p>
                        <p className="text-xs font-medium" style={{ color: s.textColor, opacity: 0.7 }}>{totalEquipos} equipos individuales</p>
                      </div>
                      <Link href={`/inventario/${s.slug}`}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.85)', color: '#1a1a1a' }}>
                        Ver →
                      </Link>
                    </div>

                    {/* Stats equipos */}
                    <div className="p-4 space-y-2">
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                          { label: 'Arneses', count: arneses.length, color: '#16a34a', bg: '#f0fdf4' },
                          { label: 'Poleas',  count: poleas.length,  color: '#2563eb', bg: '#eff6ff' },
                          { label: 'Reparar', count: reparar,        color: '#f97316', bg: '#fff7ed' },
                        ].map(({ label, count, color, bg }) => (
                          <div key={label} className="rounded-xl p-2 text-center" style={{ background: bg }}>
                            <p className="text-xl font-black" style={{ color }}>{count}</p>
                            <p className="text-xs" style={{ color: '#6b7280' }}>{label}</p>
                          </div>
                        ))}
                      </div>

                      <BarraStat label="En uso" valor={enUso} total={totalEquipos} color="#16a34a" />
                      <BarraStat label="Para reparar" valor={reparar} total={totalEquipos} color="#f97316" />

                      {/* Accesorios */}
                      {(totalCascos + totalGuantines + totalLentes) > 0 && (
                        <div className="pt-2 mt-2 border-t border-gray-100 space-y-1">
                          <p className="text-xs font-semibold text-gray-400 mb-1">Accesorios</p>
                          {totalCascos > 0 && (
                            <div className="flex justify-between text-xs">
                              <span style={{ color: '#6b7280' }}>⛑️ Cascos</span>
                              <span className="font-bold text-gray-700">{totalCascos}</span>
                            </div>
                          )}
                          {totalGuantines > 0 && (
                            <div className="flex justify-between text-xs">
                              <span style={{ color: '#6b7280' }}>🧤 Guantines</span>
                              <span className="font-bold text-gray-700">{totalGuantines}</span>
                            </div>
                          )}
                          {totalLentes > 0 && (
                            <div className="flex justify-between text-xs">
                              <span style={{ color: '#6b7280' }}>🥽 Lentes</span>
                              <span className="font-bold text-gray-700">{totalLentes}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {totalEquipos === 0 && (
                        <p className="text-xs text-center py-3" style={{ color: '#a0aec0' }}>
                          Sin equipos cargados
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Totales globales */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e7eb' }}>
              <h2 className="font-bold text-gray-800 mb-4">📦 Totales consolidados</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total arneses', color: '#16a34a', val: SECTORES.reduce((s, sec) => s + (stocks[sec.slug]?.equipos.filter(e => e.tipo === 'arnes').length ?? 0), 0) },
                  { label: 'Total poleas',  color: '#2563eb', val: SECTORES.reduce((s, sec) => s + (stocks[sec.slug]?.equipos.filter(e => e.tipo === 'polea').length ?? 0), 0) },
                  { label: 'En uso ahora', color: '#16a34a', val: SECTORES.reduce((s, sec) => s + (stocks[sec.slug]?.equipos.filter(e => e.ubicacion === 'en_uso').length ?? 0), 0) },
                  { label: 'Para reparar', color: '#f97316', val: equiposReparar.length },
                ].map(({ label, color, val }) => (
                  <div key={label} className="rounded-xl p-4 text-center" style={{ background: '#f9fafb' }}>
                    <p className="text-3xl font-black" style={{ color }}>{val}</p>
                    <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {vistaActiva === 'reparar' && (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
            <div className="px-5 py-4" style={{ background: '#fff7ed', borderBottom: '1px solid #fed7aa' }}>
              <p className="font-bold text-orange-700">🔧 Equipos para reparar</p>
              <p className="text-xs text-orange-600 mt-0.5">Todos los sectores · {equiposReparar.length} equipos</p>
            </div>
            {equiposReparar.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-sm text-gray-500">No hay equipos para reparar</p>
              </div>
            ) : (
              <div>
                {equiposReparar.map((eq, i) => {
                  const s = SECTORES.find(x => x.slug === eq.sectorSlug)
                  const ultimaRep = [...(eq.historial ?? [])].reverse().find(h => h.accion.toLowerCase().includes('reparar') || h.accion.toLowerCase().includes('mantenimiento'))
                  return (
                    <div key={eq.id} className="flex items-center gap-4 px-5 py-3"
                      style={{ borderBottom: i < equiposReparar.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: '#fff7ed' }}>
                        {eq.tipo === 'arnes' ? '🦺' : '⚙️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-1.5 py-0.5 rounded font-bold"
                            style={{ background: '#f3f4f6', color: '#6b7280' }}>#{eq.numero_interno}</span>
                          <span className="font-semibold text-sm text-gray-800">{eq.marca} {eq.modelo}</span>
                        </div>
                        {ultimaRep && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{ultimaRep.accion}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                          style={{ background: s?.color, color: s?.textColor }}>
                          {s?.icono} {s?.nombre}
                        </span>
                        <Link href={`/inventario/${eq.sectorSlug}`}
                          className="block text-xs mt-1" style={{ color: '#1d4ed8' }}>
                          Ver →
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
