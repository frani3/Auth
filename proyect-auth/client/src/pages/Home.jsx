import React from 'react'
import DashboardView from '../components/DashboardView'

const Home = ({ schedule, user, onNavigate }) => (
  <DashboardView schedule={schedule} user={user} onNavigate={onNavigate} />
)

export default Home