'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DocLegal {
  id: string
  nombre: string
  descripcion: string
  categoria: 'habilitacion' | 'ingenieria' | 'seguro' | 'otro'
  archivo_url: string
  fecha_carga: string
  fecha_vencimiento?: string
}

const CATEGORIAS = [
  { id: 'habilitacion', label: 'Habilitación Municipal', icono: '🏛️', color: 'bg-blue-50 border-blue-200' },
  { id: 'ingenieria',   label: 'Ingeniería',             icono: '📐', color: 'bg-purple-50 border-purple-200' },
  { id: 'seguro',       label: 'Seguros',                icono: '🛡️', color: 'bg-green-50 border-green-200' },
  { id: 'otro',         label: 'Otros',                  icono: '📁', color: 'bg-gray-50 border-gray-200' },
]

const DOCS_DEMO: DocLegal[] = [
  { id: '1', nombre: 'Habilitación Municipal 2026', descripcion: 'Habilitación anual otorgada por la Municipalidad de Villa Carlos Paz', categoria: 'habilitacion', archivo_url: '#', fecha_carga: '2026-01-10', fecha_vencimiento: '2026-12-31' },
  { id: '2', nombre: 'Certificado estructural tirolesa — Ing. Responsable', descripcion: 'Certificado de aptitud estructural del sistema de tirolesa firmado por el ingeniero responsable', categoria: 'ingenieria', archivo_url: '#', fecha_carga: '2025-11-01', fecha_vencimiento: '2026-11-01' },
  { id: '3', nombre: 'Papelería para registro municipal — Parque Aéreo', descripcion: 'Documentación del ingeniero para el registro del Parque Aéreo ante la municipalidad', categoria: 'ingenieria', archivo_url: '#', fecha_carga: '2025-10-15' },
  { id: '4', nombre: 'Póliza de seguro de responsabilidad civil 2026', descripcion: 'Seguro de responsabilidad civil por actividades de riesgo', categoria: 'seguro', archivo_url: '#', fecha_carga: '2026-01-01', fecha_vencimiento: '2026-12-31' },
]

function diasHastaVencimiento(fecha?: string): number | null {
  if (!fecha) return null
  return Math.ceil((new Date(fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function LegalesPage() {
  const router = useRouter()
  const [autorizado, setAutorizado] = useState(false)
  const [categoriaActiva, setCategoriaActiva] = useState('todos')

  useEffect(() => {
    const u = localStorage.getItem('usuario')
    if (!u) { router.push('/'); return }
    const usuario = JSON.parse(u)
    if (usuario.rol !== 'admin') { router.push('/home'); return }
    setAutorizado(true)
  }, [router])

  if (!autorizado) return null

  const docsFiltrados = DOCS_DEMO.filter(d => categoriaActiva === 'todos' || d.categoria === categoriaActiva)

  return (
    <div className="min-h-screen">
      <header className="bg-slate-800 text-white px-6 py-4 flex items-center gap-4 no-print">
        <Link href="/home" className="text-white opacity-70 hover:opacity-100 text-2xl">←</Link>
        <span className="text-3xl">🏛️</span>
        <div>
          <h1 className="font-bold text-xl">Documentos Legales y Municipales</h1>
          <p className="text-sm opacity-70">Acceso exclusivo — Administrador</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Alertas de vencimiento */}
        {DOCS_DEMO.filter(d => {
          const dias = diasHastaVencimiento(d.fecha_vencimiento)
          return dias !== null && dias <= 30 && dias >= 0
        }).map(d => (
          <div key={d.id} className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <span className="text-2xl">⏰</span>
            <div>
              <p className="font-semibold text-orange-800 text-sm">{d.nombre}</p>
              <p className="text-xs text-orange-600">Vence en {diasHastaVencimiento(d.fecha_vencimiento)} días — {d.fecha_vencimiento}</p>
            </div>
            <button onClick={() => window.print()} className="ml-auto text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 no-print">
              🖨️ Imprimir
            </button>
          </div>
        ))}

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button onClick={() => setCategoriaActiva('todos')}
            className={`text-sm px-4 py-2 rounded-xl border transition-colors ${categoriaActiva === 'todos' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            Todos
          </button>
          {CATEGORIAS.map(cat => (
            <button key={cat.id} onClick={() => setCategoriaActiva(cat.id)}
              className={`text-sm px-4 py-2 rounded-xl border transition-colors flex items-center gap-1.5 ${categoriaActiva === cat.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              {cat.icono} {cat.label}
            </button>
          ))}
        </div>

        {/* Documentos */}
        <div className="space-y-4">
          {CATEGORIAS.map(cat => {
            const docs = docsFiltrados.filter(d => d.categoria === cat.id)
            if (docs.length === 0) return null
            if (categoriaActiva !== 'todos' && categoriaActiva !== cat.id) return null
            return (
              <div key={cat.id}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {cat.icono} {cat.label}
                </h2>
                <div className="space-y-3">
                  {docs.map(doc => {
                    const dias = diasHastaVencimiento(doc.fecha_vencimiento)
                    return (
                      <div key={doc.id} className={`bg-white rounded-xl border p-4 flex items-start gap-4 hover:shadow-sm transition-shadow ${cat.color}`}>
                        <span className="text-3xl mt-0.5">📄</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{doc.nombre}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{doc.descripcion}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-gray-400">Cargado: {doc.fecha_carga}</span>
                            {doc.fecha_vencimiento && (
                              <span className={`text-xs px-2 py-0.5 rounded-lg ${
                                dias !== null && dias <= 30
                                  ? 'bg-orange-100 text-orange-700'
                                  : dias !== null && dias < 0
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                Vence: {doc.fecha_vencimiento} {dias !== null && dias >= 0 && dias <= 30 ? `(${dias}d)` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 no-print">
                          <button className="text-xs bg-slate-100 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-200">Ver</button>
                          <button onClick={() => window.print()} className="text-xs bg-slate-800 text-white px-3 py-2 rounded-lg hover:bg-slate-700">🖨️ Imprimir</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Subir */}
        <div className="mt-8 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center no-print">
          <span className="text-3xl">⬆️</span>
          <p className="text-sm font-medium text-gray-600 mt-2">Subir documento legal</p>
          <p className="text-xs text-gray-400 mt-1">Habilitaciones, certificados, seguros, papelería del ingeniero</p>
          <div className="flex gap-3 justify-center mt-4">
            <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
              {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.icono} {c.label}</option>)}
            </select>
            <button className="bg-slate-800 text-white text-sm px-6 py-2 rounded-xl hover:bg-slate-700">
              Seleccionar archivo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
