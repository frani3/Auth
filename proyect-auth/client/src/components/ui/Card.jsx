export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-900/40 ${className}`}>
      {children}
    </div>
  )
}
