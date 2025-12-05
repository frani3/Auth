import React, { useState, useEffect, useRef } from 'react'
import { Sparkles, Loader2, Mic, MicOff, Send, Calendar, Clock, MapPin, FileText, X, Check, MessageCircle, CalendarPlus } from 'lucide-react'
import { callGeminiAPI } from '../api/gemini'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import { useGeminiLive } from '../hooks/useGeminiLive'
import { crearEvento, formatHorarioForAssistant, formatEventosForAssistant, detectarVentanas } from '../services/backendApi'

// Ubicaciones disponibles
const UBICACIONES = [
  { id: 'cen_am', nombre: 'Centro de Alumnos' },
  { id: 'sur_lab_a', nombre: 'Laboratorio A - Sur' },
  { id: 'sur_aud', nombre: 'Auditorio Sur' },
  { id: 'sur_estudio', nombre: 'Sala de Estudio' },
  { id: 'preu_101', nombre: 'Sala 101 - Preuniversitario' },
]

// Modos de voz
const VOICE_MODES = {
  CHAT: 'chat',      // Gemini Live - conversación natural
  EVENT: 'event'     // Grabación + JSON - crear eventos
}

const AssistantPage = ({ user, onToggleRole, schedule = [], eventos = [], onEventoCreado, ventanaActiva = null, onVentanaUsada, eventoParaInfo = null, onEventoInfoUsado, onEventosSugeridos }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const messagesEndRef = useRef(null)
  const messageIdRef = useRef(1)
  
  // Modo de voz: chat (Live) o event (grabación)
  const [voiceMode, setVoiceMode] = useState(VOICE_MODES.CHAT)
  
  // Estado para saber si ya procesamos la ventana activa
  const [ventanaProcesada, setVentanaProcesada] = useState(false)
  
  // Estado para saber si ya procesamos el evento para info
  const [eventoInfoProcesado, setEventoInfoProcesado] = useState(false)
  
  const getNextMessageId = () => {
    messageIdRef.current += 1
    return messageIdRef.current
  }
  
  // Estado del formulario de evento
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventForm, setEventForm] = useState({
    titulo: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: '12:00',
    ubicacion_id: 'cen_am'
  })

  // Formatear datos para el contexto del asistente
  const horarioTexto = formatHorarioForAssistant(schedule)
  const eventosTexto = formatEventosForAssistant(eventos)
  const ventanas = detectarVentanas(schedule)

  // ============================================
  // MODO CHAT - Gemini Live (conversación natural)
  // ============================================
  const chatSystemPrompt = `Eres un asistente universitario amigable. Usuario: ${user.name} (${user.role}).

HORARIO DEL USUARIO:
${horarioTexto || 'No hay horario cargado'}

VENTANAS LIBRES HOY:
${ventanas.length > 0 ? ventanas.map(v => `- ${v.dia}: ${v.inicio} a ${v.fin} (${v.duracion} min)`).join('\n') : 'No hay ventanas detectadas'}

EVENTOS PRÓXIMOS:
${eventosTexto || 'No hay eventos'}

Responde de forma breve y amigable en español. Puedes informar sobre:
- Qué clase tiene ahora o próximamente
- Qué ventanas de tiempo libre tiene
- Eventos del campus
- Sugerencias de qué hacer en tiempos libres

Si el usuario quiere CREAR un evento, dile que cambie al modo "Crear Evento" con el botón.

IMPORTANTE: Cuando el usuario diga "adiós", "chao", "hasta luego", "gracias", "terminar" o similar, despídete brevemente y amablemente. La conversación terminará automáticamente después de tu despedida.`

  // Callbacks para Gemini Live (modo chat)
  const handleLiveResponse = (text) => {
    if (text && text.trim()) {
      console.log('🔊 [LIVE] Gemini respondió:', text)
      setMessages((prev) => [...prev, { 
        id: getNextMessageId(), 
        sender: 'bot', 
        type: 'general', 
        text 
      }])
    }
  }
  
  // Función para generar eventos sugeridos con Gemini
  const generarEventosSugeridos = async (diasSolicitados) => {
    console.log('🎯 Generando sugerencias para:', diasSolicitados)
    
    const ventanasParaSugerir = ventanas.filter(v => 
      diasSolicitados.includes('semana') || diasSolicitados.includes(v.dia.toLowerCase())
    )
    
    if (ventanasParaSugerir.length === 0) {
      setMessages(prev => [...prev, {
        id: getNextMessageId(),
        sender: 'bot',
        type: 'general',
        text: '❌ No encontré ventanas libres para los días que mencionaste.'
      }])
      return
    }
    
    setMessages(prev => [...prev, {
      id: getNextMessageId(),
      sender: 'bot',
      type: 'general',
      text: `🔍 Buscando eventos para ${ventanasParaSugerir.length} ventana(s) libre(s)...`
    }])
    
    try {
      const prompt = `Sugiere eventos universitarios para estas ventanas libres:
${ventanasParaSugerir.map(v => `- ${v.dia}: ${v.inicio} a ${v.fin} (${v.duracion} min)`).join('\n')}

Eventos disponibles en el campus:
${eventosTexto || 'Ayudantías, talleres de estudio, charlas, eventos deportivos'}

Responde SOLO con un JSON array así:
[{"dia": "Lunes", "hora": "10:00", "titulo": "Nombre evento", "ubicacion": "Lugar", "descripcion": "Breve descripción"}]

Sugiere eventos reales o actividades útiles para un estudiante. Máximo 1 evento por ventana.`

      const result = await callGeminiAPI(prompt, "Asistente universitario. Responde SOLO JSON array válido.")
      
      if (Array.isArray(result)) {
        // Enviar eventos sugeridos al estado global
        if (onEventosSugeridos) {
          onEventosSugeridos(result)
        }
        
        setMessages(prev => [...prev, {
          id: getNextMessageId(),
          sender: 'bot',
          type: 'general',
          text: `✨ ¡Listo! Agregué ${result.length} sugerencia(s) a tu horario. Puedes verlas en la pestaña "Académico" - aparecen en color morado con el ícono de Gemini. Haz clic en ellas para ver ubicación o pedir más información.`
        }])
      } else {
        setMessages(prev => [...prev, {
          id: getNextMessageId(),
          sender: 'bot',
          type: 'general',
          text: '😅 No pude generar sugerencias en este momento. ¿Quieres que lo intente de nuevo?'
        }])
      }
    } catch (error) {
      console.error('Error generando sugerencias:', error)
      setMessages(prev => [...prev, {
        id: getNextMessageId(),
        sender: 'bot',
        type: 'general',
        text: '❌ Hubo un error al buscar sugerencias. Por favor intenta de nuevo.'
      }])
    }
  }
  
  const handleLiveUserTranscript = (text) => {
    if (text && text.trim()) {
      console.log('🎤 [LIVE] Usuario dijo:', text)
      setMessages((prev) => [...prev, { 
        id: getNextMessageId(), 
        sender: 'user', 
        text 
      }])
      
      const lowerText = text.toLowerCase()
      
      // Detectar petición de sugerencias de eventos
      const quiereSugerencias = (lowerText.includes('sugier') || lowerText.includes('sugerir') || 
                                  lowerText.includes('recomienda') || lowerText.includes('qué puedo hacer') ||
                                  lowerText.includes('qué hago') || lowerText.includes('evento para'))
      
      if (quiereSugerencias) {
        // Detectar días específicos
        const diasMencionados = []
        if (lowerText.includes('lunes')) diasMencionados.push('lunes')
        if (lowerText.includes('martes')) diasMencionados.push('martes')
        if (lowerText.includes('miércoles') || lowerText.includes('miercoles')) diasMencionados.push('miércoles')
        if (lowerText.includes('jueves')) diasMencionados.push('jueves')
        if (lowerText.includes('viernes')) diasMencionados.push('viernes')
        if (lowerText.includes('semana') || lowerText.includes('toda') || diasMencionados.length === 0) {
          diasMencionados.push('semana')
        }
        
        // Generar sugerencias después de un pequeño delay
        setTimeout(() => {
          generarEventosSugeridos(diasMencionados)
        }, 500)
        return
      }
      
      // Si menciona crear evento, sugerir cambiar de modo
      if (lowerText.includes('crear') && (lowerText.includes('evento') || lowerText.includes('ayudantía'))) {
        setTimeout(() => {
          setMessages((prev) => [...prev, { 
            id: getNextMessageId(), 
            sender: 'bot', 
            type: 'general', 
            text: '💡 Para crear eventos, cambia al modo "Crear Evento" con el botón de abajo. Ahí puedo ayudarte mejor con los datos.'
          }])
        }, 500)
      }
    }
  }

  // Hook Gemini Live (conversación)
  const { 
    isRecording: isLiveRecording, 
    isPlaying: isLivePlaying,
    error: liveError, 
    startRecording: startLiveRecording, 
    stopRecording: stopLiveRecording 
  } = useGeminiLive(handleLiveResponse, handleLiveUserTranscript, chatSystemPrompt)

  // ============================================
  // MODO EVENT - Grabación + JSON (crear eventos)
  // ============================================
  const eventSystemPrompt = `Eres un asistente que ayuda a crear eventos universitarios. Usuario: ${user.name}.
Ubicaciones válidas: Centro de Alumnos (cen_am), Laboratorio A (sur_lab_a), Auditorio (sur_aud), Sala de Estudio (sur_estudio), Sala 101 (preu_101).
Fecha de hoy: ${new Date().toISOString().split('T')[0]}`

  // Callback para grabación de eventos
  const handleEventVoiceResult = (result) => {
    console.log('📅 [EVENT] Resultado:', result)
    
    // Agregar transcripción del usuario
    if (result.transcription) {
      setMessages((prev) => [...prev, { 
        id: getNextMessageId(), 
        sender: 'user', 
        text: result.transcription 
      }])
    }
    
    // Agregar respuesta
    if (result.message) {
      setMessages((prev) => [...prev, { 
        id: getNextMessageId(), 
        sender: 'bot', 
        type: 'general',
        text: result.message 
      }])
    }
    
    // Si es un evento, actualizar formulario
    if (result.type === 'event_data') {
      setShowEventForm(true)
      setEventForm(prev => ({
        ...prev,
        ...(result.titulo && { titulo: result.titulo }),
        ...(result.fecha && { fecha: result.fecha }),
        ...(result.hora && { hora: result.hora }),
        ...(result.ubicacion_id && { ubicacion_id: result.ubicacion_id }),
        ...(result.descripcion && { descripcion: result.descripcion }),
      }))
    }
    
    // Detectar confirmación
    if (result.transcription) {
      const lowerText = result.transcription.toLowerCase()
      if ((lowerText.includes('confirmar') || lowerText.includes('listo') || lowerText.includes('sí')) && 
          showEventForm && eventForm.titulo) {
        handleCreateEvent()
      }
    }
  }

  // Hook grabación de voz (eventos)
  const { 
    isRecording: isEventRecording, 
    isProcessing: isEventProcessing, 
    error: eventVoiceError, 
    startRecording: startEventRecording, 
    stopRecording: stopEventRecording 
  } = useVoiceRecorder(handleEventVoiceResult, eventSystemPrompt)

  // Estados combinados según el modo
  const isRecording = voiceMode === VOICE_MODES.CHAT ? isLiveRecording : isEventRecording
  const isProcessing = voiceMode === VOICE_MODES.EVENT ? isEventProcessing : false
  const voiceError = voiceMode === VOICE_MODES.CHAT ? liveError : eventVoiceError
  
  const handleStartRecording = () => {
    if (voiceMode === VOICE_MODES.CHAT) {
      startLiveRecording()
    } else {
      setShowEventForm(true) // Mostrar formulario al grabar evento
      startEventRecording()
    }
  }
  
  const handleStopRecording = () => {
    if (voiceMode === VOICE_MODES.CHAT) {
      stopLiveRecording()
    } else {
      stopEventRecording()
    }
  }

  // Función para extraer datos de evento del texto
  const parseEventFromText = (text) => {
    const lowerText = text.toLowerCase()
    console.log('🔍 Parseando texto:', text)
    
    // Detectar si se menciona crear evento
    if (lowerText.includes('evento') || lowerText.includes('crear') || lowerText.includes('agendar') ||
        lowerText.includes('ayudantía') || lowerText.includes('reunión') || lowerText.includes('clase')) {
      setShowEventForm(true)
    }
    
    // Extraer título - buscar patrones comunes
    // "crear un evento de/llamado/titulado X"
    // "ayudantía de X", "reunión de X", "clase de X"
    const tituloPatterns = [
      /título\s+(?:es|será|sería)?\s*[:"]?\s*(.+?)(?:\.|,|\?|$)/i,
      /(?:el\s+)?título\s+(?:es|será)?\s*[:"]?\s*(.+?)(?:\.|,|\?|$)/i,
      /(?:evento|ayudantía|reunión|clase|taller|charla)\s+(?:de\s+)?(.+?)(?:\s+(?:a las|mañana|hoy|en el|para|el día))/i,
      /(?:crear|agendar|programar)\s+(?:un[ao]?\s+)?(?:evento|ayudantía|reunión|clase)?\s*(?:de\s+|llamad[ao]\s+|titulad[ao]\s+)?(.+?)(?:\s+(?:a las|mañana|hoy|en el|para))/i,
      /se llama[:\s]+(.+?)(?:\.|,|$)/i,
    ]
    
    for (const pattern of tituloPatterns) {
      const match = text.match(pattern)
      if (match && match[1] && match[1].trim().length > 2) {
        let titulo = match[1].trim()
        // Limpiar prefijos comunes que Gemini puede agregar
        titulo = titulo.replace(/^(?:es\s+|será\s+|sería\s+)/i, '').trim()
        // Limpiar comillas
        titulo = titulo.replace(/^["']+|["']+$/g, '').trim()
        console.log('📝 Título encontrado:', titulo)
        setEventForm(prev => ({ ...prev, titulo }))
        break
      }
    }
    
    // Extraer hora (múltiples formatos)
    const horaPatterns = [
      /(\d{1,2}):(\d{2})/,                           // 14:30
      /a las (\d{1,2})(?::(\d{2}))?/i,               // a las 2, a las 2:30
      /(\d{1,2})\s*(?:horas?|hrs?|pm|am)/i,          // 14 horas, 2pm
      /las (\d{1,2})(?::(\d{2}))?/i,                 // las 3:00
    ]
    
    for (const pattern of horaPatterns) {
      const match = text.match(pattern)
      if (match) {
        let hora = parseInt(match[1])
        const min = match[2] || '00'
        
        // Ajustar PM si es necesario
        if (lowerText.includes('pm') && hora < 12) hora += 12
        if (lowerText.includes('am') && hora === 12) hora = 0
        
        // Si la hora es muy baja y no dice am/pm, asumir tarde
        if (hora >= 1 && hora <= 7 && !lowerText.includes('am') && !lowerText.includes('mañana temprano')) {
          hora += 12
        }
        
        const horaStr = `${hora.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
        console.log('⏰ Hora encontrada:', horaStr)
        setEventForm(prev => ({ ...prev, hora: horaStr }))
        break
      }
    }
    
    // Extraer fecha
    if (lowerText.includes('mañana')) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const fecha = tomorrow.toISOString().split('T')[0]
      console.log('📅 Fecha (mañana):', fecha)
      setEventForm(prev => ({ ...prev, fecha }))
    } else if (lowerText.includes('hoy')) {
      const fecha = new Date().toISOString().split('T')[0]
      console.log('📅 Fecha (hoy):', fecha)
      setEventForm(prev => ({ ...prev, fecha }))
    } else if (lowerText.includes('pasado mañana')) {
      const date = new Date()
      date.setDate(date.getDate() + 2)
      const fecha = date.toISOString().split('T')[0]
      console.log('📅 Fecha (pasado mañana):', fecha)
      setEventForm(prev => ({ ...prev, fecha }))
    }
    
    // Extraer día de la semana
    const dias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
    const hoy = new Date()
    for (let i = 0; i < dias.length; i++) {
      if (lowerText.includes(dias[i])) {
        const diaActual = hoy.getDay() // 0=domingo
        const diaObjetivo = (i + 1) % 7 // Convertir a formato JS
        let diff = diaObjetivo - diaActual
        if (diff <= 0) diff += 7 // Si ya pasó, próxima semana
        const fecha = new Date(hoy)
        fecha.setDate(hoy.getDate() + diff)
        const fechaStr = fecha.toISOString().split('T')[0]
        console.log(`📅 Fecha (${dias[i]}):`, fechaStr)
        setEventForm(prev => ({ ...prev, fecha: fechaStr }))
        break
      }
    }
    
    // Extraer ubicación
    UBICACIONES.forEach(ub => {
      if (lowerText.includes(ub.nombre.toLowerCase()) || lowerText.includes(ub.id)) {
        console.log('📍 Ubicación encontrada:', ub.id)
        setEventForm(prev => ({ ...prev, ubicacion_id: ub.id }))
      }
    })
    
    // Palabras clave para ubicaciones
    if (lowerText.includes('auditorio')) {
      console.log('📍 Ubicación: auditorio')
      setEventForm(prev => ({ ...prev, ubicacion_id: 'sur_aud' }))
    }
    if (lowerText.includes('laboratorio') || lowerText.includes('lab')) {
      console.log('📍 Ubicación: laboratorio')
      setEventForm(prev => ({ ...prev, ubicacion_id: 'sur_lab_a' }))
    }
    if (lowerText.includes('sala de estudio') || lowerText.includes('estudio')) {
      console.log('📍 Ubicación: sala de estudio')
      setEventForm(prev => ({ ...prev, ubicacion_id: 'sur_estudio' }))
    }
    if (lowerText.includes('ambiente múltiple') || lowerText.includes('central')) {
      console.log('📍 Ubicación: ambiente múltiple')
      setEventForm(prev => ({ ...prev, ubicacion_id: 'cen_am' }))
    }
  }

  useEffect(() => {
    let initialMsg
    if (user.role === 'Docente') {
      initialMsg = 'Hola Profesor. Puedo ayudarle a crear eventos. Diga "crear evento" para empezar.'
    } else {
      if (ventanas.length > 0) {
        const primeraVentana = ventanas[0]
        initialMsg = `Hola ${user.name}. Tienes una ventana de ${primeraVentana.duracion} min el ${primeraVentana.dia}. ¿Quieres crear un evento?`
      } else {
        initialMsg = `Hola ${user.name}. ¿En qué puedo ayudarte?`
      }
    }
    setMessages([{ id: 1, sender: 'bot', type: 'general', text: initialMsg }])
  }, [user, ventanas.length])
  
  // Limpiar grabación al desmontar componente
  useEffect(() => {
    return () => {
      if (isLiveRecording) {
        stopLiveRecording()
      }
    }
  }, [isLiveRecording, stopLiveRecording])

  // Efecto para manejar ventana activa (cuando viene del horario)
  useEffect(() => {
    if (ventanaActiva && !ventanaProcesada && !isLiveRecording) {
      // Asegurar modo chat (Gemini Live)
      setVoiceMode(VOICE_MODES.CHAT)
      
      // Mensaje diferente según el tipo de ventana
      let textoVentana
      if (ventanaActiva.tipo === 'fin_dia') {
        textoVentana = `🌅 ¡Terminaste tus clases a las ${ventanaActiva.inicio}! Tienes el resto de la tarde libre. ¿Quieres que te sugiera actividades?`
      } else {
        textoVentana = `🕐 Tienes ${ventanaActiva.duracion} minutos libres (${ventanaActiva.inicio} - ${ventanaActiva.fin}). ¿Qué te gustaría hacer?`
      }
      
      const ventanaMsg = {
        id: getNextMessageId(),
        sender: 'bot',
        type: 'general',
        text: textoVentana
      }
      
      setMessages(prev => [...prev, ventanaMsg])
      setVentanaProcesada(true)
      
      // Iniciar Gemini Live automáticamente después de un pequeño delay
      setTimeout(() => {
        if (!isLiveRecording) {
          startLiveRecording()
        }
      }, 800)
      
      // Limpiar la ventana después de usarla
      if (onVentanaUsada) {
        onVentanaUsada()
      }
    }
  }, [ventanaActiva, ventanaProcesada, onVentanaUsada, isLiveRecording])

  // Reset ventanaProcesada cuando cambia la ventana
  useEffect(() => {
    if (!ventanaActiva) {
      setVentanaProcesada(false)
    }
  }, [ventanaActiva])

  // Efecto para manejar cuando se pide más info de un evento sugerido
  useEffect(() => {
    if (eventoParaInfo && !eventoInfoProcesado && !isLiveRecording) {
      // Asegurar modo chat (Gemini Live)
      setVoiceMode(VOICE_MODES.CHAT)
      
      // Agregar mensaje contextual sobre el evento
      const infoMsg = {
        id: getNextMessageId(),
        sender: 'bot',
        type: 'general',
        text: `📋 Veo que quieres saber más sobre "${eventoParaInfo.titulo}" (${eventoParaInfo.dia} a las ${eventoParaInfo.hora}). ¿Qué te gustaría saber? Puedo contarte sobre el contenido, quién lo organiza, si es gratis, o cualquier otra cosa.`
      }
      
      setMessages(prev => [...prev, infoMsg])
      setEventoInfoProcesado(true)
      
      // Iniciar Gemini Live automáticamente
      setTimeout(() => {
        if (!isLiveRecording) {
          startLiveRecording()
        }
      }, 800)
      
      // Limpiar el evento después de usarlo
      if (onEventoInfoUsado) {
        onEventoInfoUsado()
      }
    }
  }, [eventoParaInfo, eventoInfoProcesado, onEventoInfoUsado, isLiveRecording])
  
  // Reset eventoInfoProcesado cuando cambia el evento
  useEffect(() => {
    if (!eventoParaInfo) {
      setEventoInfoProcesado(false)
    }
  }, [eventoParaInfo])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return
    const userText = input
    const userMsg = { id: getNextMessageId(), sender: 'user', text: userText }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)
    
    const hoy = new Date().toISOString().split('T')[0]
    
    // Detectar intención de crear evento
    const lowerInput = userText.toLowerCase()
    const quiereCrearEvento = lowerInput.includes('crear') || lowerInput.includes('agendar') || 
                              lowerInput.includes('evento') || lowerInput.includes('ayudantía') ||
                              lowerInput.includes('confirmar') || lowerInput.includes('listo')
    
    // Mostrar formulario inmediatamente si quiere crear evento
    if (quiereCrearEvento && !showEventForm) {
      setShowEventForm(true)
    }
    
    // Si dice confirmar/listo y el form está visible, crear el evento
    if ((lowerInput.includes('confirmar') || lowerInput.includes('listo')) && showEventForm && eventForm.titulo) {
      await handleCreateEvent()
      setIsTyping(false)
      return
    }
    
    // Intentar parsear datos del texto localmente primero
    parseEventFromText(userText)
    
    // Prompt para extraer datos del evento
    const chatSystemPrompt = `Extrae datos de evento. JSON: {"type":"event_update","titulo":"X","fecha":"YYYY-MM-DD","hora":"HH:MM","ubicacion_id":"id","message":"respuesta"}. Hoy: ${hoy}. Ubicaciones: cen_am, sur_lab_a, sur_aud, sur_estudio, preu_101.`

    try {
      const geminiResponse = await callGeminiAPI(userText, chatSystemPrompt)
      console.log('🤖 Respuesta:', geminiResponse)
      
      // Actualizar formulario con datos extraídos
      if (geminiResponse.titulo || geminiResponse.fecha || geminiResponse.hora || geminiResponse.ubicacion_id) {
        setShowEventForm(true)
        setEventForm(prev => ({
          ...prev,
          ...(geminiResponse.titulo && { titulo: geminiResponse.titulo }),
          ...(geminiResponse.descripcion && { descripcion: geminiResponse.descripcion }),
          ...(geminiResponse.fecha && { fecha: geminiResponse.fecha }),
          ...(geminiResponse.hora && { hora: geminiResponse.hora }),
          ...(geminiResponse.ubicacion_id && { ubicacion_id: geminiResponse.ubicacion_id }),
        }))
      }
      
      const botMsg = {
        id: getNextMessageId(),
        sender: 'bot',
        type: 'general',
        message: geminiResponse.message || (showEventForm ? '📝 Formulario actualizado.' : 'Entendido.')
      }
      
      setMessages((prev) => [...prev, botMsg])
      setIsTyping(false)
    } catch (e) {
      console.error('Error:', e)
      
      // Mostrar mensaje incluso si falla Gemini
      setMessages((prev) => [...prev, { 
        id: getNextMessageId(), 
        sender: 'bot', 
        type: 'general', 
        message: showEventForm ? '📝 Completa el formulario abajo.' : 'Error al procesar.' 
      }])
      setIsTyping(false)
    }
  }

  // Crear evento desde el formulario
  const handleCreateEvent = async () => {
    if (!eventForm.titulo) {
      setMessages((prev) => [...prev, {
        id: getNextMessageId(),
        sender: 'bot',
        type: 'general',
        message: '⚠️ Falta el título del evento. ¿Cómo se llamará?'
      }])
      return
    }
    
    setIsCreatingEvent(true)
    try {
      const nuevoEvento = {
        ...eventForm,
        creador: user.email || user.name || 'usuario@mail.com'
      }
      
      console.log('📤 Creando evento:', nuevoEvento)
      await crearEvento(nuevoEvento)
      
      setMessages((prev) => [...prev, {
        id: getNextMessageId(),
        sender: 'bot',
        type: 'general',
        message: `✅ ¡Evento "${eventForm.titulo}" creado para ${eventForm.fecha} a las ${eventForm.hora}!`
      }])
      
      // Resetear formulario
      setShowEventForm(false)
      setEventForm({
        titulo: '',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0],
        hora: '12:00',
        ubicacion_id: 'cen_am'
      })
      
      if (onEventoCreado) await onEventoCreado()
    } catch (error) {
      console.error('Error:', error)
      setMessages((prev) => [...prev, {
        id: getNextMessageId(),
        sender: 'bot',
        type: 'general',
        message: `❌ Error: ${error.message}`
      }])
    } finally {
      setIsCreatingEvent(false)
    }
  }

  // Verificar qué campos faltan
  const camposFaltantes = () => {
    const faltantes = []
    if (!eventForm.titulo) faltantes.push('título')
    return faltantes
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="bg-white shadow-lg rounded-3xl p-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Estado</p>
          <p className="text-lg font-bold text-slate-800">{user.role === 'Docente' ? 'Vista Docente' : 'Vista Estudiante'}</p>
        </div>
        <button
          onClick={onToggleRole}
          className="text-xs font-bold uppercase tracking-[0.3em] bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-lg"
        >
          Cambiar Rol
        </button>
      </div>
      
      {/* Chat Container */}
      <div className="bg-white shadow-xl rounded-3xl flex-1 flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center gap-3">
          <Sparkles size={20} />
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-emerald-200">Asistente</p>
            <p className="text-xs text-emerald-100">Gemini · Chat + Voz</p>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-100">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'user' ? (
                <div className="bg-slate-800 text-white p-3 rounded-2xl rounded-br-none max-w-[80%] text-sm shadow-md">
                  {msg.text}
                </div>
              ) : (
                <div className="bg-white text-slate-700 p-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-200 text-sm max-w-[85%]">
                  {msg.text || msg.message}
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-200 flex gap-1 w-16 items-center justify-center">
                <Loader2 size={16} className="animate-spin text-emerald-500" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Formulario de Evento */}
        {showEventForm && (
          <div className="border-t border-slate-200 bg-gradient-to-r from-emerald-50 to-blue-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-emerald-600" />
                <span className="text-sm font-bold text-slate-700">Nuevo Evento</span>
                {camposFaltantes().length > 0 && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    Falta: {camposFaltantes().join(', ')}
                  </span>
                )}
              </div>
              <button onClick={() => setShowEventForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              {/* Título */}
              <div className="col-span-2">
                <label className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <FileText size={10} /> Título *
                </label>
                <input
                  type="text"
                  value={eventForm.titulo}
                  onChange={(e) => setEventForm(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ej: Ayudantía de Cálculo"
                  className={`w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${
                    eventForm.titulo ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'
                  }`}
                />
              </div>
              
              {/* Fecha */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <Calendar size={10} /> Fecha
                </label>
                <input
                  type="date"
                  value={eventForm.fecha}
                  onChange={(e) => setEventForm(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              
              {/* Hora */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <Clock size={10} /> Hora
                </label>
                <input
                  type="time"
                  value={eventForm.hora}
                  onChange={(e) => setEventForm(prev => ({ ...prev, hora: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              
              {/* Ubicación */}
              <div className="col-span-2">
                <label className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <MapPin size={10} /> Ubicación
                </label>
                <select
                  value={eventForm.ubicacion_id}
                  onChange={(e) => setEventForm(prev => ({ ...prev, ubicacion_id: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {UBICACIONES.map(ub => (
                    <option key={ub.id} value={ub.id}>{ub.nombre}</option>
                  ))}
                </select>
              </div>
              
              {/* Descripción */}
              <div className="col-span-2">
                <label className="text-[10px] text-slate-500 uppercase font-bold">Descripción (opcional)</label>
                <input
                  type="text"
                  value={eventForm.descripcion}
                  onChange={(e) => setEventForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción breve..."
                  className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
            
            {/* Botón Crear */}
            <button
              onClick={handleCreateEvent}
              disabled={isCreatingEvent || !eventForm.titulo}
              className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {isCreatingEvent ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Crear Evento
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              💡 Di "confirmar" o "listo" por voz para crear
            </p>
          </div>
        )}
        
        {/* Error de voz */}
        {voiceError && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200">
            <p className="text-xs text-red-600">⚠️ {voiceError}</p>
          </div>
        )}
        
        {/* Selector de modo de voz */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setVoiceMode(VOICE_MODES.CHAT)
                setShowEventForm(false)
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                voiceMode === VOICE_MODES.CHAT
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Mic size={14} />
              Hablar con Gemini
            </button>
            <button
              onClick={() => {
                setVoiceMode(VOICE_MODES.EVENT)
                setShowEventForm(true)
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                voiceMode === VOICE_MODES.EVENT
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CalendarPlus size={14} />
              Crear Evento
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 text-center">
            {voiceMode === VOICE_MODES.CHAT 
              ? '🎙️ Conversación en tiempo real con IA' 
              : '📅 Escribe o graba para crear eventos'}
          </p>
        </div>
        
        {/* Indicador de grabación/procesamiento - Solo para modo EVENT */}
        {voiceMode === VOICE_MODES.EVENT && (isEventRecording || isEventProcessing) && (
          <div className="px-4 py-3 border-t flex items-center justify-center gap-2 bg-emerald-50 border-emerald-200">
            <div className={`w-3 h-3 rounded-full animate-pulse ${
              isEventProcessing ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <p className="text-sm font-medium text-emerald-700">
              {isEventProcessing ? '⏳ Procesando audio...' : '🎤 Grabando... (suelta para enviar)'}
            </p>
          </div>
        )}
        
        {/* Input - diferente según el modo */}
        <div className="p-4 bg-white border-t border-slate-200">
          {voiceMode === VOICE_MODES.CHAT ? (
            /* Modo CHAT: Solo botón de voz grande centrado */
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={isLiveRecording ? stopLiveRecording : startLiveRecording}
                className={`p-6 rounded-full transition-all shadow-lg ${
                  isLiveRecording 
                    ? 'bg-blue-500 text-white animate-pulse scale-110' 
                    : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:scale-105'
                }`}
              >
                {isLiveRecording ? <MicOff size={32} /> : <Mic size={32} />}
              </button>
              <p className={`text-sm font-medium ${isLiveRecording ? 'text-blue-600' : 'text-slate-500'}`}>
                {isLiveRecording 
                  ? isLivePlaying ? '🔊 Gemini está hablando...' : '🎤 Te estoy escuchando...'
                  : 'Toca para hablar con Gemini'}
              </p>
            </div>
          ) : (
            /* Modo EVENT: Input de texto + botón de voz */
            <div className="flex gap-2 items-center bg-slate-100 px-4 py-3 rounded-xl border border-slate-200">
              <button
                onClick={isEventRecording ? stopEventRecording : startEventRecording}
                disabled={isEventProcessing}
                className={`p-2 rounded-lg transition-all ${
                  isEventRecording 
                    ? 'bg-red-500 text-white animate-pulse shadow-lg'
                    : isEventProcessing
                      ? 'bg-yellow-500 text-white'
                      : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                }`}
                title={isEventRecording ? 'Detener y enviar' : isEventProcessing ? 'Procesando...' : 'Grabar evento'}
              >
                {isEventProcessing ? <Loader2 size={20} className="animate-spin" /> : isEventRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ej: Ayudantía de Cálculo mañana a las 3..."
                className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400"
                disabled={isEventRecording || isEventProcessing}
              />
              <button 
                onClick={handleSend} 
                disabled={isEventRecording || isEventProcessing || !input.trim()}
                className={`p-2 rounded-lg text-white transition-all ${input.trim() && !isEventRecording && !isEventProcessing ? 'bg-emerald-500 shadow-lg' : 'bg-slate-300'}`}
              >
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AssistantPage
