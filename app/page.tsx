'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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
    if (email === 'admin@aventura.com' && password === 'admin123') {
      localStorage.setItem('usuario', JSON.stringify({ nombre: 'Administrador', rol: 'admin', email }))
      router.push('/home')
    } else if (email === 'empleado@aventura.com' && password === 'emp123') {
      localStorage.setItem('usuario', JSON.stringify({ nombre: 'Empleado', rol: 'empleado', email }))
      router.push('/home')
    } else {
      setError('Email o contraseña incorrectos')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f0ede6' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/logos/aventura-en-altura.png"
            alt="Aventura en Altura"
            width={200}
            height={140}
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>

        <p className="text-center text-sm mb-6" style={{ color: '#718096' }}>Sistema de Mantenimiento</p>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-sm p-8 space-y-4" style={{ border: '1px solid #ddd8cf' }}>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#4a5568' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
              style={{ border: '1px solid #ddd8cf', background: '#faf8f4', color: '#1c2533' }}
              placeholder="tu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#4a5568' }}>Contraseña</label>
            <div className="relative">
              <input
                type={verPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none pr-12"
                style={{ border: '1px solid #ddd8cf', background: '#faf8f4', color: '#1c2533' }}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setVerPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg"
                style={{ color: '#718096', lineHeight: 1 }}
                tabIndex={-1}
              >
                {verPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {error && <p className="text-sm" style={{ color: '#c0392b' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            style={{ background: '#3a9e96' }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

      </div>
    </div>
  )
}
