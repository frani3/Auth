import React, { useState, useEffect, useRef } from 'react'
import { Sparkles, Loader2, Mic, Navigation, CheckCircle, Clock, Send } from 'lucide-react'
import { callGeminiAPI } from '../api/gemini'

const AssistantPage = ({ user, onToggleRole, schedule = [] }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const initialMsg = user.role === 'Docente'
      ? 'Hola Profesor. Puedo ayudarle a agendar ayudantías o reservar salas automáticamente.'
      : 'Hola Sofía. Detecto una ventana de 90 min. ¿Quieres que te sugiera dónde estudiar?'
    setMessages([{ id: 1, sender: 'bot', type: 'general', text: initialMsg }])
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg = { id: Date.now(), sender: 'user', text: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)
    const systemPrompt = `Eres un Asistente Logístico Universitario. Tu foco es la EFICIENCIA y OPERACIÓN. Rol del Usuario: ${user.role}. Horario Usuario: ${JSON.stringify(schedule)}. INSTRUCCIONES: 1. Si el usuario es DOCENTE y quiere crear un evento (ej: "ayudantía mañana"): - Extrae: Título, Hora, Día. - Sugiere una sala (A-101, B-202). - Responde con un JSON type="event_creation". 2. Si el usuario es ALUMNO y tiene tiempo libre o pregunta qué hacer: - Analiza ventanas en el horario. - Sugiere actividad productiva (Biblioteca, Zona Estudio). - Responde con un JSON type="recommendation". 3. Para todo lo demás, responde breve y formal JSON type="general".`
    try {
      const geminiResponse = await callGeminiAPI(input, systemPrompt)
      setTimeout(() => {
        let botMsg = { id: Date.now() + 1, sender: 'bot', ...geminiResponse }
        if (!botMsg.message && !botMsg.event_details) {
          botMsg = { id: Date.now() + 1, sender: 'bot', type: 'general', message: 'Entendido. Procesando tu solicitud en el sistema.' }
        }
        setMessages((prev) => [...prev, botMsg])
        setIsTyping(false)
      }, 1000)
    } catch (e) {
      setIsTyping(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
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
      <div className="bg-white shadow-xl rounded-3xl flex-1 flex flex-col overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center gap-3">
          <Sparkles size={20} />
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-emerald-200">Asistente Operativo</p>
            <p className="text-xs text-emerald-100">Gemini API · v2.5</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-100">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'user' && (
                <div className="bg-slate-800 text-white p-3 rounded-2xl rounded-br-none max-w-[80%] text-sm shadow-md">{msg.text}</div>
              )}
              {msg.sender === 'bot' && (
                <div className="max-w-[85%]">
                  {(msg.type === 'general' || msg.message) && (
                    <div className="bg-white text-slate-700 p-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-200 text-sm mb-2">
                      {msg.text || msg.message}
                    </div>
                  )}
                  {msg.type === 'recommendation' && msg.action_route && (
                    <div className="bg-white rounded-xl overflow-hidden shadow-md border border-slate-200">
                      <div className="bg-blue-600 p-2 px-3 flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase flex items-center gap-1">
                          <Clock size={12} /> Optimización
                        </span>
                        <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded">+Produtividad</span>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-bold text-slate-800 mb-1">Ventana detectada</p>
                        <p className="text-xs text-slate-600 mb-3">{msg.message}</p>
                        <button className="w-full bg-slate-100 text-blue-600 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-200">
                          <Navigation size={14} /> {msg.action_route}
                        </button>
                      </div>
                    </div>
                  )}
                  {msg.type === 'event_creation' && msg.event_details && (
                    <div className="bg-white rounded-xl overflow-hidden shadow-md border border-slate-200">
                      <div className="bg-emerald-600 p-2 px-3 flex items-center gap-2 text-white">
                        <CheckCircle size={14} />
                        <span className="text-xs font-bold uppercase">Borrador Automático</span>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Actividad</p>
                          <p className="text-sm font-bold text-slate-800">{msg.event_details.title}</p>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Hora</p>
                            <p className="text-sm text-slate-800">{msg.event_details.time}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Ubicación</p>
                            <p className="text-sm text-emerald-600 font-bold bg-emerald-50 px-2 rounded">{msg.event_details.room}</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-100">
                          <button className="w-full bg-slate-900 text-white text-xs font-bold py-2 rounded-lg shadow-lg hover:bg-slate-700">
                            Confirmar y Notificar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="flex gap-2 items-center bg-slate-100 px-4 py-3 rounded-xl border border-slate-200">
            <Mic size={20} className="text-slate-400 hover:text-slate-600 cursor-pointer" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={user.role === 'Docente' ? 'Ej: Crear ayudantía mañana a las 15...' : 'Ej: ¿Qué puedo hacer ahora?'}
              className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400"
            />
            <button onClick={handleSend} className={`p-2 rounded-lg text-white transition-all ${input.trim() ? 'bg-emerald-500 shadow-lg' : 'bg-slate-300'}`}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssistantPage
