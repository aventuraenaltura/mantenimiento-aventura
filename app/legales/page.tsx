'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { fmtFecha } from '@/lib/fecha'

interface Archivo {
  id: string
  nombre: string
  url: string
  fecha_carga: string
  fecha_vencimiento?: string
}

interface SeccionDoc {
  id: string
  label: string
  icono: string
  descripcion: string
  tieneVencimiento: boolean
  multiple: boolean   // permite varios archivos
}

const SECCIONES: SeccionDoc[] = [
  {
    id: 'habilitacion_municipal',
    label: 'Habilitación Municipal',
    icono: '🏛️',
    descripcion: 'Habilitación otorgada por la Municipalidad de Villa Carlos Paz',
    tieneVencimiento: true,
    multiple: false,
  },
  {
    id: 'poliza_rc',
    label: 'Póliza de Responsabilidad Civil',
    icono: '🛡️',
    descripcion: 'Póliza de seguro de responsabilidad civil actualizada',
    tieneVencimiento: true,
    multiple: false,
  },
  {
    id: 'poliza_comercio',
    label: 'Póliza Integral de Comercio',
    icono: '🏢',
    descripcion: 'Póliza integral de comercio actualizada',
    tieneVencimiento: true,
    multiple: false,
  },
  {
    id: 'planillas_blanco',
    label: 'Planillas Obras Privadas (en blanco)',
    icono: '📋',
    descripcion: 'Planillas en blanco para descargar y completar',
    tieneVencimiento: false,
    multiple: true,
  },
  {
    id: 'planillas_presentadas',
    label: 'Planillas Obras Privadas (presentadas)',
    icono: '📁',
    descripcion: 'Planillas presentadas y actualizadas ante Obras Privadas',
    tieneVencimiento: false,
    multiple: true,
  },
  {
    id: 'credencial_turismo',
    label: 'Credencial Turismo Alternativo',
    icono: '🏔️',
    descripcion: 'Credencial de prestador de turismo alternativo — Provincia de Córdoba',
    tieneVencimiento: true,
    multiple: false,
  },
]

const STORAGE_KEY = 'legales_docs_v2'

