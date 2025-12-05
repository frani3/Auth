export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variantClasses = {
    primary: 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500',
    secondary: 'bg-slate-800 text-slate-200 hover:bg-slate-700'
  }

  return (
    <button
      {...props}
      className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${variantClasses[variant] ?? variantClasses.primary} ${className}`}
    >
      {children}
    </button>
  )
}
