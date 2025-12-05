import React, { useState, useEffect } from 'react'
import { Home, Book, Map as MapIcon, User, Bell, Calendar, Sparkles, CalendarPlus } from 'lucide-react'
import HomePage from './pages/Home'
import AcademicPage from './pages/Academic'
import MapPage from './pages/Map'
import ChatPage from './pages/Chat'
import ProfilePage from './pages/Profile'
import EventTestPage from './pages/EventTest'
import { SCHEDULE_TODAY, GRADES, ATTENDANCE, CAMPUS_EVENTS } from './data/mockData'
import { getHorario, getNotas, getEventos } from './services/backendApi'

const ROLES = {
  STUDENT: { name: 'Sofía', role: 'Estudiante', id: 'u2023001' },
  PROFESSOR: { name: 'Prof. Lagos', role: 'Docente', id: 'd199005' }
}

const getTabTitle = (tab) => {
  switch (tab) {
    case 'home':
      return 'Dashboard'
    case 'academic':
      return 'Gestión Académica'
    case 'map':
      return 'Campus Vivo'
    case 'assistant':
      return 'Asistente Operativo'
    case 'eventtest':
      return 'Agregar Evento'
    case 'profile':
      return 'Perfil'
    default:
      return 'Dashboard'
  }
}

const DESKTOP_NAV = [
  { id: 'home', label: 'Dashboard', icon: Home },
  { id: 'academic', label: 'Académico', icon: Book },
  { id: 'map', label: 'Campus', icon: MapIcon },
  { id: 'assistant', label: 'Operativo', icon: Sparkles },
  { id: 'eventtest', label: 'Agregar Evento', icon: CalendarPlus },
  { id: 'profile', label: 'Perfil', icon: User }
]

const Header = ({ title, userRole, onSwitch }) => (
  <div className="flex justify-between items-center p-4 bg-white shadow-sm sticky top-0 z-10">
    <div>
      <h1 className="text-xl font-bold text-slate-800">{title}</h1>
      <p className="text-xs text-slate-500 flex items-center gap-1">
        <User size={10} /> Vista: {userRole.role}
      </p>
    </div>
    <div className="flex items-center gap-3">
      <div className="relative p-2 rounded-full hover:bg-slate-100 cursor-pointer">
        <Bell className="w-6 h-6 text-slate-600" />
        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
      </div>
      <button
        onClick={onSwitch}
        className="px-3 py-1 text-xs uppercase tracking-[0.3em] bg-slate-900 text-white rounded-xl shadow"
      >
        Cambiar Rol
      </button>
    </div>
  </div>
)

