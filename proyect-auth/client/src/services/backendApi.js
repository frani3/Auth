// Servicio para conectar con el backend de Railway
const API_BASE = import.meta.env.VITE_API_URL || 'https://auth-production-286b.up.railway.app'

// Mapear horario del backend al formato del frontend
// Ahora incluye información de sala con coordenadas
const mapHorarioToFrontend = (horarioAPI) => {
  if (!Array.isArray(horarioAPI)) return []
  
  return horarioAPI.map((item, index) => ({
    id: index + 1,
    time: item.inicio,
    endTime: item.fin,
    subject: item.ramo,
    room: item.sala?.nombre || item.sala || 'Por asignar',
    roomId: item.sala_id,
    day: item.dia,
    status: 'active',
    // Información de ubicación para el mapa
    sala: item.sala ? {
      id: item.sala.id,
      nombre: item.sala.nombre,
      piso: item.sala.piso,
      coordenadas: item.sala.coordenadas,
      edificioId: item.sala.edificio_id,
      edificioNombre: item.sala.edificio_nombre
    } : null,
    // Posición para el mapa (convertir coordenadas x,y a porcentajes)
    position: item.sala?.coordenadas ? {
      top: `${item.sala.coordenadas.y}%`,
      left: `${item.sala.coordenadas.x}%`
    } : null
  }))
}

// Mapear notas del backend al formato del frontend
const mapNotasToFrontend = (notasAPI) => {
  if (!Array.isArray(notasAPI)) return []
  
  return notasAPI.map((item, index) => ({
    id: index + 1,
    subject: item.ramo,
    grade: item.nota,
    // Calcular estado basado en la nota
    status: item.nota >= 5.5 ? 'excellent' : item.nota >= 4.0 ? 'good' : 'needs-improvement'
  }))
}

// Mapear eventos del backend al formato del frontend
// Ahora incluye información de ubicación con coordenadas
const mapEventosToFrontend = (eventosAPI) => {
  if (!Array.isArray(eventosAPI)) return []
  
  return eventosAPI.map((item) => ({
    id: item.id,
    title: item.titulo,
    description: item.descripcion,
    date: item.fecha,
    time: item.hora,
    creator: item.creador,
    // Información de ubicación
    ubicacionId: item.ubicacion_id,
    location: item.ubicacion?.nombre || 'Campus',
    ubicacion: item.ubicacion ? {
      tipo: item.ubicacion.tipo,
      id: item.ubicacion.id,
      nombre: item.ubicacion.nombre,
      capacidad: item.ubicacion.capacidad,
      coordenadas: item.ubicacion.coordenadas,
      edificioId: item.ubicacion.edificio_id,
      edificioNombre: item.ubicacion.edificio_nombre
    } : null,
    // Coordenadas directas para el mapa (el componente MapView las convertirá)
    coordenadas: item.ubicacion?.coordenadas || null,
    // Para mostrar en el mapa
    label: item.titulo
  }))
}

// Obtener horario del estudiante
export const getHorario = async () => {
  try {
    const response = await fetch(`${API_BASE}/horario`)
    if (!response.ok) throw new Error('Error al obtener horario')
    const data = await response.json()
    return mapHorarioToFrontend(data)
  } catch (error) {
    console.error('Error fetching horario:', error)
    return []
  }
}

// Obtener notas del estudiante
export const getNotas = async () => {
  try {
    const response = await fetch(`${API_BASE}/notas`)
    if (!response.ok) throw new Error('Error al obtener notas')
    const data = await response.json()
    return mapNotasToFrontend(data)
  } catch (error) {
    console.error('Error fetching notas:', error)
    return []
  }
}

// Obtener todos los eventos
export const getEventos = async () => {
  try {
    const response = await fetch(`${API_BASE}/evento`)
    if (!response.ok) throw new Error('Error al obtener eventos')
    const data = await response.json()
    return mapEventosToFrontend(data)
  } catch (error) {
    console.error('Error fetching eventos:', error)
    return []
  }
}

// Crear un nuevo evento
// Ahora usa ubicacion_id para asociar a una sala del campus
export const crearEvento = async (evento) => {
  try {
    // Preparar el evento con el formato del nuevo API
    const eventoAPI = {
      titulo: evento.titulo,
      descripcion: evento.descripcion || 'Evento creado desde asistente',
      fecha: evento.fecha,
      hora: evento.hora,
      creador: evento.creador,
      // Usar ubicacion_id si se proporciona
      ubicacion_id: evento.ubicacion_id || evento.ubicacionId || 'cen_am'
    }
    
    console.log('📤 Creando evento:', eventoAPI)
    
    const response = await fetch(`${API_BASE}/evento`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventoAPI)
    })
    
    const responseText = await response.text()
    console.log('📥 Respuesta del servidor:', response.status, responseText)
    
    if (!response.ok) {
      throw new Error(`Error al crear evento: ${response.status} - ${responseText}`)
    }
    
    return JSON.parse(responseText)
  } catch (error) {
    console.error('❌ Error creating evento:', error)
    throw error
  }
}

