import React from 'react'
import MapView from '../components/MapView'

const Map = ({ userRole, events, eventoResaltado, onEventoResaltadoVisto }) => (
  <MapView 
    userRole={userRole} 
    events={events} 
    eventoResaltado={eventoResaltado}
    onEventoResaltadoVisto={onEventoResaltadoVisto}
  />
)

export default Map