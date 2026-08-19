'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { PLANILLAS_INICIALES } from '@/lib/datos-iniciales'
import { fmtFecha } from '@/lib/fecha'
import LibroIngeniero from '@/components/LibroIngeniero'
import { getFechaInicio, getProximaFechaDesdeConfig, getFechasDelMes } from '@/lib/config'
import { cargarConfigFechas, guardarConfigFecha } from '@/lib/db'
import type { Planilla } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

interface ArchivoAdjunto {
  nombre: string
  data: string
}

interface Ejecucion {
  id: string
  planilla_id: string
  fecha: string
  proxima_fecha: string
  ejecutado_por: string
  controlo?: string
  ingeniero?: string
  tiempo_min?: number
  repuestos?: string
  observaciones?: string
  archivo_nombre?: string
  archivo_data?: string   // legacy base64
  archivo_url?: string    // nuevo: URL de Supabase Storage
  archivos_agrimensor?: ArchivoAdjunto[]
}

interface Props {
  actividadId: string
  nombre: string
  color: string
  icono: string
  logo: string
}

function colorEstadoFecha(proximaFecha: string): 'rojo' | 'naranja' | 'verde' {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const proxima = new Date(proximaFecha)
  const diff = (proxima.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  if (diff < 0) return 'rojo'
  if (diff <= 7) return 'naranja'
  return 'verde'
}

function calcularProximaFecha(fechaEjecucion: string, frecuencia: string): string {
  const fecha = new Date(fechaEjecucion)
  switch (frecuencia) {
    case 'diaria':      fecha.setDate(fecha.getDate() + 1); break
    case 'semanal':     fecha.setDate(fecha.getDate() + 7); break
    case 'mensual':     fecha.setMonth(fecha.getMonth() + 1); break
    case 'trimestral':  fecha.setMonth(fecha.getMonth() + 3); break
    case 'semestral':   fecha.setMonth(fecha.getMonth() + 6); break
    case 'anual':       fecha.setFullYear(fecha.getFullYear() + 1); break
  }
  return fecha.toISOString().split('T')[0]
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const FREC_LABEL: Record<string, string> = {
  diaria: 'Diaria', semanal: 'Semanal', mensual: 'Mensual', bimestral: 'Bimestral',
  trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual',
}

export default function PanelActividad({ actividadId, nombre, color, icono, logo }: Props) {
  const planillasBase = PLANILLAS_INICIALES.filter(p => p.actividad_id === actividadId) as unknown as Planilla[]
  const [planillaSeleccionada, setPlanillaSeleccionada] = useState<Planilla | null>(null)
  const refDetalle = useRef<HTMLDivElement>(null)

  function seleccionarPlanilla(p: Planilla | null) {
    setPlanillaSeleccionada(p)
    setMostrarFormulario(false)
    setMostrarAdjuntarOriginal(false)
    setMostrarHistorial(false)
    setExtrasAbierto(null)
    if (p) setTimeout(() => refDetalle.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarPDFMes, setMostrarPDFMes] = useState(false)
  const [ejecuciones, setEjecuciones] = useState<Ejecucion[]>([])
  const [form, setForm] = useState(() => {
    const defaults = actividadId === 'tirolesa'
      ? { ingeniero: 'Ing. Luciano Capdevila', controlo: 'Lic. Juan Vanadía' }
      : { ingeniero: '', controlo: '' }
    return { fecha: new Date().toISOString().split('T')[0], nombre: '', tiempo: '', repuestos: '', obs: '', ...defaults }
  })

  // Cargar ingeniero guardado al montar
  useEffect(() => {
    cargarConfigFechas().then(config => {
      if (config?.['ingeniero_cargo']) {
        setForm(f => ({ ...f, ingeniero: config['ingeniero_cargo'] }))
      }
    })
  }, [])
  const [archivoFirmado, setArchivoFirmado] = useState<File | null>(null)
  const [archivosAgrimensor, setArchivosAgrimensor] = useState<File[]>([])
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  const [editandoEjecucion, setEditandoEjecucion] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null)
  const [configCargada, setConfigCargada] = useState(false)
  const [proximasFechas, setProximasFechas] = useState<Record<string, string>>({})
  const [archivosOriginales, setArchivosOriginales] = useState<Record<string, string>>({}) // codigo -> dataURL
  const [mostrarAdjuntarOriginal, setMostrarAdjuntarOriginal] = useState(false)
  const [extrasAbierto, setExtrasAbierto] = useState<string | null>(null)
  const [anotaciones, setAnotaciones] = useState<Record<string, string>>({})
  const [tutoriales, setTutoriales] = useState<Record<string, { tipo: 'url' | 'file'; valor: string }>>({})
  const [configTutorialAbierto, setConfigTutorialAbierto] = useState<string | null>(null)
  const [tutorialViendose, setTutorialViendose] = useState<string | null>(null)
  const [formTutorial, setFormTutorial] = useState<{ tipo: 'url' | 'file'; valor: string; urlInput: string }>({ tipo: 'url', valor: '', urlInput: '' })
  const [esAdmin, setEsAdmin] = useState(false)
  const [toastTutorial, setToastTutorial] = useState<string | null>(null)
  const [planillaParaImprimir, setPlanillaParaImprimir] = useState<Planilla | null>(null)
  const [edicionesPlanillas, setEdicionesPlanillas] = useState<Record<string, Partial<Planilla>>>({})
  const [formEdicion, setFormEdicion] = useState<{ nombre: string; descripcion: string; frecuencia: string; tareas: string; materiales: string; instructivo: string } | null>(null)
  const [tabConfig, setTabConfig] = useState<'planilla' | 'tutorial' | 'notas'>('planilla')

  // Aplicar ediciones guardadas sobre los datos base
  const planillas = planillasBase.map(p => ({ ...p, ...edicionesPlanillas[p.codigo] }))

  const hoy = new Date()

  // Cargar config y archivos originales desde localStorage (client-only)
  useEffect(() => {
    const fechas: Record<string, string> = {}
    planillas.forEach(p => {
      const inicio = getFechaInicio(p.codigo)
      if (inicio) {
        fechas[p.codigo] = getProximaFechaDesdeConfig(inicio, p.frecuencia)
      }
    })
    setProximasFechas(fechas)
    setConfigCargada(true)

    // Cargar ejecuciones guardadas
    const rawEj = localStorage.getItem(`ejecuciones_${actividadId}`)
    if (rawEj) setEjecuciones(JSON.parse(rawEj))

    // Cargar archivos originales guardados
    const raw = localStorage.getItem(`archivos_originales_${actividadId}`)
    if (raw) setArchivosOriginales(JSON.parse(raw))

    // Cargar anotaciones extras
    const rawAn = localStorage.getItem(`anotaciones_${actividadId}`)
    if (rawAn) setAnotaciones(JSON.parse(rawAn))

    // Cargar tutoriales
    const rawTut = localStorage.getItem(`tutoriales_${actividadId}`)
    if (rawTut) setTutoriales(JSON.parse(rawTut))

    // Cargar ediciones de planillas
    const rawEd = localStorage.getItem(`ediciones_planillas_${actividadId}`)
    if (rawEd) setEdicionesPlanillas(JSON.parse(rawEd))

    // Detectar rol
    try {
      const u = JSON.parse(localStorage.getItem('usuario') || '{}')
      setEsAdmin(u.rol === 'admin')
    } catch {}
  }, [])

  // Ruta estática: public/planillas/MP00-001.pdf (o .jpg/.png)
  function urlPlanilla(codigo: string): string | null {
    // Devuelve la primera extensión encontrada — en runtime el browser intentará cargarla
    // Usamos pdf como principal; si no existe, el servidor devuelve 404 y se muestra el panel de subida
    return `/planillas/${codigo}.pdf`
  }

  function guardarArchivoOriginal(codigo: string, file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const nuevos = { ...archivosOriginales, [codigo]: dataUrl }
      setArchivosOriginales(nuevos)
      localStorage.setItem(`archivos_originales_${actividadId}`, JSON.stringify(nuevos))
    }
    reader.readAsDataURL(file)
  }

  function abrirPlanilla(codigo: string) {
    // Primero intenta la carpeta pública, luego el archivo subido desde browser
    const urlEstatica = urlPlanilla(codigo)
    // Abrir en nueva pestaña — si el archivo existe se muestra, si no el browser mostrará error
    window.open(urlEstatica!, '_blank')
  }

  function abrirEdicionPlanilla(p: Planilla) {
    setFormEdicion({
      nombre:      p.nombre,
      descripcion: p.descripcion || '',
      frecuencia:  p.frecuencia,
      tareas:      p.tareas.join('\n'),
      materiales:  p.materiales.join('\n'),
      instructivo: p.instructivo || '',
    })
  }

  function guardarEdicionPlanilla(codigo: string) {
    if (!formEdicion) return
    const edicion: Partial<Planilla> = {
      nombre:      formEdicion.nombre.trim(),
      descripcion: formEdicion.descripcion.trim(),
      frecuencia:  formEdicion.frecuencia as Planilla['frecuencia'],
      tareas:      formEdicion.tareas.split('\n').map(t => t.trim()).filter(Boolean),
      materiales:  formEdicion.materiales.split('\n').map(m => m.trim()).filter(Boolean),
      instructivo: formEdicion.instructivo.trim(),
    }
    const nuevas = { ...edicionesPlanillas, [codigo]: edicion }
    setEdicionesPlanillas(nuevas)
    localStorage.setItem(`ediciones_planillas_${actividadId}`, JSON.stringify(nuevas))
    setFormEdicion(null)
  }

  function resetearPlanilla(codigo: string) {
    const nuevas = { ...edicionesPlanillas }
    delete nuevas[codigo]
    setEdicionesPlanillas(nuevas)
    localStorage.setItem(`ediciones_planillas_${actividadId}`, JSON.stringify(nuevas))
    // Reiniciar form con datos originales
    const original = planillasBase.find(p => p.codigo === codigo)
    if (original) abrirEdicionPlanilla(original)
  }

  function guardarAnotacion(codigo: string, texto: string) {
    const nuevas = { ...anotaciones, [codigo]: texto }
    setAnotaciones(nuevas)
    localStorage.setItem(`anotaciones_${actividadId}`, JSON.stringify(nuevas))
  }

  function guardarTutorial(codigo: string, datos: { tipo: 'url' | 'file'; valor: string }) {
    const nuevos = { ...tutoriales, [codigo]: datos }
    setTutoriales(nuevos)
    localStorage.setItem(`tutoriales_${actividadId}`, JSON.stringify(nuevos))
  }

  function borrarTutorial(codigo: string) {
    const nuevos = { ...tutoriales }
    delete nuevos[codigo]
    setTutoriales(nuevos)
    localStorage.setItem(`tutoriales_${actividadId}`, JSON.stringify(nuevos))
  }

  function getYouTubeEmbed(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    if (match) return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`
    return null
  }

  function abrirConfigTutorial(codigo: string) {
    const tut = tutoriales[codigo]
    setFormTutorial({ tipo: tut?.tipo ?? 'url', valor: tut?.tipo === 'file' ? tut.valor : '', urlInput: tut?.tipo === 'url' ? tut.valor : '' })
    const p = planillas.find(x => x.codigo === codigo)
    if (p) abrirEdicionPlanilla(p)
    setTabConfig('planilla')
    setConfigTutorialAbierto(codigo)
  }

  function guardarFormTutorial(codigo: string) {
    if (formTutorial.tipo === 'url' && formTutorial.urlInput.trim()) {
      guardarTutorial(codigo, { tipo: 'url', valor: formTutorial.urlInput.trim() })
    } else if (formTutorial.tipo === 'file' && formTutorial.valor) {
      guardarTutorial(codigo, { tipo: 'file', valor: formTutorial.valor })
    }
    setConfigTutorialAbierto(null)
  }

  function cargarArchivoTutorial(file: File) {
    const reader = new FileReader()
    reader.onload = () => setFormTutorial(f => ({ ...f, tipo: 'file', valor: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const ARCHIVOS_PLANILLAS: Record<string, string> = {
    'MP00-001': '/planillas/MP00-001 Senderos (diaria).pdf',
    'MP01-001': '/planillas/MP01-001 Bases Anclaje Cables.pdf',
    'MP01-002': '/planillas/MP01-002 Freno Plataforma.pdf',
    'MP01-003': '/planillas/MP01-003 Bases y Anclajes de Cables.pdf',
    'MP01-004': '/planillas/MP01-004 Equipo de vuelo.pdf',
    'MP01-005': '/planillas/MP01-005 Cables.pdf',
    'MP01-006': '/planillas/MP01-006 Anclaje Cables.pdf',
    'MP20-007': '/planillas/MP20-007 Plataforma de vuelo.pdf',
    'MP20-008': '/planillas/MP20-008 Barandas Senderos.pdf',
    'MP20-009': '/planillas/MP20-009 Plataformas.pdf',
    'MP20-010': '/planillas/MP20-010 Baranda de Senderos.pdf',
    'MP20-011': '/planillas/MP20-011 Plataformas de Vuelo.pdf',
  }

  function abrirArchivoOriginal(codigo: string) {
    const archivo = ARCHIVOS_PLANILLAS[codigo]
    if (archivo) {
      window.open(archivo, '_blank')
    } else {
      setToastTutorial('Planilla Excel no disponible para este mantenimiento')
      setTimeout(() => setToastTutorial(null), 3500)
    }
  }

  function getProximaFecha(p: Planilla): string {
    // Prioridad: última ejecución registrada > config > demo
    const ej = ejecuciones.filter(e => e.planilla_id === p.codigo).sort((a, b) => b.fecha.localeCompare(a.fecha))[0]
    if (ej) return ej.proxima_fecha
    if (proximasFechas[p.codigo]) return proximasFechas[p.codigo]
    // Demo sin config: simular variedad de estados
    const base = new Date()
    if (p.frecuencia === 'diaria') base.setDate(base.getDate() - 1)
    else if (p.frecuencia === 'semanal') base.setDate(base.getDate() + 5)
    else base.setDate(base.getDate() + 20)
    return base.toISOString().split('T')[0]
  }

  // Planillas programadas para el mes actual
  function getPlanillasMes() {
    const mes = hoy.getMonth()
    const anio = hoy.getFullYear()
    const resultado: { planilla: Planilla; fechas: string[] }[] = []
    planillas.forEach(p => {
      const inicio = getFechaInicio(p.codigo)
      if (inicio) {
        const fechas = getFechasDelMes(inicio, p.frecuencia, anio, mes)
        if (fechas.length > 0) resultado.push({ planilla: p, fechas })
      } else {
        // Sin config, igual aparece con fecha próxima estimada
        const proxima = getProximaFecha(p)
        const d = new Date(proxima)
        if (d.getMonth() === mes && d.getFullYear() === anio) {
          resultado.push({ planilla: p, fechas: [proxima] })
        }
      }
    })
    return resultado
  }

  function leerArchivo(file: File): Promise<ArchivoAdjunto> {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve({ nombre: file.name, data: reader.result as string })
      reader.onerror = () => resolve({ nombre: file.name, data: '' })
      reader.readAsDataURL(file)
    })
  }

  async function subirArchivoAStorage(file: File, carpeta: string, idx: number = 0): Promise<{ url: string; nombre: string } | null> {
    try {
      const nombreArchivo = `${carpeta}/${Date.now()}-${idx}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

      // Timeout de 20 segundos — si Supabase no responde, usamos fallback base64
      const uploadPromise = supabase.storage
        .from('planillas-firmadas')
        .upload(nombreArchivo, file, { upsert: true })

      const timeoutPromise = new Promise<{ data: null; error: Error }>(resolve =>
        setTimeout(() => resolve({ data: null, error: new Error('Timeout') }), 20000)
      )

      const { error } = await Promise.race([uploadPromise, timeoutPromise])
      if (error) {
        console.error('Supabase upload error:', JSON.stringify(error))
        return null
      }
      const { data: urlData } = supabase.storage
        .from('planillas-firmadas')
        .getPublicUrl(nombreArchivo)
      return { url: urlData.publicUrl, nombre: file.name }
    } catch (err) {
      console.error('Error en upload:', err)
      return null
    }
  }

  async function guardarEjecucion() {
    if (!planillaSeleccionada || !form.nombre) return
    setGuardando(true)
    setErrorGuardar(null)
    try {
    const proxima = calcularProximaFecha(form.fecha, planillaSeleccionada.frecuencia)
    const carpeta = `${actividadId}/${planillaSeleccionada.codigo}`

    // Subir PDF firmado a Supabase Storage
    let firmadoUrl: string | undefined
    let firmadoNombre: string | undefined
    let archivoFalló = false
    if (archivoFirmado) {
      const resultado = await subirArchivoAStorage(archivoFirmado, carpeta)
      if (resultado) {
        firmadoUrl = resultado.url
        firmadoNombre = resultado.nombre
      } else {
        archivoFalló = true
      }
    }

    // Subir archivos agrimensor (con índice para garantizar nombres únicos)
    const agrimensoresSubidos: ArchivoAdjunto[] = []
    for (let i = 0; i < archivosAgrimensor.length; i++) {
      const file = archivosAgrimensor[i]
      const resultado = await subirArchivoAStorage(file, `${carpeta}/agrimensor`, i)
      if (resultado) {
        agrimensoresSubidos.push({ nombre: resultado.nombre, data: resultado.url })
      }
    }

    if (archivoFalló) {
      setErrorGuardar('⚠️ El archivo adjunto no se pudo subir. El registro se guardó igualmente sin el adjunto.')
    }

    if (editandoEjecucion) {
      setEjecuciones(prev => {
        const nuevas = prev.map(e => {
          if (e.id !== editandoEjecucion) return e
          return {
            ...e,
            fecha: form.fecha,
            proxima_fecha: proxima,
            ejecutado_por: form.nombre,
            controlo: form.controlo,
            ingeniero: form.ingeniero,
            tiempo_min: form.tiempo ? Number(form.tiempo) : undefined,
            repuestos: form.repuestos,
            observaciones: form.obs,
            ...(firmadoUrl ? { archivo_nombre: firmadoNombre, archivo_url: firmadoUrl, archivo_data: undefined } : {}),
            archivos_agrimensor: agrimensoresSubidos.length > 0
              ? [...(e.archivos_agrimensor ?? []), ...agrimensoresSubidos]
              : e.archivos_agrimensor,
          }
        })
        localStorage.setItem(`ejecuciones_${actividadId}`, JSON.stringify(nuevas))
        return nuevas
      })
      setEditandoEjecucion(null)
    } else {
      const nueva: Ejecucion = {
        id: Date.now().toString(),
        planilla_id: planillaSeleccionada.codigo,
        fecha: form.fecha,
        proxima_fecha: proxima,
        ejecutado_por: form.nombre,
        controlo: form.controlo,
        ingeniero: form.ingeniero,
        tiempo_min: form.tiempo ? Number(form.tiempo) : undefined,
        repuestos: form.repuestos,
        observaciones: form.obs,
        archivo_nombre: firmadoNombre,
        archivo_url: firmadoUrl,
        archivos_agrimensor: agrimensoresSubidos,
      }
      setEjecuciones(prev => {
        const nuevas = [...prev, nueva]
        localStorage.setItem(`ejecuciones_${actividadId}`, JSON.stringify(nuevas))
        return nuevas
      })
      setProximasFechas(prev => ({ ...prev, [planillaSeleccionada.codigo]: proxima }))
    }

    setMostrarFormulario(false)
    setMostrarHistorial(true)
    const defaultsCampos = actividadId === 'tirolesa'
      ? { ingeniero: 'Ing. Luciano Capdevila', controlo: 'Lic. Juan Vanadía' }
      : { ingeniero: '', controlo: '' }
    setForm({ fecha: new Date().toISOString().split('T')[0], nombre: '', tiempo: '', repuestos: '', obs: '', ...defaultsCampos })
    setArchivoFirmado(null)
    setArchivosAgrimensor([])
    } catch (err) {
      console.error('Error al guardar:', err)
      setErrorGuardar('Hubo un error al guardar. Revisá tu conexión y volvé a intentar.')
    } finally {
      setGuardando(false)
    }
  }

  function borrarEjecucion(ejId: string) {
    if (!window.confirm('¿Borrar este registro? Esta acción no se puede deshacer.')) return
    setEjecuciones(prev => {
      const nuevas = prev.filter(e => e.id !== ejId)
      localStorage.setItem(`ejecuciones_${actividadId}`, JSON.stringify(nuevas))
      return nuevas
    })
  }

  function eliminarArchivoAgrimensor(ejId: string, idx: number) {
    setEjecuciones(prev => {
      const nuevas = prev.map(e => {
        if (e.id !== ejId) return e
        const arr = [...(e.archivos_agrimensor ?? [])]
        arr.splice(idx, 1)
        return { ...e, archivos_agrimensor: arr }
      })
      localStorage.setItem(`ejecuciones_${actividadId}`, JSON.stringify(nuevas))
      return nuevas
    })
  }

  function abrirEdicionEjecucion(ej: Ejecucion) {
    setForm({
      fecha: ej.fecha,
      nombre: ej.ejecutado_por,
      tiempo: ej.tiempo_min?.toString() ?? '',
      repuestos: ej.repuestos ?? '',
      obs: ej.observaciones ?? '',
      controlo: ej.controlo ?? '',
      ingeniero: ej.ingeniero ?? '',
    })
    setArchivoFirmado(null)
    setArchivosAgrimensor([])
    setEditandoEjecucion(ej.id)
    setMostrarFormulario(true)
    setMostrarHistorial(false)
  }

  // Días del mes con planillas — cada entrada guarda lista de { codigo, color, estado }
  const diasConPlanilla: Record<number, { codigo: string; nombre: string; color: string; estado: 'realizada' | 'para_realizar' | 'vencida' }[]> = {}
  if (configCargada) {
    planillas.forEach(p => {
      const inicio = getFechaInicio(p.codigo)
      let fechas: string[] = []
      if (inicio) {
        fechas = getFechasDelMes(inicio, p.frecuencia, hoy.getFullYear(), hoy.getMonth())
      } else {
        // Recalcular próxima fecha desde la última ejecución + frecuencia actual
        const ultimaEj = ejecuciones
          .filter(e => e.planilla_id === p.codigo)
          .sort((a, b) => b.fecha.localeCompare(a.fecha))[0]

        let proximaReal: string
        if (ultimaEj) {
          // Recalcular desde la fecha real del último registro con la frecuencia actual
          proximaReal = calcularProximaFecha(ultimaEj.fecha, p.frecuencia)
        } else {
          proximaReal = getProximaFecha(p)
        }

        const d = new Date(proximaReal)
        const mesActualIdx = hoy.getMonth()
        const anioActual = hoy.getFullYear()

        if (d.getMonth() === mesActualIdx && d.getFullYear() === anioActual) {
          // Cae en este mes
          fechas = [proximaReal]
        } else if (d < hoy) {
          // Está vencida (fecha pasada) — mostrarla igual en el día 1 del mes como vencida
          fechas = [`${anioActual}-${String(mesActualIdx + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`]
          // Si el día no existe en este mes, usar el último día del mes
          const ultimoDiaMes = new Date(anioActual, mesActualIdx + 1, 0).getDate()
          const dia = Math.min(d.getDate(), ultimoDiaMes)
          fechas = [`${anioActual}-${String(mesActualIdx + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`]
        }
      }
      fechas.forEach(f => {
        const dia = new Date(f).getDate()
        const est = estadoMes(p, [f])
        const col = est === 'realizada' ? '#16a34a' : est === 'vencida' ? '#dc2626' : '#f59e0b'
        if (!diasConPlanilla[dia]) diasConPlanilla[dia] = []
        diasConPlanilla[dia].push({ codigo: p.codigo, nombre: p.nombre, color: col, estado: est })
      })
    })
  }

  const diasDelMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).getDay()

  const estilosEstado: Record<string, React.CSSProperties> = {
    rojo:    { background: '#dc2626', color: 'white', border: 'none' },
    naranja: { background: '#f59e0b', color: 'white', border: 'none' },
    verde:   { background: '#16a34a', color: 'white', border: 'none' },
  }
  // Mantener para compatibilidad con código existente
  const coloresEstado: Record<string, string> = {
    rojo: '', naranja: '', verde: '',
  }

  const planillasMes = getPlanillasMes()

  // Vista de impresión: si viene de botón Imprimir individual, filtrar solo esa planilla
  const planillasMesParaPDF = planillaParaImprimir
    ? planillasMes.filter(pm => pm.planilla.codigo === planillaParaImprimir.codigo).length > 0
      ? planillasMes.filter(pm => pm.planilla.codigo === planillaParaImprimir.codigo)
      : [{ planilla: planillaParaImprimir, fechas: [new Date().toISOString().split('T')[0]] }]
    : planillasMes

  // Vista de impresión del resumen mensual
  if (mostrarPDFMes) {
    return (
      <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Arial, sans-serif', color: '#000' }}>
        {/* Controles — solo pantalla */}
        <div className="no-print" style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => { setMostrarPDFMes(false); setPlanillaParaImprimir(null) }}
            style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 16px', fontSize: 13, background: '#fff', cursor: 'pointer' }}>
            ← Volver
          </button>
          <button onClick={() => window.print()}
            style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            🖨️ Imprimir / Guardar PDF
          </button>
          <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>
            Tip: en el diálogo de impresión seleccioná "Guardar como PDF" para exportar.
          </span>
        </div>

        {/* Contenido imprimible */}
        <div style={{ maxWidth: 740, margin: '0 auto', padding: '32px 24px' }}>

          {/* Encabezado */}
          <div style={{ borderBottom: '3px solid #000', paddingBottom: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#555', marginBottom: 2 }}>AVENTURA EN ALTURA — PTATANKA SRL</div>
                <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 1 }}>PLAN DE MANTENIMIENTO — {nombre.toUpperCase()}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{MESES[hoy.getMonth()].toUpperCase()} {hoy.getFullYear()}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 11, color: '#555' }}>
                <div>Generado: {new Date().toLocaleDateString('es-AR')}</div>
                <div style={{ marginTop: 4, fontSize: 10 }}>Villa Carlos Paz, Córdoba</div>
              </div>
            </div>
          </div>

          {/* Tabla resumen */}
          {planillasMesParaPDF.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: 14 }}>
              No hay mantenimientos configurados para este mes.
            </div>
          ) : (
            <>
              {/* Tabla de vista rápida — solo si hay más de 1 */}
              {planillasMesParaPDF.length > 1 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 28, fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#000', color: '#fff' }}>
                    <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, letterSpacing: 0.5 }}>CÓDIGO</th>
                    <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700 }}>PLANILLA</th>
                    <th style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 700 }}>FREC.</th>
                    <th style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 700 }}>FECHA(S)</th>
                    <th style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 700 }}>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {planillasMesParaPDF.map(({ planilla: p, fechas }, idx) => {
                    const est = estadoMes(p, fechas)
                    return (
                      <tr key={p.codigo} style={{ background: idx % 2 === 0 ? '#f9f9f9' : '#fff', borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 700, fontSize: 11 }}>{p.codigo}</td>
                        <td style={{ padding: '7px 10px', fontWeight: 600 }}>{p.nombre}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', fontSize: 11 }}>{FREC_LABEL[p.frecuencia]}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', fontSize: 11 }}>
                          {fechas.map(f => new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })).join(' / ')}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                          <span style={{
                            border: '1.5px solid #000', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700,
                            background: est === 'realizada' ? '#000' : '#fff',
                            color: est === 'realizada' ? '#fff' : '#000',
                          }}>
                            {est === 'realizada' ? '✓ REALIZADA' : est === 'vencida' ? '✗ VENCIDA' : '○ PENDIENTE'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              )}

              {/* Detalle por planilla */}
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#555', marginBottom: 12, borderBottom: '1px solid #ccc', paddingBottom: 6 }}>
                DETALLE DE TAREAS
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {planillasMesParaPDF.map(({ planilla: p, fechas }) => (
                  <div key={p.codigo} style={{ border: '1.5px solid #000', borderRadius: 0, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    {/* Cabecera planilla */}
                    <div style={{ background: '#000', color: '#fff', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, marginRight: 10 }}>{p.codigo}</span>
                        <span style={{ fontSize: 13, fontWeight: 900 }}>{p.nombre}</span>
                      </div>
                      <div style={{ fontSize: 11, textAlign: 'right' }}>
                        <span style={{ marginRight: 12 }}>{FREC_LABEL[p.frecuencia]}</span>
                        <strong>{fechas.map(f => new Date(f).toLocaleDateString('es-AR')).join(' / ')}</strong>
                      </div>
                    </div>

                    <div style={{ padding: '10px 12px' }}>
                      {/* Tareas */}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#555', marginBottom: 6 }}>TAREAS A REALIZAR</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            {p.tareas.map((t, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '4px 6px', width: 22, verticalAlign: 'top' }}>
                                  <div style={{ width: 14, height: 14, border: '1.5px solid #000', display: 'inline-block', flexShrink: 0 }} />
                                </td>
                                <td style={{ padding: '4px 4px', fontSize: 11, lineHeight: 1.4 }}>{t}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Materiales */}
                      {p.materiales.length > 0 && (
                        <div style={{ background: '#f3f3f3', border: '1px solid #ccc', padding: '5px 10px', marginBottom: 10 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: '#555' }}>MATERIALES / EPP: </span>
                          <span style={{ fontSize: 11 }}>{p.materiales.join(' · ')}</span>
                        </div>
                      )}

                      {/* Firma */}
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: 12, marginTop: 8, paddingTop: 8, borderTop: '1px solid #ddd' }}>
                        {['Realizado por', 'Controló', 'Firma'].map(label => (
                          <div key={label}>
                            <div style={{ fontSize: 9, color: '#888', marginBottom: 14 }}>{label}</div>
                            <div style={{ borderBottom: '1.5px solid #000' }} />
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 9, color: '#888', marginBottom: 4 }}>Observaciones</div>
                        <div style={{ border: '1px solid #ccc', height: 32 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ marginTop: 24, paddingTop: 10, borderTop: '1px solid #ddd', fontSize: 10, color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
            <span>Aventura en Altura — Ptatanka SRL · Complejo Aerosilla, Villa Carlos Paz, Córdoba</span>
            <span>Hoja 1</span>
          </div>
        </div>

        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { margin: 0; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}</style>
      </div>
    )
  }

  // Determinar estado de una planilla del mes: realizada / para realizar / vencida
  function estadoMes(p: Planilla, fechas: string[]): 'realizada' | 'para_realizar' | 'vencida' {
    const mesActual = hoy.getMonth()
    const anioActual = hoy.getFullYear()
    const realizada = ejecuciones.some(e => {
      const d = new Date(e.fecha)
      return e.planilla_id === p.codigo && d.getMonth() === mesActual && d.getFullYear() === anioActual
    })
    if (realizada) return 'realizada'
    const todasPasadas = fechas.every(f => new Date(f) < hoy)
    if (todasPasadas) return 'vencida'
    return 'para_realizar'
  }

  // PanelDetalle y FormularioEjecucion son JSX inline (no sub-componentes)
  // para evitar que React los desmonte en cada render y pierda el foco de los inputs

  // Modal reproductor de tutorial
  const tutorialActivo = tutorialViendose ? tutoriales[tutorialViendose] : null
  const planillaTutorial = tutorialViendose ? planillas.find(p => p.codigo === tutorialViendose) : null

  return (
    <div className="min-h-screen" >

      {/* Modal reproductor de tutorial */}
      {tutorialActivo && planillaTutorial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setTutorialViendose(null)}>
          <div className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}>
            {/* Header modal */}
            <div className="flex items-center justify-between px-5 py-3" style={{ background: '#1f2937' }}>
              <div>
                <p className="text-white font-bold">{planillaTutorial.nombre}</p>
                <p className="text-white/50 text-xs">{planillaTutorial.codigo} · Tutorial</p>
              </div>
              <button onClick={() => setTutorialViendose(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10">
                ✕
              </button>
            </div>
            {/* Reproductor */}
            <div style={{ background: '#000', aspectRatio: '16/9', position: 'relative' }}>
              {tutorialActivo.tipo === 'url' && getYouTubeEmbed(tutorialActivo.valor) ? (
                <iframe
                  src={getYouTubeEmbed(tutorialActivo.valor)!}
                  className="w-full h-full"
                  style={{ border: 'none', width: '100%', height: '100%' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : tutorialActivo.tipo === 'url' ? (
                <video src={tutorialActivo.valor} controls className="w-full h-full" style={{ maxHeight: 480 }} />
              ) : (
                <video src={tutorialActivo.valor} controls className="w-full h-full" style={{ maxHeight: 480 }} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="text-white px-6 py-3 flex items-center justify-between no-print" style={{ backgroundColor: color }}>
        <div className="flex items-center gap-4">
          <Link href="/home" className="text-white opacity-70 hover:opacity-100 text-2xl font-bold leading-none">←</Link>
          <Image src={logo} alt={nombre} width={160} height={80} style={{ objectFit: 'contain', maxHeight: 70 }} priority />
          <p className="text-sm opacity-80 font-medium">{planillas.length} planillas</p>
        </div>
        <div className="flex items-center gap-3">
          {['tirolesa', 'parque', 'arqueria'].includes(actividadId) && (
            <Link href={`/inventario/${actividadId}`}
              className="text-sm flex items-center gap-1.5 bg-white/90 hover:bg-white text-gray-800 font-semibold rounded-xl px-4 py-2 shadow-sm transition-colors">
              🎽 Equipos
            </Link>
          )}
          <Link href="/config" className="text-sm flex items-center gap-1.5 bg-white/90 hover:bg-white text-gray-800 font-semibold rounded-xl px-4 py-2 shadow-sm transition-colors">
            ⚙️ Configurar fechas
          </Link>
          <Image src="/logos/aventura-en-altura.png" alt="Aventura en Altura" width={90} height={60} style={{ objectFit: 'contain', maxHeight: 55 }} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* SECCIÓN SUPERIOR: planillas del mes (izq) + calendario (der) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Planillas del mes */}
          <div className="panel rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-800">Mantenimientos de {MESES[hoy.getMonth()]}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Planillas programadas para este mes</p>
              </div>
              <button onClick={() => setMostrarPDFMes(true)}
                className="text-xs text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 bg-white font-medium flex items-center gap-1.5">
                📋 Resumen
              </button>
            </div>

            {planillasMes.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-2xl mb-2">📅</p>
                <p className="text-sm">No hay planillas configuradas para este mes.</p>
                <Link href="/config" className="text-xs text-blue-500 hover:underline mt-1 inline-block">⚙️ Configurar fechas</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {planillasMes.map(({ planilla: p, fechas }) => {
                  const estado = estadoMes(p, fechas)
                  const seleccionada = planillaSeleccionada?.codigo === p.codigo
                  return (
                    <div key={p.codigo}
                      onClick={() => seleccionarPlanilla(p)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all border ${
                        seleccionada ? 'border-gray-400 shadow-sm' : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                      }`}
                      style={seleccionada ? { borderColor: color } : {}}
                    >
                      {/* Indicador de estado */}
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{
                        background: estado === 'realizada' ? '#16a34a' : estado === 'vencida' ? '#dc2626' : '#f59e0b'
                      }} />

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{p.nombre}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          <span className="font-mono">{p.codigo}</span>
                          <span className="mx-1">·</span>
                          {fechas.map(f => new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })).join(', ')}
                        </p>
                      </div>

                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 text-white" style={{
                        background: estado === 'realizada' ? '#16a34a' : estado === 'vencida' ? '#dc2626' : '#f59e0b'
                      }}>
                        {estado === 'realizada' ? '✓ Realizada' :
                         estado === 'vencida'   ? '✗ Vencida'   : '● Para realizar'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Calendario */}
          <div className="panel rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-3">{MESES[hoy.getMonth()]} {hoy.getFullYear()}</h3>
            {/* Cabecera días semana */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold mb-1" style={{ color: '#9ca3af' }}>
              {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => <div key={d}>{d}</div>)}
            </div>
            {/* Grid días */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: primerDia }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: diasDelMes }, (_, i) => i + 1).map(dia => {
                const items = diasConPlanilla[dia] ?? []
                const esHoy = dia === hoy.getDate()
                const tienePlanillas = items.length > 0
                return (
                  <div key={dia}
                    className="rounded-xl flex flex-col items-center py-1 px-0.5 min-h-[52px]"
                    style={{
                      background: esHoy ? '#f0fdf4' : tienePlanillas ? '#fafafa' : 'transparent',
                      outline: esHoy ? `2px solid ${color}` : tienePlanillas ? '1px solid #e5e7eb' : 'none',
                      outlineOffset: esHoy ? '2px' : '0',
                    }}>
                    {/* Número del día */}
                    <span className="text-xs font-bold mb-0.5" style={{
                      color: esHoy ? color : tienePlanillas ? '#374151' : '#9ca3af'
                    }}>{dia}</span>
                    {/* Lista de planillas */}
                    <div className="flex flex-col gap-0.5 w-full px-0.5">
                      {items.map(item => (
                        <button
                          key={item.codigo}
                          onClick={() => seleccionarPlanilla(planillas.find(p => p.codigo === item.codigo) ?? null)}
                          title={item.nombre}
                          className="flex items-center gap-1 w-full rounded px-1 py-0.5 text-left transition-opacity hover:opacity-80"
                          style={{ background: `${item.color}18` }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                          <span className="text-xs font-mono truncate leading-tight" style={{ color: item.color, fontSize: 9 }}>
                            {item.codigo.replace('MP', '').replace(/^0+/, '')}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Leyenda */}
            <div className="mt-3 flex gap-4 text-xs" style={{ color: '#9ca3af' }}>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{background:'#16a34a'}}/>Realizada</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{background:'#f59e0b'}}/>Para realizar</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{background:'#dc2626'}}/>Vencida</span>
            </div>
          </div>
        </div>

        {/* Panel detalle / formulario (aparece cuando hay planilla seleccionada) */}
        {/* Panel detalle planilla seleccionada */}
        {planillaSeleccionada && !mostrarFormulario && (
          <div ref={refDetalle} className="panel rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{planillaSeleccionada.codigo}</span>
                <span className="text-xs text-gray-400 ml-2">{FREC_LABEL[planillaSeleccionada.frecuencia]}</span>
              </div>
              <button onClick={() => { setPlanillaSeleccionada(null); setMostrarFormulario(false) }} className="text-gray-300 hover:text-gray-500 text-lg leading-none">✕</button>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">{planillaSeleccionada.nombre}</h3>
            <p className="text-xs text-gray-500 mb-3">{planillaSeleccionada.descripcion}</p>

            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-600 mb-1">TAREAS</p>
              <ul className="space-y-1">
                {planillaSeleccionada.tareas.map((t, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-2">
                    <span className="text-gray-300 flex-shrink-0">□</span>{t}
                  </li>
                ))}
              </ul>
            </div>

            {planillaSeleccionada.materiales.length > 0 && (
              <div className="mb-3 bg-gray-50 rounded-lg p-2">
                <p className="text-xs font-semibold text-gray-600 mb-1">MATERIALES</p>
                <p className="text-xs text-gray-500">{planillaSeleccionada.materiales.join(' · ')}</p>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button onClick={() => { setMostrarFormulario(true); setMostrarAdjuntarOriginal(false); setMostrarHistorial(false) }}
                className="flex-1 text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90"
                style={{ backgroundColor: '#16a34a' }}>
                ✓ Registrar que se realizó
              </button>
              <button
                onClick={() => setMostrarHistorial(h => !h)}
                className="px-3 py-2.5 rounded-xl text-sm flex items-center gap-1.5 font-semibold"
                style={{ background: mostrarHistorial ? '#1e3a3a' : '#f3f4f6', color: mostrarHistorial ? 'white' : '#4b5563' }}>
                🕘 <span className="text-xs">Historial</span>
              </button>
              <button onClick={() => abrirArchivoOriginal(planillaSeleccionada.codigo)}
                className="px-3 py-2.5 text-white rounded-xl text-sm flex items-center gap-1.5" style={{ background: '#2d4a4a' }}
                title="Abrir e imprimir planilla">
                🖨️ <span className="text-xs">Planilla</span>
              </button>
            </div>

            {/* Historial de ejecuciones */}
            {mostrarHistorial && (() => {
              const ejPlanilla = ejecuciones
                .filter(e => e.planilla_id === planillaSeleccionada.codigo)
                .sort((a, b) => b.fecha.localeCompare(a.fecha))
              return (
                <div className="mt-3 rounded-xl overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
                  <div className="flex items-center justify-between px-3 py-2" style={{ background: '#1e3a3a' }}>
                    <span className="text-white text-xs font-bold">Historial de ejecuciones</span>
                    <span className="text-white/50 text-xs">{ejPlanilla.length} registro{ejPlanilla.length !== 1 ? 's' : ''}</span>
                  </div>
                  {ejPlanilla.length === 0 ? (
                    <div className="px-4 py-5 text-center text-xs text-gray-400">
                      Sin registros aún. Usá &quot;Registrar que se realizó&quot; para cargar el primero.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {ejPlanilla.map(ej => (
                        <div key={ej.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-800">
                                  {fmtFecha(ej.fecha)}
                                </span>
                                <span className="text-xs text-gray-500">— {ej.ejecutado_por}</span>
                                {ej.controlo && <span className="text-xs text-gray-400">· Controló: {ej.controlo}</span>}
                                {ej.tiempo_min && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{ej.tiempo_min} min</span>}
                              </div>
                              {ej.ingeniero && <p className="text-xs text-gray-400 mt-0.5">Ing: {ej.ingeniero}</p>}
                              {ej.repuestos && <p className="text-xs text-gray-500 mt-0.5">🔩 {ej.repuestos}</p>}
                              {ej.observaciones && <p className="text-xs text-gray-600 mt-0.5 italic">"{ej.observaciones}"</p>}
                              <div className="flex gap-2 mt-1.5 flex-wrap">
                                {(ej.archivo_url || ej.archivo_data) && (
                                  <a href={ej.archivo_url || ej.archivo_data} download={!ej.archivo_url ? (ej.archivo_nombre || 'planilla-firmada.pdf') : undefined} target={ej.archivo_url ? '_blank' : undefined} rel="noreferrer"
                                    className="text-xs flex items-center gap-1 text-green-600 hover:underline">
                                    📎 {ej.archivo_nombre || 'Planilla firmada'}
                                  </a>
                                )}
                                {(ej.archivos_agrimensor ?? []).map((ag, idx) => (
                                  <div key={idx} className="flex items-center gap-1">
                                    <a href={ag.data} download={ag.nombre}
                                      className="text-xs flex items-center gap-1 text-blue-600 hover:underline">
                                      📐 {ag.nombre}
                                    </a>
                                    {esAdmin && (
                                      <button onClick={() => eliminarArchivoAgrimensor(ej.id, idx)}
                                        className="text-red-300 hover:text-red-500 text-xs leading-none" title="Quitar archivo">✕</button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                              <div>
                                <p className="text-xs text-gray-400">Próxima:</p>
                                <p className="text-xs font-semibold text-gray-600">
                                  {fmtFecha(ej.proxima_fecha)}
                                </p>
                              </div>
                              {esAdmin && (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => abrirEdicionEjecucion(ej)}
                                    className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                                    style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                                    ✏️ Editar
                                  </button>
                                  <button
                                    onClick={() => borrarEjecucion(ej.id)}
                                    className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                                    style={{ background: '#fff1f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                                    🗑️
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

            <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
              <span className="text-xs text-gray-400">
                Archivo: <span className="font-mono text-gray-500">public/planillas/{planillaSeleccionada.codigo}.pdf</span>
              </span>
              <label className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer flex items-center gap-1 flex-shrink-0">
                📎 subir alternativo
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) { guardarArchivoOriginal(planillaSeleccionada.codigo, f) } }} />
              </label>
            </div>
          </div>
        )}

        {/* Formulario registrar ejecución */}
        {mostrarFormulario && planillaSeleccionada && (
          <div className="panel rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">
                  {editandoEjecucion ? '✏️ Editando registro' : 'Registrar ejecución'} — {planillaSeleccionada.nombre}
                </h3>
                {editandoEjecucion && <p className="text-xs text-amber-600 mt-0.5">Los archivos nuevos se agregan a los existentes</p>}
              </div>
              <button onClick={() => { setMostrarFormulario(false); setEditandoEjecucion(null) }} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Fecha</label>
                <input type="date" value={form.fecha} onChange={e => setForm(f => ({...f, fecha: e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Tiempo (minutos)</label>
                <input type="number" value={form.tiempo} onChange={e => setForm(f => ({...f, tiempo: e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5" placeholder="ej: 30" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Realizado por *</label>
                <input type="text" value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5" placeholder="Nombre completo" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Controló</label>
                <input type="text" value={form.controlo} onChange={e => setForm(f => ({...f, controlo: e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5" placeholder="Supervisor" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600">Ingeniero a cargo</label>
                <input type="text" value={form.ingeniero} onChange={e => {
                    const v = e.target.value
                    setForm(f => ({...f, ingeniero: v}))
                    guardarConfigFecha('ingeniero_cargo', v)
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5" placeholder="Nombre del ingeniero responsable" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600">Repuestos / insumos usados</label>
                <input type="text" value={form.repuestos} onChange={e => setForm(f => ({...f, repuestos: e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5" placeholder="ej: 2 nocks, 1 cuerda" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600">Observaciones</label>
                <textarea value={form.obs} onChange={e => setForm(f => ({...f, obs: e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 resize-none" rows={2}
                  placeholder="Novedades, problemas detectados..." />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600">Planilla firmada (PDF / imagen)</label>
                <label className={`mt-0.5 flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  archivoFirmado ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'
                }`}>
                  <span>{archivoFirmado ? '✅' : '📎'}</span>
                  <span className="flex-1 truncate text-xs">{archivoFirmado ? archivoFirmado.name : 'Planilla firmada por el ingeniero'}</span>
                  {archivoFirmado && <button type="button" onClick={e => { e.preventDefault(); setArchivoFirmado(null) }} className="text-red-400 text-xs">✕</button>}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setArchivoFirmado(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              {planillaSeleccionada?.codigo === 'MP01-005' && (
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600">Mediciones del agrimensor (PDF — podés adjuntar varios)</label>
                <label className="mt-0.5 flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg px-3 py-2.5 text-sm transition-colors border-blue-200 text-blue-500 hover:border-blue-400 hover:bg-blue-50">
                  <span>📐</span>
                  <span className="flex-1 text-xs">Seleccionar archivo(s) de mediciones</span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="hidden"
                    onChange={e => {
                      const nuevos = Array.from(e.target.files ?? [])
                      e.target.value = ''
                      const duplicados = nuevos.filter(f =>
                        archivosAgrimensor.some(existing => existing.name === f.name)
                      )
                      if (duplicados.length > 0) {
                        const nombres = duplicados.map(f => `"${f.name}"`).join(', ')
                        const confirmar = window.confirm(
                          `⚠️ Ya tenés adjuntado un archivo con el mismo nombre:\n${nombres}\n\n¿Querés agregarlo igual? (podría ser una copia duplicada)`
                        )
                        if (!confirmar) return
                      }
                      setArchivosAgrimensor(prev => [...prev, ...nuevos])
                    }} />
                </label>
                {archivosAgrimensor.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {archivosAgrimensor.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-1.5">
                        <span className="text-xs text-blue-700 flex-1 truncate">📄 {f.name}</span>
                        <button type="button" onClick={() => setArchivosAgrimensor(prev => prev.filter((_, j) => j !== i))}
                          className="text-red-400 text-xs hover:text-red-600">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}
            </div>
            {errorGuardar && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-xs text-red-600">
                ⚠️ {errorGuardar}
              </div>
            )}
            <button onClick={guardarEjecucion}
              disabled={guardando}
              className="w-full mt-4 text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: editandoEjecucion ? '#1e3a3a' : color }}>
              {guardando ? '⏳ Guardando...' : editandoEjecucion ? '💾 Guardar cambios' : 'Guardar registro'}
            </button>
          </div>
        )}

        {/* LIBRO DEL INGENIERO — solo tirolesa */}
        {actividadId === 'tirolesa' && (
          <LibroIngeniero esAdmin={esAdmin} />
        )}

        {/* SECCIÓN INFERIOR: todas las planillas */}
        <div>
          {/* Overlay para cerrar paneles flotantes al hacer click afuera */}
          {(extrasAbierto || configTutorialAbierto) && (
            <div className="fixed inset-0 z-40" onClick={() => { setExtrasAbierto(null); setConfigTutorialAbierto(null) }} />
          )}
          <h2 className="font-bold text-gray-700 mb-3">Todas las planillas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {planillas.map(p => {
              const proxima = getProximaFecha(p)
              const ultimaEj = ejecuciones.filter(e => e.planilla_id === p.codigo).sort((a, b) => b.fecha.localeCompare(a.fecha))[0]
              const tieneConfig = !!getFechaInicio(p.codigo)

              // Usar la misma lógica que el panel del mes si la planilla tiene fechas este mes
              const planillaMes = planillasMes.find(pm => pm.planilla.codigo === p.codigo)
              let badgeText: string
              let badgeStyle: React.CSSProperties
              let borderClass: string
              if (planillaMes) {
                const est = estadoMes(p, planillaMes.fechas)
                badgeText  = est === 'realizada' ? '✅ Al día' : est === 'vencida' ? '⚠️ Vencida' : '⏰ Para realizar'
                badgeStyle = estilosEstado[est === 'realizada' ? 'verde' : est === 'vencida' ? 'rojo' : 'naranja']
                borderClass = est === 'realizada' ? 'border-l-green-600' : est === 'vencida' ? 'border-l-red-600' : 'border-l-yellow-500'
              } else {
                const col = colorEstadoFecha(proxima)
                badgeText  = col === 'rojo' ? '⚠️ Vencida' : col === 'naranja' ? '⏰ Próxima' : '✅ Al día'
                badgeStyle = estilosEstado[col]
                borderClass = col === 'rojo' ? 'border-l-red-600' : col === 'naranja' ? 'border-l-yellow-500' : 'border-l-green-600'
              }

              const tieneAnotacion = !!(anotaciones[p.codigo]?.trim())
              return (
                <div key={p.codigo} className="relative">
                  <div
                    className={`bg-white rounded-xl border-l-4 p-4 hover:shadow-sm transition-shadow ${borderClass}`}
                    style={planillaSeleccionada?.codigo === p.codigo ? { outline: `2px solid ${color}`, outlineOffset: '2px' } : {}}
                  >
                    {/* Fila superior: info + badge — clickeable para seleccionar */}
                    <div className="flex items-start justify-between gap-2 cursor-pointer"
                      onClick={() => seleccionarPlanilla(p)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{p.codigo}</span>
                          <span className="text-xs text-gray-400">{FREC_LABEL[p.frecuencia]}</span>
                          {!tieneConfig && <span className="text-xs text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">⚙️ Sin fecha</span>}
                          {tieneAnotacion && <span className="text-xs text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded">📝</span>}
                        </div>
                        <h3 className="font-semibold text-gray-800 text-sm">{p.nombre}</h3>
                        {ultimaEj && (
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            Última: {fmtFecha(ultimaEj.fecha)} — {ultimaEj.ejecutado_por}
                            {ultimaEj.archivo_nombre && <span className="text-green-500">📎</span>}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-bold rounded-lg px-2.5 py-1" style={badgeStyle}>{badgeText}</span>
                        <p className="text-xs text-gray-400 mt-1">{proxima}</p>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-1.5 mt-3 pt-2.5" style={{ borderTop: '1px solid #f3f4f6' }}>
                      {/* Tutorial — todos ven, todos acceden igual */}
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          if (tutoriales[p.codigo]) {
                            setTutorialViendose(p.codigo)
                          } else {
                            setToastTutorial(p.codigo)
                            setTimeout(() => setToastTutorial(null), 3500)
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg font-medium"
                        style={{ background: tutoriales[p.codigo] ? '#dbeafe' : '#f3f4f6', color: tutoriales[p.codigo] ? '#1d4ed8' : '#4b5563' }}
                        title="Ver tutorial">
                        📖 Tutorial
                      </button>

                      {/* Imprimir — abre Excel original */}
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          abrirArchivoOriginal(p.codigo)
                        }}
                        className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg font-medium"
                        style={{ background: '#f3f4f6', color: '#4b5563' }}
                        title="Descargar planilla Excel para imprimir">
                        🖨️ Imprimir
                      </button>

                      {/* Extras — todos ven (read-only), solo admin edita desde ⚙️ */}
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setExtrasAbierto(extrasAbierto === p.codigo ? null : p.codigo)
                          setConfigTutorialAbierto(null)
                        }}
                        className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg font-medium"
                        style={extrasAbierto === p.codigo
                          ? { background: '#7c3aed', color: 'white' }
                          : { background: tieneAnotacion ? '#ede9fe' : '#f3f4f6', color: tieneAnotacion ? '#7c3aed' : '#4b5563' }}
                        title="Ver notas y extras">
                        📝 Extras
                      </button>

                      {/* ⚙️ Config — solo admin: edita tutorial + extras juntos */}
                      {esAdmin && (
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            abrirConfigTutorial(p.codigo)
                            setExtrasAbierto(null)
                          }}
                          className="flex items-center justify-center text-xs py-1.5 px-2.5 rounded-lg font-medium"
                          style={configTutorialAbierto === p.codigo
                            ? { background: '#374151', color: 'white' }
                            : { background: '#f3f4f6', color: '#6b7280' }}
                          title="Configurar (admin)">
                          ⚙️
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Toast "sin tutorial" */}
                  {toastTutorial === p.codigo && (
                    <div className="mt-1.5 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium"
                      style={{ background: '#1e3a3a', color: '#a7f3d0' }}>
                      <span className="text-base">📖</span>
                      Tutorial no disponible aún para este mantenimiento.
                    </div>
                  )}

                  {/* Panel flotante de Extras — siempre read-only, edición desde ⚙️ */}
                  {extrasAbierto === p.codigo && (
                    <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl shadow-xl overflow-hidden"
                      style={{ border: '1.5px solid #7c3aed', background: 'white', top: '100%' }}
                      onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: '#7c3aed' }}>
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm">📝</span>
                          <span className="text-white text-xs font-bold">Extras — {p.codigo}</span>
                        </div>
                        <button onClick={() => setExtrasAbierto(null)} className="text-white/70 hover:text-white text-lg leading-none">✕</button>
                      </div>
                      <div className="p-3">
                        <div className="text-sm rounded-lg px-3 py-3" style={{ background: '#faf8f4', color: '#1c2533', lineHeight: 1.7, minHeight: 64, whiteSpace: 'pre-wrap' }}>
                          {anotaciones[p.codigo]?.trim()
                            ? anotaciones[p.codigo]
                            : <span style={{ color: '#a0aec0' }}>Sin anotaciones cargadas para esta planilla.</span>}
                        </div>
                        {esAdmin && (
                          <p className="text-xs mt-1.5 text-right" style={{ color: '#a0aec0' }}>
                            Editá desde ⚙️ Configurar
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Panel config — solo admin, con 3 tabs */}
                  {configTutorialAbierto === p.codigo && formEdicion && (
                    <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl shadow-2xl overflow-hidden"
                      style={{ border: '1.5px solid #374151', background: 'white', top: '100%' }}
                      onClick={e => e.stopPropagation()}>
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: '#1f2937' }}>
                        <span className="text-white text-xs font-bold">⚙️ Configurar — {p.codigo}</span>
                        <button onClick={() => setConfigTutorialAbierto(null)} className="text-white/70 hover:text-white text-lg leading-none">✕</button>
                      </div>

                      {/* Tabs */}
                      <div className="flex" style={{ borderBottom: '1px solid #e5e7eb' }}>
                        {([['planilla','📋 Planilla'],['tutorial','📖 Tutorial'],['notas','📝 Notas']] as const).map(([tab, label]) => (
                          <button key={tab} onClick={() => setTabConfig(tab as 'planilla' | 'tutorial' | 'notas')}
                            className="flex-1 text-xs py-2.5 font-semibold transition-colors"
                            style={tabConfig === tab
                              ? { background: '#f9fafb', color: '#1f2937', borderBottom: '2px solid #1f2937' }
                              : { background: 'white', color: '#9ca3af', borderBottom: '2px solid transparent' }}>
                            {label}
                          </button>
                        ))}
                      </div>

                      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">

                        {/* TAB: Planilla */}
                        {tabConfig === 'planilla' && (
                          <>
                            <div>
                              <label className="text-xs font-semibold block mb-1" style={{ color: '#374151' }}>Nombre de la planilla</label>
                              <input type="text" value={formEdicion.nombre}
                                onChange={e => setFormEdicion(f => f ? { ...f, nombre: e.target.value } : f)}
                                className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
                                style={{ border: '1px solid #ddd8cf', background: '#faf8f4', color: '#1c2533' }} />
                            </div>
                            <div>
                              <label className="text-xs font-semibold block mb-1" style={{ color: '#374151' }}>Descripción</label>
                              <textarea value={formEdicion.descripcion} rows={2}
                                onChange={e => setFormEdicion(f => f ? { ...f, descripcion: e.target.value } : f)}
                                className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none resize-none"
                                style={{ border: '1px solid #ddd8cf', background: '#faf8f4', color: '#1c2533' }} />
                            </div>
                            <div>
                              <label className="text-xs font-semibold block mb-1" style={{ color: '#374151' }}>Frecuencia</label>
                              <select value={formEdicion.frecuencia}
                                onChange={e => setFormEdicion(f => f ? { ...f, frecuencia: e.target.value } : f)}
                                className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
                                style={{ border: '1px solid #ddd8cf', background: '#faf8f4', color: '#1c2533' }}>
                                {['diaria','semanal','mensual','bimestral','trimestral','semestral','anual'].map(fr => (
                                  <option key={fr} value={fr}>{FREC_LABEL[fr]}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-semibold block mb-1" style={{ color: '#374151' }}>Tareas <span style={{ color: '#9ca3af', fontWeight: 400 }}>(una por línea)</span></label>
                              <textarea value={formEdicion.tareas} rows={5}
                                onChange={e => setFormEdicion(f => f ? { ...f, tareas: e.target.value } : f)}
                                className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none resize-none"
                                style={{ border: '1px solid #ddd8cf', background: '#faf8f4', color: '#1c2533', lineHeight: 1.6 }} />
                            </div>
                            <div>
                              <label className="text-xs font-semibold block mb-1" style={{ color: '#374151' }}>Materiales / EPP <span style={{ color: '#9ca3af', fontWeight: 400 }}>(uno por línea)</span></label>
                              <textarea value={formEdicion.materiales} rows={3}
                                onChange={e => setFormEdicion(f => f ? { ...f, materiales: e.target.value } : f)}
                                className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none resize-none"
                                style={{ border: '1px solid #ddd8cf', background: '#faf8f4', color: '#1c2533', lineHeight: 1.6 }} />
                            </div>
                            <div>
                              <label className="text-xs font-semibold block mb-1" style={{ color: '#374151' }}>Instructivo / Procedimiento</label>
                              <textarea value={formEdicion.instructivo} rows={3}
                                onChange={e => setFormEdicion(f => f ? { ...f, instructivo: e.target.value } : f)}
                                className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none resize-none"
                                style={{ border: '1px solid #ddd8cf', background: '#faf8f4', color: '#1c2533', lineHeight: 1.6 }} />
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button onClick={() => guardarEdicionPlanilla(p.codigo)}
                                className="flex-1 text-white text-sm font-bold py-2.5 rounded-xl"
                                style={{ background: '#1f2937' }}>
                                💾 Guardar cambios
                              </button>
                              {edicionesPlanillas[p.codigo] && (
                                <button onClick={() => resetearPlanilla(p.codigo)}
                                  className="px-4 py-2.5 text-sm rounded-xl font-semibold"
                                  style={{ background: '#fee2e2', color: '#dc2626' }}
                                  title="Volver a los datos originales">
                                  Resetear
                                </button>
                              )}
                            </div>
                          </>
                        )}

                        {/* TAB: Tutorial */}
                        {tabConfig === 'tutorial' && (
                          <>
                            <div className="flex gap-2">
                              {(['url', 'file'] as const).map(t => (
                                <button key={t} onClick={() => setFormTutorial(f => ({ ...f, tipo: t }))}
                                  className="flex-1 text-xs py-2 rounded-lg font-semibold"
                                  style={formTutorial.tipo === t ? { background: '#1f2937', color: 'white' } : { background: '#f3f4f6', color: '#6b7280' }}>
                                  {t === 'url' ? '🔗 Link YouTube / video' : '📁 Subir archivo'}
                                </button>
                              ))}
                            </div>
                            {formTutorial.tipo === 'url' ? (
                              <div>
                                <input type="text"
                                  placeholder="https://www.youtube.com/watch?v=..."
                                  value={formTutorial.urlInput}
                                  onChange={e => setFormTutorial(f => ({ ...f, urlInput: e.target.value }))}
                                  className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
                                  style={{ border: '1px solid #ddd8cf', background: '#faf8f4', color: '#1c2533' }} />
                                {formTutorial.urlInput && getYouTubeEmbed(formTutorial.urlInput) && (
                                  <p className="text-xs mt-1" style={{ color: '#16a34a' }}>✅ YouTube detectado</p>
                                )}
                              </div>
                            ) : (
                              <label className="flex flex-col items-center gap-2 cursor-pointer rounded-xl border-2 border-dashed py-5 px-4 text-center"
                                style={{ borderColor: formTutorial.valor ? '#16a34a' : '#ddd8cf', background: formTutorial.valor ? '#f0fdf4' : '#faf8f4' }}>
                                {formTutorial.valor
                                  ? <><span className="text-xl">✅</span><span className="text-xs font-semibold" style={{ color: '#16a34a' }}>Archivo cargado — click para reemplazar</span></>
                                  : <><span className="text-xl">📹</span><span className="text-xs" style={{ color: '#6b7280' }}>Seleccionar video (MP4, MOV…)</span></>}
                                <input type="file" accept="video/*" className="hidden"
                                  onChange={e => { const f = e.target.files?.[0]; if (f) cargarArchivoTutorial(f) }} />
                              </label>
                            )}
                            <div className="flex gap-2">
                              <button onClick={() => guardarFormTutorial(p.codigo)}
                                className="flex-1 text-white text-sm font-bold py-2.5 rounded-xl"
                                style={{ background: '#1f2937' }}>
                                💾 Guardar tutorial
                              </button>
                              {tutoriales[p.codigo] && (
                                <button onClick={() => borrarTutorial(p.codigo)}
                                  className="px-4 py-2.5 text-sm rounded-xl font-semibold"
                                  style={{ background: '#fee2e2', color: '#dc2626' }}>
                                  Borrar
                                </button>
                              )}
                            </div>
                          </>
                        )}

                        {/* TAB: Notas */}
                        {tabConfig === 'notas' && (
                          <>
                            <textarea
                              value={anotaciones[p.codigo] || ''}
                              onChange={e => guardarAnotacion(p.codigo, e.target.value)}
                              placeholder={`Anotaciones para ${p.nombre}...\n\nEj: usar guantes de nitrilo · revisar rodamiento derecho · pedir repuesto N° 4B`}
                              rows={6}
                              className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none resize-none"
                              style={{ border: '1px solid #ddd8cf', background: '#faf8f4', color: '#1c2533', lineHeight: 1.6 }}
                              autoFocus
                            />
                            <div className="flex items-center justify-between">
                              <p className="text-xs" style={{ color: '#a0aec0' }}>Se guarda automáticamente al escribir</p>
                              {anotaciones[p.codigo]?.trim() && (
                                <button onClick={() => guardarAnotacion(p.codigo, '')} className="text-xs" style={{ color: '#dc2626' }}>Borrar notas</button>
                              )}
                            </div>
                          </>
                        )}

                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
