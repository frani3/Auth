export const GRADES = [
  { subject: 'Cálculo III', grade: 5.8, status: 'good' },
  { subject: 'Física II', grade: 3.9, status: 'risk' },
  { subject: 'Programación Av.', grade: 6.5, status: 'excellent' }
]

export const ATTENDANCE = [
  { subject: 'Cálculo III', percentage: 85, total: 20, attended: 17 },
  { subject: 'Física II', percentage: 60, total: 20, attended: 12 }
]

export const SCHEDULE_TODAY = [
  { time: '08:30', endTime: '10:00', subject: 'Física II', room: 'A-201', status: 'finished' },
  { time: '10:00', endTime: '11:30', subject: 'VENTANA (Tiempo Libre)', room: '-', status: 'break', duration: 90 },
  { time: '11:30', endTime: '13:00', subject: 'Cálculo III', room: 'C-302', status: 'upcoming' },
  { time: '15:00', endTime: '16:30', subject: 'Programación Avanzada', room: 'Lab-4', status: 'pending' }
]

export const CAMPUS_EVENTS = [
  {
    id: 1,
    title: 'Ayudantía Cálculo',
    loc: 'Sala 302',
    time: '11:30 - 12:30',
    type: 'Académico',
    icon: '🎓',
    label: 'Ayudantía',
    position: { top: '38%', left: '48%' }
  },
  {
    id: 2,
    title: 'Charla Tech',
    loc: 'Auditorio',
    time: '18:00 - 19:30',
    type: 'Evento',
    icon: '💡',
    label: 'Charla',
    position: { top: '30%', left: '60%' }
  },
  {
    id: 3,
    title: 'Cafetería Zona Norte',
    loc: 'Plaza Central',
    time: '09:00 - 21:00',
    type: 'Punto de interés',
    icon: '☕',
    label: 'Café',
    position: { top: '55%', left: '35%' }
  },
  {
    id: 4,
    title: 'Baños Laboratorios',
    loc: 'Pabellón de Ciencias',
    time: 'Abierto',
    type: 'Infraestructura',
    icon: '🚻',
    label: 'Baños',
    position: { top: '65%', left: '72%' }
  }
]
