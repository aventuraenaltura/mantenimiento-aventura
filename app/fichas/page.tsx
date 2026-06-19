'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type TipoEquipo = 'arnes' | 'polea'
type EstadoFicha = 'alta' | 'baja'

interface FichaEquipo {
  id: string
  numero_ficha: string
  tipo: TipoEquipo
  numero_interno: string
  marca: string
  modelo: string
  numero_serie: string
  actividad: string
  uso_actual: string
  fecha_ingreso: string
  observaciones: string
  estado: EstadoFicha
  fecha_baja?: string
  motivo_baja?: string
  created_at?: string
}

interface ControlItem {
  id: string
  control_id: string
  ficha_id: string
  uso_actual: string
  ratings: Record<string, string>
  observaciones: string
  controles_stock?: { fecha: string; realizado_por: string; tipo: string }
}

const TIPO_LABEL: Record<TipoEquipo, string> = { arnes: 'Arnés', polea: 'Polea' }
const TIPO_EMOJI: Record<TipoEquipo, string> = { arnes: '🦺', polea: '⚙️' }

function BadgeEstado({ estado }: { estado: EstadoFicha }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
      style={estado === 'alta'
        ? { background: '#dcfce7', color: '#15803d' }
        : { background: '#fee2e2', color: '#b91c1c' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: estado === 'alta' ? '#16a34a' : '#dc2626' }} />
      {estado === 'alta' ? 'Alta' : 'Baja'}
    </span>
  )
}

function RatingPill({ label, value }: { label: string; value: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    MB: { bg: '#dcfce7', text: '#15803d' },
    R: { bg: '#fef3c7', text: '#92400e' },
    V: { bg: '#ede9fe', text: '#5b21b6' },
    C: { bg: '#fee2e2', text: '#b91c1c' },
  }
  const c = colors[value] ?? { bg: '#f3f4f6', text: '#9ca3af' }
  return (
    <span className="inline-flex flex-col items-center gap-0" style={{ minWidth: 32 }}>
      <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: c.bg, color: c.text }}>{value || '—'}</span>
      <span className="text-gray-400" style={{ fontSize: 8 }}>{label}</span>
    </span>
  )
}

