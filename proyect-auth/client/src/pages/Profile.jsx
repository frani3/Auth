import React from 'react'
import { User } from 'lucide-react'

const Profile = ({ user, onToggleRole }) => (
  <div className="p-6 space-y-6">
    <div className="flex flex-col items-center">
      <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-4">
        <User size={40} className="text-slate-400" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
      <p className="text-slate-500">{user.program || 'Facultad de Ingeniería'}</p>
      <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded mt-2">{user.id}</span>
    </div>
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
      <h3 className="font-bold text-sm mb-3">Configuración de Prototipo</h3>
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">Simular Rol</span>
        <button
          onClick={onToggleRole}
          className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg active:scale-95 transition-transform"
        >
          Cambiar a {user.role === 'Estudiante' ? 'Profesor' : 'Estudiante'}
        </button>
      </div>
    </div>
  </div>
)

export default Profile