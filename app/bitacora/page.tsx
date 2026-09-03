'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { fmtFecha } from '@/lib/fecha'

// ── Tipos ────────────────────────────────────────────────────────────
interface Registro {
  id: string
  fecha: string
  hora?: string
  sector?: string
  elemento?: string
  trabajo: string
  quien?: string
  materiales_usados?: string
  tuvo_novedad: boolean
  detalle_novedad?: string
  pendiente?: string
  observaciones?: string
  created_at?: string
}

interface Tarea {
  id: string
  descripcion: string
  sector?: string
  urgencia: 'muy_urgente' | 'media' | 'puede_esperar'
  estado: 'pendiente' | 'en_proceso' | 'finalizado'
  responsable?: string
  fecha_estimada?: string
  notas?: string
  created_at?: string
  finalizado_at?: string
}

interface Pedido {
  id: string
  descripcion: string
  urgencia: 'urgente' | 'normal'
  solicitado_por?: string
  solicitado_en?: string
  llego: boolean
  fecha_llegada?: string
  notas?: string
}

const SECTORES = ['Tirolesa', 'Parque Aéreo', 'Arquería', 'Salón', 'Senderos', 'General']
const URGENCIA_LABEL: Record<string, string> = { muy_urgente: 'Muy urgente', media: 'Media', puede_esperar: 'Puede esperar' }
const ESTADO_LABEL: Record<string, string> = { pendiente: 'Pendiente', en_proceso: 'En proceso', finalizado: 'Finalizado' }

