import React, { useState, useEffect } from 'react'
import { MapPin, Navigation, Clock, X, Eye, Sparkles } from 'lucide-react'
import campusImage from '../assets/img/ubicate.png'

// Función para convertir coordenadas del backend (0,0 = esquina inferior izquierda)
// a coordenadas CSS (0,0 = esquina superior izquierda)
const convertirCoordenadas = (x, y) => {
  // x se mantiene igual (izquierda a derecha)
  // y se invierte (100 - y) porque CSS va de arriba a abajo
  return {
    left: `${x}%`,
    top: `${100 - y}%`
  }
}

// Función para obtener el ícono según el tipo de evento
const getEventIcon = (evento) => {
  const titulo = (evento.title || evento.titulo || '').toLowerCase()
  if (titulo.includes('hackathon') || titulo.includes('programa')) return '💻'
  if (titulo.includes('ayudantía') || titulo.includes('clase')) return '📚'
  if (titulo.includes('reunión') || titulo.includes('meeting')) return '👥'
  if (titulo.includes('taller') || titulo.includes('workshop')) return '🛠️'
  if (titulo.includes('conferencia') || titulo.includes('charla')) return '🎤'
  if (titulo.includes('deporte') || titulo.includes('partido')) return '⚽'
  return '📍'
}

// Función para preparar eventos para el mapa
const prepararEventosParaMapa = (events) => {
  return events
    .filter(evt => {
      // Verificar si tiene coordenadas (ya sea en ubicacion o directamente)
      const coords = evt.ubicacion?.coordenadas || evt.coordenadas
      return coords && typeof coords.x === 'number' && typeof coords.y === 'number'
    })
    .map(evt => {
      const coords = evt.ubicacion?.coordenadas || evt.coordenadas
      const posicion = convertirCoordenadas(coords.x, coords.y)
      
      return {
        ...evt,
        position: posicion,
        icon: evt.icon || getEventIcon(evt),
        label: evt.label || evt.title || evt.titulo,
        locationName: evt.ubicacion?.nombre || evt.location || 'Campus'
      }
    })
}

