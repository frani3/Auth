import React, { useState } from 'react'
import { Loader2, Zap, BrainCircuit, TrendingUp, MapPin, Calendar, Clock, Sparkles, Info, X, CalendarPlus, BookOpen } from 'lucide-react'
import Card from './Card'
import { callGeminiAPI } from '../api/gemini'
import { detectarVentanas } from '../services/backendApi'

// Días de la semana (abreviados para el header)
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']
const DIAS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

// Colores para cada materia (se asignan dinámicamente)
const COLORES_MATERIAS = [
  { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800' },
  { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800' },
  { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800' },
  { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800' },
  { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800' },
  { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-800' },
  { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800' },
  { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-800' },
]

// Componente para mostrar el horario en formato grilla vertical
const ScheduleGrid = ({ schedule, eventos = [], eventosSugeridos = [], conceptLoading, subjectConcepts, handleGetConcepts, onNavigateToAssistant, onVerUbicacion, onPedirInfo, onSugerirEvento, onSugerirActividad }) => {
  const [selectedClass, setSelectedClass] = useState(null)
  const [menuEventoAbierto, setMenuEventoAbierto] = useState(null) // ID del evento con menú abierto
  const [generandoActividad, setGenerandoActividad] = useState(null) // ID de ventana generando actividad

  // Obtener día actual y fecha
  const getDiaActual = () => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return dias[new Date().getDay()]
  }
  const diaActual = getDiaActual()
  const diaActualIndex = DIAS_FULL.indexOf(diaActual)
  const fechaHoy = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // Detectar ventanas en el horario
  const ventanas = detectarVentanas(schedule)
  const ventanasHoy = ventanas.filter(v => v.dia === diaActual)

  // Convertir hora "HH:MM" a minutos desde medianoche
  const timeToMinutes = (time) => {
    if (!time) return 0
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }

  // Encontrar eventos que coinciden con ventanas de HOY
  const encontrarEventoEnVentana = (ventana) => {
    if (!eventos || eventos.length === 0) return null
    
    const ventanaInicio = timeToMinutes(ventana.inicio)
    const ventanaFin = timeToMinutes(ventana.fin)
    
    // Buscar evento de hoy cuya hora esté dentro de la ventana
    return eventos.find(evento => {
      // Verificar que sea del día de hoy
      if (evento.date !== fechaHoy) return false
      
      const eventoHora = timeToMinutes(evento.time)
      // El evento debe empezar dentro de la ventana
      return eventoHora >= ventanaInicio && eventoHora < ventanaFin
    })
  }
  
  // Encontrar evento SUGERIDO por Gemini que coincida con una ventana
  const encontrarEventoSugeridoEnVentana = (ventana, dia) => {
    if (!eventosSugeridos || eventosSugeridos.length === 0) return null
    
    const ventanaInicio = timeToMinutes(ventana.inicio)
    const ventanaFin = timeToMinutes(ventana.fin)
    
    // Buscar evento sugerido para este día y dentro de la ventana
    return eventosSugeridos.find(evento => {
      if (evento.dia !== dia) return false
      const eventoHora = timeToMinutes(evento.hora)
      return eventoHora >= ventanaInicio && eventoHora < ventanaFin
    })
  }
  
  // Encontrar evento DISPONIBLE del backend que calce en una ventana
  const encontrarEventoDisponibleParaVentana = (ventana, dia) => {
    if (!eventos || eventos.length === 0) return null
    
    const ventanaInicio = timeToMinutes(ventana.inicio)
    const ventanaFin = timeToMinutes(ventana.fin)
    
    // Buscar evento que calce en la ventana (por hora, no por fecha específica)
    return eventos.find(evento => {
      const eventoHora = timeToMinutes(evento.time)
      // El evento debe caber dentro de la ventana
      return eventoHora >= ventanaInicio && eventoHora < ventanaFin
    })
  }
  
  // Encontrar la clase siguiente después de una ventana
  const encontrarClaseSiguiente = (ventana, dia) => {
    const ventanaFin = timeToMinutes(ventana.fin)
    const clasesDelDia = schedule.filter(c => c.day === dia)
    
    // Ordenar por hora de inicio
    const clasesOrdenadas = clasesDelDia.sort((a, b) => 
      timeToMinutes(a.time) - timeToMinutes(b.time)
    )
    
    // Encontrar la primera clase que empiece después de la ventana
    return clasesOrdenadas.find(c => timeToMinutes(c.time) >= ventanaFin)
  }
  
  // Generar actividad sugerida con Gemini
  const generarActividadSugerida = async (ventana, dia) => {
    const ventanaId = `${dia}-${ventana.inicio}`
    setGenerandoActividad(ventanaId)
    
    try {
      const claseSiguiente = encontrarClaseSiguiente(ventana, dia)
      const clasesDelDia = schedule.filter(c => c.day === dia)
      
      const prompt = `Eres un asistente universitario. Un estudiante tiene ${ventana.duracion} minutos libres el ${dia} de ${ventana.inicio} a ${ventana.fin}.
      
${claseSiguiente ? `Su siguiente clase es: ${claseSiguiente.subject} a las ${claseSiguiente.time}` : 'No tiene más clases ese día.'}

Clases del día: ${clasesDelDia.map(c => `${c.subject} (${c.time})`).join(', ')}

Sugiere UNA actividad productiva breve. Responde SOLO con un JSON así:
{"titulo": "Nombre corto de la actividad", "descripcion": "Descripción de 1 línea"}`

      const result = await callGeminiAPI(prompt, "Asistente universitario. Responde SOLO JSON válido.")
      
      if (result && result.titulo) {
        // Crear el evento sugerido
        const actividadSugerida = {
          titulo: result.titulo,
          descripcion: result.descripcion || '',
          dia: dia,
          hora: ventana.inicio,
          ubicacion: 'Campus',
          esActividad: true // Marcar como actividad generada
        }
        
        if (onSugerirActividad) {
          onSugerirActividad(actividadSugerida)
        }
      }
    } catch (error) {
      console.error('Error generando actividad:', error)
    } finally {
      setGenerandoActividad(null)
    }
  }

  // Encontrar rango de horas (mínima y máxima)
  let minHour = 24, maxHour = 0
  schedule.forEach(c => {
    const startMin = timeToMinutes(c.time)
    const endMin = timeToMinutes(c.endTime)
    if (startMin > 0) minHour = Math.min(minHour, Math.floor(startMin / 60))
    if (endMin > 0) maxHour = Math.max(maxHour, Math.ceil(endMin / 60))
  })
  
  // Default: 8:00 - 20:00 si no hay datos
  if (minHour > maxHour) { minHour = 8; maxHour = 20 }
  
  // Si hay ventanas de fin de día HOY, extender la grilla hasta las 20:00
  const tieneVentanaFinDiaHoy = ventanasHoy.some(v => v.tipo === 'fin_dia')
  if (tieneVentanaFinDiaHoy && maxHour < 20) {
    maxHour = 20
  }
  
  // Generar array de horas para mostrar
  const horas = []
  for (let h = minHour; h <= maxHour; h++) {
    horas.push(h)
  }

  // Asignar colores a materias
  const materias = [...new Set(schedule.map(c => c.subject))]
  const colorMap = {}
  materias.forEach((m, i) => {
    colorMap[m] = COLORES_MATERIAS[i % COLORES_MATERIAS.length]
  })

  // Agrupar clases por día
  const classesByDay = {}
  DIAS_FULL.forEach(d => { classesByDay[d] = [] })
  schedule.forEach(c => {
    const dia = c.day
    if (classesByDay[dia]) classesByDay[dia].push(c)
  })

  // Altura por hora en píxeles
  const HORA_HEIGHT = 60
  const totalHeight = (maxHour - minHour + 1) * HORA_HEIGHT

  if (schedule.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Calendar size={48} className="mx-auto mb-3 opacity-50" />
        <p className="font-medium">No hay horario disponible</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Grilla del horario */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Header con días */}
        <div className="grid grid-cols-[40px_repeat(5,1fr)] bg-slate-50 border-b border-slate-200">
          <div className="p-2 text-center">
            <Clock size={14} className="mx-auto text-slate-400" />
          </div>
          {DIAS.map((dia, i) => (
            <div key={dia} className="p-2 text-center border-l border-slate-200">
              <span className="text-xs font-bold text-slate-600">{dia}</span>
            </div>
          ))}
        </div>

        {/* Cuerpo de la grilla */}
        <div className="grid grid-cols-[40px_repeat(5,1fr)] relative" style={{ height: totalHeight }}>
          {/* Columna de horas */}
          <div className="relative border-r border-slate-100">
            {horas.map((h, i) => (
              <div 
                key={h} 
                className="absolute w-full text-right pr-1 text-[10px] text-slate-400 font-medium"
                style={{ top: i * HORA_HEIGHT - 6 }}
              >
                {h}:00
              </div>
            ))}
          </div>

          {/* Columnas de días */}
          {DIAS_FULL.map((diaFull, diaIndex) => {
            // Ventanas de este día
            const ventanasDelDia = ventanas.filter(v => v.dia === diaFull)
            const esHoy = diaFull === diaActual
            
            return (
            <div key={diaFull} className={`relative border-l ${esHoy ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100'}`}>
              {/* Líneas de hora */}
              {horas.map((h, i) => (
                <div 
                  key={h}
                  className={`absolute w-full border-t ${esHoy ? 'border-blue-100' : 'border-slate-100'}`}
                  style={{ top: i * HORA_HEIGHT }}
                />
              ))}

              {/* Ventanas (espacios libres) - Mostrar evento real, sugerido por Gemini, o botón Gemini */}
              {ventanasDelDia.map((ventana, vIdx) => {
                const startMin = timeToMinutes(ventana.inicio)
                const endMin = timeToMinutes(ventana.fin)
                const top = ((startMin / 60) - minHour) * HORA_HEIGHT
                const height = ((endMin - startMin) / 60) * HORA_HEIGHT
                
                // Limitar altura visual para ventanas muy largas (fin de día)
                const esFinDeDia = ventana.tipo === 'fin_dia'
                const displayHeight = esFinDeDia ? Math.min(height, 120) : height
                
                // Buscar evento REAL que coincida con esta ventana (solo para hoy)
                const eventoReal = esHoy ? encontrarEventoEnVentana(ventana) : null
                
                // Buscar evento SUGERIDO por Gemini para esta ventana
                const eventoSugeridoGemini = encontrarEventoSugeridoEnVentana(ventana, diaFull)
                
                // IDs únicos para el menú de eventos
                const eventoRealId = eventoReal ? `real-${diaFull}-${vIdx}` : null
                const eventoSugeridoId = eventoSugeridoGemini ? `sug-${diaFull}-${vIdx}` : null
                const menuRealAbierto = menuEventoAbierto === eventoRealId
                const menuSugeridoAbierto = menuEventoAbierto === eventoSugeridoId

                return (
                  <div
                    key={`ventana-${vIdx}`}
                    className={`absolute left-0.5 right-0.5 rounded-md border-2 ${
                      eventoReal 
                        ? 'border-solid border-amber-400 bg-amber-50/70'
                        : eventoSugeridoGemini
                          ? 'border-solid border-indigo-400 bg-gradient-to-br from-indigo-50 to-purple-50'
                          : `border-dashed ${
                              esHoy 
                                ? esFinDeDia 
                                  ? 'border-emerald-300 bg-emerald-50/50' 
                                  : 'border-purple-300 bg-purple-50/50' 
                                : 'border-slate-200 bg-slate-50/30'
                            }`
                    } flex flex-col items-center justify-center overflow-visible`}
                    style={{ top: top + 1, height: displayHeight - 2, minHeight: 20, zIndex: (menuRealAbierto || menuSugeridoAbierto) ? 50 : 1 }}
                  >
                    {/* Si hay evento REAL, mostrarlo con menú */}
                    {eventoReal ? (
                      <div className="relative flex flex-col items-center gap-0.5 p-1 text-center w-full h-full">
                        <button
                          onClick={() => setMenuEventoAbierto(menuRealAbierto ? null : eventoRealId)}
                          className="flex flex-col items-center gap-0.5 w-full hover:scale-105 transition-transform"
                        >
                          <div className="flex items-center gap-1">
                            <Calendar size={12} className="text-amber-600" />
                            <span className="text-[8px] font-bold text-amber-700 uppercase tracking-wide">Evento</span>
                          </div>
                          <p className="text-[10px] font-bold text-amber-800 leading-tight truncate w-full px-1">
                            {eventoReal.title}
                          </p>
                          {displayHeight > 50 && (
                            <p className="text-[8px] text-amber-600 flex items-center gap-0.5">
                              <Clock size={8} /> {eventoReal.time}
                            </p>
                          )}
                          {displayHeight > 65 && eventoReal.location && (
                            <p className="text-[7px] text-amber-500 flex items-center gap-0.5 truncate w-full px-1">
                              <MapPin size={7} /> {eventoReal.location}
                            </p>
                          )}
                        </button>
                        
                        {/* Menú de opciones para evento REAL */}
                        {menuRealAbierto && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 z-50 min-w-[140px] overflow-hidden">
                            <button
                              onClick={() => {
                                setMenuEventoAbierto(null)
                                // Convertir evento real a formato compatible
                                const eventoParaMapa = {
                                  titulo: eventoReal.title,
                                  ubicacion: eventoReal.location,
                                  hora: eventoReal.time,
                                  dia: diaFull
                                }
                                onVerUbicacion && onVerUbicacion(eventoParaMapa)
                              }}
                              className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-amber-50 flex items-center gap-2"
                            >
                              <MapPin size={14} className="text-amber-500" />
                              Ver ubicación
                            </button>
                            <button
                              onClick={() => {
                                setMenuEventoAbierto(null)
                                const eventoParaInfo = {
                                  titulo: eventoReal.title,
                                  ubicacion: eventoReal.location,
                                  hora: eventoReal.time,
                                  dia: diaFull,
                                  descripcion: eventoReal.description
                                }
                                onPedirInfo && onPedirInfo(eventoParaInfo)
                              }}
                              className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-amber-50 flex items-center gap-2 border-t border-slate-100"
                            >
                              <Info size={14} className="text-amber-600" />
                              Más información
                            </button>
                            <button
                              onClick={() => setMenuEventoAbierto(null)}
                              className="w-full px-3 py-2 text-left text-xs font-medium text-slate-400 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                            >
                              <X size={14} />
                              Cerrar
                            </button>
                          </div>
                        )}
                      </div>
                    ) : eventoSugeridoGemini ? (
                      /* Evento SUGERIDO por Gemini - con ícono y menú */
                      <div className="relative flex flex-col items-center gap-0.5 p-1 text-center w-full h-full">
                        <button
                          onClick={() => setMenuEventoAbierto(menuSugeridoAbierto ? null : eventoSugeridoId)}
                          className="flex flex-col items-center gap-0.5 w-full hover:scale-105 transition-transform"
                        >
                          <div className="flex items-center gap-1">
                            <Sparkles size={12} className="text-indigo-600" />
                            <span className="text-[8px] font-bold text-indigo-700 uppercase tracking-wide">Sugerido</span>
                          </div>
                          <p className="text-[10px] font-bold text-indigo-800 leading-tight truncate w-full px-1">
                            {eventoSugeridoGemini.titulo}
                          </p>
                          {displayHeight > 50 && (
                            <p className="text-[8px] text-indigo-600 flex items-center gap-0.5">
                              <Clock size={8} /> {eventoSugeridoGemini.hora}
                            </p>
                          )}
                          {displayHeight > 65 && eventoSugeridoGemini.ubicacion && (
                            <p className="text-[7px] text-indigo-500 flex items-center gap-0.5 truncate w-full px-1">
                              <MapPin size={7} /> {eventoSugeridoGemini.ubicacion}
                            </p>
                          )}
                        </button>
                        
                        {/* Menú de opciones */}
                        {menuSugeridoAbierto && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 z-50 min-w-[140px] overflow-hidden">
                            <button
                              onClick={() => {
                                setMenuEventoAbierto(null)
                                onVerUbicacion && onVerUbicacion(eventoSugeridoGemini)
                              }}
                              className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-indigo-50 flex items-center gap-2"
                            >
                              <MapPin size={14} className="text-indigo-500" />
                              Ver ubicación
                            </button>
                            <button
                              onClick={() => {
                                setMenuEventoAbierto(null)
                                onPedirInfo && onPedirInfo(eventoSugeridoGemini)
                              }}
                              className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-purple-50 flex items-center gap-2 border-t border-slate-100"
                            >
                              <Info size={14} className="text-purple-500" />
                              Más información
                            </button>
                            <button
                              onClick={() => setMenuEventoAbierto(null)}
                              className="w-full px-3 py-2 text-left text-xs font-medium text-slate-400 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                            >
                              <X size={14} />
                              Cerrar
                            </button>
                          </div>
                        )}
                      </div>
                    ) : displayHeight > 40 ? (
                      /* Ventana sin evento - mostrar botones de sugerir */
                      (() => {
                        const eventoDisponible = encontrarEventoDisponibleParaVentana(ventana, diaFull)
                        const ventanaId = `${diaFull}-${ventana.inicio}`
                        const estaGenerando = generandoActividad === ventanaId
                        
                        return (
                          <div className="flex flex-col items-center gap-1 p-1 w-full">
                            <span className={`text-[8px] font-medium ${esFinDeDia ? 'text-emerald-600' : 'text-purple-600'}`}>
                              {ventana.duracion} min libres
                            </span>
                            
                            {/* Botón principal según si hay evento disponible */}
                            {eventoDisponible ? (
                              <button
                                onClick={() => {
                                  // Crear sugerencia basada en evento existente
                                  const sugerencia = {
                                    titulo: eventoDisponible.title || eventoDisponible.titulo,
                                    descripcion: eventoDisponible.description || '',
                                    dia: diaFull,
                                    hora: ventana.inicio,
                                    ubicacion: eventoDisponible.location || eventoDisponible.ubicacion?.nombre || 'Campus',
                                    esEvento: true
                                  }
                                  onSugerirEvento && onSugerirEvento(sugerencia)
                                }}
                                className="flex items-center gap-1 px-2 py-1 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors"
                              >
                                <CalendarPlus size={12} className="text-amber-600" />
                                <span className="text-[8px] font-bold text-amber-700">Sugerir evento</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => generarActividadSugerida(ventana, diaFull)}
                                disabled={estaGenerando}
                                className="flex items-center gap-1 px-2 py-1 bg-purple-100 hover:bg-purple-200 rounded-md transition-colors disabled:opacity-50"
                              >
                                {estaGenerando ? (
                                  <Loader2 size={12} className="text-purple-600 animate-spin" />
                                ) : (
                                  <BookOpen size={12} className="text-purple-600" />
                                )}
                                <span className="text-[8px] font-bold text-purple-700">
                                  {estaGenerando ? 'Generando...' : 'Sugerir actividad'}
                                </span>
                              </button>
                            )}
                            
                            {/* Botón secundario para ir al asistente */}
                            {displayHeight > 70 && onNavigateToAssistant && (
                              <button
                                onClick={() => onNavigateToAssistant(ventana)}
                                className="flex items-center gap-1 px-1.5 py-0.5 text-[7px] text-slate-500 hover:text-purple-600 transition-colors"
                              >
                                <Sparkles size={10} />
                                Hablar con Gemini
                              </button>
                            )}
                          </div>
                        )
                      })()
                    ) : (
                      <span className={`text-[8px] ${esFinDeDia ? 'text-emerald-500' : 'text-purple-500'} font-medium`}>
                        {ventana.duracion} min
                      </span>
                    )}
                  </div>
                )
              })}

              {/* Clases del día */}
              {classesByDay[diaFull].map((clase, idx) => {
                const startMin = timeToMinutes(clase.time)
                const endMin = timeToMinutes(clase.endTime)
                const top = ((startMin / 60) - minHour) * HORA_HEIGHT
                const height = ((endMin - startMin) / 60) * HORA_HEIGHT
                const colors = colorMap[clase.subject]

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedClass(selectedClass?.time === clase.time && selectedClass?.day === clase.day ? null : clase)}
                    className={`absolute left-0.5 right-0.5 rounded-md border ${colors.bg} ${colors.border} cursor-pointer hover:shadow-md transition-shadow overflow-hidden`}
                    style={{ top: top + 1, height: height - 2, minHeight: 20 }}
                  >
                    <div className="p-1 h-full flex flex-col">
                      <p className={`text-[9px] font-bold ${colors.text} leading-tight truncate`}>
                        {clase.subject}
                      </p>
                      {height > 35 && (
                        <p className="text-[8px] text-slate-500 truncate flex items-center gap-0.5">
                          <MapPin size={8} /> {clase.room}
                        </p>
                      )}
                      {height > 50 && (
                        <p className="text-[8px] text-slate-400 mt-auto">
                          {clase.time}-{clase.endTime}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )})}
        </div>
      </div>

      {/* Panel de detalle de clase seleccionada */}
      {selectedClass && (
        <Card className={`border-l-4 ${colorMap[selectedClass.subject]?.border || 'border-slate-300'} animate-fade-in`}>
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-slate-800">{selectedClass.subject}</h4>
              <p className="text-sm text-slate-500">{selectedClass.day} · {selectedClass.time} - {selectedClass.endTime}</p>
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                <MapPin size={12} /> {selectedClass.room}
              </p>
              {selectedClass.sala?.edificioNombre && (
                <p className="text-xs text-slate-400">{selectedClass.sala.edificioNombre}</p>
              )}
            </div>
            <button 
              onClick={() => setSelectedClass(null)}
              className="text-slate-400 hover:text-slate-600 text-lg"
            >
              ×
            </button>
          </div>

          {/* Conceptos clave */}
          <div className="mt-3">
            {!subjectConcepts[selectedClass.subject] ? (
              <button
                onClick={() => handleGetConcepts(selectedClass.subject)}
                disabled={conceptLoading[selectedClass.subject]}
                className="flex items-center gap-2 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                {conceptLoading[selectedClass.subject] ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                Conceptos Clave
              </button>
            ) : (
              <div className="bg-blue-50 p-2 rounded border border-blue-100">
                <p className="text-[10px] font-bold text-blue-700 mb-1 flex items-center gap-1">
                  <BrainCircuit size={10} /> Foco de Estudio:
                </p>
                <div className="flex flex-wrap gap-1">
                  {subjectConcepts[selectedClass.subject].map((c, i) => (
                    <span key={i} className="text-[10px] bg-white text-slate-600 px-1.5 py-0.5 rounded shadow-sm border border-blue-100">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Leyenda de materias */}
      <div className="flex flex-wrap gap-2 px-1">
        {materias.map(m => (
          <div key={m} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded ${colorMap[m].bg} ${colorMap[m].border} border`}></div>
            <span className="text-[10px] text-slate-500">{m}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const AcademicView = ({ grades = [], attendance = [], schedule = [], eventos = [], eventosSugeridos = [], onNavigateToAssistant, onVerUbicacion, onPedirInfo, onSugerirEvento, onSugerirActividad }) => {
  const [subTab, setSubTab] = useState('schedule')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [conceptLoading, setConceptLoading] = useState({})
  const [subjectConcepts, setSubjectConcepts] = useState({})

  const handleAnalyzePerformance = async () => {
    setIsAnalyzing(true)
    const prompt = `Analiza notas: ${JSON.stringify(grades)}. Diagnóstico breve.`
    const system = "Coach. JSON con 'analysis_summary'. Breve."
    try {
      const result = await callGeminiAPI(prompt, system)
      if (result.analysis_summary) setAnalysisResult(result.analysis_summary)
    } catch (e) {
      console.error(e)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGetConcepts = async (subject) => {
    if (subjectConcepts[subject]) return
    setConceptLoading((prev) => ({ ...prev, [subject]: true }))
    const prompt = `3 conceptos clave de "${subject}".`
    const system = "Profesor. JSON con 'key_concepts' (array)."
    try {
      const result = await callGeminiAPI(prompt, system)
      if (result.key_concepts) setSubjectConcepts((prev) => ({ ...prev, [subject]: result.key_concepts }))
    } catch (e) {
      console.error(e)
    } finally {
      setConceptLoading((prev) => ({ ...prev, [subject]: false }))
    }
  }

  return (
    <div className="p-4 space-y-4 pb-24 h-full flex flex-col">
      <div className="flex p-1 bg-slate-100 rounded-xl mb-2">
        {['Horario', 'Notas', 'Asistencia'].map((tab) => {
          const key = tab === 'Horario' ? 'schedule' : tab === 'Notas' ? 'grades' : 'attendance'
          return (
            <button
              key={key}
              onClick={() => setSubTab(key)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                subTab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'
              }`}
            >
              {tab}
            </button>
          )
        })}
      </div>
      <div className="flex-1 overflow-y-auto pr-1">
        {subTab === 'schedule' && (
          <ScheduleGrid 
            schedule={schedule}
            eventos={eventos}
            eventosSugeridos={eventosSugeridos}
            conceptLoading={conceptLoading} 
            subjectConcepts={subjectConcepts} 
            handleGetConcepts={handleGetConcepts}
            onNavigateToAssistant={onNavigateToAssistant}
            onVerUbicacion={onVerUbicacion}
            onPedirInfo={onPedirInfo}
            onSugerirEvento={onSugerirEvento}
            onSugerirActividad={onSugerirActividad}
          />
        )}
        {subTab === 'grades' && (
          <div className="space-y-3">
            <div className="mb-4">
              {!analysisResult ? (
                <button
                  onClick={handleAnalyzePerformance}
                  disabled={isAnalyzing}
                  className="w-full bg-indigo-600 text-white p-3 rounded-xl shadow-md flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  {isAnalyzing ? <Loader2 size={18} className="animate-spin text-indigo-200" /> : <BrainCircuit size={18} className="text-indigo-200" />}
                  <span className="font-bold text-sm">Analizar Rendimiento con IA</span>
                </button>
              ) : (
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl relative animate-fade-in">
                  <button onClick={() => setAnalysisResult(null)} className="absolute top-2 right-2 text-indigo-400 hover:text-indigo-600">
                    ×
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={18} className="text-indigo-600" />
                    <h3 className="font-bold text-indigo-800 text-sm">Diagnóstico Gemini</h3>
                  </div>
                  <p className="text-sm text-indigo-900 leading-relaxed">{analysisResult}</p>
                </div>
              )}
            </div>
            {grades.map((g, i) => (
              <Card key={i} className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-800">{g.subject}</h4>
                  <p className="text-xs text-slate-400">Promedio Parcial</p>
                </div>
                <div className={`text-xl font-bold px-3 py-1 rounded-lg ${
                  g.status === 'risk' ? 'bg-red-100 text-red-600' : g.status === 'excellent' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {g.grade}
                </div>
              </Card>
            ))}
          </div>
        )}
        {subTab === 'attendance' && (
          <div className="space-y-3">
            {attendance.map((a, i) => (
              <Card key={i}>
                <div className="flex justify-between mb-2">
                  <h4 className="font-bold text-slate-800">{a.subject}</h4>
                  <span className={`text-sm font-bold ${a.percentage < 70 ? 'text-red-500' : 'text-slate-600'}`}>{a.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full ${a.percentage < 70 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${a.percentage}%` }}></div>
                </div>
                <p className="text-xs text-slate-400 mt-2 text-right">{a.attended} de {a.total} clases</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AcademicView
