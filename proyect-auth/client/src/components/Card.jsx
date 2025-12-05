import React from 'react'

const Card = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-2xl shadow-sm p-4 ${className}`}>
    {children}
  </div>
)

export default Card