// Obtener todas las ubicaciones (edificios, salas, puntos de interés)
export const getUbicaciones = async () => {
  try {
    const response = await fetch(`${API_BASE}/ubicaciones`)
    if (!response.ok) throw new Error('Error al obtener ubicaciones')
    return await response.json()
  } catch (error) {
    console.error('Error fetching ubicaciones:', error)
    return null
  }
}

// Obtener solo las salas disponibles
export const getSalas = async () => {
  try {
    const response = await fetch(`${API_BASE}/ubicaciones/salas`)
    if (!response.ok) throw new Error('Error al obtener salas')
    return await response.json()
  } catch (error) {
    console.error('Error fetching salas:', error)
    return []
  }
}

// Obtener edificios
export const getEdificios = async () => {
  try {
    const response = await fetch(`${API_BASE}/ubicaciones/edificios`)
    if (!response.ok) throw new Error('Error al obtener edificios')
    return await response.json()
  } catch (error) {
    console.error('Error fetching edificios:', error)
    return []
  }
}

// Función helper para formatear horario para el asistente
// Incluye información de ubicación con edificio
export const formatHorarioForAssistant = (horario) => {
  if (!horario || horario.length === 0) return 'No hay horario disponible'
  
  return horario.map(h => {
    const sala = h.sala ? `${h.sala.nombre} (${h.sala.edificioNombre})` : (h.room || 'sala por asignar')
    return `${h.day || h.dia}: ${h.subject || h.ramo} de ${h.time || h.inicio} a ${h.endTime || h.fin} en ${sala}`
  }).join('; ')
}

// Función helper para formatear eventos para el asistente
// Incluye información de ubicación
export const formatEventosForAssistant = (eventos) => {
  if (!eventos || eventos.length === 0) return 'No hay eventos disponibles'
  
  return eventos.map(e => {
    const ubicacion = e.ubicacion ? `${e.ubicacion.nombre} (${e.ubicacion.edificioNombre})` : (e.location || 'Campus')
    return `${e.title || e.titulo} - ${e.date || e.fecha} ${e.time || e.hora || ''} en ${ubicacion} ${e.description || e.descripcion ? `(${e.description || e.descripcion})` : ''}`
  }).join('; ')
}

// Detectar ventanas de tiempo libre en el horario
// Funciona con el formato ya mapeado del frontend
export const detectarVentanas = (horario) => {
  if (!horario || horario.length === 0) return []
  
  const ventanas = []
  const HORA_FIN_DIA = 20 // Considerar hasta las 20:00
  const MIN_VENTANA = 30 // Mínimo 30 minutos para ser ventana
  
  // Agrupar clases por día
  const clasesPorDia = {}
  horario.forEach(clase => {
    const dia = clase.day || clase.dia
    if (!clasesPorDia[dia]) clasesPorDia[dia] = []
    clasesPorDia[dia].push(clase)
  })
  
  // Para cada día, ordenar clases y detectar ventanas
  Object.entries(clasesPorDia).forEach(([dia, clases]) => {
    // Ordenar por hora de inicio
    const clasesOrdenadas = [...clases].sort((a, b) => {
      const inicioA = a.time || a.inicio
      const inicioB = b.time || b.inicio
      const [horaA, minA] = inicioA.split(':').map(Number)
      const [horaB, minB] = inicioB.split(':').map(Number)
      return (horaA * 60 + minA) - (horaB * 60 + minB)
    })
    
    // Detectar ventanas ENTRE clases
    for (let i = 0; i < clasesOrdenadas.length - 1; i++) {
      const claseActual = clasesOrdenadas[i]
      const claseSiguiente = clasesOrdenadas[i + 1]
      
      const finActual = claseActual.endTime || claseActual.fin
      const inicioSiguiente = claseSiguiente.time || claseSiguiente.inicio
      
      const [horaFin, minFin] = finActual.split(':').map(Number)
      const [horaInicio, minInicio] = inicioSiguiente.split(':').map(Number)
      
      const finMinutos = horaFin * 60 + minFin
      const inicioMinutos = horaInicio * 60 + minInicio
      const diferencia = inicioMinutos - finMinutos
      
      if (diferencia >= MIN_VENTANA) {
        ventanas.push({
          dia,
          inicio: finActual,
          fin: inicioSiguiente,
          duracion: diferencia,
          tipo: 'entre_clases'
        })
      }
    }
    
    // Detectar ventana FINAL del día (desde última clase hasta las 20:00)
    const ultimaClase = clasesOrdenadas[clasesOrdenadas.length - 1]
    const finUltimaClase = ultimaClase.endTime || ultimaClase.fin
    const [horaFinUltima, minFinUltima] = finUltimaClase.split(':').map(Number)
    const finUltimaMinutos = horaFinUltima * 60 + minFinUltima
    const finDiaMinutos = HORA_FIN_DIA * 60
    
    const diferenciaFinal = finDiaMinutos - finUltimaMinutos
    
    if (diferenciaFinal >= MIN_VENTANA) {
      ventanas.push({
        dia,
        inicio: finUltimaClase,
        fin: '20:00',
        duracion: diferenciaFinal,
        tipo: 'fin_dia'
      })
    }
  })
  
  return ventanas
}