export default function FichasPage() {
  const [fichas, setFichas] = useState<FichaEquipo[]>([])
  const [controles, setControles] = useState<Record<string, ControlItem[]>>({}) // ficha_id → items
  const [cargando, setCargando] = useState(true)
  const [fichaSeleccionada, setFichaSeleccionada] = useState<FichaEquipo | null>(null)
  const [mostrarBaja, setMostrarBaja] = useState(false)
  const [motivoBaja, setMotivoBaja] = useState('')
  const [esAdmin, setEsAdmin] = useState(false)

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'alta' | 'baja'>('todos')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'arnes' | 'polea'>('todos')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('usuario') || '{}')
      setEsAdmin(u.rol === 'admin')
    } catch {}
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setCargando(true)
    const { data: fichasData } = await supabase
      .from('fichas_equipo')
      .select('*')
      .order('numero_interno')
    if (fichasData) setFichas(fichasData as FichaEquipo[])

    // Cargar controles con join
    const { data: itemsData } = await supabase
      .from('control_items')
      .select('*, controles_stock(fecha, realizado_por, tipo)')
      .order('control_id', { ascending: false })

    if (itemsData) {
      const mapa: Record<string, ControlItem[]> = {}
      for (const item of itemsData as ControlItem[]) {
        if (!mapa[item.ficha_id]) mapa[item.ficha_id] = []
        mapa[item.ficha_id].push(item)
      }
      setControles(mapa)
    }
    setCargando(false)
  }

  async function darBaja(ficha: FichaEquipo) {
    if (!motivoBaja.trim()) return
    const { error } = await supabase
      .from('fichas_equipo')
      .update({
        estado: 'baja',
        fecha_baja: new Date().toISOString().split('T')[0],
        motivo_baja: motivoBaja,
      })
      .eq('id', ficha.id)
    if (!error) {
      setFichas(prev => prev.map(f => f.id === ficha.id
        ? { ...f, estado: 'baja', fecha_baja: new Date().toISOString().split('T')[0], motivo_baja: motivoBaja }
        : f))
      setFichaSeleccionada(f => f ? { ...f, estado: 'baja', fecha_baja: new Date().toISOString().split('T')[0], motivo_baja: motivoBaja } : f)
      setMostrarBaja(false)
      setMotivoBaja('')
    }
  }

  async function darAlta(ficha: FichaEquipo) {
    const { error } = await supabase
      .from('fichas_equipo')
      .update({ estado: 'alta', fecha_baja: null, motivo_baja: null })
      .eq('id', ficha.id)
    if (!error) {
      setFichas(prev => prev.map(f => f.id === ficha.id
        ? { ...f, estado: 'alta', fecha_baja: undefined, motivo_baja: undefined }
        : f))
      setFichaSeleccionada(f => f ? { ...f, estado: 'alta', fecha_baja: undefined, motivo_baja: undefined } : f)
    }
  }

  const fichasFiltradas = fichas.filter(f => {
    if (filtroEstado !== 'todos' && f.estado !== filtroEstado) return false
    if (filtroTipo !== 'todos' && f.tipo !== filtroTipo) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      if (!`${f.numero_ficha} ${f.numero_serie} ${f.marca} ${f.modelo} ${f.numero_interno}`.toLowerCase().includes(q)) return false
    }
    return true
  })

  const totalAlta = fichas.filter(f => f.estado === 'alta').length
  const totalBaja = fichas.filter(f => f.estado === 'baja').length

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0ede6' }}>
        <div className="text-center">
          <div className="text-3xl mb-3">📋</div>
          <p className="text-gray-500 text-sm">Cargando fichas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f0ede6' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #1e3a3a 0%, #2d5555 100%)', color: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px' }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/inventario" className="flex items-center justify-center w-9 h-9 rounded-xl text-white text-lg"
                style={{ background: 'rgba(255,255,255,0.12)' }}>←</Link>
              <div>
                <h1 className="text-xl font-black tracking-tight">Fichas de Equipo</h1>
                <p className="text-xs opacity-60 mt-0.5">Complejo Aerosilla · Aventura en Altura</p>
              </div>
            </div>
            {/* Stats */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: '#86efac' }} />
                <span className="text-sm font-bold">{totalAlta}</span>
                <span className="text-xs opacity-60">Alta</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: '#fca5a5' }} />
                <span className="text-sm font-bold">{totalBaja}</span>
                <span className="text-xs opacity-60">Baja</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px', display: 'grid', gridTemplateColumns: fichaSeleccionada ? '1fr 420px' : '1fr', gap: 20 }}>

        {/* Panel izquierdo — listado */}
        <div>
          {/* Filtros */}
          <div className="bg-white rounded-2xl p-4 mb-4" style={{ border: '1px solid #ddd8cf' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por N° ficha, serie, marca, modelo..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none"
              style={{ border: '1px solid #e5e7eb', background: '#faf8f4' }}
            />
            <div className="flex gap-2 flex-wrap">
              <div className="flex gap-1">
                {(['todos', 'alta', 'baja'] as const).map(e => (
                  <button key={e} onClick={() => setFiltroEstado(e)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                    style={filtroEstado === e
                      ? { background: '#1e3a3a', color: 'white' }
                      : { background: '#f3f4f6', color: '#6b7280' }}>
                    {e === 'todos' ? 'Todos' : e === 'alta' ? '🟢 Alta' : '🔴 Baja'}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 ml-2">
                {(['todos', 'arnes', 'polea'] as const).map(t => (
                  <button key={t} onClick={() => setFiltroTipo(t)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                    style={filtroTipo === t
                      ? { background: '#0f4c5c', color: 'white' }
                      : { background: '#f3f4f6', color: '#6b7280' }}>
                    {t === 'todos' ? 'Todos' : TIPO_EMOJI[t] + ' ' + TIPO_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sin fichas */}
          {fichas.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center" style={{ border: '1px solid #ddd8cf' }}>
              <p className="text-4xl mb-3">📋</p>
              <p className="font-semibold text-gray-700 mb-1">Sin fichas cargadas</p>
              <p className="text-sm text-gray-400 mb-4">Primero importá el stock inicial desde Inventario</p>
              <Link href="/inventario" className="inline-flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-xl"
                style={{ background: '#1e3a3a' }}>← Ir a Inventario</Link>
            </div>
          )}

          {/* Lista de fichas */}
          <p className="text-xs text-gray-400 mb-2 ml-1">{fichasFiltradas.length} fichas</p>
          <div className="space-y-2">
            {fichasFiltradas.map(f => {
              const ultimoControl = controles[f.id]?.[0]
              const seleccionada = fichaSeleccionada?.id === f.id
              return (
                <div key={f.id}
                  onClick={() => setFichaSeleccionada(seleccionada ? null : f)}
                  className="bg-white rounded-xl px-4 py-3 cursor-pointer transition-all"
                  style={{
                    border: seleccionada ? '2px solid #1e3a3a' : `2px solid ${f.estado === 'alta' ? '#dcfce7' : '#fee2e2'}`,
                    opacity: f.estado === 'baja' ? 0.75 : 1,
                  }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{TIPO_EMOJI[f.tipo]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {f.numero_ficha}
                        </span>
                        <span className="font-semibold text-sm text-gray-800">{f.marca} {f.modelo}</span>
                        <BadgeEstado estado={f.estado} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400">N° interno: {f.numero_interno}</span>
                        <span className="text-xs text-gray-400">{TIPO_LABEL[f.tipo]}</span>
                        <span className="text-xs text-gray-400 capitalize">{f.actividad}</span>
                      </div>
                      {ultimoControl && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Último ctrl: {ultimoControl.controles_stock?.fecha} · {ultimoControl.controles_stock?.realizado_por}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{controles[f.id]?.length ?? 0} controles</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Panel derecho — detalle ficha */}
        {fichaSeleccionada && (
          <div className="space-y-4">
            {/* Ficha principal */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #ddd8cf' }}>
              {/* Header ficha */}
              <div className="px-5 py-4" style={{ background: 'linear-gradient(135deg, #1e3a3a, #2d5555)' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/60 text-xs font-mono mb-1">FICHA {fichaSeleccionada.numero_ficha}</p>
                    <p className="text-white text-lg font-black leading-tight">
                      {TIPO_EMOJI[fichaSeleccionada.tipo]} {fichaSeleccionada.marca} {fichaSeleccionada.modelo}
                    </p>
                    <p className="text-white/60 text-xs mt-1">N° interno {fichaSeleccionada.numero_interno} · {TIPO_LABEL[fichaSeleccionada.tipo]}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <BadgeEstado estado={fichaSeleccionada.estado} />
                    <button onClick={() => setFichaSeleccionada(null)} className="text-white/40 hover:text-white/80 text-lg leading-none">✕</button>
                  </div>
                </div>
              </div>

              {/* Datos */}
              <div className="p-4 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ['N° Serie / Ficha', fichaSeleccionada.numero_serie],
                    ['Marca', fichaSeleccionada.marca],
                    ['Modelo', fichaSeleccionada.modelo],
                    ['Actividad', fichaSeleccionada.actividad],
                    ['Uso', fichaSeleccionada.uso_actual],
                    ['Ingreso', fichaSeleccionada.fecha_ingreso],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-semibold text-gray-800 capitalize">{value || '—'}</p>
                    </div>
                  ))}
                </div>
                {fichaSeleccionada.observaciones && (
                  <div className="bg-amber-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-amber-600 font-semibold">Observaciones</p>
                    <p className="text-sm text-amber-800">{fichaSeleccionada.observaciones}</p>
                  </div>
                )}
                {fichaSeleccionada.estado === 'baja' && fichaSeleccionada.motivo_baja && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <p className="text-xs text-red-500 font-semibold">Baja — {fichaSeleccionada.fecha_baja}</p>
                    <p className="text-sm text-red-700">{fichaSeleccionada.motivo_baja}</p>
                  </div>
                )}

                {/* Acciones admin */}
                {esAdmin && (
                  <div className="pt-1">
                    {fichaSeleccionada.estado === 'alta' ? (
                      <button onClick={() => setMostrarBaja(true)}
                        className="w-full py-2 rounded-xl text-sm font-semibold"
                        style={{ background: '#fee2e2', color: '#b91c1c' }}>
                        Dar de baja este equipo
                      </button>
                    ) : (
                      <button onClick={() => darAlta(fichaSeleccionada)}
                        className="w-full py-2 rounded-xl text-sm font-semibold"
                        style={{ background: '#dcfce7', color: '#15803d' }}>
                        Reactivar — dar de alta
                      </button>
                    )}
                    {mostrarBaja && fichaSeleccionada.estado === 'alta' && (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={motivoBaja}
                          onChange={e => setMotivoBaja(e.target.value)}
                          placeholder="Motivo de la baja (requerido)..."
                          rows={2}
                          className="w-full text-sm rounded-xl px-3 py-2 focus:outline-none resize-none"
                          style={{ border: '1.5px solid #fca5a5', background: '#fff5f5' }}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => darBaja(fichaSeleccionada)}
                            disabled={!motivoBaja.trim()}
                            className="flex-1 py-2 rounded-xl text-sm font-bold disabled:opacity-40"
                            style={{ background: '#dc2626', color: 'white' }}>
                            Confirmar baja
                          </button>
                          <button onClick={() => { setMostrarBaja(false); setMotivoBaja('') }}
                            className="px-4 py-2 rounded-xl text-sm" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Historial de controles */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #ddd8cf' }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #f0ede6' }}>
                <p className="font-semibold text-sm text-gray-800">Historial de controles</p>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {controles[fichaSeleccionada.id]?.length ?? 0} registros
                </span>
              </div>
              {!controles[fichaSeleccionada.id]?.length ? (
                <div className="px-4 py-6 text-center text-gray-400 text-sm">
                  Sin controles registrados aún
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {controles[fichaSeleccionada.id].map((item, i) => (
                    <div key={i} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <span className="text-sm font-semibold text-gray-800">
                            {item.controles_stock?.fecha
                              ? new Date(item.controles_stock.fecha).toLocaleDateString('es-AR')
                              : '—'}
                          </span>
                          <span className="text-xs text-gray-400 ml-2">· {item.controles_stock?.realizado_por}</span>
                        </div>
                        <span className="text-xs text-gray-400 capitalize">{item.uso_actual}</span>
                      </div>
                      {/* Ratings */}
                      {item.ratings && Object.keys(item.ratings).length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mt-1">
                          {Object.entries(item.ratings).map(([campo, valor]) => (
                            <RatingPill key={campo} label={campo.replace(/_/g, ' ')} value={valor} />
                          ))}
                        </div>
                      )}
                      {item.observaciones && (
                        <p className="text-xs text-gray-500 mt-1 italic">"{item.observaciones}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
