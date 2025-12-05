import React from 'react'
import { Clock, MapPin, Book } from 'lucide-react'
import Card from './Card'

const DashboardView = ({ schedule = [], onNavigate, user }) => (
  <div className="space-y-6 pb-24">
    <div className="bg-slate-800 p-6 rounded-b-3xl text-white shadow-lg -mt-4 pt-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold">Bienvenido, {user.name}</h2>
          <p className="text-slate-300 text-sm">Eficiencia de hoy: 85%</p>
        </div>
        <div className="bg-emerald-500 px-3 py-1 rounded-full text-xs font-bold shadow-lg">EN TIEMPO</div>
      </div>
      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="text-emerald-400" size={20} />
          <h3 className="font-bold text-sm uppercase tracking-wide text-emerald-100">Próxima Actividad</h3>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-2xl font-bold">Cálculo III</p>
            <p className="text-sm text-slate-300">Edificio C, Sala 302 • 11:30 hrs</p>
          </div>
          <button onClick={() => onNavigate('map')} className="bg-white text-slate-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">
            Ver Ruta
          </button>
        </div>
      </div>
    </div>
    <div className="px-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-700 text-lg">Resumen Logístico</h3>
        <button className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border hover:bg-slate-200">+ Nuevo Evento</button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {schedule.map((item, idx) => (
          <div key={idx} className={`min-w-[150px] p-3 rounded-xl border relative overflow-hidden ${item.status === 'break' ? 'bg-stripes-gray border-slate-200' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-mono text-slate-500">{item.time}</span>
              {item.status === 'break' && <Clock size={14} className="text-slate-400" />}
            </div>
            <p className="font-bold text-slate-800 text-sm leading-tight">{item.subject}</p>
            <p className="text-xs text-slate-400 mt-1">{item.room}</p>
            {item.status === 'break' && (
              <div className="absolute bottom-0 left-0 right-0 bg-emerald-50 p-1.5 text-[10px] text-center text-emerald-700 font-bold border-t border-emerald-100">
                OPORTUNIDAD DE ESTUDIO
              </div>
            )}
          </div>
        ))}
      </div>
      <h3 className="font-bold text-slate-700 text-lg mt-4">Accesos Directos</h3>
      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col items-center justify-center gap-2 hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-all">
          <div className="bg-blue-100 p-2 rounded-full text-blue-600">
            <Book size={20} />
          </div>
          <span className="text-sm font-bold text-slate-600">Mis Notas</span>
        </Card>
        <Card className="flex flex-col items-center justify-center gap-2 hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-all">
          <div className="bg-purple-100 p-2 rounded-full text-purple-600">
            <MapPin size={20} />
          </div>
          <span className="text-sm font-bold text-slate-600">Buscar Sala</span>
        </Card>
      </div>
    </div>
  </div>
)

export default DashboardView
