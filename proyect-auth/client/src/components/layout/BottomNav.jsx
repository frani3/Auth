import React from 'react'

export function BottomNav({ items, active, onSelect }) {
  return (
    <nav className="md:hidden fixed bottom-4 left-1/2 w-[min(360px,90%)] -translate-x-1/2 rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl px-3 py-2 shadow-xl">
      <div className="flex justify-between">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`flex flex-col items-center gap-1 text-xs transition-colors ${
              active === item.id ? 'text-white' : 'text-slate-500'
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}