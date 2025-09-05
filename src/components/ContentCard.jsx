import React from 'react'

const ContentCard = ({ children, className = '', variant = 'default', onClick }) => {
  const baseClasses = 'card transition-all duration-250'
  
  const variantClasses = {
    default: '',
    outlined: 'border-2 border-primary/20'
  }

  const interactiveClasses = onClick ? 'cursor-pointer hover:shadow-lg active:scale-[0.98]' : ''

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${interactiveClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export default ContentCard