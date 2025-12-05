import React from 'react'
import { Badge } from '../ui/Badge'

export function Sidebar({ items, active, onSelect }) {
  return (
    <aside className="hidden md:flex w-64 flex-col bg-slate-900 border-r border-slate-800 px-6 py-8 space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Auth Hub</p>
        <div className="mt-4 flex items-center gap-2">
          <h1 className="text-xl font-semibold">Panel</h1>
          <Badge tone="success">Beta</Badge>
        </div>
        <p className="text-sm text-slate-400">Coordinación frontend y servicios.</p>
      </div>

      <nav className="flex-1 space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
              active === item.id
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800/40'
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="text-xs text-slate-500">
        <p>Integrante Frontend</p>
        <p className="text-slate-400">Nombre: React Vite</p>
      </div>
    </aside>
  )
}