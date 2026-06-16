'use client'
import { useState } from 'react'
import Link from 'next/link'

interface Documento {
  id: string
  nombre: string
  descripcion: string
  categoria: string
  archivo_url: string
  fecha_carga: string
  tipo_archivo: string
}

interface LinkRef {
  id: string
  titulo: string
  url: string
  descripcion: string
  categoria: string
}

const CATEGORIAS = [
  { id: 'fabricante',   label: 'Manuales de fabricante',       icono: '📄' },
  { id: 'tecnico',      label: 'Fichas técnicas',              icono: '📋' },
  { id: 'instructivo',  label: 'Instructivos de mantenimiento', icono: '🔧' },
  { id: 'planilla',     label: 'Planillas de control',         icono: '📊' },
  { id: 'link',         label: 'Links de referencia',          icono: '🔗' },
  { id: 'otro',         label: 'Otros documentos',             icono: '📁' },
]

const DOCUMENTOS_DEMO: Documento[] = [
  { id: '1', nombre: 'Ficha de revisión Petzl TRAC PLUS', descripcion: 'Procedimiento de revisión periódica de la polea TRAC PLUS', categoria: 'fabricante', archivo_url: '#', fecha_carga: '2026-01-15', tipo_archivo: 'pdf' },
  { id: '2', nombre: 'Ficha de seguimiento Petzl TRAC PLUS', descripcion: 'Planilla de seguimiento histórico de la polea TRAC PLUS', categoria: 'fabricante', archivo_url: '#', fecha_carga: '2026-01-15', tipo_archivo: 'pdf' },
  { id: '3', nombre: 'Ficha de revisión Arnés Pandion', descripcion: 'Procedimiento de revisión periódica del arnés Petzl Pandion', categoria: 'fabricante', archivo_url: '#', fecha_carga: '2026-01-15', tipo_archivo: 'pdf' },
  { id: '4', nombre: 'Ficha de seguimiento Arnés Pandion', descripcion: 'Planilla de seguimiento histórico del arnés Petzl Pandion', categoria: 'fabricante', archivo_url: '#', fecha_carga: '2026-01-15', tipo_archivo: 'pdf' },
  { id: '5', nombre: 'Procedimiento poleas TRAC2', descripcion: 'Manual de procedimiento para poleas Petzl TRAC2', categoria: 'fabricante', archivo_url: '#', fecha_carga: '2026-01-15', tipo_archivo: 'pdf' },
  { id: '6', nombre: 'Manual Aventura Resumido 2023-2024', descripcion: 'Manual operativo interno de Aventura en Altura', categoria: 'instructivo', archivo_url: '#', fecha_carga: '2024-01-01', tipo_archivo: 'docx' },
  { id: '7', nombre: 'Bitácora Diaria Parque Aéreo', descripcion: 'Formulario oficial de bitácora diaria del circuito aéreo — Tirolesas Argentina', categoria: 'planilla', archivo_url: '#', fecha_carga: '2025-10-01', tipo_archivo: 'pdf' },
  { id: '8', nombre: 'Info técnica Tirolesa', descripcion: 'Documentación técnica del sistema de tirolesa', categoria: 'tecnico', archivo_url: '#', fecha_carga: '2023-01-01', tipo_archivo: 'docx' },
]

const LINKS_DEMO: LinkRef[] = [
  { id: '1', titulo: 'Petzl — Verificación de EPIs', url: 'https://www.petzl.com/ES/es/Sport/Verificacion-EPI', descripcion: 'Guía oficial de verificación de equipos de protección Petzl', categoria: 'link' },
  { id: '2', titulo: 'Tirolesas Argentina', url: '#', descripcion: 'Sitio oficial del fabricante del Parque Aéreo', categoria: 'link' },
]

export default function BibliotecaPage() {
  const [categoriaActiva, setCategoriaActiva] = useState('todos')
  const [busqueda, setBusqueda] = useState('')

  const docsFiltrados = DOCUMENTOS_DEMO.filter(d => {
    if (categoriaActiva !== 'todos' && categoriaActiva !== 'link' && d.categoria !== categoriaActiva) return false
    if (busqueda && !d.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen">
      <header className="bg-emerald-700 text-white px-6 py-4 flex items-center gap-4 no-print">
        <Link href="/home" className="text-white opacity-70 hover:opacity-100 text-2xl">←</Link>
        <span className="text-3xl">📚</span>
        <div>
          <h1 className="font-bold text-xl">Biblioteca Técnica</h1>
          <p className="text-sm opacity-70">Manuales, fichas técnicas y documentos de referencia</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Buscar */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        {/* Categorías */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button onClick={() => setCategoriaActiva('todos')}
            className={`text-sm px-4 py-2 rounded-xl border transition-colors ${categoriaActiva === 'todos' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            Todos
          </button>
          {CATEGORIAS.map(cat => (
            <button key={cat.id} onClick={() => setCategoriaActiva(cat.id)}
              className={`text-sm px-4 py-2 rounded-xl border transition-colors flex items-center gap-1.5 ${categoriaActiva === cat.id ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              <span>{cat.icono}</span>{cat.label}
            </button>
          ))}
        </div>

        {/* Links de referencia */}
        {(categoriaActiva === 'todos' || categoriaActiva === 'link') && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">🔗 Links de referencia</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {LINKS_DEMO.map(link => (
                <div key={link.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
                  <span className="text-2xl mt-0.5">🌐</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 text-sm">{link.titulo}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{link.descripcion}</p>
                    <a href={link.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:underline mt-1 inline-block">
                      Abrir →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documentos */}
        {categoriaActiva !== 'link' && (
          <>
            {CATEGORIAS.filter(c => c.id !== 'link').map(cat => {
              const docs = docsFiltrados.filter(d => d.categoria === cat.id)
              if (docs.length === 0) return null
              if (categoriaActiva !== 'todos' && categoriaActiva !== cat.id) return null
              return (
                <div key={cat.id} className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {cat.icono} {cat.label}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {docs.map(doc => (
                      <div key={doc.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
                        <span className="text-2xl mt-0.5">
                          {doc.tipo_archivo === 'pdf' ? '📄' : doc.tipo_archivo === 'docx' ? '📝' : '📁'}
                        </span>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800 text-sm">{doc.nombre}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{doc.descripcion}</p>
                          <p className="text-xs text-gray-300 mt-1">Cargado: {doc.fecha_carga}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button className="text-xs text-emerald-600 hover:underline">Ver</button>
                          <button className="text-xs text-gray-400 hover:text-gray-600">⬇️</button>
                          <button onClick={() => window.print()} className="text-xs text-gray-400 hover:text-gray-600 no-print">🖨️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* Subir documento — solo admin */}
        <div className="mt-8 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center no-print">
          <span className="text-3xl">⬆️</span>
          <p className="text-sm font-medium text-gray-600 mt-2">Subir nuevo documento</p>
          <p className="text-xs text-gray-400 mt-1">PDF, Word, imagen — solo administrador</p>
          <button className="mt-4 bg-emerald-700 text-white text-sm px-6 py-2 rounded-xl hover:bg-emerald-800">
            Seleccionar archivo
          </button>
        </div>
      </div>
    </div>
  )
}
