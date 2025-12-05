import React from 'react'
import AssistantPage from '../components/AssistantPage'

const Chat = ({ user, onToggleRole, schedule, eventos, onEventoCreado, ventanaActiva, onVentanaUsada, eventoParaInfo, onEventoInfoUsado, onEventosSugeridos }) => (
  <AssistantPage 
    user={user} 
    onToggleRole={onToggleRole} 
    schedule={schedule}
    eventos={eventos}
    onEventoCreado={onEventoCreado}
    ventanaActiva={ventanaActiva}
    onVentanaUsada={onVentanaUsada}
    eventoParaInfo={eventoParaInfo}
    onEventoInfoUsado={onEventoInfoUsado}
    onEventosSugeridos={onEventosSugeridos}
  />
)

export default Chat