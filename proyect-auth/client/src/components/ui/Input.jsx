export function Input(props) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
    />
  )
}
