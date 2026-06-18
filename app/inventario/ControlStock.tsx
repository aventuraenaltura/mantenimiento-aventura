'use client'
import React, { useState, useEffect } from 'react'

type Rating = '' | 'MB' | 'R' | 'V' | 'C'
type UsoEquipo = '' | 'Instructor' | 'Turista' | 'Depósito'

interface Equipo {
  id: string
  tipo: string
  numero_interno: string
  marca: string
  modelo: string
  numero_serie: string
  actividad: string
  ubicacion: string
  uso_actual: string
  estado: string
  observaciones: string
  historial: { fecha: string; accion: string; por: string }[]
}

// Registro para arneses
interface RegistroArnes {
  equipo_id: string
  uso_anterior: string
  uso_actual: UsoEquipo
  toma_fuerza: Rating
  costuras: Rating
  cinta_cintura: Rating
  perneras_izq: Rating
  perneras_der: Rating
  porta_equipo: Rating
  elasticos: Rating
  linea_vida: Rating
  mosqueton_acero: Rating
  observaciones: string
}

// Registro para poleas
interface RegistroPolea {
  equipo_id: string
  uso: UsoEquipo
  estado_carcaza: Rating
  estado_vertigo: Rating
  soporte_aluminio: Rating
  ruleman_izq: Rating
  ruleman_der: Rating
  express_si: boolean
  estado_express: Rating
  mosqueton_express: Rating
  cierre_mosqueton: Rating
  observaciones: string
}

interface SesionControl {
  id: string
  fecha: string
  tipo: 'poleas' | 'arneses'
  realizado_por: string
  registros_arneses?: RegistroArnes[]
  registros_poleas?: RegistroPolea[]
}

interface Props {
  equipos: Equipo[]
  onVolver: () => void
  onGuardar: (sesion: SesionControl) => void
  esAdmin: boolean
}

const RATINGS: Rating[] = ['', 'MB', 'R', 'V', 'C']

function colorRating(r: Rating): string {
  if (r === 'MB') return '#16a34a'
  if (r === 'R') return '#f59e0b'
  if (r === 'V') return '#9333ea'
  if (r === 'C') return '#dc2626'
  return '#d1d5db'
}

function RatingSelect({ value, onChange }: { value: Rating; onChange: (v: Rating) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as Rating)}
      style={{
        fontSize: 11, fontWeight: 700, border: `2px solid ${colorRating(value)}`,
        borderRadius: 6, padding: '3px 4px', background: value ? colorRating(value) + '18' : '#f9fafb',
        color: value ? colorRating(value) : '#9ca3af', width: '100%', textAlign: 'center',
        cursor: 'pointer',
      }}
    >
      {RATINGS.map(r => <option key={r} value={r}>{r || '—'}</option>)}
    </select>
  )
}

function RatingBadge({ value }: { value: Rating }) {
  if (!value) return <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>
  return (
    <span style={{
      background: colorRating(value) + '22', color: colorRating(value),
      fontWeight: 800, fontSize: 12, padding: '2px 8px', borderRadius: 5,
      border: `1px solid ${colorRating(value)}44`,
    }}>{value}</span>
  )
}

