'use client'
import InventarioPage from '@/app/inventario/page'
import { use } from 'react'

export default function InventarioSectorPage({ params }: { params: Promise<{ sector: string }> }) {
  const { sector } = use(params)
  return <InventarioPage sector={sector} />
}
