// Sistema de usuarios — stored en localStorage + sync Supabase opcional

export type Rol = 'admin' | 'ingeniero' | 'colaborador'

export interface Usuario {
  id: string
  nombre: string
  email: string
  password: string
  rol: Rol
  activo: boolean
  creadoEn: string
}

export interface UsuarioSesion {
  id: string
  nombre: string
  email: string
  rol: Rol
}

const KEY = 'usuarios_sistema'

const INICIALES: Usuario[] = [
  {
    id: 'admin-1',
    nombre: 'Administrador',
    email: 'aventuraenaltura@gmail.com',
    password: 'admin123',
    rol: 'admin',
    activo: true,
    creadoEn: '2026-01-01',
  },
  {
    id: 'emp-1',
    nombre: 'Mantenimiento',
    email: 'mantenimientogral@gmail.com',
    password: 'mant123',
    rol: 'colaborador',
    activo: true,
    creadoEn: '2026-01-01',
  },
]

export function getUsuarios(): Usuario[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(INICIALES))
      return INICIALES
    }
    return JSON.parse(raw)
  } catch {
    return INICIALES
  }
}

export function saveUsuarios(usuarios: Usuario[]): void {
  localStorage.setItem(KEY, JSON.stringify(usuarios))
}

export function loginUsuario(email: string, password: string): UsuarioSesion | null {
  const usuarios = getUsuarios()
  const u = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.activo)
  if (!u) return null
  return { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol }
}

export function getSesion(): UsuarioSesion | null {
  try {
    const raw = localStorage.getItem('usuario')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // compatibilidad con sesiones viejas que no tienen rol
    if (!parsed.rol) parsed.rol = 'colaborador'
    return parsed
  } catch {
    return null
  }
}

export function puedeEditar(rol: Rol): boolean {
  return rol === 'admin' || rol === 'ingeniero'
}

export function esAdmin(rol: Rol): boolean {
  return rol === 'admin'
}
