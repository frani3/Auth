import React from 'react'
import DashboardView from '../components/DashboardView'

const Home = ({ schedule, user, onNavigate, showAcademic }) => (
  <DashboardView schedule={schedule} user={user} onNavigate={onNavigate} showAcademic={showAcademic} />
)

export default Home