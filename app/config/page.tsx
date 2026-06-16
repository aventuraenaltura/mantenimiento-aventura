'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PLANILLAS_INICIALES } from '@/lib/datos-iniciales'
import { getConfig, setConfig, type ConfigPlanilla } from '@/lib/config'

const ACTIVIDADES = [
  { id: 'tirolesa',  label: 'Tirolesa',           color: '#F5C800', icono: '🪂' },
  { id: 'arqueria',  label: 'Arquería',            color: '#1A7C5E', icono: '🏹' },
  { id: 'parque',    label: 'Parque Aéreo',        color: '#4FC3F7', icono: '🌲' },
  { id: 'salon',     label: 'Aventura Escondida',  color: '#FF7043', icono: '🎮' },
]

const FRECUENCIA_LABEL: Record<string, string> = {
  diaria: 'Diaria', semanal: 'Semanal', mensual: 'Mensual',
  trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual',
}

export default function ConfigPage() {
  const [config, setConfigState] = useState<Record<string, string>>({})
  const [guardado, setGuardado] = useState(false)
  const [actividadActiva, setActividadActiva] = useState('tirolesa')

  useEffect(() => {
    const saved = getConfig()
    const map: Record<string, string> = {}
    saved.forEach(c => { map[c.planilla_id] = c.fecha_inicio })
    setConfigState(map)
  }, [])

  function guardar() {
    const nuevaConfig: ConfigPlanilla[] = Object.entries(config)
      .filter(([, fecha]) => fecha)
      .map(([planilla_id, fecha_inicio]) => ({ planilla_id, fecha_inicio }))
    setConfig(nuevaConfig)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2500)
  }

  const planillasActivas = PLANILLAS_INICIALES.filter(p => p.actividad_id === actividadActiva)

  return (
    <div className="min-h-screen">
      <header className="px-6 py-4 flex items-center gap-4" style={{ background: '#2d4a4a', color: 'white' }}>
        <Link href="/home" className="text-white opacity-70 hover:opacity-100 text-2xl">←</Link>
        <span className="text-3xl">⚙️</span>
        <div>
          <h1 className="font-bold text-xl">Configuración anual</h1>
          <p className="text-sm opacity-70">Fechas de inicio de cada planilla — {new Date().getFullYear()}</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-700">
          <strong>¿Para qué sirve esto?</strong> Configurá la primera fecha de ejecución de cada planilla.
          El sistema calculará automáticamente todos los mantenimientos del año según la frecuencia de cada una.
          Por ejemplo: si MP01-001 (Mensual) inicia el 5 de enero, el sistema programa el 5 de cada mes.
        </div>

        {/* Tabs de actividades */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {ACTIVIDADES.map(act => (
            <button key={act.id} onClick={() => setActividadActiva(act.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                actividadActiva === act.id ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
              style={actividadActiva === act.id ? { backgroundColor: act.color, borderColor: act.color, color: act.id === 'tirolesa' || act.id === 'parque' ? '#1a1a1a' : '#fff' } : {}}>
              {act.icono} {act.label}
            </button>
          ))}
        </div>

        {/* Planillas */}
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {planillasActivas.map(p => {
            const fecha = config[p.codigo] || ''
            const tieneConfig = !!fecha
            return (
              <div key={p.codigo} className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{p.codigo}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-lg ${
                      p.frecuencia === 'diaria' ? 'bg-red-100 text-red-600' :
                      p.frecuencia === 'semanal' ? 'bg-orange-100 text-orange-600' :
                      p.frecuencia === 'mensual' ? 'bg-yellow-100 text-yellow-600' :
                      p.frecuencia === 'trimestral' ? 'bg-blue-100 text-blue-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>{FRECUENCIA_LABEL[p.frecuencia]}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{p.nombre}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <label className="text-xs text-gray-400 block mb-0.5">Fecha de inicio</label>
                    <input
                      type="date"
                      value={fecha}
                      onChange={e => setConfigState(prev => ({ ...prev, [p.codigo]: e.target.value }))}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  {tieneConfig && (
                    <div className="text-xs text-green-600 text-center">
                      <span className="text-lg">✅</span>
                      <p>Configurada</p>
                    </div>
                  )}
                  {!tieneConfig && (
                    <div className="text-xs text-gray-300 text-center">
                      <span className="text-lg">⬜</span>
                      <p>Sin fecha</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button onClick={guardar}
            className="text-white font-semibold px-8 py-3 rounded-xl transition-colors" style={{ background: '#3a9e96' }}>
            Guardar configuración
          </button>
          {guardado && (
            <span className="text-green-600 font-medium flex items-center gap-2">
              ✅ Guardado correctamente
            </span>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-4">
          La configuración se aplica a todos los calendarios y al PDF del mes.
          Podés actualizarla cuando quieras desde este panel.
        </p>
      </div>
    </div>
  )
}
