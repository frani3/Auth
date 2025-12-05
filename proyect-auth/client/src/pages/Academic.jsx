import React from 'react'
import AcademicView from '../components/AcademicView'

const Academic = ({ grades, attendance, schedule, eventos, eventosSugeridos, onNavigateToAssistant, onVerUbicacion, onPedirInfo, onSugerirEvento, onSugerirActividad }) => (
  <AcademicView 
    grades={grades} 
    attendance={attendance} 
    schedule={schedule}
    eventos={eventos}
    eventosSugeridos={eventosSugeridos}
    onNavigateToAssistant={onNavigateToAssistant}
    onVerUbicacion={onVerUbicacion}
    onPedirInfo={onPedirInfo}
    onSugerirEvento={onSugerirEvento}
    onSugerirActividad={onSugerirActividad}
  />
)

export default Academic
