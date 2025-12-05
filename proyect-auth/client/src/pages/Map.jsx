import React from 'react'
import MapView from '../components/MapView'

const Map = ({ userRole, events, eventoResaltado, onEventoResaltadoVisto, rutaFicticia }) => (
  <MapView 
    userRole={userRole} 
    events={events} 
    eventoResaltado={eventoResaltado}
    onEventoResaltadoVisto={onEventoResaltadoVisto}
    rutaFicticia={rutaFicticia}
  />
)

export default Map