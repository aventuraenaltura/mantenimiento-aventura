'use client'
import { useEffect } from 'react'

interface Equipo {
  id: string
  tipo: string
  numero_interno: string
  marca: string
  modelo: string
  numero_serie: string
  ubicacion: string
  observaciones: string
  historial: { fecha: string; accion: string; por: string }[]
}

interface Props {
  equipos: Equipo[]
  sector: string
  onCerrar: () => void
}

const SECTOR_LABEL: Record<string, string> = {
  tirolesa: 'Tirolesa',
  parque:   'Parque Aéreo',
  arqueria: 'Arquería',
  salon:    'Aventura Escondida',
}

const TIPO_LABEL: Record<string, string> = {
  arnes:     '🦺 Arnés',
  polea:     '⚙️ Polea',
  casco:     '⛑️ Casco',
  mosqueton: '🔗 Mosquetón',
  guantin:   '🥊 Guantín',
}

export default function ReportePDF({ equipos, sector, onCerrar }: Props) {
  const enReparacion = equipos.filter(e => e.ubicacion === 'para_reparar')
  const hoy = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // Agrupar por tipo
  const porTipo: Record<string, Equipo[]> = {}
  for (const e of enReparacion) {
    if (!porTipo[e.tipo]) porTipo[e.tipo] = []
    porTipo[e.tipo].push(e)
  }

  useEffect(() => {
    // Bloquear scroll del body mientras está abierto
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function imprimir() {
    const contenido = document.getElementById('reporte-reparaciones')
    if (!contenido) return

    const ventana = window.open('', '_blank', 'width=900,height=700')
    if (!ventana) return

    ventana.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8"/>
        <title>Equipos en Reparación — ${SECTOR_LABEL[sector] ?? sector}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', Arial, sans-serif; color: #1a202c; background: white; }
          .header { display: flex; align-items: flex-start; justify-content: space-between; padding: 28px 32px 20px; border-bottom: 3px solid #0d9e96; }
          .header-left h1 { font-size: 20px; font-weight: 700; color: #0d9e96; margin-bottom: 4px; }
          .header-left p { font-size: 12px; color: #718096; }
          .header-right { text-align: right; }
          .header-right .fecha { font-size: 13px; color: #4a5568; }
          .badge-sector { display: inline-block; background: #0d9e96; color: white; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; margin-top: 6px; }
          .resumen { display: flex; gap: 16px; padding: 16px 32px; background: #f8fafb; border-bottom: 1px solid #e2e8f0; }
          .stat-box { text-align: center; }
          .stat-box .num { font-size: 28px; font-weight: 900; color: #e07820; line-height: 1; }
          .stat-box .lbl { font-size: 10px; color: #718096; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
          .alerta { margin: 16px 32px; padding: 10px 14px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; font-size: 12px; color: #c2410c; }
          .seccion { padding: 0 32px; margin-top: 20px; }
          .seccion-titulo { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #718096; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px; }
          th { background: #f0fdfb; color: #0a8880; font-weight: 700; text-align: left; padding: 8px 10px; border-bottom: 2px solid #0d9e96; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
          td { padding: 9px 10px; border-bottom: 1px solid #f0f4f7; vertical-align: top; }
          tr:last-child td { border-bottom: none; }
          tr:nth-child(even) td { background: #fafafa; }
          .n-interno { font-size: 16px; font-weight: 900; color: #0d9e96; }
          .marca-modelo { font-weight: 600; color: #1a202c; }
          .serie { color: #718096; font-size: 11px; margin-top: 2px; }
          .problema { color: #c2410c; font-size: 12px; line-height: 1.4; }
          .historial-item { background: #fff7ed; border-left: 3px solid #f97316; padding: 5px 8px; border-radius: 0 4px 4px 0; margin-top: 4px; font-size: 11px; color: #92400e; }
          .historial-fecha { font-weight: 600; margin-right: 4px; }
          .firma-box { margin: 24px 32px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
          .firma-linea { border-top: 1px solid #cbd5e0; padding-top: 6px; font-size: 11px; color: #718096; }
          .footer { margin-top: 32px; padding: 12px 32px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #a0aec0; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${contenido.innerHTML}
        <script>window.onload = function(){ window.print(); }<\/script>
      </body>
      </html>
    `)
    ventana.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{ background: 'rgba(0,0,0,0.65)' }}>

      {/* Panel modal */}
      <div className="bg-white rounded-2xl shadow-2xl w-full flex flex-col"
        style={{ maxWidth: 720, maxHeight: '90vh' }}>

        {/* Header modal */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ background: '#0d9e96', borderRadius: '16px 16px 0 0' }}>
          <div>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 16, color: 'white' }}>
              🔧 Reporte de Reparaciones
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>
              {SECTOR_LABEL[sector] ?? sector} · {enReparacion.length} equipo{enReparacion.length !== 1 ? 's' : ''} para reparar
            </p>
          </div>
          <button onClick={onCerrar} className="w-8 h-8 rounded-full flex items-center justify-center text-white"
            style={{ background: 'rgba(255,255,255,0.2)' }}>✕</button>
        </div>

        {/* Preview scrollable */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6" style={{ background: '#f4f6f9' }}>

          {enReparacion.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-5xl mb-3">✅</div>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#1a202c' }}>
                Sin equipos para reparar
              </p>
              <p style={{ color: '#718096', fontSize: 13, marginTop: 6 }}>
                No hay arneses ni poleas marcados como "Para reparar" en este sector.
              </p>
            </div>
          ) : (
            /* Contenido que se va a imprimir */
            <div id="reporte-reparaciones" style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>

              {/* Encabezado del reporte */}
              <div className="header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '24px 28px 18px', borderBottom: '3px solid #0d9e96' }}>
                <div>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 18, color: '#0d9e96' }}>
                    Equipos en Reparación
                  </p>
                  <p style={{ fontSize: 12, color: '#718096', marginTop: 3 }}>
                    Aventura en Altura · Ptatanka SRL · Carlos Paz, Córdoba
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 13, color: '#4a5568' }}>{hoy}</p>
                  <span style={{ display: 'inline-block', background: '#0d9e96', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, marginTop: 6 }}>
                    {SECTOR_LABEL[sector] ?? sector}
                  </span>
                </div>
              </div>

              {/* Resumen */}
              <div style={{ display: 'flex', gap: 24, padding: '14px 28px', background: '#f8fafb', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: 28, fontWeight: 900, color: '#e07820', lineHeight: 1 }}>{enReparacion.length}</p>
                  <p style={{ fontSize: 10, color: '#718096', textTransform: 'uppercase', letterSpacing: 1 }}>TOTAL EQUIPOS</p>
                </div>
                {Object.entries(porTipo).map(([tipo, items]) => (
                  <div key={tipo}>
                    <p style={{ fontSize: 22, fontWeight: 900, color: '#0d9e96', lineHeight: 1 }}>{items.length}</p>
                    <p style={{ fontSize: 10, color: '#718096', textTransform: 'uppercase', letterSpacing: 1 }}>
                      {tipo === 'arnes' ? 'Arneses' : tipo === 'polea' ? 'Poleas' : tipo}
                    </p>
                  </div>
                ))}
              </div>

              {/* Tablas por tipo */}
              {Object.entries(porTipo).map(([tipo, items]) => (
                <div key={tipo} style={{ padding: '0 28px', marginTop: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#718096', marginBottom: 10, borderBottom: '1px solid #e2e8f0', paddingBottom: 6 }}>
                    {TIPO_LABEL[tipo] ?? tipo}s
                  </p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 8 }}>
                    <thead>
                      <tr>
                        <th style={{ background: '#f0fdfb', color: '#0a8880', fontWeight: 700, textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #0d9e96', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, width: 60 }}>N°</th>
                        <th style={{ background: '#f0fdfb', color: '#0a8880', fontWeight: 700, textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #0d9e96', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Equipo</th>
                        <th style={{ background: '#f0fdfb', color: '#0a8880', fontWeight: 700, textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #0d9e96', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Problema / Historial</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((eq, i) => {
                        // Último evento de historial como problema principal
                        const ultimoEvento = eq.historial.length > 0 ? [...eq.historial].reverse()[0] : null
                        const problema = eq.observaciones || ultimoEvento?.accion || '—'

                        return (
                          <tr key={eq.id} style={{ background: i % 2 === 1 ? '#fafafa' : 'white' }}>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f0f4f7', verticalAlign: 'top' }}>
                              <p style={{ fontSize: 18, fontWeight: 900, color: '#0d9e96', lineHeight: 1 }}>
                                #{eq.numero_interno}
                              </p>
                            </td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f0f4f7', verticalAlign: 'top' }}>
                              <p style={{ fontWeight: 700, color: '#1a202c', fontSize: 13 }}>{eq.marca} {eq.modelo}</p>
                              <p style={{ color: '#718096', fontSize: 11, marginTop: 2 }}>S/N {eq.numero_serie || '—'}</p>
                            </td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f0f4f7', verticalAlign: 'top', maxWidth: 280 }}>
                              <p style={{ color: '#c2410c', fontSize: 12, lineHeight: 1.5 }}>{problema}</p>
                              {/* Historial adicional */}
                              {eq.historial.length > 1 && (
                                <div style={{ marginTop: 6 }}>
                                  {[...eq.historial].reverse().slice(1, 3).map((h, hi) => (
                                    <div key={hi} style={{ background: '#fff7ed', borderLeft: '3px solid #f97316', padding: '4px 8px', borderRadius: '0 4px 4px 0', marginTop: 4, fontSize: 11, color: '#92400e' }}>
                                      <span style={{ fontWeight: 700 }}>{h.fecha}</span> — {h.accion}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ))}

              {/* Sección de firmas */}
              <div style={{ margin: '24px 28px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                <div>
                  <div style={{ borderTop: '1px solid #cbd5e0', paddingTop: 6 }}>
                    <p style={{ fontSize: 11, color: '#718096' }}>Responsable de mantenimiento</p>
                  </div>
                </div>
                <div>
                  <div style={{ borderTop: '1px solid #cbd5e0', paddingTop: 6 }}>
                    <p style={{ fontSize: 11, color: '#718096' }}>Fecha de entrega al taller</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ marginTop: 28, padding: '12px 28px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#a0aec0' }}>
                <p>Aventura en Altura · Sistema de Mantenimiento</p>
                <p>Impreso el {hoy}</p>
              </div>

            </div>
          )}
        </div>

        {/* Footer del modal */}
        <div className="flex gap-3 px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid #e2e8f0' }}>
          <button onClick={onCerrar}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: '#f3f4f6', color: '#6b7280' }}>
            Cerrar
          </button>
          <button onClick={imprimir} disabled={enReparacion.length === 0}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: '#0d9e96' }}>
            🖨️ Imprimir / Guardar PDF
          </button>
        </div>
      </div>
    </div>
  )
}