function diasHasta(fecha?: string): number | null {
  if (!fecha) return null
  return Math.ceil((new Date(fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function estadoVencimiento(dias: number | null): 'vencido' | 'proximo' | 'ok' | null {
  if (dias === null) return null
  if (dias < 0) return 'vencido'
  if (dias <= 60) return 'proximo'
  return 'ok'
}

export default function LegalesPage() {
  const router = useRouter()
  const [autorizado, setAutorizado] = useState(false)
  const [docs, setDocs] = useState<Record<string, Archivo[]>>({})
  const [subiendo, setSubiendo] = useState<string | null>(null)
  const [editandoVenc, setEditandoVenc] = useState<{ secId: string; archivoId: string; valor: string } | null>(null)
  const [editandoNombre, setEditandoNombre] = useState<{ secId: string; archivoId: string; valor: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const u = localStorage.getItem('usuario')
    if (!u) { router.push('/'); return }
    const usuario = JSON.parse(u)
    if (usuario.rol !== 'admin') { router.push('/home'); return }
    setAutorizado(true)
    // Cargar desde Supabase
    supabase.from('legales_docs').select('*').then(({ data }) => {
      if (data && data.length > 0) {
        const agrupado: Record<string, Archivo[]> = {}
        for (const d of data) {
          if (!agrupado[d.seccion_id]) agrupado[d.seccion_id] = []
          agrupado[d.seccion_id].push(d)
        }
        setDocs(agrupado)
      }
    })
  }, [router])

  async function guardarDocs(nuevos: Record<string, Archivo[]>) {
    setDocs(nuevos)
  }

  async function subirArchivo(seccionId: string, file: File, vencimiento?: string) {
    setSubiendo(seccionId)
    setError(null)
    try {
      const path = `legales/${seccionId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const uploadPromise = supabase.storage.from('planillas-firmadas').upload(path, file, { upsert: true })
      const timeout = new Promise<{ data: null; error: Error }>(res =>
        setTimeout(() => res({ data: null, error: new Error('Timeout') }), 20000)
      )
      const { error: uploadError } = await Promise.race([uploadPromise, timeout])
      if (uploadError) { setError('No se pudo subir el archivo. Revisá tu conexión.'); return }

      const { data: urlData } = supabase.storage.from('planillas-firmadas').getPublicUrl(path)
      const nuevo: Archivo = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        nombre: file.name,
        url: urlData.publicUrl,
        fecha_carga: new Date().toISOString().split('T')[0],
        fecha_vencimiento: vencimiento || undefined,
      }

      const sec = SECCIONES.find(s => s.id === seccionId)!
      const actuales = docs[seccionId] ?? []

      if (!sec.multiple && actuales.length > 0) {
        // Borrar el anterior en Supabase antes de insertar el nuevo
        await supabase.from('legales_docs').delete().eq('seccion_id', seccionId)
      }

      await supabase.from('legales_docs').insert({ ...nuevo, seccion_id: seccionId })

      const nuevosArchivos = sec.multiple ? [...actuales, nuevo] : [nuevo]
      guardarDocs({ ...docs, [seccionId]: nuevosArchivos })
    } catch {
      setError('Error al subir el archivo.')
    } finally {
      setSubiendo(null)
    }
  }

  async function borrarArchivo(seccionId: string, archivoId: string) {
    if (!window.confirm('¿Borrar este archivo?')) return
    await supabase.from('legales_docs').delete().eq('id', archivoId)
    const actuales = docs[seccionId] ?? []
    guardarDocs({ ...docs, [seccionId]: actuales.filter(a => a.id !== archivoId) })
  }

  async function guardarNombre() {
    if (!editandoNombre) return
    const { secId, archivoId, valor } = editandoNombre
    if (!valor.trim()) return
    await supabase.from('legales_docs').update({ nombre: valor.trim() }).eq('id', archivoId)
    const actuales = docs[secId] ?? []
    guardarDocs({
      ...docs,
      [secId]: actuales.map(a => a.id === archivoId ? { ...a, nombre: valor.trim() } : a),
    })
    setEditandoNombre(null)
  }

  async function guardarVencimiento() {
    if (!editandoVenc) return
    const { secId, archivoId, valor } = editandoVenc
    await supabase.from('legales_docs').update({ fecha_vencimiento: valor || null }).eq('id', archivoId)
    const actuales = docs[secId] ?? []
    guardarDocs({
      ...docs,
      [secId]: actuales.map(a => a.id === archivoId ? { ...a, fecha_vencimiento: valor || undefined } : a),
    })
    setEditandoVenc(null)
  }

  if (!autorizado) return null

  // Alertas de vencimiento
  const alertas: { sec: SeccionDoc; archivo: Archivo; dias: number }[] = []
  for (const sec of SECCIONES.filter(s => s.tieneVencimiento)) {
    for (const arch of docs[sec.id] ?? []) {
      const dias = diasHasta(arch.fecha_vencimiento)
      if (dias !== null && dias <= 60) {
        alertas.push({ sec, archivo: arch, dias })
      }
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f5f0' }}>
      <header style={{ background: '#1e3a3a', color: 'white' }} className="px-6 py-4 flex items-center gap-4">
        <Link href="/home" className="text-white opacity-70 hover:opacity-100 text-2xl">←</Link>
        <span className="text-3xl">🏛️</span>
        <div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 20 }}>
            Documentos Legales
          </h1>
          <p className="text-sm opacity-70">Ptatanka SRL · Aventura en Altura</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Alertas */}
        {alertas.length > 0 && (
          <div className="space-y-2">
            {alertas.map(({ sec, archivo, dias }) => (
              <div key={archivo.id}
                className="rounded-xl p-4 flex items-center gap-3"
                style={{ background: dias < 0 ? '#fef2f2' : '#fff7ed', border: `1px solid ${dias < 0 ? '#fecaca' : '#fed7aa'}` }}>
                <span className="text-2xl">{dias < 0 ? '🔴' : '⚠️'}</span>
                <div className="flex-1">
                  <p style={{ fontWeight: 700, fontSize: 13, color: dias < 0 ? '#dc2626' : '#c2410c' }}>
                    {dias < 0 ? 'VENCIDO' : `Vence en ${dias} días`} — {sec.label}
                  </p>
                  <p style={{ fontSize: 11, color: '#6b7280' }}>
                    {archivo.nombre} · {fmtFecha(archivo.fecha_vencimiento)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">⚠️ {error}</div>
        )}

        {/* Secciones */}
        {SECCIONES.map(sec => {
          const archivos = docs[sec.id] ?? []
          const estaSubiendo = subiendo === sec.id

          return (
            <div key={sec.id} className="bg-white rounded-2xl p-5 shadow-sm"
              style={{ border: '1px solid #e5e7eb' }}>

              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl mt-0.5">{sec.icono}</span>
                <div className="flex-1">
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14, color: '#1c2533' }}>
                    {sec.label}
                  </p>
                  <p style={{ fontSize: 11, color: '#a0aec0' }}>{sec.descripcion}</p>
                </div>
              </div>

              {/* Archivos cargados */}
              {archivos.length > 0 && (
                <div className="space-y-2 mb-4">
                  {archivos.map(arch => {
                    const dias = diasHasta(arch.fecha_vencimiento)
                    const estado = estadoVencimiento(dias)
                    return (
                      <div key={arch.id} className="rounded-xl p-3 flex items-start gap-3"
                        style={{ background: '#f7f5f0', border: '1px solid #e5e7eb' }}>
                        <span className="text-lg mt-0.5">
                          {arch.nombre.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? '🖼️' : '📄'}
                        </span>
                        <div className="flex-1 min-w-0">
                          {editandoNombre?.secId === sec.id && editandoNombre?.archivoId === arch.id ? (
                            <div className="flex items-center gap-2 mt-1">
                              <input autoFocus value={editandoNombre.valor}
                                onChange={e => setEditandoNombre(n => n ? { ...n, valor: e.target.value } : null)}
                                onKeyDown={e => { if (e.key === 'Enter') guardarNombre(); if (e.key === 'Escape') setEditandoNombre(null) }}
                                className="flex-1 border rounded-lg px-2 py-1 text-xs focus:outline-none"
                                style={{ border: '1px solid #d1d5db' }} />
                              <button onClick={guardarNombre} className="text-xs px-2 py-1 rounded-lg text-white" style={{ background: '#1e3a3a' }}>OK</button>
                              <button onClick={() => setEditandoNombre(null)} className="text-xs text-gray-400">✕</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 mt-0.5">
                              <a href={arch.url} target="_blank" rel="noreferrer"
                                className="text-sm font-semibold text-blue-600 hover:underline truncate">
                                {arch.nombre}
                              </a>
                              <button onClick={() => setEditandoNombre({ secId: sec.id, archivoId: arch.id, valor: arch.nombre })}
                                className="text-gray-400 hover:text-gray-600 text-xs flex-shrink-0" title="Renombrar">✏️</button>
                            </div>
                          )}
                          <p style={{ fontSize: 11, color: '#a0aec0' }}>Cargado: {fmtFecha(arch.fecha_carga)}</p>

                          {/* Vencimiento */}
                          {sec.tieneVencimiento && (
                            editandoVenc?.secId === sec.id && editandoVenc?.archivoId === arch.id ? (
                              <div className="flex items-center gap-2 mt-1.5">
                                <input type="date" value={editandoVenc.valor}
                                  onChange={e => setEditandoVenc(ev => ev ? { ...ev, valor: e.target.value } : null)}
                                  className="border rounded-lg px-2 py-1 text-xs focus:outline-none"
                                  style={{ border: '1px solid #d1d5db' }} />
                                <button onClick={guardarVencimiento}
                                  className="text-xs px-2 py-1 rounded-lg text-white" style={{ background: '#1e3a3a' }}>
                                  Guardar
                                </button>
                                <button onClick={() => setEditandoVenc(null)} className="text-xs text-gray-400">✕</button>
                              </div>
                            ) : (
                              <button onClick={() => setEditandoVenc({ secId: sec.id, archivoId: arch.id, valor: arch.fecha_vencimiento ?? '' })}
                                className="mt-1 text-xs flex items-center gap-1">
                                <span className={`px-2 py-0.5 rounded-lg font-medium ${
                                  estado === 'vencido' ? 'bg-red-100 text-red-600' :
                                  estado === 'proximo' ? 'bg-orange-100 text-orange-600' :
                                  estado === 'ok' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-500'
                                }`}>
                                  {arch.fecha_vencimiento ? `Vence: ${fmtFecha(arch.fecha_vencimiento)}${dias !== null && dias >= 0 ? ` (${dias}d)` : ' — VENCIDO'}` : '+ Agregar vencimiento'}
                                </span>
                              </button>
                            )
                          )}
                        </div>
                        <button onClick={() => borrarArchivo(sec.id, arch.id)}
                          className="text-red-400 hover:text-red-600 text-sm flex-shrink-0">🗑️</button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Subir */}
              {(sec.multiple || archivos.length === 0) && (
                <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-xl px-3 py-3 transition-colors"
                  style={{ borderColor: estaSubiendo ? '#9ca3af' : '#d1d5db' }}>
                  <span>{estaSubiendo ? '⏳' : '⬆️'}</span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>
                    {estaSubiendo ? 'Subiendo...' : sec.multiple ? 'Agregar archivo' : archivos.length === 0 ? 'Subir archivo' : 'Reemplazar archivo'}
                  </span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
                    disabled={estaSubiendo}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) subirArchivo(sec.id, file)
                      e.target.value = ''
                    }} />
                </label>
              )}

              {/* Reemplazar si no es múltiple y ya tiene archivo */}
              {!sec.multiple && archivos.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer mt-2"
                  style={{ fontSize: 12, color: '#6b7280' }}>
                  <span>{estaSubiendo ? '⏳' : '🔄'}</span>
                  <span className="underline cursor-pointer">
                    {estaSubiendo ? 'Subiendo...' : 'Reemplazar con versión actualizada'}
                  </span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
                    disabled={estaSubiendo}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) subirArchivo(sec.id, file)
                      e.target.value = ''
                    }} />
                </label>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
