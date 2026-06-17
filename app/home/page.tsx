'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { PLANILLAS_INICIALES } from '@/lib/datos-iniciales'

const ACTIVIDADES_BASE = [
  { slug: 'tirolesa',  nombre: 'Tirolesa',          logo: '/logos/tirolesa.png',  color: '#F5C800', textColor: '#1a1a1a' },
  { slug: 'arqueria',  nombre: 'Arquería',           logo: '/logos/arqueria.png',  color: '#C8956A', textColor: '#ffffff' },
  { slug: 'parque',    nombre: 'Parque Aéreo',       logo: '/logos/parque.png',    color: '#4FC3F7', textColor: '#1a1a1a' },
  { slug: 'salon',     nombre: 'Aventura Escondida', logo: '/logos/escondida.png', color: '#6B8E5A', textColor: '#ffffff' },
]

function calcularAlertas(actividadSlug: string): number {
  try {
    const fechasRaw = localStorage.getItem('fechas_planillas')
    if (!fechasRaw) return 0
    const fechas: Record<string, string> = JSON.parse(fechasRaw)
    const hoy = new Date()
    const planillas = PLANILLAS_INICIALES.filter(p => p.actividad_id === actividadSlug)
    let alertas = 0
    for (const p of planillas) {
      const fechaStr = fechas[p.codigo]
      if (!fechaStr) continue
      const inicio = new Date(fechaStr)
      const mesesPorFrecuencia: Record<string, number> = {
        diario: 0, semanal: 0, mensual: 1, trimestral: 3, semestral: 6, anual: 12
      }
      const meses = mesesPorFrecuencia[p.frecuencia] ?? 1
      const vence = new Date(inicio)
      vence.setMonth(vence.getMonth() + meses)
      if (vence < hoy) alertas++
    }
    return alertas
  } catch { return 0 }
}

const ANIO_INICIO = 2011