export default function BitacoraPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'registro' | 'pendientes' | 'pedidos'>('pendientes')
  const [usuario, setUsuario] = useState<{ nombre: string; rol: string } | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  // Datos
  const [registros, setRegistros] = useState<Registro[]>([])
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [cargando, setCargando] = useState(true)

  // Filtros pendientes
  const [filtroUrgencia, setFiltroUrgencia] = useState<string>('todos')
  const [filtroEstado, setFiltroEstado] = useState<string>('activos')
  const [filtroSector, setFiltroSector] = useState<string>('todos')
  const [filtroResponsable, setFiltroResponsable] = useState<string>('todos')
  const [ordenTareas, setOrdenTareas] = useState<string>('urgencia')

  // Modales
  const [showFormRegistro, setShowFormRegistro] = useState(false)
  const [showFormTarea, setShowFormTarea] = useState(false)
  const [showFormPedido, setShowFormPedido] = useState(false)
  const [editandoTarea, setEditandoTarea] = useState<Tarea | null>(null)

  // Form registro
  const [fReg, setFReg] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().slice(0, 5),
    sector: '', elemento: '', trabajo: '', quien: '',
    materiales_usados: '', tuvo_novedad: false,
    detalle_novedad: '', pendiente: '', observaciones: '',
    materiales_faltantes: [] as string[],
    nuevo_material: '',
  })

  // Form tarea
  const [fTarea, setFTarea] = useState({
    descripcion: '', sector: '', urgencia: 'media',
    responsable: '', fecha_estimada: '', notas: '',
    materiales_solicitados: [] as string[],
    nuevo_mat_tarea: '',
  })

  // Form pedido
  const [fPedido, setFPedido] = useState({ descripcion: '', urgencia: 'normal', notas: '' })

  useEffect(() => {
    const u = localStorage.getItem('usuario')
    if (!u) { router.push('/'); return }
    setUsuario(JSON.parse(u))
    cargarTodo()
  }, [router])

  async function cargarTodo() {
    setCargando(true)
    const [{ data: reg }, { data: tar }, { data: ped }] = await Promise.all([
      supabase.from('bitacora_registros').select('*').order('fecha', { ascending: false }),
      supabase.from('bitacora_tareas').select('*').order('created_at', { ascending: false }),
      supabase.from('bitacora_pedidos').select('*').order('created_at', { ascending: false }),
    ])
    setRegistros(reg ?? [])
    setTareas(tar ?? [])
    setPedidos(ped ?? [])
    setCargando(false)
  }

  // ── Guardar registro ────────────────────────────────────────────────
  async function guardarRegistro() {
    if (!fReg.trabajo.trim()) return
    const nuevo: Registro = {
      id: `reg_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      fecha: fReg.fecha, hora: fReg.hora,
      sector: fReg.sector, elemento: fReg.elemento,
      trabajo: fReg.trabajo, quien: fReg.quien || usuario?.nombre,
      materiales_usados: fReg.materiales_usados,
      tuvo_novedad: fReg.tuvo_novedad,
      detalle_novedad: fReg.detalle_novedad,
      pendiente: fReg.pendiente,
      observaciones: fReg.observaciones,
    }
    await supabase.from('bitacora_registros').insert(nuevo)

    // Si hay pendiente → crear tarea automáticamente
    if (fReg.pendiente.trim()) {
      const tarea: Tarea = {
        id: `tar_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        descripcion: fReg.pendiente.trim(),
        sector: fReg.sector,
        urgencia: 'media',
        estado: 'pendiente',
        responsable: '',
        notas: `Generado desde registro del ${fmtFecha(fReg.fecha)}`,
      }
      await supabase.from('bitacora_tareas').insert(tarea)
    }

    // Materiales faltantes → pedidos
    for (const mat of fReg.materiales_faltantes) {
      const pedido: Pedido = {
        id: `ped_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        descripcion: mat,
        urgencia: 'normal',
        solicitado_por: fReg.quien || usuario?.nombre,
        solicitado_en: fReg.fecha,
        llego: false,
      }
      await supabase.from('bitacora_pedidos').insert(pedido)
    }

    setShowFormRegistro(false)
    setFReg({ fecha: new Date().toISOString().split('T')[0], hora: new Date().toTimeString().slice(0,5), sector: '', elemento: '', trabajo: '', quien: '', materiales_usados: '', tuvo_novedad: false, detalle_novedad: '', pendiente: '', observaciones: '', materiales_faltantes: [], nuevo_material: '' })
    cargarTodo()
  }

  // ── Guardar tarea ───────────────────────────────────────────────────
  async function guardarTarea() {
    if (!fTarea.descripcion.trim()) return
    const camposTarea = {
      descripcion: fTarea.descripcion, sector: fTarea.sector,
      urgencia: fTarea.urgencia, responsable: fTarea.responsable,
      fecha_estimada: fTarea.fecha_estimada, notas: fTarea.notas,
    }
    if (editandoTarea) {
      await supabase.from('bitacora_tareas').update(camposTarea).eq('id', editandoTarea.id)
    } else {
      await supabase.from('bitacora_tareas').insert({
        id: `tar_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        ...camposTarea,
      })
    }
    // Crear pedidos por los materiales solicitados
    for (const mat of fTarea.materiales_solicitados) {
      await supabase.from('bitacora_pedidos').insert({
        id: `ped_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        descripcion: mat,
        urgencia: fTarea.urgencia === 'muy_urgente' ? 'urgente' : 'normal',
        solicitado_por: usuario?.nombre,
        solicitado_en: new Date().toISOString().split('T')[0],
        llego: false,
        notas: `Requerido por tarea: ${fTarea.descripcion}`,
      })
    }
    setShowFormTarea(false); setEditandoTarea(null)
    setFTarea({ descripcion: '', sector: '', urgencia: 'media', responsable: '', fecha_estimada: '', notas: '', materiales_solicitados: [], nuevo_mat_tarea: '' })
    cargarTodo()
  }

  async function cambiarEstadoTarea(id: string, estado: Tarea['estado']) {
    const upd: Partial<Tarea> = { estado }
    if (estado === 'finalizado') upd.finalizado_at = new Date().toISOString().split('T')[0]
    await supabase.from('bitacora_tareas').update(upd).eq('id', id)
    setTareas(prev => prev.map(t => t.id === id ? { ...t, ...upd } : t))
  }

  async function borrarTarea(id: string) {
    if (!confirm('¿Borrar esta tarea? Solo el admin puede hacerlo.')) return
    await supabase.from('bitacora_tareas').delete().eq('id', id)
    setTareas(prev => prev.filter(t => t.id !== id))
  }

  // ── Guardar pedido ──────────────────────────────────────────────────
  async function guardarPedido() {
    if (!fPedido.descripcion.trim()) return
    await supabase.from('bitacora_pedidos').insert({
      id: `ped_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      ...fPedido,
      solicitado_por: usuario?.nombre,
      solicitado_en: new Date().toISOString().split('T')[0],
      llego: false,
    })
    setShowFormPedido(false)
    setFPedido({ descripcion: '', urgencia: 'normal', notas: '' })
    cargarTodo()
  }

  async function marcarPedidoLlegado(id: string, llego: boolean) {
    await supabase.from('bitacora_pedidos').update({
      llego, fecha_llegada: llego ? new Date().toISOString().split('T')[0] : null
    }).eq('id', id)
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, llego, fecha_llegada: llego ? new Date().toISOString().split('T')[0] : undefined } : p))
  }

  // ── Filtrar tareas ──────────────────────────────────────────────────
  const tareasFiltradas = tareas.filter(t => {
    if (filtroEstado === 'activos' && t.estado === 'finalizado') return false
    if (filtroEstado !== 'activos' && filtroEstado !== 'todos' && t.estado !== filtroEstado) return false
    if (filtroUrgencia !== 'todos' && t.urgencia !== filtroUrgencia) return false
    if (filtroSector !== 'todos' && t.sector !== filtroSector) return false
    if (filtroResponsable !== 'todos' && t.responsable !== filtroResponsable) return false
    return true
  }).sort((a, b) => {
    if (ordenTareas === 'urgencia') {
      const ord = { muy_urgente: 0, media: 1, puede_esperar: 2 }
      return ord[a.urgencia] - ord[b.urgencia]
    }
    if (ordenTareas === 'fecha') return (a.fecha_estimada ?? '').localeCompare(b.fecha_estimada ?? '')
    if (ordenTareas === 'responsable') return (a.responsable ?? '').localeCompare(b.responsable ?? '')
    return (b.created_at ?? '').localeCompare(a.created_at ?? '')
  })

  const responsables = [...new Set(tareas.map(t => t.responsable).filter(Boolean))]

  // ── Badges dashboard ─────────────────────────────────────────────────
  const urgentes = tareas.filter(t => t.urgencia === 'muy_urgente' && t.estado !== 'finalizado').length
  const enProceso = tareas.filter(t => t.estado === 'en_proceso').length
  const pendientesMat = pedidos.filter(p => !p.llego).length

  // ── Imprimir ─────────────────────────────────────────────────────────
  function imprimir() {
    window.print()
  }

  const urgenciaColor = (u: string) => ({
    muy_urgente: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', dot: '#dc2626' },
    media: { bg: '#fffbeb', border: '#fde68a', text: '#d97706', dot: '#f59e0b' },
    puede_esperar: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', dot: '#22c55e' },
  }[u] ?? { bg: '#f3f4f6', border: '#e5e7eb', text: '#6b7280', dot: '#9ca3af' })

  const estadoColor = (e: string) => ({
    pendiente: '#6b7280',
    en_proceso: '#2563eb',
    finalizado: '#16a34a',
  }[e] ?? '#6b7280')

  if (!usuario) return null

  return (
    <div className="min-h-screen" style={{ background: '#f7f5f0' }}>
      {/* Header */}
      <header style={{ background: '#1e3a3a', color: 'white' }} className="px-4 py-4 flex items-center gap-3 print:hidden">
        <Link href="/home" className="text-white opacity-60 hover:opacity-100 text-xl">←</Link>
        <span className="text-2xl">📓</span>
        <div className="flex-1">
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18 }}>Bitácora de Mantenimiento</h1>
          <p style={{ fontSize: 11, opacity: 0.6 }}>Aventura en Altura · Ptatanka SRL</p>
        </div>
        <button onClick={imprimir} className="text-xs px-3 py-1.5 rounded-lg font-semibold"
          style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>🖨️ Imprimir</button>
      </header>

      {/* Badges resumen */}
      <div className="max-w-3xl mx-auto px-4 pt-4 grid grid-cols-3 gap-3 print:hidden">
        {[
          { label: 'Urgentes', val: urgentes, color: '#dc2626', bg: '#fef2f2', icon: '🔴' },
          { label: 'En proceso', val: enProceso, color: '#2563eb', bg: '#eff6ff', icon: '🔵' },
          { label: 'Mat. esperados', val: pendientesMat, color: '#d97706', bg: '#fffbeb', icon: '🛒' },
        ].map(b => (
          <div key={b.label} className="rounded-2xl p-3 text-center" style={{ background: b.bg, border: `1px solid ${b.color}22` }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: b.color }}>{b.val}</p>
            <p style={{ fontSize: 10, color: b.color, fontWeight: 600 }}>{b.icon} {b.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-4 pt-4 print:hidden">
        <div className="flex rounded-2xl overflow-hidden border border-gray-200 bg-white">
          {([['pendientes', '📌 Pendientes'], ['registro', '📋 Registro'], ['pedidos', '🛒 Pedidos']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex-1 py-2.5 text-xs font-bold transition-colors"
              style={{ background: tab === id ? '#1e3a3a' : 'white', color: tab === id ? 'white' : '#6b7280' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-3" ref={printRef}>

        {/* ══ TAB PENDIENTES ══════════════════════════════════════════ */}
        {tab === 'pendientes' && (
          <>
            {/* Filtros */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 print:hidden space-y-3">
              <div className="flex gap-2 flex-wrap">
                <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                  className="flex-1 min-w-[120px] border rounded-xl px-3 py-2 text-xs focus:outline-none" style={{ border: '1px solid #e5e7eb' }}>
                  <option value="activos">Activas</option>
                  <option value="todos">Todas</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En proceso</option>
                  <option value="finalizado">Finalizadas</option>
                </select>
                <select value={filtroUrgencia} onChange={e => setFiltroUrgencia(e.target.value)}
                  className="flex-1 min-w-[120px] border rounded-xl px-3 py-2 text-xs focus:outline-none" style={{ border: '1px solid #e5e7eb' }}>
                  <option value="todos">Toda urgencia</option>
                  <option value="muy_urgente">🔴 Muy urgente</option>
                  <option value="media">🟡 Media</option>
                  <option value="puede_esperar">🟢 Puede esperar</option>
                </select>
                <select value={filtroSector} onChange={e => setFiltroSector(e.target.value)}
                  className="flex-1 min-w-[120px] border rounded-xl px-3 py-2 text-xs focus:outline-none" style={{ border: '1px solid #e5e7eb' }}>
                  <option value="todos">Todo sector</option>
                  {SECTORES.map(s => <option key={s}>{s}</option>)}
                </select>
                {responsables.length > 0 && (
                  <select value={filtroResponsable} onChange={e => setFiltroResponsable(e.target.value)}
                    className="flex-1 min-w-[120px] border rounded-xl px-3 py-2 text-xs focus:outline-none" style={{ border: '1px solid #e5e7eb' }}>
                    <option value="todos">Todo responsable</option>
                    {responsables.map(r => <option key={r!}>{r}</option>)}
                  </select>
                )}
              </div>
              <div className="flex gap-2 items-center justify-between">
                <div className="flex gap-1">
                  {[['urgencia', '🔴 Urgencia'], ['fecha', '📅 Fecha'], ['responsable', '👤 Responsable'], ['reciente', '🕐 Reciente']].map(([v, l]) => (
                    <button key={v} onClick={() => setOrdenTareas(v)}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{ background: ordenTareas === v ? '#1e3a3a' : '#f3f4f6', color: ordenTareas === v ? 'white' : '#6b7280' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Lista tareas */}
            <div className="space-y-2">
              {tareasFiltradas.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
                  <p className="text-3xl mb-2">✅</p>
                  <p className="text-sm text-gray-500">No hay tareas con ese filtro</p>
                </div>
              ) : tareasFiltradas.map(t => {
                const uc = urgenciaColor(t.urgencia)
                return (
                  <div key={t.id} className="bg-white rounded-2xl p-4 border"
                    style={{ borderColor: uc.border, borderLeftWidth: 4, borderLeftColor: uc.dot }}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: uc.bg, color: uc.text }}>
                            {URGENCIA_LABEL[t.urgencia]}
                          </span>
                          {t.sector && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">{t.sector}</span>}
                        </div>
                        <p className="text-sm font-semibold text-gray-800 mb-1">{t.descripcion}</p>
                        <div className="flex gap-3 flex-wrap text-xs text-gray-400">
                          {t.responsable && <span>👤 {t.responsable}</span>}
                          {t.fecha_estimada && <span>📅 {fmtFecha(t.fecha_estimada)}</span>}
                          {t.notas && <span>💬 {t.notas}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end flex-shrink-0">
                        <select value={t.estado}
                          onChange={e => cambiarEstadoTarea(t.id, e.target.value as Tarea['estado'])}
                          className="text-xs border rounded-lg px-2 py-1 focus:outline-none"
                          style={{ border: '1px solid #e5e7eb', color: estadoColor(t.estado) }}>
                          <option value="pendiente">Pendiente</option>
                          <option value="en_proceso">En proceso</option>
                          <option value="finalizado">Finalizado ✅</option>
                        </select>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditandoTarea(t); setFTarea({ descripcion: t.descripcion, sector: t.sector ?? '', urgencia: t.urgencia, responsable: t.responsable ?? '', fecha_estimada: t.fecha_estimada ?? '', notas: t.notas ?? '', materiales_solicitados: [], nuevo_mat_tarea: '' }); setShowFormTarea(true) }}
                            className="text-xs px-2 py-1 rounded-lg" style={{ background: '#f0f9ff', color: '#0284c7' }}>✏️</button>
                          {usuario?.rol === 'admin' && t.estado === 'finalizado' && (
                            <button onClick={() => borrarTarea(t.id)}
                              className="text-xs px-2 py-1 rounded-lg" style={{ background: '#fef2f2', color: '#dc2626' }}>🗑️</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Botón agregar tarea */}
            <button onClick={() => { setEditandoTarea(null); setShowFormTarea(true) }}
              className="w-full py-3 rounded-2xl text-sm font-bold text-white print:hidden"
              style={{ background: '#1e3a3a' }}>
              + Nueva tarea
            </button>
          </>
        )}

        {/* ══ TAB REGISTRO ════════════════════════════════════════════ */}
        {tab === 'registro' && (
          <>
            <div className="space-y-2">
              {registros.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-sm text-gray-500">Todavía no hay registros</p>
                </div>
              ) : registros.map(r => (
                <div key={r.id} className="bg-white rounded-2xl p-4 border border-gray-200">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-700">{fmtFecha(r.fecha)}</span>
                      {r.hora && <span className="text-xs text-gray-400">{r.hora}</span>}
                      {r.sector && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">{r.sector}</span>}
                      {r.elemento && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg">{r.elemento}</span>}
                    </div>
                    {r.tuvo_novedad && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-lg flex-shrink-0">⚠️ Novedad</span>}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">{r.trabajo}</p>
                  <div className="flex gap-3 flex-wrap text-xs text-gray-400 mb-1">
                    {r.quien && <span>👤 {r.quien}</span>}
                    {r.materiales_usados && <span>🔧 {r.materiales_usados}</span>}
                  </div>
                  {r.tuvo_novedad && r.detalle_novedad && (
                    <p className="text-xs bg-orange-50 text-orange-700 rounded-lg px-3 py-1.5 mt-1">⚠️ {r.detalle_novedad}</p>
                  )}
                  {r.pendiente && (
                    <p className="text-xs bg-blue-50 text-blue-700 rounded-lg px-3 py-1.5 mt-1">📌 Pendiente: {r.pendiente}</p>
                  )}
                  {r.observaciones && (
                    <p className="text-xs text-gray-400 mt-1">💬 {r.observaciones}</p>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setShowFormRegistro(true)}
              className="w-full py-3 rounded-2xl text-sm font-bold text-white print:hidden"
              style={{ background: '#1e3a3a' }}>
              + Nuevo registro
            </button>
          </>
        )}

        {/* ══ TAB PEDIDOS ═════════════════════════════════════════════ */}
        {tab === 'pedidos' && (
          <>
            {/* Esperando */}
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">⏳ Esperando llegada</p>
              <div className="space-y-2">
                {pedidos.filter(p => !p.llego).length === 0 ? (
                  <div className="bg-white rounded-2xl p-4 text-center border border-gray-200 text-sm text-gray-400">Sin pedidos pendientes ✅</div>
                ) : pedidos.filter(p => !p.llego).map(p => (
                  <div key={p.id} className="bg-white rounded-2xl p-4 border border-amber-200 flex items-center gap-3">
                    <button onClick={() => marcarPedidoLlegado(p.id, true)}
                      className="w-8 h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-lg"
                      style={{ borderColor: '#f59e0b' }} title="Marcar como llegado">○</button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{p.descripcion}</p>
                      <p className="text-xs text-gray-400">
                        {p.urgencia === 'urgente' && '🔴 Urgente · '}
                        {p.solicitado_por && `Pedido por ${p.solicitado_por}`}
                        {p.solicitado_en && ` · ${fmtFecha(p.solicitado_en)}`}
                      </p>
                    </div>
                    {p.urgencia === 'urgente' && <span className="text-red-500 text-xs font-bold">🔴</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Llegados */}
            {pedidos.filter(p => p.llego).length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">✅ Llegaron</p>
                <div className="space-y-2">
                  {pedidos.filter(p => p.llego).map(p => (
                    <div key={p.id} className="bg-white rounded-2xl p-4 border border-green-200 flex items-center gap-3 opacity-70">
                      <button onClick={() => marcarPedidoLlegado(p.id, false)}
                        className="w-8 h-8 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center text-white text-sm">✓</button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-600 line-through">{p.descripcion}</p>
                        {p.fecha_llegada && <p className="text-xs text-gray-400">Llegó: {fmtFecha(p.fecha_llegada)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setShowFormPedido(true)}
              className="w-full py-3 rounded-2xl text-sm font-bold text-white print:hidden"
              style={{ background: '#1e3a3a' }}>
              + Agregar pedido
            </button>
          </>
        )}
      </div>

      {/* ══ MODAL REGISTRO ══════════════════════════════════════════════ */}
      {showFormRegistro && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white w-full sm:rounded-2xl sm:max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 16 }}>📋 Nuevo registro</h2>
              <button onClick={() => setShowFormRegistro(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Fecha</label>
                  <input type="date" value={fReg.fecha} onChange={e => setFReg(f => ({ ...f, fecha: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Hora</label>
                  <input type="time" value={fReg.hora} onChange={e => setFReg(f => ({ ...f, hora: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Sector</label>
                  <select value={fReg.sector} onChange={e => setFReg(f => ({ ...f, sector: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }}>
                    <option value="">— Seleccioná —</option>
                    {SECTORES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Elemento</label>
                  <input value={fReg.elemento} onChange={e => setFReg(f => ({ ...f, elemento: e.target.value }))}
                    placeholder="ej: P2, cajón cascos..."
                    className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Trabajo realizado *</label>
                <textarea value={fReg.trabajo} onChange={e => setFReg(f => ({ ...f, trabajo: e.target.value }))}
                  placeholder="Describí el trabajo..."
                  rows={2} className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none resize-none" style={{ border: '1.5px solid #e5e7eb' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Realizó</label>
                  <input value={fReg.quien} onChange={e => setFReg(f => ({ ...f, quien: e.target.value }))}
                    placeholder={usuario?.nombre ?? 'Nombre'}
                    className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Materiales usados</label>
                  <input value={fReg.materiales_usados} onChange={e => setFReg(f => ({ ...f, materiales_usados: e.target.value }))}
                    placeholder="ej: tornillos, pintura..."
                    className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }} />
                </div>
              </div>

              {/* Novedad */}
              <div className="border rounded-xl p-3" style={{ border: '1.5px solid #e5e7eb' }}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={fReg.tuvo_novedad} onChange={e => setFReg(f => ({ ...f, tuvo_novedad: e.target.checked }))}
                    className="w-4 h-4 rounded" />
                  <span className="text-sm font-semibold text-gray-700">⚠️ Hubo una novedad</span>
                </label>
                {fReg.tuvo_novedad && (
                  <textarea value={fReg.detalle_novedad} onChange={e => setFReg(f => ({ ...f, detalle_novedad: e.target.value }))}
                    placeholder="Describí la novedad..."
                    rows={2} className="w-full border rounded-xl px-3 py-2 text-sm mt-2 focus:outline-none resize-none" style={{ border: '1.5px solid #e5e7eb' }} />
                )}
              </div>

              {/* Pendiente */}
              <div>
                <label className="text-xs font-semibold text-gray-600">📌 Quedó pendiente / acción futura</label>
                <input value={fReg.pendiente} onChange={e => setFReg(f => ({ ...f, pendiente: e.target.value }))}
                  placeholder="Si queda algo para hacer después..."
                  className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }} />
                {fReg.pendiente.trim() && (
                  <p className="text-xs text-blue-500 mt-1">→ Se creará una tarea automáticamente en Pendientes</p>
                )}
              </div>

              {/* Materiales faltantes */}
              <div className="border rounded-xl p-3" style={{ border: '1.5px solid #e5e7eb' }}>
                <p className="text-xs font-semibold text-gray-600 mb-2">🛒 ¿Faltó algún material?</p>
                {fReg.materiales_faltantes.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm flex-1 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-lg">{m}</span>
                    <button onClick={() => setFReg(f => ({ ...f, materiales_faltantes: f.materiales_faltantes.filter((_, j) => j !== i) }))}
                      className="text-red-400 text-xs">✕</button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input value={fReg.nuevo_material} onChange={e => setFReg(f => ({ ...f, nuevo_material: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter' && fReg.nuevo_material.trim()) { setFReg(f => ({ ...f, materiales_faltantes: [...f.materiales_faltantes, f.nuevo_material.trim()], nuevo_material: '' })) }}}
                    placeholder="Nombre del material..."
                    className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }} />
                  <button onClick={() => { if (fReg.nuevo_material.trim()) setFReg(f => ({ ...f, materiales_faltantes: [...f.materiales_faltantes, f.nuevo_material.trim()], nuevo_material: '' }))}}
                    className="px-3 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#1e3a3a' }}>+</button>
                </div>
                {fReg.materiales_faltantes.length > 0 && (
                  <p className="text-xs text-amber-600 mt-1.5">→ Se agregarán {fReg.materiales_faltantes.length} material(es) a la lista de Pedidos</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">💬 Observaciones</label>
                <textarea value={fReg.observaciones} onChange={e => setFReg(f => ({ ...f, observaciones: e.target.value }))}
                  placeholder="Cualquier dato útil..."
                  rows={2} className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none resize-none" style={{ border: '1.5px solid #e5e7eb' }} />
              </div>

              <button onClick={guardarRegistro} disabled={!fReg.trabajo.trim()}
                className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: '#1e3a3a' }}>
                Guardar registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL TAREA ═══════════════════════════════════════════════ */}
      {showFormTarea && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white w-full sm:rounded-2xl sm:max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 16 }}>
                {editandoTarea ? '✏️ Editar tarea' : '📌 Nueva tarea'}
              </h2>
              <button onClick={() => { setShowFormTarea(false); setEditandoTarea(null) }} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">Descripción *</label>
                <textarea value={fTarea.descripcion} onChange={e => setFTarea(f => ({ ...f, descripcion: e.target.value }))}
                  rows={2} className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none resize-none" style={{ border: '1.5px solid #e5e7eb' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Urgencia</label>
                  <select value={fTarea.urgencia} onChange={e => setFTarea(f => ({ ...f, urgencia: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }}>
                    <option value="muy_urgente">🔴 Muy urgente</option>
                    <option value="media">🟡 Media</option>
                    <option value="puede_esperar">🟢 Puede esperar</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Sector</label>
                  <select value={fTarea.sector} onChange={e => setFTarea(f => ({ ...f, sector: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }}>
                    <option value="">General</option>
                    {SECTORES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Responsable</label>
                  <input value={fTarea.responsable} onChange={e => setFTarea(f => ({ ...f, responsable: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Fecha estimada</label>
                  <input type="date" value={fTarea.fecha_estimada} onChange={e => setFTarea(f => ({ ...f, fecha_estimada: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Notas</label>
                <input value={fTarea.notas} onChange={e => setFTarea(f => ({ ...f, notas: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }} />
              </div>

              {/* Materiales solicitados */}
              <div className="border rounded-xl p-3" style={{ border: '1.5px solid #e5e7eb' }}>
                <p className="text-xs font-semibold text-gray-600 mb-2">🛒 Materiales necesarios para esta tarea</p>
                {fTarea.materiales_solicitados.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm flex-1 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-lg">{m}</span>
                    <button onClick={() => setFTarea(f => ({ ...f, materiales_solicitados: f.materiales_solicitados.filter((_, j) => j !== i) }))}
                      className="text-red-400 text-xs hover:text-red-600">✕</button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input value={fTarea.nuevo_mat_tarea}
                    onChange={e => setFTarea(f => ({ ...f, nuevo_mat_tarea: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter' && fTarea.nuevo_mat_tarea.trim()) { setFTarea(f => ({ ...f, materiales_solicitados: [...f.materiales_solicitados, f.nuevo_mat_tarea.trim()], nuevo_mat_tarea: '' })) }}}
                    placeholder="ej: Tornillos M8, pintura..."
                    className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }} />
                  <button onClick={() => { if (fTarea.nuevo_mat_tarea.trim()) setFTarea(f => ({ ...f, materiales_solicitados: [...f.materiales_solicitados, f.nuevo_mat_tarea.trim()], nuevo_mat_tarea: '' })) }}
                    className="px-3 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#1e3a3a' }}>+</button>
                </div>
                {fTarea.materiales_solicitados.length > 0 && (
                  <p className="text-xs text-amber-600 mt-1.5">→ Se agregarán {fTarea.materiales_solicitados.length} material(es) a Pedidos</p>
                )}
              </div>
              <button onClick={guardarTarea} disabled={!fTarea.descripcion.trim()}
                className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: '#1e3a3a' }}>
                {editandoTarea ? 'Guardar cambios' : 'Agregar tarea'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL PEDIDO ══════════════════════════════════════════════ */}
      {showFormPedido && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white w-full sm:rounded-2xl sm:max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 16 }}>🛒 Agregar pedido</h2>
              <button onClick={() => setShowFormPedido(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">Material / elemento *</label>
                <input value={fPedido.descripcion} onChange={e => setFPedido(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="ej: Tuercas M10, pintura blanca..."
                  className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Urgencia</label>
                <select value={fPedido.urgencia} onChange={e => setFPedido(f => ({ ...f, urgencia: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }}>
                  <option value="urgente">🔴 Urgente</option>
                  <option value="normal">🟡 Normal</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Notas</label>
                <input value={fPedido.notas} onChange={e => setFPedido(f => ({ ...f, notas: e.target.value }))}
                  placeholder="Cantidad, especificación..."
                  className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }} />
              </div>
              <button onClick={guardarPedido} disabled={!fPedido.descripcion.trim()}
                className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: '#1e3a3a' }}>
                Agregar al pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          header { background: #1e3a3a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  )
}
