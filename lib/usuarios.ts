// Sistema de usuarios — Supabase como fuente de verdad
import { supabase } from './supabase'

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

const INICIALES: Usuario[] = [
  { id: 'admin-1', nombre: 'Administrador', email: 'aventuraenaltura@gmail.com', password: 'admin123', rol: 'admin', activo: true, creadoEn: '2026-01-01' },
  { id: 'emp-1', nombre: 'Mantenimiento', email: 'mantenimientogral@gmail.com', password: 'mant123', rol: 'colaborador', activo: true, creadoEn: '2026-01-01' },
]

// ── Cargar usuarios desde Supabase (con fallback a localStorage) ──────
export async function getUsuariosAsync(): Promise<Usuario[]> {
  try {
    const { data, error } = await supabase.from('usuarios_sistema').select('*').order('creado_en')
    if (!error && data && data.length > 0) {
      const users = data.map((u: Record<string, unknown>) => ({
        id: u.id as string,
        nombre: u.nombre as string,
        email: u.email as string,
        password: u.password as string,
        rol: u.rol as Rol,
        activo: u.activo as boolean,
        creadoEn: u.creado_en as string,
      }))
      localStorage.setItem('usuarios_sistema', JSON.stringify(users))
      return users
    }
  } catch { /* fallback */ }
  // Fallback localStorage
  const raw = localStorage.getItem('usuarios_sistema')
  if (raw) return JSON.parse(raw)
  return INICIALES
}

// Versión sync para compatibilidad (usa caché localStorage)
export function getUsuarios(): Usuario[] {
  try {
    const raw = localStorage.getItem('usuarios_sistema')
    if (!raw) {
      localStorage.setItem('usuarios_sistema', JSON.stringify(INICIALES))
      return INICIALES
    }
    return JSON.parse(raw)
  } catch { return INICIALES }
}

// ── Guardar usuarios en Supabase + localStorage ───────────────────────
export async function saveUsuarios(usuarios: Usuario[]): Promise<void> {
  localStorage.setItem('usuarios_sistema', JSON.stringify(usuarios))
  try {
    // Upsert todos en Supabase
    const rows = usuarios.map(u => ({
      id: u.id, nombre: u.nombre, email: u.email,
      password: u.password, rol: u.rol, activo: u.activo,
      creado_en: u.creadoEn,
    }))
    await supabase.from('usuarios_sistema').upsert(rows, { onConflict: 'id' })
  } catch { /* localStorage ya guardado */ }
}

// ── Login: verifica en Supabase primero, luego localStorage ──────────
export async function loginUsuarioAsync(email: string, password: string): Promise<UsuarioSesion | null> {
  const usuarios = await getUsuariosAsync()
  const u = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.activo)
  if (!u) return null
  return { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol }
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
    if (!parsed.rol) parsed.rol = 'colaborador'
    return parsed
  } catch { return null }
}

export function puedeEditar(rol: Rol): boolean { return rol === 'admin' || rol === 'ingeniero' }
export function esAdmin(rol: Rol): boolean { return rol === 'admin' }
