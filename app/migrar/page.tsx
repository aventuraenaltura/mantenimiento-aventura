'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ACTIVIDADES = ['tirolesa', 'arqueria', 'parque', 'salon']

export default function MigrarPage() {
  const router = useRouter()
  const [log, setLog] = useState<string[]>([])
  const [corriendo, setCorriendo] = useState(false)
  const [listo, setListo] = useState(false)

  function addLog(msg: string) {
    setLog(prev => [...prev, msg])
  }

  async function migrar() {
    setCorriendo(true)
    setLog([])
    let total = 0
    let errores = 0

    addLog('📋 Migrando registros de mantenimiento...')
    for (const act of ACTIVIDADES) {
      try {
        const raw = localStorage.getItem(`ejecuciones_${act}`)
        if (!raw) { addLog(`  ↳ ${act}: sin datos`); continue }
        const ejs = JSON.parse(raw)
        if (!Array.isArray(ejs) || ejs.length === 0) { addLog(`  ↳ ${act}: vacío`); continue }
        const { data: existentes } = await supabase.from('ejecuciones').select('id').eq('actividad_id', act)
        const idsExistentes = new Set((existentes ?? []).map((e: {id:string}) => e.id))
        const nuevos = ejs.filter((e: {id:string}) => !idsExistentes.has(e.id))
        if (nuevos.length === 0) { addLog(`  ↳ ${act}: ya migrado (${ejs.length} registros)`); continue }
        const rows = nuevos.map((e: Record<string,unknown>) => ({ ...e, actividad_id: act }))
        const { error } = await supabase.from('ejecuciones').insert(rows)
        if (error) { addLog(`  ↳ ${act}: ❌ ${error.message}`); errores++ }
        else { addLog(`  ↳ ${act}: ✅ ${nuevos.length} registros migrados`); total += nuevos.length }
      } catch (e) { addLog(`  ↳ ${act}: ❌ ${e}`); errores++ }
    }

    addLog('🏛️ Migrando documentos legales...')
    try {
      const raw = localStorage.getItem('legales_docs_v2')
      if (raw) {
        const docsLocal = JSON.parse(raw) as Record<string, {id:string;nombre:string;url:string;fecha_carga:string;fecha_vencimiento?:string}[]>
        const { data: existentes } = await supabase.from('legales_docs').select('id')
        const idsExistentes = new Set((existentes ?? []).map((d:{id:string}) => d.id))
        const rows: {id:string;seccion_id:string;nombre:string;url:string;fecha_carga:string;fecha_vencimiento?:string}[] = []
        for (const [seccionId, archivos] of Object.entries(docsLocal)) {
          for (const a of archivos) {
            if (!idsExistentes.has(a.id)) rows.push({ ...a, seccion_id: seccionId })
          }
        }
        if (rows.length > 0) {
          const { error } = await supabase.from('legales_docs').insert(rows)
          if (error) { addLog(`  ❌ ${error.message}`); errores++ }
          else { addLog(`  ✅ ${rows.length} documentos migrados`); total += rows.length }
        } else { addLog('  ↳ Ya migrado o sin datos') }
      } else { addLog('  ↳ Sin datos en este dispositivo') }
    } catch (e) { addLog(`  ↳ ❌ ${e}`); errores++ }

    addLog('📖 Migrando libro del ingeniero...')
    try {
      const raw = localStorage.getItem('libro_ingeniero_tirolesa')
      if (raw) {
        const fotosLocal = JSON.parse(raw) as {id:string;mes:string;url:string;nombre:string;fecha_subida:string}[]
        const { data: existentes } = await supabase.from('libro_ingeniero').select('id')
        const idsExistentes = new Set((existentes ?? []).map((f:{id:string}) => f.id))
        const nuevas = fotosLocal.filter(f => !idsExistentes.has(f.id))
        if (nuevas.length > 0) {
          const { error } = await supabase.from('libro_ingeniero').insert(nuevas)
          if (error) { addLog(`  ❌ ${error.message}`); errores++ }
          else { addLog(`  ✅ ${nuevas.length} fotos migradas`); total += nuevas.length }
        } else { addLog('  ↳ Ya migrado o sin datos') }
      } else { addLog('  ↳ Sin datos en este dispositivo') }
    } catch (e) { addLog(`  ↳ ❌ ${e}`); errores++ }

    addLog('')
    addLog(`✅ Fin: ${total} elementos migrados${errores > 0 ? `, ${errores} errores` : ' sin errores'}`)
    setCorriendo(false)
    setListo(true)
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-6" style={{ background: '#f7f5f0' }}>
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 22, color: '#1e3a3a', marginBottom: 4 }}>
            🔄 Migración de datos
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Sube todos los datos de <b>este dispositivo</b> a Supabase. Ejecutalo una vez desde cada dispositivo donde hayas cargado datos.
          </p>
          {!listo ? (
            <button onClick={migrar} disabled={corriendo}
              className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
              style={{ background: '#1e3a3a' }}>
              {corriendo ? '⏳ Migrando...' : '🚀 Iniciar migración'}
            </button>
          ) : (
            <button onClick={() => router.push('/home')}
              className="w-full py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: '#16a34a' }}>
              ✅ Listo — Volver al inicio
            </button>
          )}
          {log.length > 0 && (
            <div className="mt-5 bg-gray-900 rounded-xl p-4 max-h-96 overflow-y-auto">
              {log.map((l, i) => (
                <p key={i} className="text-xs font-mono mb-0.5"
                  style={{ color: l.includes('❌') ? '#f87171' : l.includes('✅') ? '#4ade80' : '#e5e7eb' }}>
                  {l || '\u00A0'}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
