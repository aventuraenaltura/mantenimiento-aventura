'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type TipoEquipo = 'arnes' | 'polea'
type Ubicacion = 'en_uso' | 'deposito' | 'para_reparar' | 'baja'

interface Equipo {
  id: string
  tipo: TipoEquipo
  numero_interno: string
  marca: string
  modelo: string
  numero_serie: string
  actividad: string
  ubicacion: Ubicacion
  uso_actual: string
  historial: { fecha: string; accion: string; por: string }[]
}

interface Props {
  equipos: Equipo[]
  onCerrar: () => void
  onGuardar: (equiposActualizados: Equipo[]) => void
}

const UBICACION_LABEL: Record<Ubicacion, string> = {
  en_uso: 'En uso',
  deposito: 'En depósito',
  para_reparar: 'Para reparar',
  baja: 'Baja definitiva',
}

const UBICACION_COLOR: Record<Ubicacion, string> = {
  en_uso: '#16a34a',
  deposito: '#2563eb',
  para_reparar: '#f97316',
  baja: '#dc2626',
}

export default function RegistrarReparacion({ equipos, onCerrar, onGuardar }: Props) {
  const [filtroTipo, setFiltroTipo] = useState<TipoEquipo>('arnes')
  const [equipoId, setEquipoId] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [realizadoPor, setRealizadoPor] = useState('')
  const [tipoAccion, setTipoAccion] = useState<'mantenimiento' | 'ubicacion' | 'ambos'>('mantenimiento')
  const [descripcion, setDescripcion] = useState('')
  const [nuevaUbicacion, setNuevaUbicacion] = useState<Ubicacion>('en_uso')
  const [guardando, setGuardando] = useState(false)
  const [ok, setOk] = useState(false)

  const listaFiltrada = equipos
    .filter(e => e.tipo === filtroTipo)
    .sort((a, b) => Number(a.numero_interno) - Number(b.numero_interno))

  const equipoSel = equipos.find(e => e.id === equipoId)

  useEffect(() => {
    setEquipoId('')
  }, [filtroTipo])

  useEffect(() => {
    if (equipoSel) setNuevaUbicacion(equipoSel.ubicacion as Ubicacion)
  }, [equipoId])

  async function guardar() {
    if (!equipoSel || !realizadoPor.trim()) return
    setGuardando(true)

    const accionTexto = tipoAccion === 'mantenimiento'
      ? `Mantenimiento: ${descripcion}`
      : tipoAccion === 'ubicacion'
      ? `Cambio ubicación → ${UBICACION_LABEL[nuevaUbicacion]}`
      : `Mantenimiento: ${descripcion} · Cambio ubicación → ${UBICACION_LABEL[nuevaUbicacion]}`

    const entrada = { fecha, accion: accionTexto, por: realizadoPor }
    const nuevoHistorial = [...(equipoSel.historial ?? []), entrada]

    const camposUpdate: Partial<Equipo> & { historial: typeof nuevoHistorial } = {
      historial: nuevoHistorial,
    }
    if (tipoAccion === 'ubicacion' || tipoAccion === 'ambos') {
      camposUpdate.ubicacion = nuevaUbicacion
    }

    // Actualizar en Supabase
    const { error } = await supabase.from('equipos').update(camposUpdate).eq('id', equipoSel.id)

    // Registrar en tabla reparaciones (puede no existir aún, falla silenciosamente)
    try {
      await supabase.from('reparaciones').insert({
        id: `rep_${Date.now()}_${equipoSel.id}`,
        equipo_id: equipoSel.id,
        fecha,
        realizado_por: realizadoPor,
        tipo_accion: tipoAccion,
        descripcion: descripcion || null,
        ubicacion_anterior: equipoSel.ubicacion,
        nueva_ubicacion: (tipoAccion !== 'mantenimiento') ? nuevaUbicacion : null,
      })
    } catch { /* tabla opcional */ }

    // Actualizar local siempre (aunque Supabase falle)
    const equiposAct = equipos.map(e => {
      if (e.id !== equipoSel.id) return e
      const actualizado = { ...e, historial: nuevoHistorial }
      if (tipoAccion === 'ubicacion' || tipoAccion === 'ambos') actualizado.ubicacion = nuevaUbicacion
      return actualizado
    })

    setGuardando(false)
    if (!error) {
      setOk(true)
      onGuardar(equiposAct)
    } else {
      // Guardamos igual en local
      onGuardar(equiposAct)
      setOk(true)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ background: '#1d4ed8' }}>
          <div>
            <p className="text-white font-bold text-base">🔧 Registrar Reparación / Mantenimiento</p>
            <p className="text-white/60 text-xs mt-0.5">Quedará registrado en la ficha y en el stock general</p>
          </div>
          <button onClick={onCerrar} className="text-white/50 hover:text-white text-xl leading-none">✕</button>
        </div>

        {ok ? (
          <div className="p-10 text-center">
            <div className="text-5xl mb-4">✅</div>
            <p className="font-bold text-gray-800 text-lg mb-1">Registro guardado</p>
            <p className="text-sm text-gray-500 mb-6">
              {equipoSel?.marca} {equipoSel?.modelo} · N° {equipoSel?.numero_interno}
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setOk(false); setEquipoId(''); setDescripcion(''); setRealizadoPor('') }}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                Registrar otro
              </button>
              <button onClick={onCerrar}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: '#1d4ed8' }}>
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">

            {/* Filtro tipo */}
            <div className="flex gap-2">
              {(['arnes', 'polea'] as const).map(t => (
                <button key={t} onClick={() => setFiltroTipo(t)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors"
                  style={filtroTipo === t
                    ? { background: '#1d4ed8', color: 'white' }
                    : { background: '#eff6ff', color: '#1d4ed8' }}>
                  {t === 'arnes' ? '🦺 Arneses' : '⚙️ Poleas'}
                </button>
              ))}
            </div>

            {/* Selector equipo */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Seleccionar equipo *
              </label>
              <select value={equipoId} onChange={e => setEquipoId(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                style={{ border: '1.5px solid #e5e7eb', background: '#faf8f4' }}>
                <option value="">— Elegí un equipo —</option>
                {listaFiltrada.map(e => (
                  <option key={e.id} value={e.id}>
                    #{e.numero_interno} · {e.marca} {e.modelo} · S/N {e.numero_serie || '—'} · {UBICACION_LABEL[e.ubicacion as Ubicacion]}
                  </option>
                ))}
              </select>
            </div>

            {/* Info equipo seleccionado */}
            {equipoSel && (
              <div className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">{equipoSel.marca} {equipoSel.modelo}</p>
                  <p className="text-xs text-gray-500">N° {equipoSel.numero_interno} · Serie {equipoSel.numero_serie || '—'} · {equipoSel.actividad}</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-lg text-white"
                  style={{ background: UBICACION_COLOR[equipoSel.ubicacion as Ubicacion] }}>
                  {UBICACION_LABEL[equipoSel.ubicacion as Ubicacion]}
                </span>
              </div>
            )}

            {/* Tipo de acción */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">¿Qué se registra?</label>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  ['mantenimiento', '🔧 Mantenimiento'],
                  ['ubicacion', '📍 Cambio lugar'],
                  ['ambos', '🔧📍 Ambos'],
                ] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setTipoAccion(val)}
                    className="py-2 rounded-xl text-xs font-semibold transition-colors"
                    style={tipoAccion === val
                      ? { background: '#1d4ed8', color: 'white' }
                      : { background: '#f3f4f6', color: '#4b5563' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Descripción mantenimiento */}
            {(tipoAccion === 'mantenimiento' || tipoAccion === 'ambos') && (
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Descripción del mantenimiento *</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
                  placeholder="Ej: Revisión de costuras, cambio de mosquetón, limpieza de rodamiento..."
                  rows={2} className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none resize-none"
                  style={{ border: '1.5px solid #e5e7eb', background: '#faf8f4' }} />
              </div>
            )}

            {/* Nueva ubicación */}
            {(tipoAccion === 'ubicacion' || tipoAccion === 'ambos') && (
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Nueva ubicación</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.entries(UBICACION_LABEL) as [Ubicacion, string][]).map(([key, label]) => (
                    <button key={key} onClick={() => setNuevaUbicacion(key)}
                      className="py-2 rounded-xl text-xs font-semibold transition-colors"
                      style={nuevaUbicacion === key
                        ? { background: UBICACION_COLOR[key], color: 'white' }
                        : { background: '#f3f4f6', color: '#4b5563' }}>
                      {label}
                    </button>
                  ))}
                </div>
                {equipoSel && nuevaUbicacion !== equipoSel.ubicacion && (
                  <p className="text-xs mt-1.5" style={{ color: '#f97316' }}>
                    {UBICACION_LABEL[equipoSel.ubicacion as Ubicacion]} → {UBICACION_LABEL[nuevaUbicacion]}
                  </p>
                )}
              </div>
            )}

            {/* Fecha y realizado por */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Fecha</label>
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1.5px solid #e5e7eb', background: '#faf8f4' }} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Realizado por *</label>
                <input type="text" value={realizadoPor} onChange={e => setRealizadoPor(e.target.value)}
                  placeholder="Nombre"
                  className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1.5px solid #e5e7eb', background: '#faf8f4' }} />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-1">
              <button onClick={onCerrar}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: '#f3f4f6', color: '#6b7280' }}>
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={!equipoId || !realizadoPor.trim() || guardando ||
                  ((tipoAccion === 'mantenimiento' || tipoAccion === 'ambos') && !descripcion.trim())}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: '#1d4ed8' }}>
                {guardando ? 'Guardando...' : '💾 Guardar registro'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
