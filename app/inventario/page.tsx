'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import ControlStock from './ControlStock'
import ImportarStockInicial from '@/components/ImportarStockInicial'
import RegistrarReparacion from '@/components/RegistrarReparacion'

type TipoEquipo = 'arnes' | 'polea' | 'casco' | 'mosqueton' | 'guantin'
type Ubicacion = 'en_uso' | 'deposito' | 'para_reparar' | 'baja'
type Estado = 'nuevo' | 'bueno' | 'regular' | 'revisar' | 'baja'

interface Equipo {
  id: string
  tipo: TipoEquipo
  numero_interno: string
  marca: string
  modelo: string
  numero_serie: string
  actividad: 'tirolesa' | 'parque'
  ubicacion: Ubicacion
  uso_actual: string
  estado: Estado
  fecha_ingreso: string
  observaciones: string
  historial: { fecha: string; accion: string; por: string }[]
}

interface RegistroStock {
  fecha: string
  nota: string
  enUso: number
  deposito: number
  reparar: number
}

interface ModeloGuantin {
  id: string
  modelo: string   // ej: "Cuero natural", "Reforzado", etc.
  color: string
  enUso: number
  deposito: number
  reparar: number
  historial: RegistroStock[]
}

interface RegistroCasco {
  fecha: string
  nota: string
  tirolesa: number
  parque: number
  deposito: number
  reparar: number
}

interface ModeloCasco {
  id: string
  modelo: string
  marca: string
  color: string
  tirolesa: number
  parque: number
  deposito: number
  reparar: number
  historial: RegistroCasco[]
}

const EQUIPOS_DEMO: Equipo[] = [
  { id: '1', tipo: 'arnes', numero_interno: '23', marca: 'Climb X', modelo: 'Galaxy', numero_serie: '1', actividad: 'tirolesa', ubicacion: 'en_uso', uso_actual: 'turista', estado: 'bueno', fecha_ingreso: '2020-01-01', observaciones: '', historial: [] },
  { id: '2', tipo: 'arnes', numero_interno: '24', marca: 'Climb X', modelo: 'Galaxy', numero_serie: '2', actividad: 'tirolesa', ubicacion: 'en_uso', uso_actual: 'turista', estado: 'bueno', fecha_ingreso: '2020-01-01', observaciones: '', historial: [] },
  { id: '3', tipo: 'arnes', numero_interno: '19', marca: 'Fixe', modelo: 'Amarillo instructor', numero_serie: '124210', actividad: 'tirolesa', ubicacion: 'en_uso', uso_actual: 'instructor', estado: 'bueno', fecha_ingreso: '2018-01-01', observaciones: 'sin polea', historial: [] },
  { id: '4', tipo: 'arnes', numero_interno: '1', marca: 'Petzl', modelo: 'Pandion', numero_serie: '114', actividad: 'parque', ubicacion: 'en_uso', uso_actual: 'turista', estado: 'nuevo', fecha_ingreso: '2025-10-01', observaciones: 'Ingreso octubre 2025', historial: [] },
  { id: '5', tipo: 'arnes', numero_interno: '2', marca: 'Petzl', modelo: 'Pandion', numero_serie: '123', actividad: 'parque', ubicacion: 'en_uso', uso_actual: 'turista', estado: 'nuevo', fecha_ingreso: '2025-10-01', observaciones: '', historial: [] },
  { id: '6', tipo: 'polea', numero_interno: '9', marca: 'Petzl', modelo: 'Trac Plus Naranja', numero_serie: '1822', actividad: 'tirolesa', ubicacion: 'en_uso', uso_actual: 'instructor', estado: 'bueno', fecha_ingreso: '2018-01-01', observaciones: '', historial: [] },
  { id: '7', tipo: 'polea', numero_interno: '13', marca: 'Petzl', modelo: 'Trac 2', numero_serie: '1994', actividad: 'tirolesa', ubicacion: 'en_uso', uso_actual: 'turista', estado: 'bueno', fecha_ingreso: '2018-01-01', observaciones: '', historial: [] },
  { id: '8', tipo: 'polea', numero_interno: '1', marca: 'Petzl', modelo: 'TRAC CLUB', numero_serie: '3639', actividad: 'parque', ubicacion: 'en_uso', uso_actual: 'turista', estado: 'nuevo', fecha_ingreso: '2025-10-01', observaciones: '', historial: [] },
  { id: '9', tipo: 'polea', numero_interno: '17', marca: 'Petzl', modelo: 'Trac 2', numero_serie: '2127', actividad: 'tirolesa', ubicacion: 'deposito', uso_actual: 'deposito', estado: 'regular', fecha_ingreso: '2018-01-01', observaciones: '', historial: [{ fecha: '2024-06-01', accion: 'Revisión semestral — rulemán der. desgastado', por: 'Juan Banadía' }] },
]

const LENTES_DEMO: ModeloGuantin[] = [
  {
    id: '1', modelo: 'Transparente', color: 'Transparente',
    enUso: 8, deposito: 4, reparar: 1,
    historial: [
      { fecha: '2025-01-10', nota: 'Stock inicial temporada', enUso: 8, deposito: 5, reparar: 0 },
      { fecha: '2026-02-20', nota: '1 lente rayado separado', enUso: 8, deposito: 4, reparar: 1 },
    ],
  },
  {
    id: '2', modelo: 'Antirreflejo oscuro', color: 'Gris',
    enUso: 4, deposito: 2, reparar: 0,
    historial: [
      { fecha: '2025-06-01', nota: 'Ingreso lentes oscuros para días soleados', enUso: 4, deposito: 2, reparar: 0 },
    ],
  },
]

const GUANTINES_DEMO: ModeloGuantin[] = [
  {
    id: '1', modelo: 'Cuero natural', color: 'Marrón',
    enUso: 12, deposito: 5, reparar: 3,
    historial: [
      { fecha: '2025-01-10', nota: 'Stock inicial temporada', enUso: 12, deposito: 8, reparar: 0 },
      { fecha: '2026-03-01', nota: 'Separados 3 para reparar costura', enUso: 12, deposito: 5, reparar: 3 },
    ],
  },
]

const CASCOS_DEMO: ModeloCasco[] = [
  {
    id: '1', modelo: 'Boreo', marca: 'Petzl', color: 'Rojo',
    tirolesa: 6, parque: 0, deposito: 2, reparar: 1,
    historial: [
      { fecha: '2025-10-01', nota: 'Ingreso inicial', tirolesa: 6, parque: 0, deposito: 2, reparar: 0 },
      { fecha: '2026-03-15', nota: 'Hebilla dañada separada para reparar', tirolesa: 6, parque: 0, deposito: 2, reparar: 1 },
    ],
  },
  {
    id: '2', modelo: 'Boreo', marca: 'Petzl', color: 'Azul',
    tirolesa: 0, parque: 4, deposito: 1, reparar: 0,
    historial: [
      { fecha: '2025-10-01', nota: 'Ingreso inicial Parque Aéreo', tirolesa: 0, parque: 4, deposito: 1, reparar: 0 },
    ],
  },
  {
    id: '3', modelo: 'Meteor', marca: 'Petzl', color: 'Negro',
    tirolesa: 1, parque: 1, deposito: 2, reparar: 0,
    historial: [
      { fecha: '2025-10-01', nota: 'Ingreso octubre 2025 — instructores', tirolesa: 0, parque: 0, deposito: 4, reparar: 0 },
      { fecha: '2026-01-10', nota: 'Asignados 2 a actividades', tirolesa: 1, parque: 1, deposito: 2, reparar: 0 },
    ],
  },
]

const ETIQUETAS_UBICACION: Record<Ubicacion, { label: string; color: string }> = {
  en_uso:       { label: 'En uso',         color: 'bg-green-100 text-green-700' },
  deposito:     { label: 'En depósito',    color: 'bg-blue-100 text-blue-700' },
  para_reparar: { label: 'Para reparar',   color: 'bg-orange-100 text-orange-700' },
  baja:         { label: 'Baja definitiva',color: 'bg-red-100 text-red-700' },
}

const ETIQUETAS_ESTADO: Record<Estado, { label: string; color: string }> = {
  nuevo:   { label: 'Nuevo',        color: 'bg-blue-100 text-blue-700' },
  bueno:   { label: 'Bueno',        color: 'bg-green-100 text-green-700' },
  regular: { label: 'Regular',      color: 'bg-yellow-100 text-yellow-700' },
  revisar: { label: 'Para revisar', color: 'bg-orange-100 text-orange-700' },
  baja:    { label: 'Baja',         color: 'bg-red-100 text-red-700' },
}

