// Servicio para conectar con el backend de Railway
const API_BASE = import.meta.env.VITE_API_URL || 'https://auth-production-286b.up.railway.app'

// Obtener horario del estudiante
export const getHorario = async () => {
  try {
    const response = await fetch(`${API_BASE}/horario`)
    if (!response.ok) throw new Error('Error al obtener horario')
    return await response.json()
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
    return await response.json()
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
    return await response.json()
  } catch (error) {
    console.error('Error fetching eventos:', error)
    return []
  }
}

// Crear un nuevo evento
export const crearEvento = async (evento) => {
  try {
    const response = await fetch(`${API_BASE}/evento`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(evento)
    })
    if (!response.ok) throw new Error('Error al crear evento')
    return await response.json()
  } catch (error) {
    console.error('Error creating evento:', error)
    throw error
  }
}

// Función helper para formatear horario para el asistente
export const formatHorarioForAssistant = (horario) => {
  if (!horario || horario.length === 0) return 'No hay horario disponible'
  
  return horario.map(h => 
    `${h.dia}: ${h.ramo} de ${h.inicio} a ${h.fin}`
  ).join('; ')
}

// Función helper para formatear eventos para el asistente
export const formatEventosForAssistant = (eventos) => {
  if (!eventos || eventos.length === 0) return 'No hay eventos disponibles'
  
  return eventos.map(e => 
    `${e.titulo} - ${e.fecha} ${e.hora || ''} ${e.descripcion ? `(${e.descripcion})` : ''}`
  ).join('; ')
}

// Detectar ventanas de tiempo libre en el horario
export const detectarVentanas = (horario) => {
  if (!horario || horario.length === 0) return []
  
  const ventanas = []
  const horarioOrdenado = [...horario].sort((a, b) => {
    const [horaA] = a.fin.split(':').map(Number)
    const [horaB] = b.inicio.split(':').map(Number)
    return horaA - horaB
  })
  
  for (let i = 0; i < horarioOrdenado.length - 1; i++) {
    const claseActual = horarioOrdenado[i]
    const claseSiguiente = horarioOrdenado[i + 1]
    
    if (claseActual.dia === claseSiguiente.dia) {
      const [horaFin, minFin] = claseActual.fin.split(':').map(Number)
      const [horaInicio, minInicio] = claseSiguiente.inicio.split(':').map(Number)
      
      const finMinutos = horaFin * 60 + minFin
      const inicioMinutos = horaInicio * 60 + minInicio
      const diferencia = inicioMinutos - finMinutos
      
      if (diferencia >= 30) { // Ventana de al menos 30 minutos
        ventanas.push({
          dia: claseActual.dia,
          inicio: claseActual.fin,
          fin: claseSiguiente.inicio,
          duracion: diferencia
        })
      }
    }
  }
  
  return ventanas
}
