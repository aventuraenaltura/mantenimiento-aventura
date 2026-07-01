'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUsuarios, saveUsuarios, getSesion, type Usuario, type Rol } from '@/lib/usuarios'

const ROL_INFO: Record<Rol, { label: string; color: string; desc: string }> = {
  admin:       { label: 'Admin',        color: '#0d9e96', desc: 'Acceso total: usuarios, stock inicial, configuración' },
  ingeniero:   { label: 'Ingeniero',    color: '#7c3aed', desc: 'Puede registrar reparaciones, agregar eventos, ver fichas' },
  colaborador: { label: 'Colaborador',  color: '#6b7280', desc: 'Solo lectura: puede ver stock y planillas, no puede modificar' },
}

const FORM_VACIO = { nombre: '', email: '', password: '', rol: 'colaborador' as Rol, activo: true }

export default function UsuariosPage() {
  const router = useRouter()
  const [sesion, setSesion] = useState<{ nombre: string; rol: Rol } | null>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [verPass, setVerPass] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  useEffect(() => {
    const s = getSesion()
    if (!s || s.rol !== 'admin') { router.push('/home'); return }
    setSesion(s)
    setUsuarios(getUsuarios())
  }, [router])

  function abrirNuevo() {
    setForm(FORM_VACIO)
    setEditandoId(null)
    setError('')
    setMostrarForm(true)
  }

  function abrirEditar(u: Usuario) {
    setForm({ nombre: u.nombre, email: u.email, password: u.password, rol: u.rol, activo: u.activo })
    setEditandoId(u.id)
    setError('')
    setMostrarForm(true)
  }

  function guardar() {
    if (!form.nombre.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Completá todos los campos')
      return
    }
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailReg.test(form.email)) { setError('Email inválido'); return }

    const lista = [...usuarios]
    if (editandoId) {
      const idx = lista.findIndex(u => u.id === editandoId)
      if (idx >= 0) lista[idx] = { ...lista[idx], ...form }
    } else {
      // verificar email único
      if (lista.some(u => u.email.toLowerCase() === form.email.toLowerCase())) {
        setError('Ya existe un usuario con ese email')
        return
      }
      lista.push({
        id: `user-${Date.now()}`,
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        rol: form.rol,
        activo: form.activo,
        creadoEn: new Date().toISOString().split('T')[0],
      })
    }
    saveUsuarios(lista)
    setUsuarios(lista)
    setMostrarForm(false)
    setExito(editandoId ? 'Usuario actualizado ✓' : 'Usuario creado ✓')
    setTimeout(() => setExito(''), 3000)
  }

  function toggleActivo(id: string) {
    const lista = usuarios.map(u => u.id === id ? { ...u, activo: !u.activo } : u)
    saveUsuarios(lista)
    setUsuarios(lista)
  }

  if (!sesion) return null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      {/* Header */}
      <div style={{ background: '#1a202c', padding: '16px 24px' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/home" className="text-white/60 hover:text-white text-sm">← Inicio</Link>
            <span className="text-white/30">|</span>
            <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, color: 'white', fontSize: 18 }}>
              👥 Gestión de Usuarios
            </h1>
          </div>
          <button onClick={abrirNuevo}
            className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl"
            style={{ background: 'var(--c-teal)', color: 'white' }}>
            + Nuevo usuario
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {exito && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold"
            style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a' }}>
            ✅ {exito}
          </div>
        )}

        {/* Leyenda de roles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {Object.entries(ROL_INFO).map(([rol, info]) => (
            <div key={rol} className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid var(--border)' }}>
              <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-2" style={{ background: info.color + '20', color: info.color }}>
                {info.label}
              </span>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{info.desc}</p>
            </div>
          ))}
        </div>

        {/* Lista de usuarios */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--border)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--text-main)' }}>
              {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}
            </p>
          </div>

          {usuarios.map((u, i) => (
            <div key={u.id} className="flex items-center gap-4 px-5 py-4"
              style={{ borderBottom: i < usuarios.length - 1 ? '1px solid var(--border-light)' : 'none', opacity: u.activo ? 1 : 0.5 }}>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: ROL_INFO[u.rol]?.color ?? '#6b7280' }}>
                {u.nombre.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--text-main)' }}>
                    {u.nombre}
                  </p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: (ROL_INFO[u.rol]?.color ?? '#6b7280') + '20', color: ROL_INFO[u.rol]?.color ?? '#6b7280' }}>
                    {ROL_INFO[u.rol]?.label ?? u.rol}
                  </span>
                  {!u.activo && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">Inactivo</span>}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{u.email}</p>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => abrirEditar(u)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: 'var(--bg-subtle)', color: 'var(--text-sub)', border: '1px solid var(--border)' }}>
                  Editar
                </button>
                {u.id !== 'admin-1' && (
                  <button onClick={() => toggleActivo(u.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: u.activo ? '#fff5f5' : '#f0fdf4', color: u.activo ? '#dc2626' : '#16a34a', border: `1px solid ${u.activo ? '#fecaca' : '#86efac'}` }}>
                    {u.activo ? 'Desactivar' : 'Activar'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal crear/editar */}
      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            <div className="px-6 py-4 flex items-center justify-between" style={{ background: 'var(--c-teal)' }}>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, color: 'white', fontSize: 16 }}>
                {editandoId ? 'Editar usuario' : 'Nuevo usuario'}
              </p>
              <button onClick={() => setMostrarForm(false)} className="text-white/70 hover:text-white text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#fff5f5', border: '1px solid #fecaca', color: '#dc2626' }}>
                  ⚠️ {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-sub)' }}>Nombre completo</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  style={{ border: '1.5px solid var(--border)', background: 'var(--bg-subtle)' }}
                  placeholder="Ej: Juan García" />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-sub)' }}>Email</label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  type="email"
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  style={{ border: '1.5px solid var(--border)', background: 'var(--bg-subtle)' }}
                  placeholder="usuario@email.com" />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-sub)' }}>Contraseña</label>
                <div className="relative">
                  <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    type={verPass ? 'text' : 'password'}
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none pr-10"
                    style={{ border: '1.5px solid var(--border)', background: 'var(--bg-subtle)' }}
                    placeholder="Mínimo 6 caracteres" />
                  <button type="button" onClick={() => setVerPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base"
                    style={{ color: 'var(--text-muted)' }}>
                    {verPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-sub)' }}>Rol de acceso</label>
                <div className="space-y-2">
                  {(Object.entries(ROL_INFO) as [Rol, typeof ROL_INFO[Rol]][]).map(([rol, info]) => (
                    <label key={rol} className="flex items-start gap-3 p-3 rounded-xl cursor-pointer"
                      style={{ border: `1.5px solid ${form.rol === rol ? info.color : 'var(--border)'}`, background: form.rol === rol ? info.color + '10' : 'white' }}>
                      <input type="radio" name="rol" value={rol} checked={form.rol === rol}
                        onChange={() => setForm({ ...form, rol })} className="mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold" style={{ color: info.color }}>{info.label}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{info.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {editandoId && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} />
                  <span className="text-sm" style={{ color: 'var(--text-sub)' }}>Usuario activo</span>
                </label>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setMostrarForm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                  Cancelar
                </button>
                <button onClick={guardar}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'var(--c-teal)' }}>
                  {editandoId ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
