import React from 'react'
import AssistantPage from '../components/AssistantPage'

const Chat = ({ user, onToggleRole, schedule }) => (
  <AssistantPage user={user} onToggleRole={onToggleRole} schedule={schedule} />
)

export default Chat