export default function HomePage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<{ nombre: string; rol: string } | null>(null)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [actividades, setActividades] = useState(ACTIVIDADES_BASE.map(a => ({ ...a, alertas: 0 })))
  const [statsGlobales, setStatsGlobales] = useState({ vencidos: 0, proximos: 0, reparar: 0 })

  useEffect(() => {
    const u = localStorage.getItem('usuario')
    if (!u) { router.push('/'); return }
    setUsuario(JSON.parse(u))
    setActividades(ACTIVIDADES_BASE.map(a => ({ ...a, alertas: calcularAlertas(a.slug) })))

    // Stats globales
    try {
      const fechasRaw = localStorage.getItem('fechas_planillas')
      const fechas: Record<string, string> = fechasRaw ? JSON.parse(fechasRaw) : {}
      const hoy = new Date()
      const en7dias = new Date(); en7dias.setDate(hoy.getDate() + 7)
      let vencidos = 0, proximos = 0
      const mesesPorFrecuencia: Record<string, number> = {
        diario: 0, semanal: 0, mensual: 1, trimestral: 3, semestral: 6, anual: 12
      }
      for (const p of PLANILLAS_INICIALES) {
        const fechaStr = fechas[p.codigo]
        if (!fechaStr) continue
        const inicio = new Date(fechaStr)
        const meses = mesesPorFrecuencia[p.frecuencia] ?? 1
        const vence = new Date(inicio)
        vence.setMonth(vence.getMonth() + meses)
        if (vence < hoy) vencidos++
        else if (vence <= en7dias) proximos++
      }
      const equiposRaw = localStorage.getItem('inv_equipos')
      const equipos = equiposRaw ? JSON.parse(equiposRaw) : []
      const reparar = equipos.filter((e: {ubicacion: string}) => e.ubicacion === 'para_reparar').length
      setStatsGlobales({ vencidos, proximos, reparar })
    } catch { /* sin datos */ }
  }, [router])

  function logout() {
    localStorage.removeItem('usuario')
    router.push('/')
  }

  const anios = Array.from({ length: new Date().getFullYear() - ANIO_INICIO + 1 }, (_, i) => ANIO_INICIO + i).reverse()

  if (!usuario) return null

  return (
    <div className="min-h-screen" style={{ background: '#f0ede6' }}>

      {/* HERO — imagen aérea del lago + logo */}
      {/* Reemplazá /bg-lago.jpg con tu foto aérea del Lago San Roque */}
      <div className="no-print" style={{ position: 'relative', width: '100%', height: 260 }}>
        {/* Imagen de fondo — reemplazá con tu foto: copiá tu imagen a public/bg-lago.jpg */}
        {/* Por ahora usa una foto aérea de lago de Unsplash como placeholder */}
        <Image
          src="/bg-lago.jpg"
          alt="Vista aérea Lago San Roque"
          fill
          style={{ objectFit: 'cover', objectPosition: 'center 40%' }}
          priority
        />

        {/* Overlay degradado: oscuro abajo para legibilidad, transparente arriba */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.55) 100%)'
        }} />

        {/* Barra superior: logo izq + usuario der */}
        <div className="absolute top-0 left-0 right-0 flex items-start justify-between px-6 pt-5" style={{ zIndex: 10 }}>
          <Image
            src="/logos/aventura-en-altura.png"
            alt="Aventura en Altura"
            width={140}
            height={95}
            style={{ objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
            priority
          />
          <div className="flex items-center gap-4 pt-2">
            <select
              value={anio}
              onChange={e => setAnio(Number(e.target.value))}
              className="rounded-lg px-3 py-1.5 text-sm focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(4px)' }}
            >
              {anios.map(a => <option key={a} value={a} style={{ color: '#111' }}>{a}</option>)}
            </select>
            <div className="text-right" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
              <p className="text-sm font-semibold text-white">{usuario.nombre}</p>
              <p className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.7)' }}>{usuario.rol}</p>
            </div>
            <button onClick={logout} className="text-xs underline" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Salir
            </button>
          </div>
        </div>

        {/* Texto hero centrado abajo */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-5" style={{ zIndex: 10 }}>
          <p className="text-white font-bold text-xl" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)', letterSpacing: 0.5 }}>
            Sistema de Mantenimiento
          </p>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
            Complejo Aerosilla · Villa Carlos Paz, Córdoba
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* Alertas rápidas */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: '#fde8e6', border: '1px solid #f5c4be' }}>
            <span className="text-2xl">🔴</span>
            <div>
              <p className="text-xl font-bold" style={{ color: '#c0392b' }}>{statsGlobales.vencidos}</p>
              <p className="text-xs" style={{ color: '#c0392b' }}>Mantenimientos vencidos</p>
            </div>
          </div>
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: '#fff4e0', border: '1px solid #f5dca0' }}>
            <span className="text-2xl">🟠</span>
            <div>
              <p className="text-xl font-bold" style={{ color: '#b7770d' }}>{statsGlobales.proximos}</p>
              <p className="text-xs" style={{ color: '#b7770d' }}>Próximos 7 días</p>
            </div>
          </div>
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: '#e6f5f4', border: '1px solid #b2dbd8' }}>
            <span className="text-2xl">🔧</span>
            <div>
              <p className="text-xl font-bold" style={{ color: '#2a807a' }}>{statsGlobales.reparar}</p>
              <p className="text-xs" style={{ color: '#2a807a' }}>Equipos para reparar</p>
            </div>
          </div>
        </div>

        {/* Botones de actividades */}
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#2d3a2e' }}>Seleccioná una actividad</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {actividades.map(act => (
            <Link key={act.slug} href={`/${act.slug}`}>
              <div
                className="relative rounded-2xl overflow-hidden cursor-pointer hover:opacity-95 transition-all hover:shadow-xl active:scale-95"
                style={{ backgroundColor: act.color, minHeight: 180 }}
              >
                {act.alertas > 0 && (
                  <span className="absolute top-3 right-3 z-10 bg-red-500 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow">
                    {act.alertas}
                  </span>
                )}
                <div className="flex items-center justify-center w-full h-full p-4" style={{ minHeight: 180 }}>
                  <Image
                    src={act.logo}
                    alt={act.nombre}
                    width={280}
                    height={160}
                    style={{ objectFit: 'contain', maxHeight: 150 }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Configuración anual — destacada */}
        {usuario.rol === 'admin' && (
          <Link href="/config">
            <div className="rounded-2xl p-5 flex items-center gap-4 mb-6 cursor-pointer" style={{ background: '#2d4a4a', color: 'white' }}>
              <span className="text-3xl">⚙️</span>
              <div>
                <p className="font-bold text-base">Configuración anual de fechas</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>Establecé cuándo empieza cada planilla para que el sistema calcule el calendario automáticamente</p>
              </div>
              <span className="ml-auto text-xl" style={{ color: 'rgba(255,255,255,0.4)' }}>→</span>
            </div>
          </Link>
        )}

        {/* Accesos rápidos */}
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#2d3a2e' }}>Accesos rápidos</h2>
        <div className="grid grid-cols-3 gap-3">
          <Link href="/inventario">
            <div className="rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow cursor-pointer" style={{ background: '#fff', border: '1px solid #ddd8cf' }}>
              <span className="text-2xl">🎽</span>
              <span className="text-sm font-medium" style={{ color: '#2d3a2e' }}>Inventario de Equipos</span>
            </div>
          </Link>
          <Link href="/biblioteca">
            <div className="rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow cursor-pointer" style={{ background: '#fff', border: '1px solid #ddd8cf' }}>
              <span className="text-2xl">📚</span>
              <span className="text-sm font-medium" style={{ color: '#2d3a2e' }}>Biblioteca Técnica</span>
            </div>
          </Link>
          {usuario.rol === 'admin' && (
            <Link href="/legales">
              <div className="rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow cursor-pointer" style={{ background: '#fff', border: '1px solid #ddd8cf' }}>
                <span className="text-2xl">🏛️</span>
                <span className="text-sm font-medium" style={{ color: '#2d3a2e' }}>Documentos Legales</span>
              </div>
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