const MapView = ({ userRole, events = [], eventoResaltado = null, onEventoResaltadoVisto }) => {
  // Estado para el evento seleccionado
  const [selectedEventId, setSelectedEventId] = useState(null)
  
  // Preparar eventos con coordenadas convertidas
  const eventosEnMapa = prepararEventosParaMapa(events)
  
  // Efecto para resaltar evento sugerido cuando llega
  useEffect(() => {
    if (eventoResaltado) {
      // Buscar el evento por ubicación similar o crear uno temporal
      const eventoEnMapa = eventosEnMapa.find(evt => 
        evt.locationName?.toLowerCase().includes(eventoResaltado.ubicacion?.toLowerCase()) ||
        evt.label?.toLowerCase().includes(eventoResaltado.titulo?.toLowerCase())
      )
      
      if (eventoEnMapa) {
        setSelectedEventId(eventoEnMapa.id)
      }
      
      // Limpiar después de un tiempo
      if (onEventoResaltadoVisto) {
        setTimeout(() => onEventoResaltadoVisto(), 5000)
      }
    }
  }, [eventoResaltado, eventosEnMapa, onEventoResaltadoVisto])
  
  // Filtrar eventos a mostrar en el mapa
  const eventosVisibles = selectedEventId 
    ? eventosEnMapa.filter(evt => evt.id === selectedEventId)
    : eventosEnMapa
  
  // Obtener evento seleccionado para mostrar info
  const eventoSeleccionado = selectedEventId 
    ? eventosEnMapa.find(evt => evt.id === selectedEventId)
    : null
  
  return (
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

      {/* Banner de evento sugerido por Gemini */}
      {eventoResaltado && (
        <div className="rounded-[32px] bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 border border-purple-300 shadow-lg p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-200">
                Evento sugerido por Gemini
              </p>
              <p className="text-lg font-bold text-white">{eventoResaltado.titulo}</p>
              <p className="text-sm text-purple-100">{eventoResaltado.ubicacion}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de eventos activos */}
      {eventosEnMapa.length > 0 && (
        <div className="rounded-[32px] bg-white border border-slate-200/70 shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Eventos en el campus ({eventosEnMapa.length})
            </p>
            {selectedEventId && (
              <button 
                onClick={() => setSelectedEventId(null)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-full flex items-center gap-1 transition-colors"
              >
                <Eye size={12} /> Ver todos
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {eventosEnMapa.map((evt) => (
              <div 
                key={evt.id} 
                onClick={() => setSelectedEventId(selectedEventId === evt.id ? null : evt.id)}
                className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                  selectedEventId === evt.id 
                    ? 'bg-emerald-100 border-2 border-emerald-500 shadow-md' 
                    : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                }`}
              >
                <span className="text-xl">{evt.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${selectedEventId === evt.id ? 'text-emerald-800' : 'text-slate-800'}`}>
                    {evt.label}
                  </p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <MapPin size={10} /> {evt.locationName}
                    </span>
                    {evt.time && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {evt.time}
                      </span>
                    )}
                  </p>
                </div>
                {selectedEventId === evt.id && (
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <MapPin size={12} className="text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative w-full h-[510px] rounded-[36px] overflow-hidden border border-slate-900/20 shadow-[0_30px_60px_rgba(15,23,42,0.25)]">
        <img src={campusImage} alt="Mapa del campus" className="absolute inset-0 w-full h-full object-cover" />
        
        {/* Info del evento seleccionado */}
        {eventoSeleccionado && (
          <div className="absolute top-4 left-4 right-4 z-30 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-4 border border-slate-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">
                  {eventoSeleccionado.icon}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{eventoSeleccionado.label}</p>
                  <p className="text-sm text-slate-500">{eventoSeleccionado.locationName}</p>
                  {eventoSeleccionado.time && (
                    <p className="text-xs text-emerald-600 font-semibold mt-1">
                      📅 {eventoSeleccionado.date} · {eventoSeleccionado.time}
                    </p>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setSelectedEventId(null)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
          </div>
        )}
        
        {/* Marcadores de eventos en el mapa */}
        <div className="absolute inset-0 pointer-events-none">
          {eventosVisibles.map((evt) => (
            <div
              key={evt.id}
              className={`absolute flex flex-col items-center gap-1 transform -translate-x-1/2 -translate-y-full pointer-events-auto cursor-pointer group transition-all duration-300 ${
                selectedEventId === evt.id ? 'scale-125 z-20' : ''
              }`}
              style={{ top: evt.position.top, left: evt.position.left }}
              onClick={() => setSelectedEventId(selectedEventId === evt.id ? null : evt.id)}
            >
              {/* Tooltip con información (solo si no está seleccionado) */}
              {!selectedEventId && (
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-20">
                  <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl min-w-[150px]">
                    <p className="font-bold text-sm">{evt.label}</p>
                    <p className="text-[10px] text-slate-300">{evt.locationName}</p>
                    {evt.time && <p className="text-[10px] text-emerald-300">{evt.date} - {evt.time}</p>}
                  </div>
                  <div className="w-3 h-3 bg-slate-900 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1.5"></div>
                </div>
              )}
              
              {/* Pulso animado para evento seleccionado */}
              {selectedEventId === evt.id && (
                <div className="absolute w-16 h-16 bg-emerald-500/30 rounded-full animate-ping"></div>
              )}
              
              {/* Ícono del marcador */}
              <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 border-white shadow-[0_4px_15px_rgba(16,185,129,0.5)] text-lg transition-transform group-hover:scale-110 ${
                selectedEventId === evt.id ? 'bg-emerald-600 w-14 h-14 text-xl' : 'bg-emerald-500'
              }`}>
                {evt.icon}
              </div>
              
              {/* Etiqueta */}
              <span className={`px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap max-w-[120px] truncate ${
                selectedEventId === evt.id 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-900/80 text-white'
              }`}>
                {evt.label}
              </span>
              
              {/* Punto de anclaje */}
              <div className={`rounded-full shadow-lg ${
                selectedEventId === evt.id ? 'w-3 h-3 bg-emerald-600' : 'w-2 h-2 bg-emerald-500'
              }`}></div>
            </div>
          ))}
        </div>

        {userRole === 'Docente' && (
          <button className="absolute bottom-6 right-6 z-20 bg-white/90 text-slate-900 px-4 py-2 rounded-full shadow-[0_15px_30px_rgba(15,23,42,0.4)] text-[10px] font-semibold uppercase tracking-[0.3em] border border-slate-200/70 flex items-center gap-2 hover:bg-white transition-colors">
            <MapPin size={16} /> Crear Marcador
          </button>
        )}
      </div>
    </div>
  )
}

export default MapView