const ETIQUETAS_TIPO: Record<TipoEquipo, string> = {
  arnes: 'Arnés', polea: 'Polea', casco: 'Casco', mosqueton: 'Mosquetón', guantin: 'Guantín',
}

// ——— Módulo individual de guantín ———
function ModuloGuantin({ guantin, onUpdate, onDelete, accentColor = '#e8b84b' }: {
  guantin: ModeloGuantin
  onUpdate: (g: ModeloGuantin) => void
  onDelete: (id: string) => void
  accentColor?: string
}) {
  const [editando, setEditando] = useState(false)
  const [verHistorial, setVerHistorial] = useState(false)
  const [form, setForm] = useState({ enUso: guantin.enUso, deposito: guantin.deposito, reparar: guantin.reparar })
  const [nota, setNota] = useState('')

  const total = guantin.enUso + guantin.deposito + guantin.reparar

  function guardar() {
    const registro: RegistroStock = {
      fecha: new Date().toISOString().split('T')[0],
      nota: nota.trim() || 'Actualización de stock',
      ...form,
    }
    onUpdate({ ...guantin, ...form, historial: [...guantin.historial, registro] })
    setEditando(false)
    setNota('')
  }

  function cancelar() {
    setForm({ enUso: guantin.enUso, deposito: guantin.deposito, reparar: guantin.reparar })
    setNota('')
    setEditando(false)
  }

  const celdas = [
    { label: 'En uso',    key: 'enUso'    as const, color: '#22c55e', bg: '#f0fdf4' },
    { label: 'Depósito',  key: 'deposito' as const, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Reparar',   key: 'reparar'  as const, color: '#f97316', bg: '#fff7ed' },
    { label: 'Total',     key: null,                color: '#4a5568', bg: '#f7f4ef' },
  ]

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${accentColor}30`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      {/* Cabecera */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: `${accentColor}18`, borderBottom: `1px solid ${accentColor}30` }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm" style={{ background: `${accentColor}40` }}>
            <span style={{ fontSize: 13 }}>🧤</span>
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#1c2533' }}>{guantin.modelo}</p>
            <p className="text-xs" style={{ color: '#718096' }}>{guantin.color} · <strong style={{ color: accentColor }}>{total}</strong> unidades</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {!editando && (
            <button onClick={() => setEditando(true)}
              className="text-xs px-2.5 py-1 rounded-lg font-medium"
              style={{ border: `1px solid ${accentColor}60`, color: accentColor, background: 'white' }}>
              Editar
            </button>
          )}
          <button onClick={() => onDelete(guantin.id)}
            className="text-xs px-2 py-1 rounded-lg"
            style={{ color: '#cbd5e0', background: 'transparent', border: 'none' }}>
            ✕
          </button>
        </div>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-4 divide-x" style={{ background: 'white', borderBottom: '1px solid #f0ede6' }}>
        {celdas.map(({ label, key, color, bg }) => (
          <div key={label} className="flex flex-col items-center justify-center py-3 px-1" style={{ background: bg }}>
            {editando && key ? (
              <input type="number" min={0}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: Math.max(0, Number(e.target.value)) }))}
                className="w-full text-center text-xl font-bold focus:outline-none rounded"
                style={{ color, background: 'transparent', border: 'none', maxWidth: 52 }}
              />
            ) : (
              <p className="text-2xl font-bold" style={{ color }}>
                {key ? guantin[key] : total}
              </p>
            )}
            <p className="text-xs mt-0.5" style={{ color: '#718096' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Nota + guardar */}
      {editando && (
        <div className="px-4 py-3 space-y-2" style={{ background: 'white', borderBottom: '1px solid #f0ede6' }}>
          <input type="text"
            placeholder="Nota del cambio (ej: Ingreso 5 pares nuevos, 2 a reparar...)"
            value={nota}
            onChange={e => setNota(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={{ border: '1px solid #ddd8cf', background: '#faf8f4' }}
          />
          <div className="flex gap-2">
            <button onClick={guardar}
              className="flex-1 text-white text-sm font-semibold py-2 rounded-lg"
              style={{ background: '#3a9e96' }}>
              Guardar y registrar
            </button>
            <button onClick={cancelar}
              className="px-4 py-2 text-sm rounded-lg"
              style={{ border: '1px solid #ddd8cf', color: '#718096' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Historial */}
      {guantin.historial.length > 0 && (
        <div style={{ background: 'white' }}>
          <button onClick={() => setVerHistorial(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold"
            style={{ color: '#4a5568', borderTop: '1px solid #f0ede6' }}>
            <span>📋 Historial ({guantin.historial.length} registros)</span>
            <span style={{ color: '#a0aec0' }}>{verHistorial ? '▲' : '▼'}</span>
          </button>
          {verHistorial && (
            <div className="px-4 pb-3 space-y-2">
              {[...guantin.historial].reverse().map((r, i) => (
                <div key={i} className="rounded-lg px-3 py-2 text-xs" style={{ background: '#f7f4ef', border: '1px solid #ece9e1' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold" style={{ color: '#1c2533' }}>{r.fecha}</span>
                    <span style={{ color: '#718096' }}>{r.nota}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    {[
                      { label: 'En uso',   val: r.enUso,    color: '#22c55e' },
                      { label: 'Depósito', val: r.deposito, color: '#3b82f6' },
                      { label: 'Reparar',  val: r.reparar,  color: '#f97316' },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="text-center rounded px-1 py-1" style={{ background: 'white' }}>
                        <p className="font-bold" style={{ color }}>{val}</p>
                        <p style={{ color: '#a0aec0', fontSize: 10 }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ——— Módulo individual de casco ———
function ModuloCasco({ casco, onUpdate, onDelete, accentColor = '#3a9e96' }: {
  casco: ModeloCasco
  onUpdate: (c: ModeloCasco) => void
  onDelete: (id: string) => void
  accentColor?: string
}) {
  const [editando, setEditando] = useState(false)
  const [verHistorial, setVerHistorial] = useState(false)
  const [form, setForm] = useState({ tirolesa: casco.tirolesa, parque: casco.parque, deposito: casco.deposito, reparar: casco.reparar })
  const [nota, setNota] = useState('')

  const total = casco.tirolesa + casco.parque + casco.deposito + casco.reparar

  function guardar() {
    const registro: RegistroCasco = {
      fecha: new Date().toISOString().split('T')[0],
      nota: nota.trim() || 'Actualización de stock',
      ...form,
    }
    onUpdate({ ...casco, ...form, historial: [...casco.historial, registro] })
    setEditando(false)
    setNota('')
  }

  function cancelar() {
    setForm({ tirolesa: casco.tirolesa, parque: casco.parque, deposito: casco.deposito, reparar: casco.reparar })
    setNota('')
    setEditando(false)
  }

  const celdas = [
    { label: 'Tirolesa', key: 'tirolesa' as const, color: '#e8b84b', bg: '#fffbeb' },
    { label: 'Parque',   key: 'parque'   as const, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Depósito', key: 'deposito' as const, color: '#3a9e96', bg: '#f0fdfb' },
    { label: 'Reparar',  key: 'reparar'  as const, color: '#e07060', bg: '#fef2f2' },
  ]

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${accentColor}30`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      {/* Cabecera del módulo */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: `${accentColor}18`, borderBottom: `1px solid ${accentColor}30` }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${accentColor}40`, fontSize: 13 }}>⛑️</div>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#1c2533' }}>{casco.marca} {casco.modelo}</p>
            <p className="text-xs" style={{ color: '#718096' }}>{casco.color} · <strong style={{ color: accentColor }}>{total}</strong> unidades</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {!editando && (
            <button onClick={() => setEditando(true)}
              className="text-xs px-2.5 py-1 rounded-lg font-medium"
              style={{ border: `1px solid ${accentColor}60`, color: accentColor, background: 'white' }}>
              Editar
            </button>
          )}
          <button onClick={() => onDelete(casco.id)}
            className="text-xs px-2 py-1 rounded-lg"
            style={{ color: '#cbd5e0', background: 'transparent', border: 'none' }}>
            ✕
          </button>
        </div>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-4 divide-x" style={{ background: 'white', borderBottom: '1px solid #f0ede6' }}>
        {celdas.map(({ label, key, color, bg }) => (
          <div key={key} className="flex flex-col items-center justify-center py-3 px-1" style={{ background: bg }}>
            {editando ? (
              <input
                type="number"
                min={0}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: Math.max(0, Number(e.target.value)) }))}
                className="w-full text-center text-xl font-bold focus:outline-none rounded"
                style={{ color, background: 'transparent', border: 'none', maxWidth: 52 }}
              />
            ) : (
              <p className="text-2xl font-bold" style={{ color }}>{casco[key]}</p>
            )}
            <p className="text-xs mt-0.5" style={{ color: '#718096' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Formulario guardar (solo en modo edición) */}
      {editando && (
        <div className="px-4 py-3 space-y-2" style={{ background: 'white', borderBottom: '1px solid #f0ede6' }}>
          <input
            type="text"
            placeholder="Nota del cambio (ej: Ingreso 3 cascos nuevos, revisión mensual...)"
            value={nota}
            onChange={e => setNota(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={{ border: '1px solid #ddd8cf', background: '#faf8f4' }}
          />
          <div className="flex gap-2">
            <button onClick={guardar}
              className="flex-1 text-white text-sm font-semibold py-2 rounded-lg"
              style={{ background: '#3a9e96' }}>
              Guardar y registrar
            </button>
            <button onClick={cancelar}
              className="px-4 py-2 text-sm rounded-lg"
              style={{ border: '1px solid #ddd8cf', color: '#718096' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Historial */}
      {casco.historial.length > 0 && (
        <div style={{ background: 'white' }}>
          <button
            onClick={() => setVerHistorial(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold"
            style={{ color: '#4a5568', borderTop: '1px solid #f0ede6' }}
          >
            <span>📋 Historial ({casco.historial.length} registros)</span>
            <span style={{ color: '#a0aec0' }}>{verHistorial ? '▲' : '▼'}</span>
          </button>
          {verHistorial && (
            <div className="px-4 pb-3 space-y-2">
              {[...casco.historial].reverse().map((r, i) => (
                <div key={i} className="rounded-lg px-3 py-2 text-xs" style={{ background: '#f7f4ef', border: '1px solid #ece9e1' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold" style={{ color: '#1c2533' }}>{r.fecha}</span>
                    <span style={{ color: '#718096' }}>{r.nota}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 mt-1">
                    {[
                      { label: 'Tirolesa', val: r.tirolesa, color: '#e8b84b' },
                      { label: 'Parque',   val: r.parque,   color: '#3b82f6' },
                      { label: 'Depósito', val: r.deposito, color: '#3a9e96' },
                      { label: 'Reparar',  val: r.reparar,  color: '#e07060' },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="text-center rounded px-1 py-1" style={{ background: 'white' }}>
                        <p className="font-bold" style={{ color }}>{val}</p>
                        <p style={{ color: '#a0aec0', fontSize: 10 }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ——— Página principal ———
function SeccionStock({ icono, titulo, total, modelos, accentColor, mostrarForm, setMostrarForm, formContent, children }: {
  icono: string; titulo: string; total: number; modelos: number
  accentColor: string; mostrarForm: boolean; setMostrarForm: (v: boolean) => void
  formContent: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${accentColor}25`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ background: `${accentColor}12` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg" style={{ background: `${accentColor}25` }}>
            {icono}
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: '#1c2533' }}>{titulo}</p>
            <p className="text-xs" style={{ color: accentColor }}>{total} uds · {modelos} modelo{modelos !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => setMostrarForm(!mostrarForm)}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
          style={mostrarForm
            ? { background: accentColor, color: 'white', border: 'none' }
            : { border: `1px solid ${accentColor}50`, color: accentColor, background: 'white' }}>
          {mostrarForm ? '✕' : '+ Nuevo'}
        </button>
      </div>
      {mostrarForm && (
        <div className="px-4 py-4" style={{ background: 'white', borderBottom: `1px solid ${accentColor}20` }}>
          {formContent}
        </div>
      )}
      <div className="p-3 space-y-2" style={{ background: '#faf8f4' }}>
        {children}
      </div>
    </div>
  )
}

