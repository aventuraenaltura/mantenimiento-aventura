'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { loginUsuarioAsync } from '@/lib/usuarios'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verPassword, setVerPassword] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const sesion = await loginUsuarioAsync(email, password)
    if (sesion) {
      localStorage.setItem('usuario', JSON.stringify(sesion))
      router.push('/home')
    } else {
      setError('Email o contraseña incorrectos, o usuario inactivo')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-page)' }}>

      {/* Panel izquierdo — teal con imagen */}
      <div className="hidden md:flex flex-col justify-between w-2/5 p-10"
        style={{ background: 'linear-gradient(160deg, #0d9e96 0%, #0a7070 100%)' }}>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-8" style={{ color: 'var(--c-yellow)', fontFamily: "'Montserrat', sans-serif" }}>
            AVENTURA EN ALTURA
          </p>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 32, fontWeight: 900, color: 'white', lineHeight: 1.2 }}>
            Sistema de<br />Mantenimiento
          </h1>
          <span style={{ display: 'block', width: 48, height: 3, background: 'var(--c-yellow)', borderRadius: 2, margin: '18px 0' }} />
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6 }}>
            Ptatanka SRL · Complejo Aerosilla<br />Villa Carlos Paz, Córdoba
          </p>
        </div>
        <div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { n: '4', l: 'Actividades' },
              { n: '100+', l: 'Equipos' },
              { n: '12', l: 'Controles' },
              { n: '365', l: 'Días al año' },
            ].map(({ n, l }) => (
              <div key={l} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 24, fontWeight: 900, color: 'var(--c-yellow)' }}>{n}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{l}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>© 2026 Ptatanka SRL</p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex flex-1 items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/logos/aventura-en-altura.png"
              alt="Aventura en Altura"
              width={160}
              height={110}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>

          <p className="section-label text-center mb-2">INGRESÁ TU CUENTA</p>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text-main)', textAlign: 'center', marginBottom: 24 }}>
            Bienvenido
          </h2>

          <form onSubmit={handleLogin} className="bg-white rounded-2xl p-8 space-y-4" style={{ border: '1px solid var(--border)', boxShadow: '0 4px 18px rgba(0,0,0,0.06)' }}>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-sub)', fontFamily: "'Montserrat', sans-serif" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{ border: '1.5px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-main)' }}
                placeholder="tu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-sub)', fontFamily: "'Montserrat', sans-serif" }}>Contraseña</label>
              <div className="relative">
                <input
                  type={verPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none pr-12"
                  style={{ border: '1.5px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-main)' }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setVerPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lg"
                  style={{ color: 'var(--text-muted)', lineHeight: 1 }}
                  tabIndex={-1}
                >
                  {verPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#fff5f5', border: '1px solid #fed7d7', color: '#c53030' }}>
                ⚠️ {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
              style={{ background: 'var(--c-teal)', color: 'white', fontFamily: "'Montserrat', sans-serif", fontSize: 15 }}
            >
              {loading ? 'Ingresando...' : 'Ingresar →'}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
