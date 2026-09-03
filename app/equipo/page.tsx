'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { fmtFecha } from '@/lib/fecha'

// ── Tipos ────────────────────────────────────────────────────────────
interface Ficha {
  id: string
  tipo: 'arnes' | 'polea'
  numero_interno?: string
  marca?: string
  modelo?: string
  numero_serie?: string
  sector?: string
  estado: string
  instructor?: string
  ingreso?: string
  observaciones?: string
}

interface Historial {
  id: string
  ficha_id: string
  fecha: string
  tipo: string
  descripcion: string
  materiales?: string
  quien?: string
  estado_nuevo?: string
}

interface Stock {
  id: string
  categoria: string
  nombre: string
  marca?: string
  descripcion?: string
  en_uso: number
  deposito: number
  reparar: number
  baja: number
  notas?: string
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  en_uso_turista:    { label: 'En uso turista',    color: '#16a34a', bg: '#f0fdf4', dot: '#22c55e' },
  en_uso_instructor: { label: 'En uso instructor', color: '#2563eb', bg: '#eff6ff', dot: '#3b82f6' },
  deposito:          { label: 'Depósito',           color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' },
  reparacion:        { label: 'Reparación',         color: '#dc2626', bg: '#fef2f2', dot: '#ef4444' },
  baja:              { label: 'Baja',               color: '#6b7280', bg: '#f9fafb', dot: '#9ca3af' },
  sin_uso:           { label: 'Sin uso',            color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' },
  carcasa:           { label: 'Carcasa/Depósito',   color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' },
}

const CATEGORIAS: Record<string, string> = {
  casco: '⛑️ Cascos',
  arco: '🏹 Arcos',
  flecha: '➡️ Flechas',
  lente: '🥽 Lentes',
  guantin: '🧤 Guantines',
  protector: '🦺 Protectores',
  cuerda: '🪢 Cuerdas',
  varios: '📦 Varios',
}

export default function EquipoPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<{ nombre: string; rol: string } | null>(null)
  const [tab, setTab] = useState<'fichas' | 'stock' | 'reparaciones' | 'importar'>('fichas')
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [stock, setStock] = useState<Stock[]>([])
  const [cargando, setCargando] = useState(true)

  // Filtros fichas
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroSector, setFiltroSector] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  // Ficha seleccionada
  const [fichaSeleccionada, setFichaSeleccionada] = useState<Ficha | null>(null)
  const [historial, setHistorial] = useState<Historial[]>([])
  const [showFormHistorial, setShowFormHistorial] = useState(false)
  const [showFormEstado, setShowFormEstado] = useState(false)

  // Form historial
  const [fHist, setFHist] = useState({ fecha: new Date().toISOString().split('T')[0], descripcion: '', materiales: '', quien: '' })
  // Form cambio estado
  const [fEstado, setFEstado] = useState({ estado: '', instructor: '', observaciones: '' })

  // Import
  const [importando, setImportando] = useState(false)
  const [importLog, setImportLog] = useState<string[]>([])

  useEffect(() => {
    const u = localStorage.getItem('usuario')
    if (!u) { router.push('/'); return }
    setUsuario(JSON.parse(u))
    cargarTodo()
  }, [router])

  async function cargarTodo() {
    setCargando(true)
    const [{ data: f }, { data: s }] = await Promise.all([
      supabase.from('equipo_fichas').select('*').order('tipo').order('numero_interno'),
      supabase.from('equipo_stock').select('*').order('categoria').order('nombre'),
    ])
    setFichas(f ?? [])
    setStock(s ?? [])
    setCargando(false)
  }

  async function abrirFicha(f: Ficha) {
    setFichaSeleccionada(f)
    const { data } = await supabase.from('equipo_historial').select('*').eq('ficha_id', f.id).order('fecha', { ascending: false })
    setHistorial(data ?? [])
  }

  async function guardarHistorial() {
    if (!fichaSeleccionada || !fHist.descripcion.trim()) return
    const nuevo: Historial = {
      id: `hist_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      ficha_id: fichaSeleccionada.id,
      fecha: fHist.fecha,
      tipo: 'mantenimiento',
      descripcion: fHist.descripcion,
      materiales: fHist.materiales,
      quien: fHist.quien || usuario?.nombre,
    }
    await supabase.from('equipo_historial').insert(nuevo)
    setHistorial(prev => [nuevo, ...prev])
    setShowFormHistorial(false)
    setFHist({ fecha: new Date().toISOString().split('T')[0], descripcion: '', materiales: '', quien: '' })
  }

  async function cambiarEstado() {
    if (!fichaSeleccionada || !fEstado.estado) return
    const upd: Partial<Ficha> = { estado: fEstado.estado, instructor: fEstado.instructor || undefined }
    await supabase.from('equipo_fichas').update(upd).eq('id', fichaSeleccionada.id)
    // Registrar en historial
    const hist: Historial = {
      id: `hist_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      ficha_id: fichaSeleccionada.id,
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'cambio_estado',
      descripcion: `Estado cambiado a: ${ESTADO_CONFIG[fEstado.estado]?.label ?? fEstado.estado}${fEstado.instructor ? ` — Instructor: ${fEstado.instructor}` : ''}${fEstado.observaciones ? `. ${fEstado.observaciones}` : ''}`,
      quien: usuario?.nombre,
      estado_nuevo: fEstado.estado,
    }
    await supabase.from('equipo_historial').insert(hist)
    setFichas(prev => prev.map(f => f.id === fichaSeleccionada.id ? { ...f, ...upd } : f))
    setFichaSeleccionada(prev => prev ? { ...prev, ...upd } : null)
    setHistorial(prev => [hist, ...prev])
    setShowFormEstado(false)
    setFEstado({ estado: '', instructor: '', observaciones: '' })
  }

  async function actualizarStock(id: string, campo: keyof Stock, valor: number) {
    await supabase.from('equipo_stock').update({ [campo]: valor }).eq('id', id)
    setStock(prev => prev.map(s => s.id === id ? { ...s, [campo]: valor } : s))
  }

  // ── Importar desde Excel ─────────────────────────────────────────────
  async function importarExcel(file: File) {
    setImportando(true)
    setImportLog(['📂 Leyendo archivo...'])
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let XLSX = (window as any).XLSX
      if (!XLSX) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script')
          s.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'
          s.onload = () => res(); s.onerror = () => rej(new Error('No se pudo cargar XLSX'))
          document.head.appendChild(s)
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        XLSX = (window as any).XLSX
      }
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array', cellDates: true })

      const fichasNuevas: Omit<Ficha, 'id'>[] = []
      const stockNuevo: Omit<Stock, 'id'>[] = []

      function parseEstadoArnes(juego: string, ubic: string, uso: string): { estado: string; instructor: string } {
        const j = String(juego || '').trim().toUpperCase()
        const u = String(ubic || '').trim()
        const us = String(uso || '').trim().toUpperCase()
        if (us === 'NO') return { estado: 'baja', instructor: '' }
        if (j === 'REPARAR') return { estado: 'reparacion', instructor: u }
        if (['DEP', 'D', 'dep'].includes(u)) return { estado: 'deposito', instructor: '' }
        if (['EU', 'eu', 'E.U.'].includes(u)) return { estado: 'en_uso_turista', instructor: '' }
        if (u === '') return { estado: 'deposito', instructor: '' }
        if (j.includes('INSTR')) return { estado: 'en_uso_instructor', instructor: u }
        if (j.includes('TIRO') || j.includes('PARQUE')) {
          return { estado: 'en_uso_turista', instructor: '' }
        }
        return { estado: 'deposito', instructor: u }
      }

      function sectorDeJuego(juego: string): string {
        const j = String(juego || '').trim().toUpperCase()
        if (j.includes('PARQUE') || j.includes('AEREO')) return 'parque'
        if (j.includes('TIRO') || j.includes('INSTR') || j.includes('DEP') || j.includes('REP')) return 'tirolesa'
        return 'tirolesa'
      }

      // ARNESES
      const shArn = wb.Sheets['stock arneses']
      if (shArn) {
        setImportLog(l => [...l, '🎽 Procesando arneses...'])
        const rows: unknown[][] = XLSX.utils.sheet_to_json(shArn, { header: 1, defval: '' })
        for (let i = 2; i < rows.length; i++) {
          const r = rows[i] as string[]
          const marca = String(r[1] || '').trim()
          const modelo = String(r[2] || '').trim()
          if (!marca && !modelo) continue
          const juego = String(r[3] || '').trim()
          const serie = String(r[4] || '').trim()
          const ingreso = String(r[5] || '').trim().replace('T00:00:00', '').slice(0,4)
          const uso = String(r[6] || '').trim()
          const ubic = String(r[7] || '').trim()
          const obs = String(r[8] || '').trim()
          const nroInt = String(r[0] || '').trim()
          const { estado, instructor } = parseEstadoArnes(juego, ubic, uso)
          fichasNuevas.push({ tipo: 'arnes', numero_interno: nroInt, marca, modelo, numero_serie: serie, sector: sectorDeJuego(juego), estado, instructor, ingreso, observaciones: obs })
        }
      }

      // POLEAS
      const shPol = wb.Sheets['stock ploeas'] || wb.Sheets['stock poleas']
      if (shPol) {
        setImportLog(l => [...l, '🛞 Procesando poleas...'])
        const rows: unknown[][] = XLSX.utils.sheet_to_json(shPol, { header: 1, defval: '' })
        for (let i = 2; i < rows.length; i++) {
          const r = rows[i] as string[]
          const nroInt = String(r[1] || '').trim()
          const marca = String(r[2] || '').trim()
          const modelo = String(r[3] || '').trim()
          if (!marca && !modelo) continue
          const juego = String(r[4] || '').trim().toUpperCase()
          const serie = String(r[5] || '').trim()
          const ubic = String(r[7] || '').trim()
          const ubic2 = String(r[8] || '').trim()
          let estado = 'deposito'; let instructor = ''; let sector = 'tirolesa'
          if (juego === 'REPARAR') { estado = 'reparacion' }
          else if (juego === 'SIN USO' || juego === 'CARCASA') { estado = 'carcasa'; sector = 'tirolesa' }
          else if (juego === 'DEPOSITO') { estado = 'deposito' }
          else if (juego.includes('INSTR')) {
            const nm = ubic !== '' && !['DEP','EU','NO'].includes(ubic.toUpperCase()) ? ubic : ubic2
            if (nm && !['DEP','EU','NO',''].includes(nm.toUpperCase())) { estado = 'en_uso_instructor'; instructor = nm }
            else { estado = 'deposito' }
          }
          else if (juego === 'PARQUE AEREO') { sector = 'parque'; estado = ubic.toUpperCase() === 'EU' ? 'en_uso_turista' : 'deposito' }
          else if (juego === 'TIROLESA') { sector = 'tirolesa'; estado = ubic.toUpperCase() === 'EU' || ubic.toUpperCase() === 'TUR' ? 'en_uso_turista' : ubic.toUpperCase() === 'DEP' ? 'deposito' : 'deposito' }
          if (ubic.toUpperCase() === 'NO' || ubic2.toUpperCase() === 'NO') { estado = 'baja' }
          fichasNuevas.push({ tipo: 'polea', numero_interno: nroInt, marca, modelo, numero_serie: serie, sector, estado, instructor, ingreso: '', observaciones: '' })
        }
      }

      // STOCK — Cascos (Col A vacía → índices desde 0=ColB)
      const shCasc = wb.Sheets['Stock cascos']
      if (shCasc) {
        setImportLog(l => [...l, '⛑️ Procesando cascos...'])
        const rows: unknown[][] = XLSX.utils.sheet_to_json(shCasc, { header: 1, defval: '' })
        // detectar offset: si fila 1 col 0 es vacía, datos empiezan en col 1
        const offset = String(rows[1]?.[0] || '').trim() === '' ? 0 : 1
        for (let i = 2; i < rows.length; i++) {
          const r = rows[i] as unknown[]
          const nombre = String(r[0 + offset] || '').trim()
          const marca = String(r[1 + offset] || '').trim()
          if (!nombre) continue
          const uso = String(r[2 + offset] || '').trim()
          const instrCount = Number(r[3 + offset]) || 0
          const tirolesa = Number(r[4 + offset]) || 0
          const parque = Number(r[5 + offset]) || 0
          const dep = Number(r[6 + offset]) || 0
          const rep = Number(r[7 + offset]) || 0
          stockNuevo.push({ categoria: 'casco', nombre: `Casco ${nombre}`, marca, descripcion: `Uso: ${uso}`, en_uso: instrCount + tirolesa + parque, deposito: dep, reparar: rep, baja: 0 })
        }
      }

      // STOCK — Arcos (Col A vacía → r[0]=Modelo, r[1]=Marca)
      const shArc = wb.Sheets['stock arcos']
      if (shArc) {
        setImportLog(l => [...l, '🏹 Procesando arcos...'])
        const rows: unknown[][] = XLSX.utils.sheet_to_json(shArc, { header: 1, defval: '' })
        // detectar offset: buscar fila con 'Modelo' o 'modelo'
        let arcOffset = 0
        for (const r of rows.slice(0, 5)) {
          const r0 = String((r as unknown[])[0] || '').toLowerCase()
          const r1 = String((r as unknown[])[1] || '').toLowerCase()
          if (r0.includes('model')) { arcOffset = 0; break }
          if (r1.includes('model')) { arcOffset = 1; break }
        }
        for (let i = 3; i < rows.length; i++) {
          const r = rows[i] as unknown[]
          const modelo = String(r[0 + arcOffset] || '').trim()
          const marca = String(r[1 + arcOffset] || '').trim()
          if (!modelo) continue
          const dureza = String(r[2 + arcOffset] || '').trim()
          const uso = String(r[3 + arcOffset] || '').trim()
          const der = Number(r[4 + arcOffset]) || 0
          const zur = Number(r[5 + arcOffset]) || 0
          const amb = Number(r[6 + arcOffset]) || 0
          const dep = Number(r[7 + arcOffset]) || 0
          const enUso = (typeof r[8 + arcOffset] === 'number') ? r[8 + arcOffset] as number : 0
          stockNuevo.push({ categoria: 'arco', nombre: `${modelo} ${dureza} — ${uso}`.trim(), marca, descripcion: `Derecho:${der} Zurdo:${zur} Ambidiestro:${amb}`, en_uso: enUso > 0 ? enUso : der + zur + amb, deposito: dep, reparar: 0, baja: 0 })
        }
      }

      // STOCK — Varios (Col A vacía → r[0]=nombre, r[1]=marca)
      const shVar = wb.Sheets['stock varios'] || wb.Sheets['stock  varios']
      if (shVar) {
        setImportLog(l => [...l, '📦 Procesando varios...'])
        const rows: unknown[][] = XLSX.utils.sheet_to_json(shVar, { header: 1, defval: '' })
        // detectar offset: buscar fila con 'Materiales'
        let varOffset = 0
        for (const r of rows.slice(0, 5)) {
          const r0 = String((r as unknown[])[0] || '').toLowerCase()
          const r1 = String((r as unknown[])[1] || '').toLowerCase()
          if (r0.includes('material')) { varOffset = 0; break }
          if (r1.includes('material')) { varOffset = 1; break }
        }
        for (let i = 3; i < rows.length; i++) {
          const r = rows[i] as unknown[]
          const nombre = String(r[0 + varOffset] || '').trim()
          if (!nombre || nombre.toLowerCase().includes('material')) continue
          const marca = String(r[1 + varOffset] || '').trim()
          const tur = Number(r[2 + varOffset]) || 0
          const instr = Number(r[3 + varOffset]) || 0
          const mant = Number(r[4 + varOffset]) || 0
          const dep = Number(r[5 + varOffset]) || 0
          const rep = Number(r[6 + varOffset]) || 0
          let cat = 'varios'
          const n = nombre.toLowerCase()
          if (n.includes('casco')) cat = 'casco'
          else if (n.includes('arco') || n.includes('bow')) cat = 'arco'
          else if (n.includes('flecha')) cat = 'flecha'
          else if (n.includes('lente')) cat = 'lente'
          else if (n.includes('guantin') || n.includes('guante') || n.includes('mitone')) cat = 'guantin'
          else if (n.includes('protector') || n.includes('brazo') || n.includes('tab')) cat = 'protector'
          else if (n.includes('cuerda') || n.includes('nock')) cat = 'cuerda'
          stockNuevo.push({ categoria: cat, nombre, marca, descripcion: '', en_uso: tur + instr + mant, deposito: dep, reparar: rep, baja: 0 })
        }
      }

      setImportLog(l => [...l, `📊 ${fichasNuevas.length} fichas, ${stockNuevo.length} ítems de stock`])
      setImportLog(l => [...l, '💾 Guardando en Supabase...'])

      // Upsert fichas por numero_serie
      const { data: existentes } = await supabase.from('equipo_fichas').select('id, numero_serie, tipo')
      const existMap = new Map((existentes ?? []).map(e => [`${e.tipo}-${e.numero_serie}`, e.id]))

      let creadas = 0, actualizadas = 0
      for (const f of fichasNuevas) {
        const key = `${f.tipo}-${f.numero_serie}`
        const existeId = existMap.get(key)
        if (existeId) {
          await supabase.from('equipo_fichas').update({ estado: f.estado, instructor: f.instructor, sector: f.sector, observaciones: f.observaciones }).eq('id', existeId)
          actualizadas++
        } else {
          await supabase.from('equipo_fichas').insert({ id: `eq_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, ...f })
          creadas++
        }
      }
      setImportLog(l => [...l, `  ✅ Fichas: ${creadas} creadas, ${actualizadas} actualizadas`])

      // Stock: borrar y reinsert
      if (stockNuevo.length > 0) {
        await supabase.from('equipo_stock').delete().neq('id', 'xxx')
        for (const s of stockNuevo) {
          await supabase.from('equipo_stock').insert({ id: `stk_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, ...s })
        }
        setImportLog(l => [...l, `  ✅ Stock: ${stockNuevo.length} ítems`])
      }

      setImportLog(l => [...l, '🎉 Importación completada'])
      cargarTodo()
    } catch (e) {
      setImportLog(l => [...l, `❌ Error: ${e}`])
    }
    setImportando(false)
  }

  // ── Filtros ───────────────────────────────────────────────────────────
  const fichasFiltradas = fichas.filter(f => {
    if (filtroTipo !== 'todos' && f.tipo !== filtroTipo) return false
    if (filtroSector !== 'todos' && f.sector !== filtroSector) return false
    if (filtroEstado !== 'todos' && f.estado !== filtroEstado) return false
    if (busqueda) {
      const b = busqueda.toLowerCase()
      return (f.numero_serie?.toLowerCase().includes(b) || f.marca?.toLowerCase().includes(b) || f.modelo?.toLowerCase().includes(b) || f.instructor?.toLowerCase().includes(b) || f.numero_interno?.includes(b))
    }
    return true
  })

  const enReparacion = fichas.filter(f => f.estado === 'reparacion')
  const stockReparar = stock.filter(s => s.reparar > 0)

  if (!usuario) return null

  return (
    <div className="min-h-screen" style={{ background: '#f7f5f0' }}>
      {/* Header */}
      <header style={{ background: '#1e3a3a', color: 'white' }} className="px-4 py-4 flex items-center gap-3">
        <Link href="/home" className="text-white opacity-60 hover:opacity-100 text-xl">←</Link>
        <span className="text-2xl">🎽</span>
        <div className="flex-1">
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18 }}>Control de Equipo</h1>
          <p style={{ fontSize: 11, opacity: 0.6 }}>Aventura en Altura</p>
        </div>
      </header>

      {/* Badges resumen */}
      <div className="max-w-3xl mx-auto px-4 pt-4 grid grid-cols-4 gap-2">
        {[
          { label: 'Arneses', val: fichas.filter(f=>f.tipo==='arnes').length, icon: '🎽', color: '#1e3a3a' },
          { label: 'Poleas', val: fichas.filter(f=>f.tipo==='polea').length, icon: '🛞', color: '#1e3a3a' },
          { label: 'Reparación', val: enReparacion.length, icon: '🔴', color: '#dc2626' },
          { label: 'Depósito', val: fichas.filter(f=>f.estado==='deposito').length, icon: '🟡', color: '#d97706' },
        ].map(b => (
          <div key={b.label} className="bg-white rounded-2xl p-3 text-center border border-gray-200">
            <p style={{ fontSize: 20, fontWeight: 800, color: b.color }}>{b.val}</p>
            <p style={{ fontSize: 9, color: '#6b7280', fontWeight: 600 }}>{b.icon} {b.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <div className="flex rounded-2xl overflow-hidden border border-gray-200 bg-white">
          {([['fichas','🎽 Fichas'],['control','📋 Control Stock'],['stock','📦 Varios'],['reparaciones','🔴 Reparaciones'],['importar','📥 Importar']] as const).map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              className="flex-1 py-2.5 text-xs font-bold"
              style={{ background: tab===id ? '#1e3a3a' : 'white', color: tab===id ? 'white' : '#6b7280' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">

        {/* ══ CONTROL STOCK ═══════════════════════════════════════════ */}
        {tab === 'control' && !fichaSeleccionada && (
          <>
            {(['arnes', 'polea'] as const).map(tipo => {
              const items = fichas.filter(f => f.tipo === tipo)
              if (items.length === 0) return null
              const titulo = tipo === 'arnes' ? '🎽 Arneses' : '🛞 Poleas'
              // Agrupar por sector
              const sectores = [...new Set(items.map(f => f.sector || 'general'))].sort()
              return (
                <div key={tipo}>
                  <div className="flex items-center justify-between mb-2">
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 14, color: '#1c2533' }}>{titulo}</p>
                    <p className="text-xs text-gray-400">{items.length} equipos</p>
                  </div>
                  {sectores.map(sector => {
                    const equiposSector = items.filter(f => (f.sector || 'general') === sector)
                    return (
                      <div key={sector} className="mb-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-1 capitalize">{sector}</p>
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                          {equiposSector.map((f, idx) => {
                            const ec = ESTADO_CONFIG[f.estado] ?? ESTADO_CONFIG.deposito
                            return (
                              <button key={f.id} onClick={() => { abrirFicha(f); setTab('fichas') }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                                style={{ borderBottom: idx < equiposSector.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ec.dot }} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-gray-400 w-6 flex-shrink-0">#{f.numero_interno || '—'}</span>
                                    <span className="text-sm font-semibold text-gray-800 truncate">{f.marca} {f.modelo}</span>
                                  </div>
                                  <div className="flex gap-3 text-xs text-gray-400 mt-0.5 pl-8">
                                    <span>Serie: {f.numero_serie || '—'}</span>
                                    {f.instructor && <span className="text-blue-500">👤 {f.instructor}</span>}
                                  </div>
                                </div>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-lg flex-shrink-0"
                                  style={{ background: ec.bg, color: ec.color }}>{ec.label}</span>
                                <span className="text-gray-300 text-sm flex-shrink-0">›</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {/* Varios — solo stock cantidad, sin ficha individual */}
            {stock.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 14, color: '#1c2533' }}>📦 Varios (stock)</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  {stock.map((s, idx) => (
                    <div key={s.id} className="flex items-center gap-3 px-4 py-3"
                      style={{ borderBottom: idx < stock.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{s.nombre}</p>
                        {s.marca && <p className="text-xs text-gray-400">{s.marca}</p>}
                      </div>
                      <div className="flex gap-4 text-center flex-shrink-0">
                        <div>
                          <p style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>{s.en_uso}</p>
                          <p style={{ fontSize: 9, color: '#9ca3af' }}>En uso</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 16, fontWeight: 800, color: '#d97706' }}>{s.deposito}</p>
                          <p style={{ fontSize: 9, color: '#9ca3af' }}>Depósito</p>
                        </div>
                        {s.reparar > 0 && (
                          <div>
                            <p style={{ fontSize: 16, fontWeight: 800, color: '#dc2626' }}>{s.reparar}</p>
                            <p style={{ fontSize: 9, color: '#9ca3af' }}>Reparar</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fichas.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm text-gray-400">Importá el Excel primero</p>
                <button onClick={()=>setTab('importar')} className="mt-3 text-sm text-blue-500 hover:underline">→ Ir a Importar</button>
              </div>
            )}
          </>
        )}

        {/* ══ FICHAS ══════════════════════════════════════════════════ */}
        {tab === 'fichas' && !fichaSeleccionada && (
          <>
            {/* Filtros */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-2">
              <input value={busqueda} onChange={e=>setBusqueda(e.target.value)}
                placeholder="🔍 Buscar por nº serie, marca, modelo, instructor..."
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }} />
              <div className="flex gap-2 flex-wrap">
                {[['todos','Todo tipo'],['arnes','Arneses'],['polea','Poleas']].map(([v,l])=>(
                  <button key={v} onClick={()=>setFiltroTipo(v)}
                    className="text-xs px-3 py-1.5 rounded-xl font-semibold"
                    style={{ background: filtroTipo===v ? '#1e3a3a' : '#f3f4f6', color: filtroTipo===v ? 'white' : '#6b7280' }}>{l}</button>
                ))}
                <select value={filtroSector} onChange={e=>setFiltroSector(e.target.value)}
                  className="text-xs border rounded-xl px-2 py-1.5 focus:outline-none" style={{ border: '1px solid #e5e7eb' }}>
                  <option value="todos">Todo sector</option>
                  <option value="tirolesa">Tirolesa</option>
                  <option value="parque">Parque Aéreo</option>
                </select>
                <select value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)}
                  className="text-xs border rounded-xl px-2 py-1.5 focus:outline-none" style={{ border: '1px solid #e5e7eb' }}>
                  <option value="todos">Todo estado</option>
                  {Object.entries(ESTADO_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <p className="text-xs text-gray-400">{fichasFiltradas.length} equipos</p>
            </div>

            {/* Lista */}
            {cargando ? <p className="text-center text-gray-400 py-8">Cargando...</p> :
            fichasFiltradas.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm text-gray-400">No hay equipos — importá el Excel primero</p>
                <button onClick={()=>setTab('importar')} className="mt-3 text-sm text-blue-500 hover:underline">→ Ir a Importar</button>
              </div>
            ) : (
              <div className="space-y-2">
                {fichasFiltradas.map(f => {
                  const ec = ESTADO_CONFIG[f.estado] ?? ESTADO_CONFIG.deposito
                  return (
                    <button key={f.id} onClick={()=>abrirFicha(f)} className="w-full bg-white rounded-2xl p-4 border text-left flex items-center gap-3"
                      style={{ borderColor: f.estado === 'reparacion' ? '#fecaca' : '#e5e7eb', borderLeftWidth: 4, borderLeftColor: ec.dot }}>
                      <div className="text-2xl flex-shrink-0">{f.tipo === 'arnes' ? '🎽' : '🛞'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-gray-800">{f.marca} {f.modelo}</span>
                          {f.numero_interno && <span className="text-xs text-gray-400">#{f.numero_interno}</span>}
                        </div>
                        <div className="flex gap-2 flex-wrap mt-0.5">
                          <span className="text-xs text-gray-400">Serie: {f.numero_serie || '—'}</span>
                          {f.instructor && <span className="text-xs text-blue-500">👤 {f.instructor}</span>}
                          {f.sector && <span className="text-xs text-gray-400 capitalize">{f.sector}</span>}
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
                        style={{ background: ec.bg, color: ec.color }}>{ec.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ══ FICHA DETALLE ════════════════════════════════════════════ */}
        {tab === 'fichas' && fichaSeleccionada && (
          <>
            <button onClick={()=>setFichaSeleccionada(null)} className="text-sm text-blue-500 hover:underline">← Volver a la lista</button>

            {/* Card equipo */}
            <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: fichaSeleccionada.estado === 'reparacion' ? '#fecaca' : '#e5e7eb' }}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{fichaSeleccionada.tipo === 'arnes' ? '🎽' : '🛞'}</span>
                    <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18, color: '#1c2533' }}>
                      {fichaSeleccionada.marca} {fichaSeleccionada.modelo}
                    </h2>
                  </div>
                  <div className="flex gap-3 flex-wrap text-xs text-gray-500">
                    <span>Nº {fichaSeleccionada.numero_interno || '—'}</span>
                    <span>Serie: <strong>{fichaSeleccionada.numero_serie || '—'}</strong></span>
                    <span className="capitalize">{fichaSeleccionada.sector}</span>
                    {fichaSeleccionada.ingreso && <span>Ingreso: {fichaSeleccionada.ingreso}</span>}
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0"
                  style={{ background: ESTADO_CONFIG[fichaSeleccionada.estado]?.bg, color: ESTADO_CONFIG[fichaSeleccionada.estado]?.color }}>
                  {ESTADO_CONFIG[fichaSeleccionada.estado]?.label}
                </span>
              </div>
              {fichaSeleccionada.instructor && (
                <p className="text-sm text-blue-600 mb-2">👤 Instructor: <strong>{fichaSeleccionada.instructor}</strong></p>
              )}
              {fichaSeleccionada.observaciones && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">{fichaSeleccionada.observaciones}</p>
              )}
              {fichaSeleccionada.estado === 'reparacion' && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <p className="text-xs font-bold text-red-600">🔴 EQUIPO EN REPARACIÓN</p>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={()=>setShowFormEstado(true)}
                  className="flex-1 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#1e3a3a' }}>
                  Cambiar estado
                </button>
                <button onClick={()=>setShowFormHistorial(true)}
                  className="flex-1 py-2 rounded-xl text-sm font-bold" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                  + Mantenimiento
                </button>
              </div>
            </div>

            {/* Historial */}
            <div>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 13, color: '#1c2533', marginBottom: 8 }}>
                📋 Historial ({historial.length})
              </p>
              {historial.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sin registros aún</p>
              ) : historial.map(h => (
                <div key={h.id} className="bg-white rounded-2xl p-4 border border-gray-200 mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-700">{fmtFecha(h.fecha)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${h.tipo === 'cambio_estado' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                      {h.tipo === 'cambio_estado' ? '🔄 Cambio estado' : '🔧 Mantenimiento'}
                    </span>
                    {h.quien && <span className="text-xs text-gray-400">👤 {h.quien}</span>}
                  </div>
                  <p className="text-sm text-gray-700">{h.descripcion}</p>
                  {h.materiales && <p className="text-xs text-gray-400 mt-0.5">🔧 {h.materiales}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══ STOCK ════════════════════════════════════════════════════ */}
        {tab === 'stock' && (
          <>
            {Object.entries(CATEGORIAS).map(([cat, label]) => {
              const items = stock.filter(s => s.categoria === cat)
              if (items.length === 0) return null
              return (
                <div key={cat}>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 12, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                  <div className="space-y-2">
                    {items.map(s => (
                      <div key={s.id} className="bg-white rounded-2xl p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-sm font-bold text-gray-800">{s.nombre}</p>
                            {s.marca && <p className="text-xs text-gray-400">{s.marca}</p>}
                            {s.descripcion && <p className="text-xs text-gray-400">{s.descripcion}</p>}
                          </div>
                          <span className="text-lg font-black text-gray-800">{s.en_uso + s.deposito + s.reparar}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { campo: 'en_uso' as const, label: 'En uso', color: '#16a34a' },
                            { campo: 'deposito' as const, label: 'Depósito', color: '#d97706' },
                            { campo: 'reparar' as const, label: 'Reparar', color: '#dc2626' },
                          ].map(({ campo, label, color }) => (
                            <div key={campo} className="text-center">
                              <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>{label}</p>
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => actualizarStock(s.id, campo, Math.max(0, s[campo] - 1))}
                                  className="w-8 h-8 rounded-full text-gray-500 hover:text-gray-700 text-lg font-bold flex items-center justify-center" style={{ background: '#f3f4f6' }}>−</button>
                                <span style={{ fontSize: 32, fontWeight: 900, color, minWidth: 40, textAlign: 'center', lineHeight: 1 }}>{s[campo]}</span>
                                <button onClick={() => actualizarStock(s.id, campo, s[campo] + 1)}
                                  className="w-8 h-8 rounded-full text-gray-500 hover:text-gray-700 text-lg font-bold flex items-center justify-center" style={{ background: '#f3f4f6' }}>+</button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {s.reparar > 0 && (
                          <p className="text-xs text-red-500 mt-2 text-center">⚠️ {s.reparar} unidad{s.reparar > 1 ? 'es' : ''} para reparar</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {stock.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
                <p className="text-3xl mb-2">📦</p>
                <p className="text-sm text-gray-400">Importá el Excel para cargar el stock</p>
                <button onClick={()=>setTab('importar')} className="mt-3 text-sm text-blue-500 hover:underline">→ Ir a Importar</button>
              </div>
            )}
          </>
        )}

        {/* ══ REPARACIONES ═════════════════════════════════════════════ */}
        {tab === 'reparaciones' && (
          <>
            {enReparacion.length === 0 && stockReparar.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-sm text-gray-500">No hay equipos en reparación</p>
              </div>
            ) : (
              <>
                {/* Fichas en reparación */}
                {enReparacion.length > 0 && (
                  <div>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 12, color: '#dc2626', marginBottom: 6, textTransform: 'uppercase' }}>
                      🔴 Fichas individuales ({enReparacion.length})
                    </p>
                    <div className="space-y-2">
                      {enReparacion.map(f => (
                        <button key={f.id} onClick={()=>{ abrirFicha(f); setTab('fichas') }}
                          className="w-full bg-white rounded-2xl p-4 border border-red-200 text-left flex items-center gap-3">
                          <span className="text-xl">{f.tipo === 'arnes' ? '🎽' : '🛞'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800">{f.marca} {f.modelo}</p>
                            <p className="text-xs text-gray-400">Serie: {f.numero_serie} · #{f.numero_interno} · {f.sector}</p>
                            {f.observaciones && <p className="text-xs text-red-500 mt-0.5">{f.observaciones}</p>}
                          </div>
                          <span className="text-xs text-blue-500">Ver ficha →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Stock con reparaciones */}
                {stockReparar.length > 0 && (
                  <div>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 12, color: '#d97706', marginBottom: 6, textTransform: 'uppercase' }}>
                      🟡 Stock por cantidad ({stockReparar.length} ítems)
                    </p>
                    <div className="space-y-2">
                      {stockReparar.map(s => (
                        <div key={s.id} className="bg-white rounded-2xl p-4 border border-amber-200 flex items-center gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-800">{s.nombre}</p>
                            {s.marca && <p className="text-xs text-gray-400">{s.marca}</p>}
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-black text-red-500">{s.reparar}</p>
                            <p className="text-xs text-gray-400">para reparar</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ══ IMPORTAR ═════════════════════════════════════════════════ */}
        {tab === 'importar' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18, color: '#1c2533', marginBottom: 4 }}>📥 Importar desde Excel</h2>
            <p className="text-sm text-gray-500 mb-5">
              Subí el archivo <strong>contro_STOCK_2026.xlsx</strong>. Las fichas existentes se actualizarán sin perder el historial.
            </p>
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 cursor-pointer hover:bg-gray-50"
              style={{ borderColor: importando ? '#9ca3af' : '#1e3a3a' }}>
              <span className="text-4xl mb-3">{importando ? '⏳' : '📂'}</span>
              <span className="text-sm font-bold text-gray-700">{importando ? 'Importando...' : 'Tocar para seleccionar el Excel'}</span>
              <span className="text-xs text-gray-400 mt-1">contro_STOCK_2026.xlsx</span>
              <input type="file" accept=".xlsx,.xls" className="hidden" disabled={importando}
                onChange={e => { const f = e.target.files?.[0]; if (f) importarExcel(f); e.target.value = '' }} />
            </label>
            {importLog.length > 0 && (
              <div className="mt-4 bg-gray-900 rounded-xl p-4 max-h-64 overflow-y-auto">
                {importLog.map((l, i) => (
                  <p key={i} className="text-xs font-mono mb-0.5"
                    style={{ color: l.includes('❌') ? '#f87171' : l.includes('✅') || l.includes('🎉') ? '#4ade80' : '#e5e7eb' }}>{l}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ MODAL CAMBIO ESTADO ══════════════════════════════════════════ */}
      {showFormEstado && fichaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white w-full sm:rounded-2xl sm:max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 16 }}>🔄 Cambiar estado</h2>
              <button onClick={()=>setShowFormEstado(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(ESTADO_CONFIG).map(([k,v]) => (
                  <button key={k} onClick={()=>setFEstado(f=>({...f, estado:k}))}
                    className="py-2.5 rounded-xl text-xs font-bold border-2 transition-all"
                    style={{ background: fEstado.estado===k ? v.bg : 'white', borderColor: fEstado.estado===k ? v.dot : '#e5e7eb', color: v.color }}>
                    {v.label}
                  </button>
                ))}
              </div>
              {fEstado.estado === 'en_uso_instructor' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600">Instructor</label>
                  <input value={fEstado.instructor} onChange={e=>setFEstado(f=>({...f,instructor:e.target.value}))}
                    placeholder="Nombre del instructor"
                    className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }} />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-600">Observaciones</label>
                <input value={fEstado.observaciones} onChange={e=>setFEstado(f=>({...f,observaciones:e.target.value}))}
                  placeholder="Motivo del cambio..."
                  className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }} />
              </div>
              <button onClick={cambiarEstado} disabled={!fEstado.estado}
                className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: '#1e3a3a' }}>
                Confirmar cambio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL MANTENIMIENTO ══════════════════════════════════════════ */}
      {showFormHistorial && fichaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white w-full sm:rounded-2xl sm:max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 16 }}>🔧 Registrar mantenimiento</h2>
              <button onClick={()=>setShowFormHistorial(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">Fecha</label>
                <input type="date" value={fHist.fecha} onChange={e=>setFHist(f=>({...f,fecha:e.target.value}))}
                  className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">¿Qué se hizo? *</label>
                <textarea value={fHist.descripcion} onChange={e=>setFHist(f=>({...f,descripcion:e.target.value}))}
                  rows={2} placeholder="Describí el mantenimiento..."
                  className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none resize-none" style={{ border: '1.5px solid #e5e7eb' }} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Materiales usados</label>
                <input value={fHist.materiales} onChange={e=>setFHist(f=>({...f,materiales:e.target.value}))}
                  placeholder="ej: lona, hilo, pegamento..."
                  className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Realizado por</label>
                <input value={fHist.quien} onChange={e=>setFHist(f=>({...f,quien:e.target.value}))}
                  placeholder={usuario?.nombre ?? 'Nombre'}
                  className="w-full border rounded-xl px-3 py-2 text-sm mt-0.5 focus:outline-none" style={{ border: '1.5px solid #e5e7eb' }} />
              </div>
              <button onClick={guardarHistorial} disabled={!fHist.descripcion.trim()}
                className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: '#1e3a3a' }}>
                Guardar registro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
