'use client'
import { useState } from 'react'
import { importarStockInicial, fichasExisten } from '@/lib/db'

interface Equipo {
  id: string; tipo: string; numero_interno: string; marca: string
  modelo: string; numero_serie: string; actividad: string
  uso_actual: string; fecha_ingreso: string; observaciones: string
}

interface Props {
  equipos: Equipo[]
  onCerrar: () => void
  onExito: () => void
}

export default function ImportarStockInicial({ equipos, onCerrar, onExito }: Props) {
  const [paso, setPaso] = useState<'confirmar' | 'cargando' | 'ok' | 'error' | 'ya_existe'>('confirmar')
  const [mensaje, setMensaje] = useState('')

  const arneses = equipos.filter(e => e.tipo === 'arnes')
  const poleas = equipos.filter(e => e.tipo === 'polea')

  async function confirmar() {
    setPaso('cargando')
    const yaExiste = await fichasExisten()
    if (yaExiste) { setPaso('ya_existe'); return }

    const ok = await importarStockInicial(equipos as unknown as Record<string, unknown>[])
    if (ok) {
      setPaso('ok')
    } else {
      setMensaje('No se pudo conectar con la base de datos. Verificá la conexión.')
      setPaso('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ background: '#1e3a3a' }}>
          <div>
            <p className="text-white font-bold">📦 Importación de Stock Inicial</p>
            <p className="text-white/50 text-xs mt-0.5">Esta acción se realiza una sola vez</p>
          </div>
          <button onClick={onCerrar} className="text-white/50 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-6">
          {paso === 'confirmar' && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                <p className="text-amber-800 font-semibold text-sm mb-1">⚠️ Acción irreversible</p>
                <p className="text-amber-700 text-xs">
                  Esto va a crear <strong>{equipos.length} fichas permanentes</strong> en la base de datos.
                  Las fichas no se pueden borrar, solo dar de alta o de baja.
                  El N° de ficha será el N° de serie de cada equipo.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-xl p-4 text-center" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
                  <p className="text-3xl font-black text-green-700">{arneses.length}</p>
                  <p className="text-sm text-green-600">🦺 Arneses</p>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ background: '#eff6ff', border: '1px solid #93c5fd' }}>
                  <p className="text-3xl font-black text-blue-700">{poleas.length}</p>
                  <p className="text-sm text-blue-600">⚙️ Poleas</p>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden mb-5" style={{ border: '1px solid #e5e7eb', maxHeight: 200, overflowY: 'auto' }}>
                <div className="px-3 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-500">Vista previa de fichas a crear</div>
                {equipos.slice(0, 20).map(e => (
                  <div key={e.id} className="flex items-center gap-3 px-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{e.numero_serie || e.numero_interno}</span>
                    <span className="text-sm text-gray-700">{e.marca} {e.modelo}</span>
                    <span className="ml-auto text-xs text-gray-400 capitalize">{e.tipo}</span>
                  </div>
                ))}
                {equipos.length > 20 && (
                  <div className="px-3 py-2 text-xs text-gray-400 text-center">... y {equipos.length - 20} más</div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={onCerrar}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: '#f3f4f6', color: '#6b7280' }}>
                  Cancelar
                </button>
                <button onClick={confirmar}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: '#1e3a3a' }}>
                  Crear {equipos.length} fichas →
                </button>
              </div>
            </>
          )}

          {paso === 'cargando' && (
            <div className="py-10 text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p className="font-semibold text-gray-700">Creando fichas en la base de datos...</p>
              <p className="text-xs text-gray-400 mt-1">No cierres esta ventana</p>
            </div>
          )}

          {paso === 'ok' && (
            <div className="py-8 text-center">
              <div className="text-5xl mb-4">✅</div>
              <p className="font-bold text-gray-800 text-lg mb-1">{equipos.length} fichas creadas</p>
              <p className="text-sm text-gray-500 mb-6">El stock inicial quedó registrado correctamente</p>
              <button onClick={onExito}
                className="px-8 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: '#1e3a3a' }}>
                Ver fichas →
              </button>
            </div>
          )}

          {paso === 'ya_existe' && (
            <div className="py-8 text-center">
              <div className="text-5xl mb-4">📋</div>
              <p className="font-bold text-gray-800 text-lg mb-1">Stock inicial ya cargado</p>
              <p className="text-sm text-gray-500 mb-6">Las fichas ya fueron creadas anteriormente. No se puede repetir esta acción.</p>
              <button onClick={onCerrar}
                className="px-8 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: '#1e3a3a' }}>
                Entendido
              </button>
            </div>
          )}

          {paso === 'error' && (
            <div className="py-8 text-center">
              <div className="text-5xl mb-4">❌</div>
              <p className="font-bold text-red-700 mb-1">Error al crear fichas</p>
              <p className="text-sm text-gray-500 mb-6">{mensaje}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setPaso('confirmar')}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: '#f3f4f6', color: '#374151' }}>
                  Reintentar
                </button>
                <button onClick={onCerrar}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: '#dc2626' }}>
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