const DesktopView = ({ activeTab, setActiveTab, user, onToggleRole, schedule, grades, attendance, events, onEventoCreado, navegarAlAsistente, ventanaActiva, setVentanaActiva, eventosSugeridos, verUbicacionEvento, pedirInfoEvento, eventoResaltadoMapa, setEventoResaltadoMapa, eventoParaInfo, setEventoParaInfo, setEventosSugeridos, agregarEventoSugerido, agregarActividadSugerida }) => (
  <div className="hidden md:grid md:grid-cols-[220px_1fr_300px] md:gap-6 md:w-full md:mt-6">
    <div className="bg-white shadow-2xl rounded-3xl p-5 flex flex-col gap-6 sticky top-6 h-[calc(100vh-48px)]">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Campus</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">Integrate</h3>
      </div>
      <div className="flex-1 space-y-3">
        {DESKTOP_NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-2xl transition ${
              activeTab === item.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <item.icon size={18} />
            <span className="text-sm font-bold">{item.label}</span>
          </button>
        ))}
      </div>
      <div className="space-y-3">
        <p className="text-xs uppercase text-slate-400 tracking-[0.4em]">Rol actual</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center">
            <User size={20} className="text-slate-500" />
          </div>
          <div>
            <p className="font-bold text-slate-900">{user.name}</p>
            <p className="text-xs uppercase text-slate-400">{user.role}</p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('assistant')}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-xs font-bold uppercase px-3 py-2 rounded-2xl shadow-lg"
        >
          <Sparkles size={16} />
          Ir al Asistente
        </button>
      </div>
    </div>
    <div className="bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col min-h-[80vh]">
      <Header title={getTabTitle(activeTab)} userRole={user} onSwitch={onToggleRole} />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === 'home' && <HomePage schedule={schedule} user={user} onNavigate={setActiveTab} />}
        {activeTab === 'academic' && (
          <AcademicPage 
            grades={grades} 
            attendance={attendance} 
            schedule={schedule} 
            eventos={events}
            eventosSugeridos={eventosSugeridos}
            onNavigateToAssistant={navegarAlAsistente}
            onVerUbicacion={verUbicacionEvento}
            onPedirInfo={pedirInfoEvento}
            onSugerirEvento={agregarEventoSugerido}
            onSugerirActividad={agregarActividadSugerida}
          />
        )}
        {activeTab === 'map' && (
          <MapPage 
            userRole={user.role} 
            events={events}
            eventoResaltado={eventoResaltadoMapa}
            onEventoResaltadoVisto={() => setEventoResaltadoMapa(null)}
          />
        )}
        {activeTab === 'assistant' && (
          <ChatPage 
            user={user} 
            onToggleRole={onToggleRole} 
            schedule={schedule} 
            eventos={events} 
            onEventoCreado={onEventoCreado} 
            ventanaActiva={ventanaActiva} 
            onVentanaUsada={() => setVentanaActiva(null)}
            eventoParaInfo={eventoParaInfo}
            onEventoInfoUsado={() => setEventoParaInfo(null)}
            onEventosSugeridos={setEventosSugeridos}
          />
        )}
        {activeTab === 'eventtest' && <EventTestPage user={user} onEventoCreado={onEventoCreado} />}
        {activeTab === 'profile' && <ProfilePage user={user} onToggleRole={onToggleRole} />}
      </div>
    </div>
    <div className="bg-white shadow-xl rounded-3xl p-5 space-y-5 sticky top-6 h-[calc(100vh-48px)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-slate-400">Campus en vivo</p>
          <h4 className="font-bold text-slate-900">Agenda activa</h4>
        </div>
        <Calendar size={20} className="text-slate-500" />
      </div>
      <div className="space-y-3">
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Actividad</span>
            <button className="text-[11px] font-bold text-emerald-600">Ver ruta</button>
          </div>
          <p className="font-semibold text-slate-900 mt-2">Ayudantía Cálculo</p>
          <p className="text-[11px] text-slate-500">Sala 302</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Evento</span>
            <button className="text-[11px] font-bold text-emerald-600">Ver ruta</button>
          </div>
          <p className="font-semibold text-slate-900 mt-2">Charla Tech</p>
          <p className="text-[11px] text-slate-500">Auditorio</p>
        </div>
      </div>
      <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Panorama</p>
        <div className="flex items-center justify-between text-sm font-bold">
          <span>Asistencia</span>
          <span>72%</span>
        </div>
        <div className="w-full h-1 bg-white/20 rounded-full">
          <div className="h-1 bg-emerald-400 rounded-full" style={{ width: '72%' }}></div>
        </div>
        <div className="flex items-center justify-between text-sm font-bold">
          <span>Promedio</span>
          <span>5.4</span>
        </div>
        <div className="w-full h-1 bg-white/20 rounded-full">
          <div className="h-1 bg-blue-400 rounded-full" style={{ width: '65%' }}></div>
        </div>
      </div>
    </div>
  </div>
)

