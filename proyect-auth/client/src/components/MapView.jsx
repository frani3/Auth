import React from 'react'
import { MapPin, Navigation } from 'lucide-react'
import campusImage from '../assets/img/ubicate.png'

const MapView = ({ userRole, events = [] }) => (
  <div className="flex flex-col gap-4">
    <div className="rounded-[32px] bg-white border border-slate-200/70 shadow-[0_25px_45px_rgba(15,23,42,0.1)] p-4 space-y-4">
      <div className="rounded-3xl bg-slate-950/95 text-white px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-300">Tu ubicación</p>
        <p className="text-lg font-bold">Patio de Ingeniería</p>
      </div>
      <div className="rounded-3xl bg-slate-950/95 text-white px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Siguiente destino</p>
          <p className="text-lg font-bold">Auditorio Principal</p>
        </div>
        <span className="flex items-center gap-2 text-blue-300 text-sm font-semibold">
          <Navigation size={18} /> 3 min
        </span>
      </div>
    </div>

    <div className="relative w-full h-[510px] rounded-[36px] overflow-hidden border border-slate-900/20 shadow-[0_30px_60px_rgba(15,23,42,0.25)]">
      <img src={campusImage} alt="Mapa del campus" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 pointer-events-none">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="absolute flex flex-col items-center gap-1 text-[10px] font-semibold text-slate-100"
            style={{ top: evt.position.top, left: evt.position.left }}
          >
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-500/90 border border-white shadow-[0_12px_20px_rgba(16,185,129,0.4)] text-sm">
              {evt.icon}
            </div>
            <span className="bg-slate-950/70 px-2 py-1 rounded-full border border-white/40 text-[10px] tracking-wide">{evt.label}</span>
          </div>
        ))}
      </div>

      {userRole === 'Docente' && (
        <button className="absolute bottom-6 right-6 z-20 bg-white/90 text-slate-900 px-4 py-2 rounded-full shadow-[0_15px_30px_rgba(15,23,42,0.4)] text-[10px] font-semibold uppercase tracking-[0.3em] border border-slate-200/70 flex items-center gap-2">
          <MapPin size={16} /> Crear Marcador
        </button>
      )}
    </div>
  </div>
)

export default MapView