export default function ControlStock({ equipos, onVolver, onGuardar, esAdmin }: Props) {
  const [tipo, setTipo] = useState<'poleas' | 'arneses'>('poleas')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [realizadoPor, setRealizadoPor] = useState('')
  const [regArneses, setRegArneses] = useState<Record<string, RegistroArnes>>({})
  const [regPoleas, setRegPoleas] = useState<Record<string, RegistroPolea>>({})
  const [vistaImprimir, setVistaImprimir] = useState(false)
  const [historialSesiones, setHistorialSesiones] = useState<SesionControl[]>([])

  const arneses = equipos.filter(e => e.tipo === 'arnes').sort((a, b) => Number(a.numero_interno) - Number(b.numero_interno))
  const poleas = equipos.filter(e => e.tipo === 'polea').sort((a, b) => Number(a.numero_interno) - Number(b.numero_interno))
  const filtrados = tipo === 'poleas' ? poleas : arneses

  useEffect(() => {
    const saved = localStorage.getItem('historial_controles')
    if (saved) setHistorialSesiones(JSON.parse(saved))
  }, [])

  // Inicializar registros vacíos para arneses
  useEffect(() => {
    const init: Record<string, RegistroArnes> = {}
    arneses.forEach(eq => {
      if (!regArneses[eq.id]) {
        init[eq.id] = {
          equipo_id: eq.id,
          uso_anterior: eq.uso_actual || '',
          uso_actual: '' as UsoEquipo,
          toma_fuerza: '', costuras: '', cinta_cintura: '',
          perneras_izq: '', perneras_der: '',
          porta_equipo: '', elasticos: '', linea_vida: '', mosqueton_acero: '',
          observaciones: '',
        }
      }
    })
    if (Object.keys(init).length > 0) setRegArneses(prev => ({ ...init, ...prev }))
  }, [arneses.length])

  // Inicializar registros vacíos para poleas
  useEffect(() => {
    const init: Record<string, RegistroPolea> = {}
    poleas.forEach(eq => {
      if (!regPoleas[eq.id]) {
        init[eq.id] = {
          equipo_id: eq.id,
          uso: '' as UsoEquipo,
          estado_carcaza: '', estado_vertigo: '', soporte_aluminio: '',
          ruleman_izq: '', ruleman_der: '',
          express_si: false,
          estado_express: '', mosqueton_express: '', cierre_mosqueton: '',
          observaciones: '',
        }
      }
    })
    if (Object.keys(init).length > 0) setRegPoleas(prev => ({ ...init, ...prev }))
  }, [poleas.length])

  function setRA(id: string, campo: Partial<RegistroArnes>) {
    setRegArneses(prev => ({ ...prev, [id]: { ...prev[id], ...campo } }))
  }
  function setRP(id: string, campo: Partial<RegistroPolea>) {
    setRegPoleas(prev => ({ ...prev, [id]: { ...prev[id], ...campo } }))
  }

  function guardar() {
    const sesion: SesionControl = {
      id: Date.now().toString(),
      fecha, tipo, realizado_por: realizadoPor,
      registros_arneses: arneses.map(eq => regArneses[eq.id]).filter(Boolean),
      registros_poleas: poleas.map(eq => regPoleas[eq.id]).filter(Boolean),
    }
    const nuevas = [sesion, ...historialSesiones].slice(0, 20)
    setHistorialSesiones(nuevas)
    localStorage.setItem('historial_controles', JSON.stringify(nuevas))
    onGuardar(sesion)
    alert(`✅ Control guardado. ${filtrados.length} equipos registrados.`)
  }

  // ── VISTA IMPRIMIR ───────────────────────────────────────────────
  if (vistaImprimir) {
    return (
      <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Arial, sans-serif', color: '#000', padding: '12px 20px' }}>
        <div className="no-print" style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setVistaImprimir(false)}
            style={{ border: '1px solid #ccc', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>← Volver</button>
          <button onClick={() => window.print()}
            style={{ background: '#000', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 700, cursor: 'pointer' }}>
            🖨️ Imprimir / PDF
          </button>
        </div>

        {/* ── ARNESES ── */}
        <div style={{ pageBreakAfter: 'always' }}>
          <div style={{ borderBottom: '2px solid #000', paddingBottom: 6, marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#555' }}>AVENTURA EN ALTURA — PTATANKA SRL</div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>PLANILLA DE CONTROL DE EQUIPOS — ARNESES</div>
            <div style={{ display: 'flex', gap: 32, marginTop: 4, fontSize: 12 }}>
              <span><strong>Fecha:</strong> {new Date(fecha).toLocaleDateString('es-AR')}</span>
              <span><strong>Realizado por:</strong> {realizadoPor || '_______________'}</span>
              <span style={{ marginLeft: 'auto', fontStyle: 'italic', color: '#555' }}>MB= Muy Bueno / R= Regular / V= Ver / C= Cambiar</span>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#1e3a3a', color: '#fff' }}>
                <th style={th}>N°</th>
                <th style={th}>Marca</th>
                <th style={th}>Modelo</th>
                <th style={th}>N° Serie</th>
                <th style={{ ...th, background: '#2d5555' }}>Uso Ant.</th>
                <th style={{ ...th, background: '#2d5555' }}>Uso Act.</th>
                <th style={th}>Toma fuerza</th>
                <th style={th}>Costuras</th>
                <th style={th}>Cinta cintura</th>
                <th style={th}>Perneras IZQ</th>
                <th style={th}>Perneras DER</th>
                <th style={th}>Porta equipo</th>
                <th style={th}>Elásticos</th>
                <th style={th}>Línea vida</th>
                <th style={th}>Mosq. acero</th>
                <th style={{ ...th, minWidth: 80 }}>Obs.</th>
              </tr>
            </thead>
            <tbody>
              {arneses.map((eq, idx) => {
                const r = regArneses[eq.id]
                return (
                  <tr key={eq.id} style={{ background: idx % 2 === 0 ? '#f5f5f5' : '#fff' }}>
                    <td style={td}>{eq.numero_interno}</td>
                    <td style={td}>{eq.marca}</td>
                    <td style={td}>{eq.modelo}</td>
                    <td style={{ ...td, fontFamily: 'monospace' }}>{eq.numero_serie}</td>
                    <td style={{ ...td, color: '#888' }}>{r?.uso_anterior || '—'}</td>
                    <td style={td}>{r?.uso_actual || '—'}</td>
                    <td style={tdC}><RatingBadge value={r?.toma_fuerza || ''} /></td>
                    <td style={tdC}><RatingBadge value={r?.costuras || ''} /></td>
                    <td style={tdC}><RatingBadge value={r?.cinta_cintura || ''} /></td>
                    <td style={tdC}><RatingBadge value={r?.perneras_izq || ''} /></td>
                    <td style={tdC}><RatingBadge value={r?.perneras_der || ''} /></td>
                    <td style={tdC}><RatingBadge value={r?.porta_equipo || ''} /></td>
                    <td style={tdC}><RatingBadge value={r?.elasticos || ''} /></td>
                    <td style={tdC}><RatingBadge value={r?.linea_vida || ''} /></td>
                    <td style={tdC}><RatingBadge value={r?.mosqueton_acero || ''} /></td>
                    <td style={td}>{r?.observaciones || ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <Firmas />
        </div>

        {/* ── POLEAS ── */}
        <div>
          <div style={{ borderBottom: '2px solid #000', paddingBottom: 6, marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#555' }}>AVENTURA EN ALTURA — PTATANKA SRL</div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>PLANILLA DE CONTROL DE EQUIPOS — POLEAS</div>
            <div style={{ display: 'flex', gap: 32, marginTop: 4, fontSize: 12 }}>
              <span><strong>Fecha:</strong> {new Date(fecha).toLocaleDateString('es-AR')}</span>
              <span><strong>Realizado por:</strong> {realizadoPor || '_______________'}</span>
              <span style={{ marginLeft: 'auto', fontStyle: 'italic', color: '#555' }}>MB= Muy Bueno / R= Regular / V= Ver / C= Cambiar</span>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#1e3a3a', color: '#fff' }}>
                <th style={th}>N°</th>
                <th style={th}>Marca</th>
                <th style={th}>Modelo</th>
                <th style={th}>N° Serie</th>
                <th style={{ ...th, background: '#2d5555' }}>Uso</th>
                <th style={th}>Carcaza</th>
                <th style={th}>Vértigo</th>
                <th style={th}>Sop. Alum.</th>
                <th style={th}>Ruleman IZQ</th>
                <th style={th}>Ruleman DER</th>
                <th style={{ ...th, textAlign: 'center' }}>Express</th>
                <th style={th}>Est. Express</th>
                <th style={th}>Mosq. Exp.</th>
                <th style={th}>Cierre M.</th>
                <th style={{ ...th, minWidth: 80 }}>Obs.</th>
              </tr>
            </thead>
            <tbody>
              {poleas.map((eq, idx) => {
                const r = regPoleas[eq.id]
                return (
                  <tr key={eq.id} style={{ background: idx % 2 === 0 ? '#f5f5f5' : '#fff' }}>
                    <td style={td}>{eq.numero_interno}</td>
                    <td style={td}>{eq.marca}</td>
                    <td style={td}>{eq.modelo}</td>
                    <td style={{ ...td, fontFamily: 'monospace' }}>{eq.numero_serie}</td>
                    <td style={{ ...td, color: '#555' }}>{r?.uso || '—'}</td>
                    <td style={tdC}><RatingBadge value={r?.estado_carcaza || ''} /></td>
                    <td style={tdC}><RatingBadge value={r?.estado_vertigo || ''} /></td>
                    <td style={tdC}><RatingBadge value={r?.soporte_aluminio || ''} /></td>
                    <td style={tdC}><RatingBadge value={r?.ruleman_izq || ''} /></td>
                    <td style={tdC}><RatingBadge value={r?.ruleman_der || ''} /></td>
                    <td style={{ ...tdC }}>{r?.express_si ? '✓' : '—'}</td>
                    <td style={tdC}><RatingBadge value={r?.estado_express || ''} /></td>
                    <td style={tdC}><RatingBadge value={r?.mosqueton_express || ''} /></td>
                    <td style={tdC}><RatingBadge value={r?.cierre_mosqueton || ''} /></td>
                    <td style={td}>{r?.observaciones || ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <Firmas />
        </div>

        <style>{`
          @media print {
            .no-print { display: none !important; }
            @page { size: A4 landscape; margin: 10mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}</style>
      </div>
    )
  }

  // ── VISTA NORMAL ────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#f0ede6' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #1e3a3a 0%, #2d5555 100%)', color: 'white' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button onClick={onVolver}
                style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 18 }}>
                ←
              </button>
              <div>
                <h1 style={{ margin: 0, fontWeight: 900, fontSize: 20, letterSpacing: 0.5 }}>Control de Stock</h1>
                <p style={{ margin: 0, fontSize: 11, opacity: 0.6 }}>MB= Muy Bueno · R= Regular · V= Ver · C= Cambiar</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setVistaImprimir(true)}
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 10, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                🖨️ Imprimir planilla
              </button>
              <button onClick={guardar}
                style={{ background: '#16a34a', border: 'none', color: 'white', borderRadius: 10, padding: '8px 20px', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>
                💾 Guardar control
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 3, gap: 3 }}>
              {(['poleas', 'arneses'] as const).map(t => (
                <button key={t} onClick={() => setTipo(t)}
                  style={tipo === t
                    ? { background: 'white', color: '#1e3a3a', border: 'none', borderRadius: 8, padding: '6px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }
                    : { background: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: 8, padding: '6px 20px', fontSize: 13, cursor: 'pointer' }}>
                  {t === 'poleas' ? '⚙️ Poleas' : '🦺 Arneses'}
                </button>
              ))}
            </div>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 10, padding: '6px 12px', fontSize: 13 }} />
            <input type="text" placeholder="Realizado por..." value={realizadoPor} onChange={e => setRealizadoPor(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 10, padding: '6px 14px', fontSize: 13, minWidth: 180 }} />
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '6px 14px', fontSize: 13 }}>
              <strong>{filtrados.length}</strong> <span style={{ opacity: 0.7 }}>{tipo}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabla */}
      <div style={{ maxWidth: 1400, margin: '24px auto', padding: '0 16px' }}>
        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #ddd8cf', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {filtrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#a0aec0' }}>
              <p style={{ fontSize: 24, margin: '0 0 8px' }}>📦</p>
              <p>No hay {tipo} registrados. Importá el Excel desde Inventario.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              {tipo === 'arneses' ? (
                <TablaArneses arneses={arneses} regArneses={regArneses} setRA={setRA} />
              ) : (
                <TablaPoleas poleas={poleas} regPoleas={regPoleas} setRP={setRP} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── TABLA ARNESES ──────────────────────────────────────────────────
function TablaArneses({
  arneses, regArneses, setRA
}: {
  arneses: Equipo[]
  regArneses: Record<string, RegistroArnes>
  setRA: (id: string, c: Partial<RegistroArnes>) => void
}) {
  const headerStyle: React.CSSProperties = {
    padding: '8px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center',
    background: '#1e3a3a', color: 'white', whiteSpace: 'nowrap', border: '1px solid #2d5555',
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
      <thead>
        <tr>
          <th style={{ ...headerStyle, textAlign: 'left', minWidth: 40 }}>N°</th>
          <th style={{ ...headerStyle, textAlign: 'left', minWidth: 70 }}>Marca</th>
          <th style={{ ...headerStyle, textAlign: 'left', minWidth: 100 }}>Modelo</th>
          <th style={{ ...headerStyle, minWidth: 80 }}>N° Serie</th>
          <th style={{ ...headerStyle, background: '#2d5555', minWidth: 80 }}>Uso ant.</th>
          <th style={{ ...headerStyle, background: '#2d5555', minWidth: 90 }}>Uso actual</th>
          <th style={{ ...headerStyle, minWidth: 72 }}>Toma fuerza</th>
          <th style={{ ...headerStyle, minWidth: 66 }}>Costuras</th>
          <th style={{ ...headerStyle, minWidth: 76 }}>Cinta cintura</th>
          <th style={{ ...headerStyle, minWidth: 72 }}>Perneras IZQ</th>
          <th style={{ ...headerStyle, minWidth: 72 }}>Perneras DER</th>
          <th style={{ ...headerStyle, minWidth: 76 }}>Porta equipo</th>
          <th style={{ ...headerStyle, minWidth: 66 }}>Elásticos</th>
          <th style={{ ...headerStyle, minWidth: 70 }}>Línea vida</th>
          <th style={{ ...headerStyle, minWidth: 72 }}>Mosq. acero</th>
          <th style={{ ...headerStyle, textAlign: 'left', minWidth: 140 }}>Observaciones</th>
        </tr>
      </thead>
      <tbody>
        {arneses.map((eq, idx) => {
          const r = regArneses[eq.id]
          if (!r) return null
          const rowBg = idx % 2 === 0 ? '#fafafa' : 'white'
          const cell: React.CSSProperties = { padding: '6px 5px', borderBottom: '1px solid #f0ede6', textAlign: 'center', background: rowBg }
          return (
            <tr key={eq.id}>
              <td style={{ ...cell, fontFamily: 'monospace', fontWeight: 700, fontSize: 12, textAlign: 'left', paddingLeft: 10 }}>#{eq.numero_interno}</td>
              <td style={{ ...cell, textAlign: 'left' }}>{eq.marca}</td>
              <td style={{ ...cell, textAlign: 'left', fontWeight: 500 }}>{eq.modelo}</td>
              <td style={{ ...cell, fontFamily: 'monospace', fontSize: 10 }}>{eq.numero_serie || '—'}</td>
              <td style={{ ...cell, color: '#888', fontSize: 10 }}>{r.uso_anterior || '—'}</td>
              <td style={{ ...cell }}>
                <select value={r.uso_actual} onChange={e => setRA(eq.id, { uso_actual: e.target.value as UsoEquipo })}
                  style={{ fontSize: 11, border: '1px solid #ddd', borderRadius: 6, padding: '3px 4px', background: '#faf8f4', width: '100%' }}>
                  <option value="">—</option>
                  <option value="Instructor">Instructor</option>
                  <option value="Turista">Turista</option>
                  <option value="Depósito">Depósito</option>
                </select>
              </td>
              <td style={cell}><RatingSelect value={r.toma_fuerza} onChange={v => setRA(eq.id, { toma_fuerza: v })} /></td>
              <td style={cell}><RatingSelect value={r.costuras} onChange={v => setRA(eq.id, { costuras: v })} /></td>
              <td style={cell}><RatingSelect value={r.cinta_cintura} onChange={v => setRA(eq.id, { cinta_cintura: v })} /></td>
              <td style={cell}><RatingSelect value={r.perneras_izq} onChange={v => setRA(eq.id, { perneras_izq: v })} /></td>
              <td style={cell}><RatingSelect value={r.perneras_der} onChange={v => setRA(eq.id, { perneras_der: v })} /></td>
              <td style={cell}><RatingSelect value={r.porta_equipo} onChange={v => setRA(eq.id, { porta_equipo: v })} /></td>
              <td style={cell}><RatingSelect value={r.elasticos} onChange={v => setRA(eq.id, { elasticos: v })} /></td>
              <td style={cell}><RatingSelect value={r.linea_vida} onChange={v => setRA(eq.id, { linea_vida: v })} /></td>
              <td style={cell}><RatingSelect value={r.mosqueton_acero} onChange={v => setRA(eq.id, { mosqueton_acero: v })} /></td>
              <td style={{ ...cell, textAlign: 'left' }}>
                <input type="text" value={r.observaciones} placeholder="Obs..."
                  onChange={e => setRA(eq.id, { observaciones: e.target.value })}
                  style={{ fontSize: 10, border: '1px solid #ddd', borderRadius: 6, padding: '3px 6px', background: '#faf8f4', width: '100%' }} />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// ── TABLA POLEAS ───────────────────────────────────────────────────
function TablaPoleas({
  poleas, regPoleas, setRP
}: {
  poleas: Equipo[]
  regPoleas: Record<string, RegistroPolea>
  setRP: (id: string, c: Partial<RegistroPolea>) => void
}) {
  const headerStyle: React.CSSProperties = {
    padding: '8px 6px', fontSize: 10, fontWeight: 700, textAlign: 'center',
    background: '#1e3a3a', color: 'white', whiteSpace: 'nowrap', border: '1px solid #2d5555',
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
      <thead>
        <tr>
          <th style={{ ...headerStyle, textAlign: 'left', minWidth: 40 }}>N°</th>
          <th style={{ ...headerStyle, textAlign: 'left', minWidth: 70 }}>Marca</th>
          <th style={{ ...headerStyle, textAlign: 'left', minWidth: 100 }}>Modelo</th>
          <th style={{ ...headerStyle, minWidth: 80 }}>N° Serie</th>
          <th style={{ ...headerStyle, background: '#2d5555', minWidth: 90 }}>Uso</th>
          <th style={{ ...headerStyle, minWidth: 66 }}>Carcaza</th>
          <th style={{ ...headerStyle, minWidth: 66 }}>Vértigo</th>
          <th style={{ ...headerStyle, minWidth: 76 }}>Sop. Alum.</th>
          <th style={{ ...headerStyle, minWidth: 72 }}>Ruleman IZQ</th>
          <th style={{ ...headerStyle, minWidth: 72 }}>Ruleman DER</th>
          <th style={{ ...headerStyle, minWidth: 58 }}>Express</th>
          <th style={{ ...headerStyle, minWidth: 76 }}>Est. Express</th>
          <th style={{ ...headerStyle, minWidth: 76 }}>Mosq. Express</th>
          <th style={{ ...headerStyle, minWidth: 66 }}>Cierre M.</th>
          <th style={{ ...headerStyle, textAlign: 'left', minWidth: 140 }}>Observaciones</th>
        </tr>
      </thead>
      <tbody>
        {poleas.map((eq, idx) => {
          const r = regPoleas[eq.id]
          if (!r) return null
          const rowBg = idx % 2 === 0 ? '#fafafa' : 'white'
          const cell: React.CSSProperties = { padding: '6px 5px', borderBottom: '1px solid #f0ede6', textAlign: 'center', background: rowBg }
          return (
            <tr key={eq.id}>
              <td style={{ ...cell, fontFamily: 'monospace', fontWeight: 700, fontSize: 12, textAlign: 'left', paddingLeft: 10 }}>#{eq.numero_interno}</td>
              <td style={{ ...cell, textAlign: 'left' }}>{eq.marca}</td>
              <td style={{ ...cell, textAlign: 'left', fontWeight: 500 }}>{eq.modelo}</td>
              <td style={{ ...cell, fontFamily: 'monospace', fontSize: 10 }}>{eq.numero_serie || '—'}</td>
              <td style={cell}>
                <select value={r.uso} onChange={e => setRP(eq.id, { uso: e.target.value as UsoEquipo })}
                  style={{ fontSize: 11, border: '1px solid #ddd', borderRadius: 6, padding: '3px 4px', background: '#faf8f4', width: '100%' }}>
                  <option value="">—</option>
                  <option value="Instructor">Instructor</option>
                  <option value="Turista">Turista</option>
                  <option value="Depósito">Depósito</option>
                </select>
              </td>
              <td style={cell}><RatingSelect value={r.estado_carcaza} onChange={v => setRP(eq.id, { estado_carcaza: v })} /></td>
              <td style={cell}><RatingSelect value={r.estado_vertigo} onChange={v => setRP(eq.id, { estado_vertigo: v })} /></td>
              <td style={cell}><RatingSelect value={r.soporte_aluminio} onChange={v => setRP(eq.id, { soporte_aluminio: v })} /></td>
              <td style={cell}><RatingSelect value={r.ruleman_izq} onChange={v => setRP(eq.id, { ruleman_izq: v })} /></td>
              <td style={cell}><RatingSelect value={r.ruleman_der} onChange={v => setRP(eq.id, { ruleman_der: v })} /></td>
              <td style={cell}>
                <input type="checkbox" checked={r.express_si}
                  onChange={e => setRP(eq.id, { express_si: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: 'pointer' }} />
              </td>
              <td style={cell}><RatingSelect value={r.estado_express} onChange={v => setRP(eq.id, { estado_express: v })} /></td>
              <td style={cell}><RatingSelect value={r.mosqueton_express} onChange={v => setRP(eq.id, { mosqueton_express: v })} /></td>
              <td style={cell}><RatingSelect value={r.cierre_mosqueton} onChange={v => setRP(eq.id, { cierre_mosqueton: v })} /></td>
              <td style={{ ...cell, textAlign: 'left' }}>
                <input type="text" value={r.observaciones} placeholder="Obs..."
                  onChange={e => setRP(eq.id, { observaciones: e.target.value })}
                  style={{ fontSize: 10, border: '1px solid #ddd', borderRadius: 6, padding: '3px 6px', background: '#faf8f4', width: '100%' }} />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function Firmas() {
  return (
    <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
      {['Realizado por', 'Controló', 'Aclaración / Firma'].map(l => (
        <div key={l}>
          <div style={{ borderBottom: '1.5px solid #000', marginBottom: 4 }} />
          <div style={{ fontSize: 9, color: '#666' }}>{l}</div>
        </div>
      ))}
    </div>
  )
}

const th: React.CSSProperties = {
  padding: '7px 6px', fontSize: 12, fontWeight: 700, textAlign: 'center',
  background: '#1e3a3a', color: 'white', whiteSpace: 'nowrap', border: '1px solid #2d5555',
}
const td: React.CSSProperties = {
  padding: '5px 6px', border: '1px solid #ccc', textAlign: 'left', fontSize: 12,
}
const tdC: React.CSSProperties = {
  padding: '5px 6px', border: '1px solid #ccc', textAlign: 'center', fontSize: 12,
}
