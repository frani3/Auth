import React, { useState } from 'react'
import { Calendar, MapPin, Clock, FileText, User, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { crearEvento } from '../services/backendApi'

const UBICACIONES = [
    { id: 'cen_am', label: 'Centro - Ambiente Múltiple' },
    { id: 'sur_lab_a', label: 'Sur - Laboratorio A' },
    { id: 'sur_aud', label: 'Sur - Auditorio' },
    { id: 'sur_estudio', label: 'Sur - Sala de Estudio' },
    { id: 'preu_101', label: 'Preuniversitario - Sala 101' },
]

export default function EventTestPage({ user, onEventoCreado }) {
    const [form, setForm] = useState({
        titulo: '',
        descripcion: '',
        ubicacion_id: 'cen_am',
        fecha: '',
        hora: '',
    })

    const [status, setStatus] = useState(null) // null, 'loading', 'success', 'error'
    const [responseData, setResponseData] = useState(null)
    const [errorMsg, setErrorMsg] = useState('')
    const [requestPayload, setRequestPayload] = useState(null)

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setStatus('loading')
        setResponseData(null)
        setErrorMsg('')

        // Preparar payload
        const payload = {
            titulo: form.titulo,
            descripcion: form.descripcion,
            ubicacion_id: form.ubicacion_id,
            fecha: form.fecha,
            hora: form.hora,
            creador: user?.id || 'u2023001'
        }

        setRequestPayload(payload)

        console.log('📤 Enviando evento al backend:', payload)
        console.log('📤 JSON stringified:', JSON.stringify(payload, null, 2))

        try {
            const response = await crearEvento(payload)
            console.log('✅ Respuesta del backend:', response)
            setResponseData(response)
            setStatus('success')

            // Limpiar formulario
            setForm({
                titulo: '',
                descripcion: '',
                ubicacion_id: 'cen_am',
                fecha: '',
                hora: '',
            })

            // Notificar que se creó un evento
            if (onEventoCreado) {
                onEventoCreado()
            }
        } catch (error) {
            console.error('❌ Error creando evento:', error)
            setErrorMsg(error.message || 'Error desconocido')
            setStatus('error')
        }
    }

    const fillTestData = () => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const dateStr = tomorrow.toISOString().split('T')[0]

        setForm({
            titulo: 'Ayudantía de Cálculo TEST',
            descripcion: 'Repaso para el certamen de la próxima semana',
            ubicacion_id: 'sur_lab_a',
            fecha: dateStr,
            hora: '15:00',
        })
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-10 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white/90 border border-white/30 rounded-3xl shadow-[0_25px_65px_rgba(15,23,42,0.4)] p-7 backdrop-blur">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">🧪 Test de Creación de Eventos</h2>
                    <p className="text-sm text-slate-600 mb-4">
                        Usa este formulario para probar si los eventos se envían correctamente al backend.
                    </p>

                    <button
                        type="button"
                        onClick={fillTestData}
                        className="mb-4 px-4 py-2 bg-purple-100 text-purple-700 rounded-2xl text-sm font-semibold shadow-sm transition hover:bg-purple-200"
                    >
                        Llenar datos de prueba
                    </button>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Título */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                                <FileText size={16} />
                                Título *
                            </label>
                            <input
                                type="text"
                                name="titulo"
                                value={form.titulo}
                                onChange={handleChange}
                                required
                                placeholder="Ej: Ayudantía de Cálculo"
                                className="w-full px-4 py-2 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white/90"
                            />
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                                <FileText size={16} />
                                Descripción
                            </label>
                            <textarea
                                name="descripcion"
                                value={form.descripcion}
                                onChange={handleChange}
                                placeholder="Descripción del evento..."
                                rows={3}
                                className="w-full px-4 py-2 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-white/90"
                            />
                        </div>

                        {/* Ubicación */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                                <MapPin size={16} />
                                Ubicación *
                            </label>
                            <select
                                name="ubicacion_id"
                                value={form.ubicacion_id}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white/90"
                            >
                                {UBICACIONES.map(ub => (
                                    <option key={ub.id} value={ub.id}>{ub.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Fecha y Hora */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                                    <Calendar size={16} />
                                    Fecha *
                                </label>
                                <input
                                    type="date"
                                    name="fecha"
                                    value={form.fecha}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white/90"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                                    <Clock size={16} />
                                    Hora *
                                </label>
                                <input
                                    type="time"
                                    name="hora"
                                    value={form.hora}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white/90"
                                />
                            </div>
                        </div>

                        {/* Creador (solo lectura) */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                                <User size={16} />
                                Creador
                            </label>
                            <input
                                type="text"
                                value={user?.id || 'u2023001'}
                                disabled
                                className="w-full px-4 py-2 border border-slate-200 rounded-2xl bg-slate-100 text-slate-500"
                            />
                        </div>

                        {/* Botón enviar */}
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {status === 'loading' ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    Crear Evento
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Panel de Debug */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-white shadow-lg">
                    <h3 className="text-lg font-bold mb-4">🔍 Debug Info</h3>

                    {/* Request Payload */}
                    {requestPayload && (
                        <div className="mb-4">
                            <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Request Payload:</p>
                            <pre className="bg-slate-800 p-3 rounded-xl text-xs overflow-auto max-h-40">
                                {JSON.stringify(requestPayload, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* Status */}
                    {status && (
                        <div className="mb-4">
                            <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Status:</p>
                            <div className={`flex items-center gap-2 p-3 rounded-xl ${status === 'success' ? 'bg-emerald-900/50 text-emerald-300' :
                                    status === 'error' ? 'bg-red-900/50 text-red-300' :
                                        'bg-blue-900/50 text-blue-300'
                                }`}>
                                {status === 'success' && <CheckCircle size={20} />}
                                {status === 'error' && <XCircle size={20} />}
                                {status === 'loading' && <Loader2 size={20} className="animate-spin" />}
                                <span className="font-medium capitalize">{status}</span>
                            </div>
                        </div>
                    )}

                    {/* Response */}
                    {responseData && (
                        <div className="mb-4">
                            <p className="text-xs uppercase tracking-wider text-emerald-400 mb-2">✅ Response:</p>
                            <pre className="bg-slate-800 p-3 rounded-xl text-xs overflow-auto max-h-40 text-emerald-300">
                                {JSON.stringify(responseData, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* Error */}
                    {errorMsg && (
                        <div>
                            <p className="text-xs uppercase tracking-wider text-red-400 mb-2">❌ Error:</p>
                            <pre className="bg-slate-800 p-3 rounded-xl text-xs overflow-auto max-h-40 text-red-300">
                                {errorMsg}
                            </pre>
                        </div>
                    )}

                    {!requestPayload && !status && (
                        <p className="text-slate-400 text-sm">Envía un evento para ver la información de debug aquí.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
