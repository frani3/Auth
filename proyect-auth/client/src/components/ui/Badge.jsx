import React from 'react'

const toneStyles = {
  success: 'bg-emerald-500/20 text-emerald-200',
  info: 'bg-sky-500/20 text-sky-200',
  warning: 'bg-amber-500/20 text-amber-200'
}

export function Badge({ tone = 'info', children, className = '' }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${toneStyles[tone] ?? toneStyles.info} ${className}`}>
      {children}
    </span>
  )
}
