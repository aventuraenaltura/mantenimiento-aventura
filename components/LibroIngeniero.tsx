'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { fmtFecha } from '@/lib/fecha'

interface FotoLibro {
  id: string
  mes: string
  url: string
  nombre: string
  fecha_subida: string
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function mesLabel(mes: string) {
  const [anio, m] = mes.split('-')
  return `${MESES[parseInt(m) - 1]} ${anio}`
}

function mesActual() {
  return new Date().toISOString().slice(0, 7)
}

export default function LibroIngeniero({ esAdmin }: { esAdmin: boolean }) {
  const [fotos, setFotos] = useState<FotoLibro[]>([])
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [mesSeleccionado, setMesSeleccionado] = useState(mesActual())
  const [error, setError] = useState<string | null>(null)
  const [expandido, setExpandido] = useState(false)

  useEffect(() => { cargarFotos() }, [])

  async function cargarFotos() {
    setCargando(true)
    const { data } = await supabase
      .from('libro_ingeniero')
      .select('*')
      .order('mes', { ascending: false })
    if (data) setFotos(data)
    setCargando(false)
  }

  async function subirFoto(file: File) {
    setSubiendo(true)
    setError(null)
    try {
      const path = `tirolesa/libro-ingeniero/${mesSeleccionado}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const uploadPromise = supabase.storage.from('planillas-firmadas').upload(path, file, { upsert: true })
      const timeout = new Promise<{ data: null; error: Error }>(res =>
        setTimeout(() => res({ data: null, error: new Error('Timeout') }), 20000)
      )
      const { error: uploadError } = await Promise.race([uploadPromise, timeout])
      if (uploadError) { setError('No se pudo subir la foto. Revisá tu conexión.'); return }

      const { data: urlData } = supabase.storage.from('planillas-firmadas').getPublicUrl(path)
      const nueva: FotoLibro = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        mes: mesSeleccionado,
        url: urlData.publicUrl,
        nombre: file.name,
        fecha_subida: new Date().toISOString().split('T')[0],
      }
      const { error: dbError } = await supabase.from('libro_ingeniero').insert(nueva)
      if (dbError) { setError('La foto se subió pero no se pudo registrar. Recargá la página.'); return }
      setFotos(prev => [nueva, ...prev])
    } catch {
      setError('Error al subir la foto.')
    } finally {
      setSubiendo(false)
    }
  }

  async function borrarFoto(id: string) {
    if (!window.confirm('¿Borrar esta foto del libro?')) return
    await supabase.from('libro_ingeniero').delete().eq('id', id)
    setFotos(prev => prev.filter(f => f.id !== id))
  }

  const porMes = fotos.reduce((acc, f) => {
    if (!acc[f.mes]) acc[f.mes] = []
    acc[f.mes].push(f)
    return acc
  }, {} as Record<string, FotoLibro[]>)

  const mesesOrdenados = Object.keys(porMes).sort((a, b) => b.localeCompare(a))

  const opcionesMes: string[] = []
  const hoy = new Date()
  for (let i = 0; i < 24; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    opcionesMes.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  return (
    <div className="panel rounded-2xl border border-gray-200 p-5">
      <button className="w-full flex items-center justify-between" onClick={() => setExpandido(e => !e)}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">📖</span>
          <div className="text-left">
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14, color: '#1c2533' }}>
              Libro del Ingeniero
            </p>
            <p style={{ fontSize: 11, color: '#a0aec0' }}>
              {cargando ? 'Cargando...' : fotos.length === 0 ? 'Sin fotos cargadas' : `${fotos.length} foto${fotos.length !== 1 ? 's' : ''} en ${mesesOrdenados.length} mes${mesesOrdenados.length !== 1 ? 'es' : ''}`}
            </p>
          </div>
        </div>
        <span style={{ color: '#a0aec0', fontSize: 18 }}>{expandido ? '▲' : '▼'}</span>
      </button>

      {expandido && (
        <div className="mt-5 space-y-5">
          {esAdmin && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 12, color: '#92400e', marginBottom: 10 }}>
                📷 Agregar foto del libro
              </p>
              <div className="flex gap-2 items-center mb-3">
                <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Mes:</label>
                <select value={mesSeleccionado} onChange={e => setMesSeleccionado(e.target.value)}
                  className="flex-1 border rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                  style={{ border: '1.5px solid #e5e7eb' }}>
                  {opcionesMes.map(m => <option key={m} value={m}>{mesLabel(m)}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg px-3 py-3 transition-colors border-amber-200 text-amber-600 hover:border-amber-400 hover:bg-amber-100">
                <span className="text-xl">{subiendo ? '⏳' : '📷'}</span>
                <span className="text-xs font-medium flex-1">
                  {subiendo ? 'Subiendo...' : `Seleccionar foto para ${mesLabel(mesSeleccionado)}`}
                </span>
                <input type="file" accept="image/*,.pdf" className="hidden" disabled={subiendo}
                  onChange={e => { const file = e.target.files?.[0]; if (file) subirFoto(file); e.target.value = '' }} />
              </label>
              {error && <p className="mt-2 text-xs text-red-500">⚠️ {error}</p>}
            </div>
          )}

          {cargando ? (
            <p className="text-sm text-center text-gray-400 py-4">Cargando fotos...</p>
          ) : mesesOrdenados.length === 0 ? (
            <p className="text-sm text-center text-gray-400 py-4">Todavía no hay fotos del libro cargadas.</p>
          ) : (
            <div className="space-y-4">
              {mesesOrdenados.map(mes => (
                <div key={mes}>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 12, color: '#4a5568', marginBottom: 8 }}>
                    📅 {mesLabel(mes)}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {porMes[mes].map(foto => (
                      <div key={foto.id} className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                        {foto.url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                          <a href={foto.url} target="_blank" rel="noreferrer">
                            <img src={foto.url} alt={foto.nombre} className="w-full h-28 object-cover" />
                          </a>
                        ) : (
                          <a href={foto.url} target="_blank" rel="noreferrer"
                            className="flex flex-col items-center justify-center h-28 gap-1">
                            <span className="text-3xl">📄</span>
                            <span className="text-xs text-gray-500 px-2 text-center truncate w-full">{foto.nombre}</span>
                          </a>
                        )}
                        <div className="px-2 py-1.5 flex items-center justify-between">
                          <span className="text-xs text-gray-400">{fmtFecha(foto.fecha_subida)}</span>
                          {esAdmin && (
                            <button onClick={() => borrarFoto(foto.id)} className="text-red-400 text-xs hover:text-red-600">🗑️</button>
                          )}
                        </div>
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

export async function obtenerFotosLibro(): Promise<{ mes: string; url: string; nombre: string }[]> {
  const { data } = await supabase.from('libro_ingeniero').select('mes, url, nombre')
  return data ?? []
}
