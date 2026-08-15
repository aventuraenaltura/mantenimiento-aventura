'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { PLANILLAS_INICIALES } from '@/lib/datos-iniciales'
import ExportarRegistros from '@/components/ExportarRegistros'

const ACTIVIDADES = [
  { slug: 'tirolesa', nombre: 'Tirolesa',          logo: '/logos/tirolesa.png',  color: '#F5C800' },
  { slug: 'arqueria', nombre: 'Arquería',           logo: '/logos/arqueria.png',  color: '#2d8a4e' },
  { slug: 'parque',   nombre: 'Parque Aéreo',       logo: '/logos/parque.png',    color: '#4FC3F7' },
  { slug: 'salon',    nombre: 'Aventura Escondida', logo: '/logos/escondida.png', color: '#e07820' },
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
      const meses: Record<string, number> = { diario: 0, semanal: 0, mensual: 1, trimestral: 3, semestral: 6, anual: 12 }
      const vence = new Date(inicio)
      vence.setMonth(vence.getMonth() + (meses[p.frecuencia] ?? 1))
      if (vence < hoy) alertas++
    }
    return alertas
  } catch { return 0 }
}

export default function HomePage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<{ nombre: string; rol: string } | null>(null)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [actividades, setActividades] = useState(ACTIVIDADES.map(a => ({ ...a, alertas: 0 })))
  const [stats, setStats] = useState({ vencidos: 0, proximos: 0, reparar: 0, totalPlanillas: 0 })

  const anios = Array.from({ length: new Date().getFullYear() - 2011 + 1 }, (_, i) => 2011 + i).reverse()

  useEffect(() => {
    const u = localStorage.getItem('usuario')
    if (!u) { router.push('/'); return }
    setUsuario(JSON.parse(u))
    setActividades(ACTIVIDADES.map(a => ({ ...a, alertas: calcularAlertas(a.slug) })))

    try {
      const fechasRaw = localStorage.getItem('fechas_planillas')
      const fechas: Record<string, string> = fechasRaw ? JSON.parse(fechasRaw) : {}
      const hoy = new Date()
      const en7dias = new Date(); en7dias.setDate(hoy.getDate() + 7)
      let vencidos = 0, proximos = 0
      const meses: Record<string, number> = { diario: 0, semanal: 0, mensual: 1, trimestral: 3, semestral: 6, anual: 12 }
      for (const p of PLANILLAS_INICIALES) {
        const fechaStr = fechas[p.codigo]
        if (!fechaStr) continue
        const inicio = new Date(fechaStr)
        const vence = new Date(inicio)
        vence.setMonth(vence.getMonth() + (meses[p.frecuencia] ?? 1))
        if (vence < hoy) vencidos++
        else if (vence <= en7dias) proximos++
      }
      const equiposRaw = localStorage.getItem('inv_equipos')
      const equipos = equiposRaw ? JSON.parse(equiposRaw) : []
      const reparar = equipos.filter((e: { ubicacion: string }) => e.ubicacion === 'para_reparar').length
      setStats({ vencidos, proximos, reparar, totalPlanillas: PLANILLAS_INICIALES.length })
    } catch { /* sin datos */ }
  }, [router])

  function logout() {
    localStorage.removeItem('usuario')
    router.push('/')
  }

  if (!usuario) return null

  const totalAlertas = actividades.reduce((s, a) => s + a.alertas, 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>

      {/* ── HERO ── */}
      <div className="relative w-full" style={{ height: 'clamp(220px, 40vw, 300px)' }}>
        <Image src="/bg-lago.jpg" alt="Vista aérea" fill
          style={{ objectFit: 'cover', objectPosition: 'center 40%' }} priority />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(13,158,150,0.55) 0%, rgba(10,30,40,0.80) 100%)' }} />

        {/* Navbar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 sm:px-8 sm:pt-5" style={{ zIndex: 10 }}>
          {/* Logo + año */}
          <div className="flex items-center gap-3">
            <Image src="/logos/aventura-en-altura.png" alt="Aventura en Altura" width={90} height={58}
              style={{ objectFit: 'contain', filter: 'brightness(0) invert(1) drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }} priority />
            <select value={anio} onChange={e => setAnio(Number(e.target.value))}
              className="rounded-lg px-2 py-1 text-xs sm:text-sm focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
              {anios.map(a => <option key={a} value={a} style={{ color: '#111' }}>{a}</option>)}
            </select>
          </div>

          {/* Usuario + logout */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* En desktop mostramos el nombre, en mobile solo el botón */}
            <div className="hidden sm:block text-right">
              <p className="text-white text-sm font-semibold" style={{ fontFamily: "'Montserrat', sans-serif" }}>{usuario.nombre}</p>
              <p className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.65)' }}>{usuario.rol}</p>
            </div>
            <button onClick={logout}
              className="text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>
              Salir
            </button>
          </div>
        </div>

        {/* Texto hero */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 sm:px-8 sm:pb-8" style={{ zIndex: 10 }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1 sm:mb-2"
            style={{ color: 'var(--c-yellow)', fontFamily: "'Montserrat', sans-serif", fontSize: 10 }}>
            PTATANKA SRL · VILLA CARLOS PAZ
          </p>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(20px, 5vw, 30px)', fontWeight: 900, color: 'white', letterSpacing: -0.5, lineHeight: 1.15 }}>
            Sistema de Mantenimiento
          </h1>
          <p className="hidden sm:block" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 6 }}>
            Complejo Aerosilla · Aventura en Altura
          </p>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4">
          {[
            { val: stats.totalPlanillas, label: 'Planillas',      color: 'var(--c-teal)' },
            { val: totalAlertas,         label: 'Alertas',         color: totalAlertas > 0 ? '#e53e3e' : 'var(--c-teal)' },
            { val: stats.proximos,       label: 'Próx. 7 días',    color: stats.proximos > 0 ? '#d97706' : 'var(--c-teal)' },
            { val: stats.reparar,        label: 'Para reparar',    color: stats.reparar > 0 ? '#d97706' : 'var(--c-teal)' },
          ].map(({ val, label, color }, i) => (
            <div key={i} className="flex flex-col items-center justify-center py-4 px-2 sm:py-6 sm:px-4"
              style={{ borderRight: (i === 0 || i === 2) ? '1px solid var(--border-light)' : i === 1 ? '1px solid var(--border-light)' : 'none',
                       borderBottom: i < 2 ? '1px solid var(--border-light)' : 'none' }}>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(28px, 6vw, 38px)', fontWeight: 900, color, lineHeight: 1 }}>{val}</p>
              <span style={{ display: 'block', width: 24, height: 3, background: 'var(--c-teal)', borderRadius: 2, margin: '6px auto 4px' }} />
              <p className="text-xs text-center" style={{ color: 'var(--text-muted)', fontSize: 11 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-10">

        {/* Actividades */}
        <div className="mb-8 sm:mb-10">
          <p className="section-label mb-1">ACTIVIDADES</p>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(18px, 4vw, 26px)', fontWeight: 800, color: 'var(--text-main)' }}>
            Seleccioná una actividad
          </h2>
          <span className="heading-line" />

          <div className="grid grid-cols-2 gap-3 mt-4 sm:gap-4 sm:mt-6">
            {actividades.map(act => (
              <Link key={act.slug} href={`/${act.slug}`}>
                <div className="relative rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-95 sm:hover:scale-[1.02] sm:hover:shadow-xl"
                  style={{ backgroundColor: act.color, boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
                  {act.alertas > 0 && (
                    <span className="absolute top-2 right-2 z-10 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                      {act.alertas}
                    </span>
                  )}
                  <div className="flex items-center justify-center w-full p-3 sm:p-4" style={{ minHeight: 'clamp(120px, 25vw, 180px)' }}>
                    <Image src={act.logo} alt={act.nombre} width={280} height={160}
                      style={{ objectFit: 'contain', maxHeight: 'clamp(90px, 20vw, 150px)', width: '100%' }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Gestión */}
        <div className="mb-8 sm:mb-10">
          <p className="section-label mb-1">GESTIÓN</p>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(18px, 4vw, 26px)', fontWeight: 800, color: 'var(--text-main)' }}>
            Panel de equipos y stock
          </h2>
          <span className="heading-line" />

          <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 mt-4 sm:gap-4 sm:mt-6">
            {/* Equipo técnico */}
            <Link href="/equipo-tecnico" className="sm:col-span-2">
              <div className="rounded-2xl p-5 flex items-center gap-4 cursor-pointer"
                style={{ background: 'var(--c-teal)', boxShadow: '0 4px 18px rgba(13,158,150,0.3)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.2)' }}>🎽</div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 17, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>
                    Equipo Técnico
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 3 }}>
                    Stock de arneses, poleas y accesorios
                  </p>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 20, flexShrink: 0 }}>→</span>
              </div>
            </Link>

            {/* Fichas */}
            <Link href="/fichas">
              <div className="rounded-2xl p-5 flex items-center gap-4 sm:flex-col sm:items-start sm:justify-between cursor-pointer"
                style={{ background: 'var(--c-yellow)', boxShadow: '0 4px 18px rgba(245,200,0,0.25)', minHeight: 90 }}>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: 'rgba(0,0,0,0.08)' }}>📋</div>
                <div className="flex-1 sm:flex-none">
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 15, fontWeight: 800, color: '#1a1a1a' }}>
                    Fichas de equipo
                  </p>
                  <p style={{ color: 'rgba(0,0,0,0.55)', fontSize: 12, marginTop: 2 }}>
                    Historial por equipo
                  </p>
                </div>
                <span className="sm:hidden" style={{ color: 'rgba(0,0,0,0.3)', fontSize: 20 }}>→</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Config + Accesos */}
        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-4">

          {usuario.rol === 'admin' && (
            <div className="sm:col-span-2 flex flex-col gap-3">
              <Link href="/config">
                <div className="rounded-2xl p-4 sm:p-5 flex items-center gap-4 cursor-pointer"
                  style={{ background: '#1a202c', color: 'white' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.1)' }}>⚙️</div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14 }}>
                      Configuración anual de fechas
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>
                      Calendario de mantenimientos automático
                    </p>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18, flexShrink: 0 }}>→</span>
                </div>
              </Link>
              <Link href="/usuarios">
                <div className="rounded-2xl p-4 sm:p-5 flex items-center gap-4 cursor-pointer"
                  style={{ background: '#4a1d96', color: 'white' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.15)' }}>👥</div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14 }}>
                      Gestión de usuarios
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>
                      Admin · Ingeniero · Colaborador
                    </p>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18, flexShrink: 0 }}>→</span>
                </div>
              </Link>
            </div>
          )}

          <div className={`flex flex-col gap-3 ${usuario.rol !== 'admin' ? 'sm:col-span-3' : ''}`}>
            <Link href="/biblioteca">
              <div className="rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
                style={{ background: 'white', border: '1px solid var(--border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: 'var(--c-teal-bg)' }}>📚</div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--text-main)' }}>Biblioteca Técnica</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Manuales y documentación</p>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>→</span>
              </div>
            </Link>
            {usuario.rol === 'admin' && (
              <Link href="/legales">
                <div className="rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
                  style={{ background: 'white', border: '1px solid var(--border)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'var(--c-teal-bg)' }}>🏛️</div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--text-main)' }}>Doc. Legales</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Habilitaciones y permisos</p>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>→</span>
                </div>
              </Link>
            )}
            {usuario.rol === 'admin' && <ExportarRegistros />}
          </div>

        </div>

      </main>

      {/* ── FOOTER ── */}
      <footer className="px-4 py-5 mt-6 sm:px-8" style={{ background: '#1a202c', color: 'rgba(255,255,255,0.4)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <p style={{ fontSize: 11 }}>© 2026 Ptatanka SRL · Aventura en Altura · Villa Carlos Paz, Córdoba</p>
          <p style={{ fontSize: 11 }}>Sistema de Mantenimiento v2.0</p>
        </div>
      </footer>
    </div>
  )
}
