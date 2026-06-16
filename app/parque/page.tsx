'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const PUNTOS = Array.from({ length: 19 }, (_, i) => ({
  numero: i + 1,
  desc: i < 18
    ? `Punto ${i + 1}: anclaje, marcas de pintura, prensacable y tensor`
    : 'Inspección visual general del circuito completo',
}))

type EstadoPunto = 'pendiente' | 'correcto' | 'incorrecto'

export default function ParquePage() {
  const [puntos, setPuntos] = useState<{ estado: EstadoPunto; notas: string }[]>(
    PUNTOS.map(() => ({ estado: 'pendiente', notas: '' }))
  )
  const [inspector, setInspector] = useState('')
  const [inspeccionGeneral, setInspeccionGeneral] = useState('')
  const [guardado, setGuardado] = useState(false)

  const tieneAnomalia = puntos.some(p => p.estado === 'incorrecto')
  const completo = puntos.every(p => p.estado !== 'pendiente') && inspector

  function setEstado(idx: number, estado: EstadoPunto) {
    setPuntos(prev => prev.map((p, i) => i === idx ? { ...p, estado } : p))
  }
  function setNotas(idx: number, notas: string) {
    setPuntos(prev => prev.map((p, i) => i === idx ? { ...p, notas } : p))
  }

  function guardar() {
    if (!completo) return
    setGuardado(true)
  }

  return (
    <div className="min-h-screen">
      <header className="bg-sky-400 text-white px-6 py-3 flex items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <Link href="/home" className="text-white opacity-70 hover:opacity-100 text-2xl font-bold leading-none">←</Link>
          <Image src="/logos/parque.png" alt="Parque Aéreo" width={160} height={80} style={{ objectFit: 'contain', maxHeight: 70 }} priority />
          <p className="text-sm opacity-80 font-medium">Bitácora diaria + mantenimiento</p>
        </div>
        <Image src="/logos/aventura-en-altura.png" alt="Aventura en Altura" width={90} height={60} style={{ objectFit: 'contain', maxHeight: 55 }} />
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Alerta anomalía */}
        {tieneAnomalia && (
          <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-2xl">⛔</span>
            <div>
              <p className="font-bold text-red-700 text-lg">PARQUE CERRADO</p>
              <p className="text-red-600 text-sm">Anomalía detectada. No abrir al público hasta resolución. Contactar a Tirolesas Argentina: 11-3279-8939</p>
            </div>
          </div>
        )}

        {guardado && !tieneAnomalia && (
          <div className="bg-green-50 border border-green-300 rounded-xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <p className="text-green-700 font-semibold">Bitácora registrada. Parque habilitado para abrir.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bitácora diaria */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-800">Bitácora Diaria — Circuito Aéreo</h2>
                  <p className="text-xs text-gray-500">Revisión previa apertura al público · {new Date().toLocaleDateString('es-AR')}</p>
                </div>
                <span className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded-lg">MP-04-000 · Diaria</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Inspector *</label>
                <input type="text" value={inspector} onChange={e => setInspector(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 mb-4"
                  placeholder="Nombre completo del inspector" />
              </div>

              <div className="space-y-2">
                {PUNTOS.map((punto, idx) => (
                  <div key={idx} className={`border rounded-xl p-3 transition-colors ${
                    puntos[idx].estado === 'correcto' ? 'border-green-200 bg-green-50' :
                    puntos[idx].estado === 'incorrecto' ? 'border-red-200 bg-red-50' :
                    'border-gray-100 bg-white'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-gray-500 w-6 text-center">{punto.numero}</span>
                      <p className="flex-1 text-sm text-gray-700">{punto.desc}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEstado(idx, 'correcto')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            puntos[idx].estado === 'correcto'
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-gray-500 hover:bg-green-100'
                          }`}
                        >✓ OK</button>
                        <button
                          onClick={() => setEstado(idx, 'incorrecto')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            puntos[idx].estado === 'incorrecto'
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-500 hover:bg-red-100'
                          }`}
                        >✗ NOK</button>
                      </div>
                    </div>
                    {puntos[idx].estado === 'incorrecto' && (
                      <input
                        type="text"
                        placeholder="Describir la anomalía detectada..."
                        value={puntos[idx].notas}
                        onChange={e => setNotas(idx, e.target.value)}
                        className="w-full mt-2 border border-red-200 rounded-lg px-3 py-2 text-xs bg-white"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <label className="text-xs font-semibold text-gray-600">Inspección visual general del circuito</label>
                <textarea value={inspeccionGeneral} onChange={e => setInspeccionGeneral(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 resize-none"
                  rows={3} placeholder="Observaciones generales del circuito..." />
              </div>

              <button
                onClick={guardar}
                disabled={!completo}
                className="w-full mt-4 bg-sky-400 hover:bg-sky-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {tieneAnomalia ? '⛔ Registrar anomalía (parque no habilitado)' : '✅ Registrar bitácora (parque habilitado)'}
              </button>
            </div>
          </div>

          {/* Sidebar — otras planillas del parque */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 text-sm">Otras planillas</h3>
            {[
              { codigo: 'MP-04-003', nombre: 'Infraestructura Parque', freq: 'Mensual', estado: 'verde' },
              { codigo: 'MP-04-001', nombre: 'Equipos de Vuelo Parque', freq: 'Semestral', estado: 'verde' },
              { codigo: 'MP-04-002', nombre: 'Revisión Tirolesas Argentina', freq: 'Semestral', estado: 'naranja' },
            ].map(p => (
              <div key={p.codigo} className={`bg-white rounded-xl border-l-4 p-4 ${
                p.estado === 'rojo' ? 'border-l-red-500' : p.estado === 'naranja' ? 'border-l-orange-400' : 'border-l-green-500'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{p.codigo}</span>
                  <span className="text-xs text-gray-400">{p.freq}</span>
                </div>
                <p className="text-sm font-medium text-gray-700">{p.nombre}</p>
                <button className="mt-2 w-full text-xs bg-sky-400 text-white rounded-lg py-1.5 hover:bg-sky-500">
                  ✓ REALIZADO
                </button>
              </div>
            ))}

            <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-sky-700 mb-1">Revisión externa</p>
              <p className="text-xs text-sky-600">Tirolesas Argentina realiza revisión completa cada 6 meses.</p>
              <p className="text-xs text-sky-500 mt-1">📞 11-3279-8939</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
