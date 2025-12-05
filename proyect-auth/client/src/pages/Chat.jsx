import React from 'react'
import AssistantPage from '../components/AssistantPage'

const Chat = ({ user, onToggleRole, schedule, eventos, onEventoCreado }) => (
  <AssistantPage 
    user={user} 
    onToggleRole={onToggleRole} 
    schedule={schedule}
    eventos={eventos}
    onEventoCreado={onEventoCreado}
  />
)

export default Chat