const ACCESORIOS_ARQ = [
  { slug: 'protBrazo',  label: 'Protectores de brazo',      icono: '💪', color: '#7c3aed' },
  { slug: 'protDedo',   label: 'Protectores dedo TAB',      icono: '🖐️', color: '#0369a1' },
  { slug: 'parchesOjo', label: 'Parches de ojo',            icono: '👁️', color: '#dc2626' },
  { slug: 'carcaj',     label: 'Carcaj de piso',            icono: '🏹', color: '#92400e' },
  { slug: 'contNino',   label: 'Contenciones de niño',      icono: '🧸', color: '#059669' },
  { slug: 'paneles',    label: 'Paneles de contención gde.', icono: '🛡️', color: '#374151' },
]

const SECTOR_INFO: Record<string, { nombre: string; icono: string }> = {
  tirolesa: { nombre: 'Tirolesa', icono: '🪂' },
  parque:   { nombre: 'Parque Aéreo', icono: '🌲' },
  arqueria: { nombre: 'Arquería', icono: '🎯' },
  general:  { nombre: 'General', icono: '🎽' },
}

export default function InventarioPage({ sector = 'tirolesa' }: { sector?: string }) {
  const sectorInfo = SECTOR_INFO[sector] ?? SECTOR_INFO.general
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [cascos, setCascos] = useState<ModeloCasco[]>([])
  const [guantines, setGuantines] = useState<ModeloGuantin[]>([])
  const [lentes, setLentes] = useState<ModeloGuantin[]>([])
  const [bolsitas, setBolsitas] = useState<ModeloGuantin[]>([])
  const [fundas, setFundas] = useState<ModeloGuantin[]>([])
  const [cargado, setCargado] = useState(false)
  const [vistaControl, setVistaControl] = useState(false)
  const [mostrarStockInicial, setMostrarStockInicial] = useState(false)
  const [mostrarReparacion, setMostrarReparacion] = useState(false)
  const [esAdmin, setEsAdmin] = useState(false)

  React.useEffect(() => {
    try { const u = JSON.parse(localStorage.getItem('usuario') || '{}'); setEsAdmin(u.rol === 'admin') } catch {}
  }, [])

  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroActividad, setFiltroActividad] = useState<string>('todos')
  const [filtroUbicacion, setFiltroUbicacion] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<Equipo | null>(null)
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  const [formEvento, setFormEvento] = useState({ fecha: new Date().toISOString().split('T')[0], accion: '', por: '' })
  const [mostrarFormEvento, setMostrarFormEvento] = useState(false)

  // Arquería: accesorios específicos del sector
  const [accArq, setAccArq] = useState<Record<string, ModeloGuantin[]>>({})
  const [mostrarFormArq, setMostrarFormArq] = useState<string | null>(null)
  const [formArq, setFormArq] = useState({ modelo: '', color: '', enUso: 0, deposito: 0, reparar: 0, nota: '' })

  const [mostrarFormNuevoGuantin, setMostrarFormNuevoGuantin] = useState(false)
  const [formNuevoGuantin, setFormNuevoGuantin] = useState({ modelo: '', color: '', enUso: 0, deposito: 0, reparar: 0, nota: '' })
  const [mostrarFormNuevoLente, setMostrarFormNuevoLente] = useState(false)
  const [formNuevoLente, setFormNuevoLente] = useState({ modelo: '', color: '', enUso: 0, deposito: 0, reparar: 0, nota: '' })
  const [mostrarFormNuevoBolsita, setMostrarFormNuevoBolsita] = useState(false)
  const [formNuevoBolsita, setFormNuevoBolsita] = useState({ modelo: '', color: '', enUso: 0, deposito: 0, reparar: 0, nota: '' })
  const [mostrarFormNuevaFunda, setMostrarFormNuevaFunda] = useState(false)
  const [formNuevaFunda, setFormNuevaFunda] = useState({ modelo: '', color: '', enUso: 0, deposito: 0, reparar: 0, nota: '' })
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false)
  const [formNuevo, setFormNuevo] = useState({ modelo: '', marca: '', color: '', tirolesa: 0, parque: 0, deposito: 0, reparar: 0, nota: '' })

  React.useEffect(() => {
    async function cargar() {
      // Accesorios — localStorage (no críticos para sincronización entre dispositivos)
      const g = localStorage.getItem(`inv_${sector}_guantines`)
      const l = localStorage.getItem(`inv_${sector}_lentes`)
      const c = localStorage.getItem(`inv_${sector}_cascos`)
      const b = localStorage.getItem(`inv_${sector}_bolsitas`)
      const f = localStorage.getItem(`inv_${sector}_fundas`)
      setGuantines(g ? JSON.parse(g) : [])
      setLentes(l ? JSON.parse(l) : [])
      setCascos(c ? JSON.parse(c) : [])
      setBolsitas(b ? JSON.parse(b) : [])
      setFundas(f ? JSON.parse(f) : [])

      // Arquería: cargar accesorios específicos
      if (sector === 'arqueria') {
        const loaded: Record<string, ModeloGuantin[]> = {}
        for (const a of ACCESORIOS_ARQ) {
          const raw = localStorage.getItem(`inv_${sector}_${a.slug}`)
          loaded[a.slug] = raw ? JSON.parse(raw) : []
        }
        setAccArq(loaded)
      }

      // Equipos (arneses/poleas) — Supabase primero, localStorage como fallback
      try {
        const { cargarEquipos } = await import('@/lib/db')
        const data = await cargarEquipos(sector)
        if (data && data.length > 0) {
          setEquipos(data as Equipo[])
          localStorage.setItem(`inv_${sector}_equipos`, JSON.stringify(data))
        } else {
          const e = localStorage.getItem(`inv_${sector}_equipos`)
          setEquipos(e ? JSON.parse(e) : [])
        }
      } catch {
        const e = localStorage.getItem(`inv_${sector}_equipos`)
        setEquipos(e ? JSON.parse(e) : [])
      }
      setCargado(true)
    }
    cargar()
  }, [])

  React.useEffect(() => {
    if (!cargado || sector !== 'arqueria' || Object.keys(accArq).length === 0) return
    for (const a of ACCESORIOS_ARQ) {
      localStorage.setItem(`inv_${sector}_${a.slug}`, JSON.stringify(accArq[a.slug] ?? []))
    }
  }, [accArq, cargado, sector])
  React.useEffect(() => { if (cargado) localStorage.setItem(`inv_${sector}_guantines`, JSON.stringify(guantines)) }, [guantines, cargado, sector])
  React.useEffect(() => { if (cargado) localStorage.setItem(`inv_${sector}_lentes`,    JSON.stringify(lentes))    }, [lentes,    cargado, sector])
  React.useEffect(() => { if (cargado) localStorage.setItem(`inv_${sector}_cascos`,    JSON.stringify(cascos))    }, [cascos,    cargado, sector])
  React.useEffect(() => { if (cargado) localStorage.setItem(`inv_${sector}_bolsitas`,  JSON.stringify(bolsitas))  }, [bolsitas,  cargado, sector])
  React.useEffect(() => { if (cargado) localStorage.setItem(`inv_${sector}_fundas`,    JSON.stringify(fundas))    }, [fundas,    cargado, sector])
  // Equipos: sync a Supabase cuando cambian
  React.useEffect(() => {
    if (!cargado || equipos.length === 0) return
    localStorage.setItem(`inv_${sector}_equipos`, JSON.stringify(equipos))
    import('@/lib/db').then(({ guardarEquipos }) => guardarEquipos(equipos, sector))
  }, [equipos, cargado, sector])

  const equiposFiltrados = equipos.filter(e => {
    if (filtroTipo !== 'todos' && e.tipo !== filtroTipo) return false
    if (filtroActividad !== 'todos' && e.actividad !== filtroActividad) return false
    if (filtroUbicacion !== 'todos' && e.ubicacion !== filtroUbicacion) return false
    if (busqueda && !`${e.numero_interno} ${e.marca} ${e.modelo} ${e.numero_serie}`.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  })

  function agregarEvento() {
    if (!equipoSeleccionado || !formEvento.accion || !formEvento.por) return
    setEquipos(prev => prev.map(e =>
      e.id === equipoSeleccionado.id
        ? { ...e, historial: [...e.historial, { ...formEvento }] } : e
    ))
    setEquipoSeleccionado(prev => prev ? { ...prev, historial: [...prev.historial, { ...formEvento }] } : null)
    setFormEvento({ fecha: new Date().toISOString().split('T')[0], accion: '', por: '' })
    setMostrarFormEvento(false)
  }

  function agregarModeloLente() {
    if (!formNuevoLente.modelo) return
    const nuevo: ModeloGuantin = {
      id: Date.now().toString(),
      modelo: formNuevoLente.modelo,
      color: formNuevoLente.color,
      enUso: formNuevoLente.enUso,
      deposito: formNuevoLente.deposito,
      reparar: formNuevoLente.reparar,
      historial: [{
        fecha: new Date().toISOString().split('T')[0],
        nota: formNuevoLente.nota || 'Stock inicial',
        enUso: formNuevoLente.enUso,
        deposito: formNuevoLente.deposito,
        reparar: formNuevoLente.reparar,
      }],
    }
    setLentes(prev => [...prev, nuevo])
    setFormNuevoLente({ modelo: '', color: '', enUso: 0, deposito: 0, reparar: 0, nota: '' })
    setMostrarFormNuevoLente(false)
  }

  function agregarModeloGuantin() {
    if (!formNuevoGuantin.modelo) return
    const nuevo: ModeloGuantin = {
      id: Date.now().toString(),
      modelo: formNuevoGuantin.modelo,
      color: formNuevoGuantin.color,
      enUso: formNuevoGuantin.enUso,
      deposito: formNuevoGuantin.deposito,
      reparar: formNuevoGuantin.reparar,
      historial: [{
        fecha: new Date().toISOString().split('T')[0],
        nota: formNuevoGuantin.nota || 'Stock inicial',
        enUso: formNuevoGuantin.enUso,
        deposito: formNuevoGuantin.deposito,
        reparar: formNuevoGuantin.reparar,
      }],
    }
    setGuantines(prev => [...prev, nuevo])
    setFormNuevoGuantin({ modelo: '', color: '', enUso: 0, deposito: 0, reparar: 0, nota: '' })
    setMostrarFormNuevoGuantin(false)
  }

  function agregarModeloCasco() {
    if (!formNuevo.modelo) return
    const nuevo: ModeloCasco = {
      id: Date.now().toString(),
      modelo: formNuevo.modelo,
      marca: formNuevo.marca,
      color: formNuevo.color,
      tirolesa: formNuevo.tirolesa,
      parque: formNuevo.parque,
      deposito: formNuevo.deposito,
      reparar: formNuevo.reparar,
      historial: [{
        fecha: new Date().toISOString().split('T')[0],
        nota: formNuevo.nota || 'Stock inicial',
        tirolesa: formNuevo.tirolesa,
        parque: formNuevo.parque,
        deposito: formNuevo.deposito,
        reparar: formNuevo.reparar,
      }],
    }
    setCascos(prev => [...prev, nuevo])
    setFormNuevo({ modelo: '', marca: '', color: '', tirolesa: 0, parque: 0, deposito: 0, reparar: 0, nota: '' })
    setMostrarFormNuevo(false)
  }

  const totalCascosTodos = cascos.reduce((s, c) => s + c.tirolesa + c.parque + c.deposito + c.reparar, 0)

  // Stats rápidas
  const totalEnUso = equipos.filter(e => e.ubicacion === 'en_uso').length
  const totalReparar = equipos.filter(e => e.ubicacion === 'para_reparar').length

  async function importarExcel(file: File) {
    const XLSX = await import('xlsx')
    const data = await file.arrayBuffer()
    const wb = XLSX.read(data)

    function mapUbicacion(raw: string): Ubicacion {
      const v = String(raw || '').trim().toUpperCase()
      if (v === 'D' || v === 'DEP' || v.startsWith('DEP')) return 'deposito'
      if (v === 'R' || v.includes('REP')) return 'para_reparar'
      if (v === 'B' || v === 'BAJA') return 'baja'
      return 'en_uso' // INS, EU, T, etc.
    }

    function mapUso(raw: string): string {
      const v = String(raw || '').trim().toUpperCase()
      if (v.startsWith('INS')) return 'instructor'
      if (v === 'T' || v.startsWith('TUR')) return 'turista'
      return 'turista'
    }

    const nuevos: Equipo[] = []
    const ts = Date.now()

    // ── Stock Arneses (fila 4 = headers, datos desde fila 5) ──
    const wsA = wb.Sheets['stock arneses'] || wb.Sheets['Stock Arneses'] || wb.Sheets['Stock arneses']
    if (wsA) {
      const rows = XLSX.utils.sheet_to_json<unknown[]>(wsA, { header: 1 }) as unknown[][]
      // headers en fila índice 3, datos desde índice 4
      for (let i = 4; i < rows.length; i++) {
        const row = rows[i] as unknown[]
        const n = row[0]
        if (!n && n !== 0) continue
        nuevos.push({
          id: `arnes-${ts}-${i}`,
          tipo: 'arnes' as TipoEquipo,
          numero_interno: String(n),
          marca: String(row[1] || ''),
          modelo: String(row[2] || ''),
          numero_serie: String(row[3] || ''),
          actividad: 'tirolesa',
          ubicacion: mapUbicacion(String(row[4] || '')),
          uso_actual: mapUso(String(row[4] || '')),
          estado: 'bueno' as Estado,
          fecha_ingreso: '',
          observaciones: String(row[5] || ''),
          historial: [],
        })
      }
    }

    // ── Stock Poleas (fila 4 = headers en col 1..7, datos desde fila 5) ──
    const wsP = wb.Sheets['stock poleas'] || wb.Sheets['Stock Poleas'] || wb.Sheets['Stock poleas']
    if (wsP) {
      const rows = XLSX.utils.sheet_to_json<unknown[]>(wsP, { header: 1 }) as unknown[][]
      for (let i = 4; i < rows.length; i++) {
        const row = rows[i] as unknown[]
        const n = row[1]
        if (!n && n !== 0) continue
        nuevos.push({
          id: `polea-${ts}-${i}`,
          tipo: 'polea' as TipoEquipo,
          numero_interno: String(n),
          marca: String(row[2] || ''),
          modelo: String(row[3] || ''),
          numero_serie: String(row[4] || ''),
          actividad: 'tirolesa',
          ubicacion: mapUbicacion(String(row[5] || '')),
          uso_actual: mapUso(String(row[5] || '')),
          estado: (String(row[7] || 'bueno').toLowerCase() || 'bueno') as Estado,
          fecha_ingreso: '',
          observaciones: String(row[6] || ''),
          historial: [],
        })
      }
    }

    if (nuevos.length === 0) {
      alert('⚠️ No se encontraron datos. Verificá que el Excel tenga las hojas "stock arneses" y "stock poleas".')
      return
    }

    setEquipos(() => nuevos)
    const arnCount = nuevos.filter(e => e.tipo === 'arnes').length
    const polCount = nuevos.filter(e => e.tipo === 'polea').length
    alert(`✅ Importados ${nuevos.length} equipos: ${arnCount} arneses y ${polCount} poleas.`)
  }

  function imprimirInventario() {
    window.print()
  }

  if (vistaControl) {
    return (
      <ControlStock
        equipos={equipos}
        onVolver={() => setVistaControl(false)}
        onGuardar={(_sesion) => {
          // el control queda en historial_controles; equipos no se modifican desde aquí
        }}
        esAdmin={esAdmin}
      />
    )
  }

  return (
    <div className="min-h-screen">

      {/* Header */}
      <header className="no-print" style={{ background: 'linear-gradient(135deg, #2d4a4a 0%, #3a6060 100%)', color: 'white' }}>
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Link href={`/${sector}`} className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                style={{ background: 'rgba(255,255,255,0.12)' }}>←</Link>
              <div>
                <h1 className="font-bold text-xl tracking-tight">{sectorInfo.icono} {sectorInfo.nombre} — Equipos de Seguridad</h1>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Inventario independiente por sector</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Stat Arneses */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="text-center pr-2" style={{ borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                  <p className="text-3xl font-black" style={{ color: 'white', lineHeight: 1 }}>{equipos.filter(e => e.tipo === 'arnes').length}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Arneses</p>
                </div>
                <div className="text-xs space-y-0.5 pl-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#86efac' }}/>
                    <span style={{ color: '#86efac' }}>{equipos.filter(e => e.tipo === 'arnes' && e.ubicacion === 'en_uso').length} en uso</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'rgba(255,255,255,0.5)' }}/>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>{equipos.filter(e => e.tipo === 'arnes' && e.ubicacion === 'deposito').length} depósito</span>
                  </div>
                </div>
              </div>
              {/* Stat Poleas */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="text-center pr-2" style={{ borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                  <p className="text-3xl font-black" style={{ color: 'white', lineHeight: 1 }}>{equipos.filter(e => e.tipo === 'polea').length}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Poleas</p>
                </div>
                <div className="text-xs space-y-0.5 pl-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#86efac' }}/>
                    <span style={{ color: '#86efac' }}>{equipos.filter(e => e.tipo === 'polea' && e.ubicacion === 'en_uso').length} en uso</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'rgba(255,255,255,0.5)' }}/>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>{equipos.filter(e => e.tipo === 'polea' && e.ubicacion === 'deposito').length} depósito</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#fca5a5' }}/>
                    <span style={{ color: '#fca5a5' }}>{equipos.filter(e => e.tipo === 'polea' && e.ubicacion === 'para_reparar').length} reparar</span>
                  </div>
                </div>
              </div>
              {/* Ver fichas */}
              <Link href="/fichas"
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white' }}>
                📋 Ver fichas
              </Link>
              {/* Importar mantenimiento — solo admin */}
              {esAdmin && (
                <label className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white' }}>
                  📥 Importar mantenimiento
                  <input type="file" accept=".xlsx,.xls" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) importarExcel(f); e.target.value = '' }} />
                </label>
              )}
              {/* Stock inicial — solo admin, solo si hay equipos cargados */}
              {esAdmin && equipos.length > 0 && (
                <button onClick={() => setMostrarStockInicial(true)}
                  className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl"
                  style={{ background: 'rgba(245,158,11,0.25)', border: '1px solid rgba(245,158,11,0.5)', color: '#fde68a' }}>
                  📦 Stock inicial
                </button>
              )}
              {/* Registrar Reparaciones */}
              <button onClick={() => setMostrarReparacion(true)}
                className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl"
                style={{ background: '#1d4ed8', border: 'none', color: 'white', boxShadow: '0 2px 8px rgba(29,78,216,0.4)' }}>
                🔧 Registrar Reparaciones
              </button>
              {/* Control de Stock */}
              <button onClick={() => setVistaControl(true)}
                className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl"
                style={{ background: '#16a34a', border: 'none', color: 'white', boxShadow: '0 2px 8px rgba(22,163,74,0.4)' }}>
                📋 HACER CONTROL DE STOCK
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* IZQUIERDA: búsqueda + lista */}
          <div className="lg:col-span-2 space-y-4">

            {/* Buscador + filtros */}
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #ddd8cf', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div className="relative mb-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#a0aec0' }}>🔍</span>
                <input type="text"
                  placeholder="Buscar por N° interno, serie, modelo..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none"
                  style={{ border: '1px solid #ddd8cf', background: '#faf8f4', color: '#1c2533' }}
                />
              </div>
              {/* Grupos de filtro */}
              <div className="space-y-2">
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold self-center mr-1" style={{ color: '#a0aec0', minWidth: 36 }}>Tipo</span>
                  {['todos','arnes','polea','casco','mosqueton'].map(t => (
                    <button key={t} onClick={() => setFiltroTipo(t)}
                      className="text-xs px-3 py-1 rounded-full border transition-colors"
                      style={filtroTipo === t
                        ? { background: '#2d4a4a', color: 'white', borderColor: '#2d4a4a' }
                        : { background: 'white', color: '#4a5568', borderColor: '#e2ddd6' }}>
                      {t === 'todos' ? 'Todos' : ETIQUETAS_TIPO[t as TipoEquipo]}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold self-center mr-1" style={{ color: '#a0aec0', minWidth: 36 }}>Zona</span>
                  {['todos','tirolesa','parque'].map(a => (
                    <button key={a} onClick={() => setFiltroActividad(a)}
                      className="text-xs px-3 py-1 rounded-full border transition-colors"
                      style={filtroActividad === a
                        ? { background: '#2d4a4a', color: 'white', borderColor: '#2d4a4a' }
                        : { background: 'white', color: '#4a5568', borderColor: '#e2ddd6' }}>
                      {a === 'todos' ? 'Todas' : a === 'tirolesa' ? '🪂 Tirolesa' : '🌲 Parque'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold self-center mr-1" style={{ color: '#a0aec0', minWidth: 36 }}>Lugar</span>
                  {['todos','en_uso','deposito','para_reparar'].map(u => (
                    <button key={u} onClick={() => setFiltroUbicacion(u)}
                      className="text-xs px-3 py-1 rounded-full border transition-colors"
                      style={filtroUbicacion === u
                        ? { background: '#2d4a4a', color: 'white', borderColor: '#2d4a4a' }
                        : { background: 'white', color: '#4a5568', borderColor: '#e2ddd6' }}>
                      {u === 'todos' ? 'Todos' : ETIQUETAS_UBICACION[u as Ubicacion].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Lista de equipos */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #ddd8cf', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #f0ede6' }}>
                <p className="text-sm font-semibold" style={{ color: '#4a5568' }}>
                  {equiposFiltrados.length} <span style={{ fontWeight: 400, color: '#a0aec0' }}>equipos encontrados</span>
                </p>
                <button onClick={() => window.print()}
                  className="text-xs rounded-lg px-3 py-1.5 no-print flex items-center gap-1.5"
                  style={{ border: '1px solid #ddd8cf', color: '#718096' }}>
                  🖨️ Imprimir
                </button>
              </div>
              <div>
                {equiposFiltrados.map((eq, idx) => {
                  const seleccionado = equipoSeleccionado?.id === eq.id
                  const estadoColor = eq.ubicacion === 'para_reparar' ? '#f97316' : eq.ubicacion === 'baja' ? '#e07060' : eq.estado === 'revisar' ? '#e8b84b' : '#3a9e96'
                  return (
                    <div key={eq.id}
                      onClick={() => { setEquipoSeleccionado(eq); setMostrarHistorial(false); setMostrarFormEvento(false) }}
                      className="flex items-center gap-4 cursor-pointer transition-all"
                      style={{
                        padding: '12px 20px',
                        borderBottom: idx < equiposFiltrados.length - 1 ? '1px solid #f7f4ef' : 'none',
                        background: seleccionado ? '#e6f5f4' : 'white',
                        borderLeft: seleccionado ? `3px solid ${estadoColor}` : '3px solid transparent',
                      }}>
                      {/* Ícono tipo */}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: seleccionado ? `${estadoColor}20` : '#f7f4ef' }}>
                        {eq.tipo === 'arnes' ? '🦺' : eq.tipo === 'polea' ? '⚙️' : eq.tipo === 'casco' ? '⛑️' : '🔩'}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: '#f0ede6', color: '#718096' }}>#{eq.numero_interno}</span>
                          <span className="font-semibold text-sm" style={{ color: '#1c2533' }}>{eq.marca} {eq.modelo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: '#a0aec0' }}>{eq.actividad === 'tirolesa' ? '🪂' : '🌲'} {eq.actividad}</span>
                          <span style={{ color: '#ddd8cf', fontSize: 10 }}>•</span>
                          <span className="text-xs" style={{ color: '#a0aec0' }}>S/N {eq.numero_serie || '—'}</span>
                          {eq.historial.length > 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#e6f5f4', color: '#3a9e96' }}>
                              {eq.historial.length} eventos
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Badge ubicación */}
                      <div className="flex-shrink-0 text-right">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ETIQUETAS_UBICACION[eq.ubicacion].color}`}>
                          {ETIQUETAS_UBICACION[eq.ubicacion].label}
                        </span>
                        <p className="text-xs mt-1" style={{ color: '#a0aec0' }}>{ETIQUETAS_ESTADO[eq.estado].label}</p>
                      </div>
                    </div>
                  )
                })}
                {equiposFiltrados.length === 0 && (
                  <div className="text-center py-10" style={{ color: '#a0aec0' }}>
                    <p className="text-2xl mb-2">🔍</p>
                    <p className="text-sm">No se encontraron equipos con esos filtros</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DERECHA: stock por categoría + detalle */}
          <div className="space-y-4">

            {/* ── ACCESORIOS: condicional por sector ── */}
            {sector === 'arqueria' ? (
              <>
                {ACCESORIOS_ARQ.map(a => {
                  const items = accArq[a.slug] ?? []
                  return (
                    <SeccionStock
                      key={a.slug}
                      icono={a.icono} titulo={a.label}
                      total={items.reduce((s, g) => s + g.enUso + g.deposito + g.reparar, 0)}
                      modelos={items.length}
                      accentColor={a.color}
                      mostrarForm={mostrarFormArq === a.slug}
                      setMostrarForm={(v) => { setMostrarFormArq(v ? a.slug : null); setFormArq({ modelo: '', color: '', enUso: 0, deposito: 0, reparar: 0, nota: '' }) }}
                      formContent={
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <input type="text" placeholder="Descripción *" value={formArq.modelo}
                              onChange={e => setFormArq(f => ({ ...f, modelo: e.target.value }))}
                              className="rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4' }} />
                            <input type="text" placeholder="Color / Talle" value={formArq.color}
                              onChange={e => setFormArq(f => ({ ...f, color: e.target.value }))}
                              className="rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4' }} />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {[{ key: 'enUso', label: 'En uso', color: '#22c55e' }, { key: 'deposito', label: 'Depósito', color: '#3b82f6' }, { key: 'reparar', label: 'Reparar', color: '#f97316' }].map(({ key, label, color }) => (
                              <div key={key} className="text-center">
                                <p className="text-xs mb-1 font-medium" style={{ color }}>{label}</p>
                                <input type="number" min={0} value={(formArq as Record<string, number | string>)[key] as number}
                                  onChange={e => setFormArq(f => ({ ...f, [key]: Math.max(0, Number(e.target.value)) }))}
                                  className="w-full text-center rounded-lg py-2 text-sm font-bold focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4', color }} />
                              </div>
                            ))}
                          </div>
                          <input type="text" placeholder="Nota inicial" value={formArq.nota}
                            onChange={e => setFormArq(f => ({ ...f, nota: e.target.value }))}
                            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4' }} />
                          <button onClick={() => {
                            if (!formArq.modelo) return
                            const nuevo: ModeloGuantin = {
                              id: Date.now().toString(),
                              modelo: formArq.modelo, color: formArq.color,
                              enUso: formArq.enUso, deposito: formArq.deposito, reparar: formArq.reparar,
                              historial: formArq.nota ? [{ fecha: new Date().toISOString().split('T')[0], nota: formArq.nota, enUso: formArq.enUso, deposito: formArq.deposito, reparar: formArq.reparar }] : [],
                            }
                            setAccArq(prev => ({ ...prev, [a.slug]: [...(prev[a.slug] ?? []), nuevo] }))
                            setFormArq({ modelo: '', color: '', enUso: 0, deposito: 0, reparar: 0, nota: '' })
                            setMostrarFormArq(null)
                          }} className="w-full text-white text-sm font-bold py-2.5 rounded-xl" style={{ background: a.color }}>
                            Agregar
                          </button>
                        </div>
                      }>
                      {items.map(g => (
                        <ModuloGuantin key={g.id} guantin={g} accentColor={a.color}
                          onUpdate={u => setAccArq(prev => ({ ...prev, [a.slug]: (prev[a.slug] ?? []).map(x => x.id === u.id ? u : x) }))}
                          onDelete={id => setAccArq(prev => ({ ...prev, [a.slug]: (prev[a.slug] ?? []).filter(x => x.id !== id) }))} />
                      ))}
                    </SeccionStock>
                  )
                })}
              </>
            ) : (
              <>
            {/* GUANTINES */}
            <SeccionStock
              icono="🧤" titulo="Guantines de cuero"
              total={guantines.reduce((s, g) => s + g.enUso + g.deposito + g.reparar, 0)}
              modelos={guantines.length}
              accentColor="#c8780a"
              mostrarForm={mostrarFormNuevoGuantin}
              setMostrarForm={setMostrarFormNuevoGuantin}
              formContent={
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Modelo *" value={formNuevoGuantin.modelo}
                      onChange={e => setFormNuevoGuantin(f => ({ ...f, modelo: e.target.value }))}
                      className="rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4' }} />
                    <input type="text" placeholder="Color" value={formNuevoGuantin.color}
                      onChange={e => setFormNuevoGuantin(f => ({ ...f, color: e.target.value }))}
                      className="rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4' }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ key: 'enUso', label: 'En uso', color: '#22c55e' }, { key: 'deposito', label: 'Depósito', color: '#3b82f6' }, { key: 'reparar', label: 'Reparar', color: '#f97316' }].map(({ key, label, color }) => (
                      <div key={key} className="text-center">
                        <p className="text-xs mb-1 font-medium" style={{ color }}>{label}</p>
                        <input type="number" min={0} value={(formNuevoGuantin as Record<string, number | string>)[key] as number}
                          onChange={e => setFormNuevoGuantin(f => ({ ...f, [key]: Math.max(0, Number(e.target.value)) }))}
                          className="w-full text-center rounded-lg py-2 text-sm font-bold focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4', color }} />
                      </div>
                    ))}
                  </div>
                  <input type="text" placeholder="Nota inicial" value={formNuevoGuantin.nota}
                    onChange={e => setFormNuevoGuantin(f => ({ ...f, nota: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4' }} />
                  <button onClick={agregarModeloGuantin} className="w-full text-white text-sm font-bold py-2.5 rounded-xl" style={{ background: '#c8780a' }}>Agregar modelo</button>
                </div>
              }>
              {guantines.map(g => (
                <ModuloGuantin key={g.id} guantin={g} accentColor="#c8780a"
                  onUpdate={u => setGuantines(prev => prev.map(x => x.id === u.id ? u : x))}
                  onDelete={id => setGuantines(prev => prev.filter(x => x.id !== id))} />
              ))}
            </SeccionStock>

            {/* LENTES */}
            <SeccionStock
              icono="🥽" titulo="Lentes de seguridad"
              total={lentes.reduce((s, l) => s + l.enUso + l.deposito + l.reparar, 0)}
              modelos={lentes.length}
              accentColor="#5a7080"
              mostrarForm={mostrarFormNuevoLente}
              setMostrarForm={setMostrarFormNuevoLente}
              formContent={
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Modelo *" value={formNuevoLente.modelo}
                      onChange={e => setFormNuevoLente(f => ({ ...f, modelo: e.target.value }))}
                      className="rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4' }} />
                    <input type="text" placeholder="Color" value={formNuevoLente.color}
                      onChange={e => setFormNuevoLente(f => ({ ...f, color: e.target.value }))}
                      className="rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4' }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ key: 'enUso', label: 'En uso', color: '#22c55e' }, { key: 'deposito', label: 'Depósito', color: '#3b82f6' }, { key: 'reparar', label: 'Reparar', color: '#f97316' }].map(({ key, label, color }) => (
                      <div key={key} className="text-center">
                        <p className="text-xs mb-1 font-medium" style={{ color }}>{label}</p>
                        <input type="number" min={0} value={(formNuevoLente as Record<string, number | string>)[key] as number}
                          onChange={e => setFormNuevoLente(f => ({ ...f, [key]: Math.max(0, Number(e.target.value)) }))}
                          className="w-full text-center rounded-lg py-2 text-sm font-bold focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4', color }} />
                      </div>
                    ))}
                  </div>
                  <input type="text" placeholder="Nota inicial" value={formNuevoLente.nota}
                    onChange={e => setFormNuevoLente(f => ({ ...f, nota: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4' }} />
                  <button onClick={agregarModeloLente} className="w-full text-white text-sm font-bold py-2.5 rounded-xl" style={{ background: '#5a7080' }}>Agregar modelo</button>
                </div>
              }>
              {lentes.map(l => (
                <ModuloGuantin key={l.id} guantin={l} accentColor="#5a7080"
                  onUpdate={u => setLentes(prev => prev.map(x => x.id === u.id ? u : x))}
                  onDelete={id => setLentes(prev => prev.filter(x => x.id !== id))} />
              ))}
            </SeccionStock>

            {/* CASCOS */}
            <SeccionStock
              icono="⛑️" titulo="Cascos"
              total={totalCascosTodos}
              modelos={cascos.length}
              accentColor="#3a9e96"
              mostrarForm={mostrarFormNuevo}
              setMostrarForm={setMostrarFormNuevo}
              formContent={
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[{ key: 'modelo', ph: 'Modelo *' }, { key: 'marca', ph: 'Marca' }, { key: 'color', ph: 'Color' }].map(({ key, ph }) => (
                      <input key={key} type="text" placeholder={ph} value={(formNuevo as Record<string, string | number>)[key] as string}
                        onChange={e => setFormNuevo(f => ({ ...f, [key]: e.target.value }))}
                        className="rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4' }} />
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[{ key: 'tirolesa', label: 'Tirolesa', color: '#e8b84b' }, { key: 'parque', label: 'Parque', color: '#3b82f6' }, { key: 'deposito', label: 'Depósito', color: '#3a9e96' }, { key: 'reparar', label: 'Reparar', color: '#e07060' }].map(({ key, label, color }) => (
                      <div key={key} className="text-center">
                        <p className="text-xs mb-1 font-medium" style={{ color }}>{label}</p>
                        <input type="number" min={0} value={(formNuevo as Record<string, string | number>)[key] as number}
                          onChange={e => setFormNuevo(f => ({ ...f, [key]: Math.max(0, Number(e.target.value)) }))}
                          className="w-full text-center rounded-lg py-2 text-sm font-bold focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4', color }} />
                      </div>
                    ))}
                  </div>
                  <input type="text" placeholder="Nota inicial" value={formNuevo.nota}
                    onChange={e => setFormNuevo(f => ({ ...f, nota: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4' }} />
                  <button onClick={agregarModeloCasco} className="w-full text-white text-sm font-bold py-2.5 rounded-xl" style={{ background: '#3a9e96' }}>Agregar modelo</button>
                </div>
              }>
              {cascos.map(c => (
                <ModuloCasco key={c.id} casco={c} accentColor="#3a9e96"
                  onUpdate={u => setCascos(prev => prev.map(x => x.id === u.id ? u : x))}
                  onDelete={id => setCascos(prev => prev.filter(x => x.id !== id))} />
              ))}
            </SeccionStock>

            {/* BOLSITAS DE LENTES */}
            <SeccionStock
              icono="👜" titulo="Bolsitas de lentes"
              total={bolsitas.reduce((s, b) => s + b.enUso + b.deposito + b.reparar, 0)}
              modelos={bolsitas.length}
              accentColor="#7c3aed"
              mostrarForm={mostrarFormNuevoBolsita}
              setMostrarForm={setMostrarFormNuevoBolsita}
              formContent={
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[{ key: 'modelo', ph: 'Modelo *' }, { key: 'color', ph: 'Color' }].map(({ key, ph }) => (
                      <input key={key} type="text" placeholder={ph} value={(formNuevoBolsita as Record<string, string | number>)[key] as string}
                        onChange={e => setFormNuevoBolsita(f => ({ ...f, [key]: e.target.value }))}
                        className="rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4' }} />
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ key: 'enUso', label: 'En uso', color: '#16a34a' }, { key: 'deposito', label: 'Depósito', color: '#7c3aed' }, { key: 'reparar', label: 'Reparar', color: '#e07060' }].map(({ key, label, color }) => (
                      <div key={key} className="text-center">
                        <p className="text-xs mb-1 font-medium" style={{ color }}>{label}</p>
                        <input type="number" min={0} value={(formNuevoBolsita as Record<string, string | number>)[key] as number}
                          onChange={e => setFormNuevoBolsita(f => ({ ...f, [key]: Math.max(0, Number(e.target.value)) }))}
                          className="w-full text-center rounded-lg py-2 text-sm font-bold focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4', color }} />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => {
                    if (!formNuevoBolsita.modelo) return
                    setBolsitas(prev => [...prev, { id: Date.now().toString(), modelo: formNuevoBolsita.modelo, color: formNuevoBolsita.color, enUso: formNuevoBolsita.enUso, deposito: formNuevoBolsita.deposito, reparar: formNuevoBolsita.reparar, historial: formNuevoBolsita.nota ? [{ fecha: new Date().toISOString().split('T')[0], nota: formNuevoBolsita.nota, enUso: formNuevoBolsita.enUso, deposito: formNuevoBolsita.deposito, reparar: formNuevoBolsita.reparar }] : [] }])
                    setFormNuevoBolsita({ modelo: '', color: '', enUso: 0, deposito: 0, reparar: 0, nota: '' })
                    setMostrarFormNuevoBolsita(false)
                  }} className="w-full text-white text-sm font-bold py-2.5 rounded-xl" style={{ background: '#7c3aed' }}>Agregar modelo</button>
                </div>
              }>
              {bolsitas.map(b => (
                <ModuloGuantin key={b.id} guantin={b} accentColor="#7c3aed"
                  onUpdate={u => setBolsitas(prev => prev.map(x => x.id === u.id ? u : x))}
                  onDelete={id => setBolsitas(prev => prev.filter(x => x.id !== id))} />
              ))}
            </SeccionStock>

            {/* FUNDAS DE HANDIS */}
            <SeccionStock
              icono="📻" titulo="Fundas de handis"
              total={fundas.reduce((s, f) => s + f.enUso + f.deposito + f.reparar, 0)}
              modelos={fundas.length}
              accentColor="#0369a1"
              mostrarForm={mostrarFormNuevaFunda}
              setMostrarForm={setMostrarFormNuevaFunda}
              formContent={
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[{ key: 'modelo', ph: 'Modelo *' }, { key: 'color', ph: 'Color' }].map(({ key, ph }) => (
                      <input key={key} type="text" placeholder={ph} value={(formNuevaFunda as Record<string, string | number>)[key] as string}
                        onChange={e => setFormNuevaFunda(f => ({ ...f, [key]: e.target.value }))}
                        className="rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4' }} />
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ key: 'enUso', label: 'En uso', color: '#16a34a' }, { key: 'deposito', label: 'Depósito', color: '#0369a1' }, { key: 'reparar', label: 'Reparar', color: '#e07060' }].map(({ key, label, color }) => (
                      <div key={key} className="text-center">
                        <p className="text-xs mb-1 font-medium" style={{ color }}>{label}</p>
                        <input type="number" min={0} value={(formNuevaFunda as Record<string, string | number>)[key] as number}
                          onChange={e => setFormNuevaFunda(f => ({ ...f, [key]: Math.max(0, Number(e.target.value)) }))}
                          className="w-full text-center rounded-lg py-2 text-sm font-bold focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4', color }} />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => {
                    if (!formNuevaFunda.modelo) return
                    setFundas(prev => [...prev, { id: Date.now().toString(), modelo: formNuevaFunda.modelo, color: formNuevaFunda.color, enUso: formNuevaFunda.enUso, deposito: formNuevaFunda.deposito, reparar: formNuevaFunda.reparar, historial: formNuevaFunda.nota ? [{ fecha: new Date().toISOString().split('T')[0], nota: formNuevaFunda.nota, enUso: formNuevaFunda.enUso, deposito: formNuevaFunda.deposito, reparar: formNuevaFunda.reparar }] : [] }])
                    setFormNuevaFunda({ modelo: '', color: '', enUso: 0, deposito: 0, reparar: 0, nota: '' })
                    setMostrarFormNuevaFunda(false)
                  }} className="w-full text-white text-sm font-bold py-2.5 rounded-xl" style={{ background: '#0369a1' }}>Agregar modelo</button>
                </div>
              }>
              {fundas.map(f => (
                <ModuloGuantin key={f.id} guantin={f} accentColor="#0369a1"
                  onUpdate={u => setFundas(prev => prev.map(x => x.id === u.id ? u : x))}
                  onDelete={id => setFundas(prev => prev.filter(x => x.id !== id))} />
              ))}
            </SeccionStock>
              </>
            )}

            {/* Detalle equipo seleccionado */}
            {equipoSeleccionado ? (
              <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #ddd8cf', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
                <div className="px-5 py-4 flex items-start justify-between" style={{ borderBottom: '1px solid #f0ede6', background: '#f7f4ef' }}>
                  <div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded font-bold" style={{ background: '#e8e4dc', color: '#718096' }}>#{equipoSeleccionado.numero_interno}</span>
                    <h3 className="font-bold text-base mt-1" style={{ color: '#1c2533' }}>{equipoSeleccionado.marca} {equipoSeleccionado.modelo}</h3>
                    <p className="text-xs mt-0.5" style={{ color: '#a0aec0' }}>Serie: {equipoSeleccionado.numero_serie || '—'}</p>
                  </div>
                  <button onClick={() => setEquipoSeleccionado(null)} className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                    style={{ background: '#e8e4dc', color: '#718096' }}>✕</button>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    {[
                      { label: 'Ubicación', value: ETIQUETAS_UBICACION[equipoSeleccionado.ubicacion].label },
                      { label: 'Estado',    value: ETIQUETAS_ESTADO[equipoSeleccionado.estado].label },
                      { label: 'Actividad', value: equipoSeleccionado.actividad },
                      { label: 'Ingreso',   value: equipoSeleccionado.fecha_ingreso },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-xl p-2.5" style={{ background: '#f7f4ef' }}>
                        <p className="text-xs mb-0.5" style={{ color: '#a0aec0' }}>{label}</p>
                        <p className="font-semibold capitalize" style={{ color: '#1c2533' }}>{value}</p>
                      </div>
                    ))}
                  </div>
                  {equipoSeleccionado.observaciones && (
                    <p className="text-xs mb-4 rounded-xl p-3" style={{ color: '#718096', background: '#fff4e0', border: '1px solid #f5dca0' }}>
                      ⚠️ {equipoSeleccionado.observaciones}
                    </p>
                  )}
                  <button onClick={() => setMostrarHistorial(!mostrarHistorial)}
                    className="w-full flex items-center justify-between text-sm font-semibold mb-2"
                    style={{ color: '#1c2533' }}>
                    <span>📋 Historial ({equipoSeleccionado.historial.length} eventos)</span>
                    <span style={{ color: '#a0aec0', fontSize: 11 }}>{mostrarHistorial ? '▲' : '▼'}</span>
                  </button>
                  {mostrarHistorial && (
                    <div className="space-y-2 mb-4">
                      {equipoSeleccionado.historial.length === 0 && <p className="text-xs" style={{ color: '#a0aec0' }}>Sin eventos registrados</p>}
                      {equipoSeleccionado.historial.map((h, i) => (
                        <div key={i} className="pl-3 py-1.5 rounded-r-lg" style={{ borderLeft: '3px solid #3a9e96', background: '#f0fdfb' }}>
                          <p className="text-xs font-semibold" style={{ color: '#1c2533' }}>{h.accion}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#a0aec0' }}>{h.fecha} — {h.por}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {!mostrarFormEvento ? (
                    <button onClick={() => setMostrarFormEvento(true)}
                      className="w-full text-white text-sm font-bold py-2.5 rounded-xl"
                      style={{ background: 'linear-gradient(135deg, #2d4a4a, #3a6060)' }}>
                      + Registrar evento / reparación
                    </button>
                  ) : (
                    <div className="space-y-2 pt-3" style={{ borderTop: '1px solid #f0ede6' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: '#4a5568' }}>Nuevo evento</p>
                      <input type="date" value={formEvento.fecha} onChange={e => setFormEvento(f => ({ ...f, fecha: e.target.value }))}
                        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4' }} />
                      <input type="text" placeholder="Descripción de la acción" value={formEvento.accion}
                        onChange={e => setFormEvento(f => ({ ...f, accion: e.target.value }))}
                        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4' }} />
                      <input type="text" placeholder="Realizado por" value={formEvento.por}
                        onChange={e => setFormEvento(f => ({ ...f, por: e.target.value }))}
                        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={{ border: '1px solid #ddd8cf', background: '#faf8f4' }} />
                      <div className="flex gap-2">
                        <button onClick={agregarEvento} className="flex-1 text-white text-sm py-2 rounded-xl font-semibold" style={{ background: '#3a9e96' }}>Guardar</button>
                        <button onClick={() => setMostrarFormEvento(false)} className="px-4 py-2 text-sm rounded-xl" style={{ border: '1px solid #ddd8cf', color: '#718096' }}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-8 text-center" style={{ border: '2px dashed #ddd8cf', color: '#a0aec0' }}>
                <p className="text-3xl mb-2">👈</p>
                <p className="text-sm">Seleccioná un equipo<br/>para ver su detalle</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal stock inicial */}
      {mostrarStockInicial && (
        <ImportarStockInicial
          equipos={equipos.filter(e => e.tipo === 'arnes' || e.tipo === 'polea')}
          onCerrar={() => setMostrarStockInicial(false)}
          onExito={() => { setMostrarStockInicial(false); window.location.href = '/fichas' }}
        />
      )}

      {/* Modal registrar reparaciones */}
      {mostrarReparacion && (
        <RegistrarReparacion
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          equipos={equipos.filter(e => e.tipo === 'arnes' || e.tipo === 'polea') as any}
          onCerrar={() => setMostrarReparacion(false)}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onGuardar={(equiposAct: any[]) => setEquipos(prev => prev.map(e => equiposAct.find((a: any) => a.id === e.id) ?? e))}
        />
      )}
    </div>
  )
}