export default function UniversityApp() {
  const [activeTab, setActiveTab] = useState('home')
  const [currentUser, setCurrentUser] = useState(ROLES.STUDENT)
  const [ventanaActiva, setVentanaActiva] = useState(null) // Ventana seleccionada desde el horario
  
  // Estados para datos de la API
  const [horarioAPI, setHorarioAPI] = useState([])
  const [notasAPI, setNotasAPI] = useState([])
  const [eventosAPI, setEventosAPI] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  
  // Estados para eventos sugeridos por Gemini
  const [eventosSugeridos, setEventosSugeridos] = useState([])
  const [eventoResaltadoMapa, setEventoResaltadoMapa] = useState(null) // Para resaltar en mapa
  const [eventoParaInfo, setEventoParaInfo] = useState(null) // Para pedir más info con Gemini

  // Función para navegar al asistente con contexto de ventana
  const navegarAlAsistente = (ventana = null) => {
    setVentanaActiva(ventana)
    setActiveTab('assistant')
  }
  
  // Función para ver ubicación de un evento sugerido en el mapa
  const verUbicacionEvento = (evento) => {
    setEventoResaltadoMapa(evento)
    setActiveTab('map')
  }
  
  // Función para pedir más info de un evento (abre Gemini Live)
  const pedirInfoEvento = (evento) => {
    setEventoParaInfo(evento)
    setActiveTab('assistant')
  }
  
  // Función para agregar un evento sugerido al horario
  const agregarEventoSugerido = (evento) => {
    setEventosSugeridos(prev => {
      // Evitar duplicados por día y hora
      const existe = prev.some(e => e.dia === evento.dia && e.hora === evento.hora)
      if (existe) {
        return prev.map(e => 
          (e.dia === evento.dia && e.hora === evento.hora) ? evento : e
        )
      }
      return [...prev, evento]
    })
  }
  
  // Función para agregar una actividad sugerida (igual que evento pero con marca diferente)
  const agregarActividadSugerida = (actividad) => {
    setEventosSugeridos(prev => {
      // Evitar duplicados por día y hora
      const existe = prev.some(e => e.dia === actividad.dia && e.hora === actividad.hora)
      if (existe) {
        return prev.map(e => 
          (e.dia === actividad.dia && e.hora === actividad.hora) ? actividad : e
        )
      }
      return [...prev, actividad]
    })
  }

  // Cargar datos del backend al montar
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingData(true)
        const [horario, notas, eventos] = await Promise.all([
          getHorario(),
          getNotas(),
          getEventos()
        ])
        setHorarioAPI(horario)
        setNotasAPI(notas)
        setEventosAPI(eventos)
      } catch (error) {
        console.error('Error cargando datos del backend:', error)
        // Usar datos mock como fallback
      } finally {
        setLoadingData(false)
      }
    }
    cargarDatos()
  }, [])

  const toggleRole = () => {
    setCurrentUser((prev) => (prev.role === 'Estudiante' ? ROLES.PROFESSOR : ROLES.STUDENT))
  }

  // Función para recargar eventos (útil después de crear uno nuevo)
  const recargarEventos = async () => {
    try {
      const eventos = await getEventos()
      setEventosAPI(eventos)
    } catch (error) {
      console.error('Error recargando eventos:', error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-200 flex justify-center font-sans text-slate-800">
      <div className="w-full bg-transparent min-h-screen relative overflow-hidden flex flex-col md:px-4 md:py-6">
        <div className="flex-1 flex flex-col md:hidden">
          <Header title={getTabTitle(activeTab)} userRole={currentUser} onSwitch={toggleRole} />
          <div className="flex-1 overflow-y-auto bg-slate-50 scroll-smooth">
            {activeTab === 'home' && (
              <HomePage schedule={horarioAPI.length > 0 ? horarioAPI : SCHEDULE_TODAY} user={currentUser} onNavigate={setActiveTab} />
            )}
            {activeTab === 'academic' && (
              <AcademicPage 
                grades={notasAPI.length > 0 ? notasAPI : GRADES} 
                attendance={ATTENDANCE} 
                schedule={horarioAPI.length > 0 ? horarioAPI : SCHEDULE_TODAY}
                eventos={eventosAPI.length > 0 ? eventosAPI : CAMPUS_EVENTS}
                eventosSugeridos={eventosSugeridos}
                onNavigateToAssistant={navegarAlAsistente}
                onVerUbicacion={verUbicacionEvento}
                onPedirInfo={pedirInfoEvento}
                onSugerirEvento={agregarEventoSugerido}
                onSugerirActividad={agregarActividadSugerida}
              />
            )}
            {activeTab === 'map' && (
              <MapPage 
                userRole={currentUser.role} 
                events={eventosAPI.length > 0 ? eventosAPI : CAMPUS_EVENTS}
                eventoResaltado={eventoResaltadoMapa}
                onEventoResaltadoVisto={() => setEventoResaltadoMapa(null)}
              />
            )}
            {activeTab === 'assistant' && (
              <ChatPage 
                user={currentUser} 
                onToggleRole={toggleRole} 
                schedule={horarioAPI.length > 0 ? horarioAPI : SCHEDULE_TODAY}
                eventos={eventosAPI.length > 0 ? eventosAPI : CAMPUS_EVENTS}
                onEventoCreado={recargarEventos}
                ventanaActiva={ventanaActiva}
                onVentanaUsada={() => setVentanaActiva(null)}
                eventoParaInfo={eventoParaInfo}
                onEventoInfoUsado={() => setEventoParaInfo(null)}
                onEventosSugeridos={setEventosSugeridos}
              />
            )}
            {activeTab === 'eventtest' && <EventTestPage user={currentUser} onEventoCreado={recargarEventos} />}
            {activeTab === 'profile' && <ProfilePage user={currentUser} onToggleRole={toggleRole} />}
          </div>
        </div>
        <DesktopView
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={currentUser}
          onToggleRole={toggleRole}
          schedule={horarioAPI.length > 0 ? horarioAPI : SCHEDULE_TODAY}
          grades={notasAPI.length > 0 ? notasAPI : GRADES}
          attendance={ATTENDANCE}
          events={eventosAPI.length > 0 ? eventosAPI : CAMPUS_EVENTS}
          onEventoCreado={recargarEventos}
          navegarAlAsistente={navegarAlAsistente}
          ventanaActiva={ventanaActiva}
          setVentanaActiva={setVentanaActiva}
          eventosSugeridos={eventosSugeridos}
          verUbicacionEvento={verUbicacionEvento}
          pedirInfoEvento={pedirInfoEvento}
          eventoResaltadoMapa={eventoResaltadoMapa}
          setEventoResaltadoMapa={setEventoResaltadoMapa}
          eventoParaInfo={eventoParaInfo}
          setEventoParaInfo={setEventoParaInfo}
          setEventosSugeridos={setEventosSugeridos}
          agregarEventoSugerido={agregarEventoSugerido}
          agregarActividadSugerida={agregarActividadSugerida}
        />
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center relative z-10 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-emerald-600' : 'text-slate-400'}`}>
            <Home size={24} />
            <span className="text-[10px] font-bold">Inicio</span>
          </button>
          <button onClick={() => setActiveTab('academic')} className={`flex flex-col items-center gap-1 ${activeTab === 'academic' ? 'text-emerald-600' : 'text-slate-400'}`}>
            <Book size={24} />
            <span className="text-[10px] font-bold">Académico</span>
          </button>
          <div className="relative -top-6">
            <button
              onClick={() => setActiveTab('assistant')}
              className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl shadow-slate-400/50 transform transition-transform hover:scale-110 active:scale-95 flex items-center justify-center rotate-45"
            >
              <Sparkles size={24} className="-rotate-45" />
            </button>
          </div>
          <button onClick={() => setActiveTab('map')} className={`flex flex-col items-center gap-1 ${activeTab === 'map' ? 'text-emerald-600' : 'text-slate-400'}`}>
            <MapIcon size={24} />
            <span className="text-[10px] font-bold">Campus</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-emerald-600' : 'text-slate-400'}`}>
            <User size={24} />
            <span className="text-[10px] font-bold">Perfil</span>
          </button>
        </div>
      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .bg-stripes-gray { background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, #f1f5f9 10px, #f1f5f9 20px); }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
      `}</style>
    </div>
  )
}
