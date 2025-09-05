import React, { useState } from 'react'
import { ChevronDown, Shield } from 'lucide-react'

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
]

const StateSelection = ({ onComplete }) => {
  const [selectedState, setSelectedState] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selectedState) {
      onComplete(selectedState)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto animate-slide-up">
      <div className="card text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-primary/10 p-4 rounded-full">
            <Shield className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        <h1 className="text-2xl font-semibold text-text mb-2">Welcome to KnowYourRights AI</h1>
        <p className="text-text/70 mb-8">
          Your pocket guide to legal rights and incident response. 
          First, let's personalize your experience by selecting your state.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="input flex items-center justify-between w-full text-left"
            >
              <span className={selectedState ? 'text-text' : 'text-text/60'}>
                {selectedState || 'Select your state...'}
              </span>
              <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-primary/20 rounded-md shadow-card max-h-48 overflow-y-auto z-10 animate-fade-in">
                {US_STATES.map((state) => (
                  <button
                    key={state}
                    type="button"
                    onClick={() => {
                      setSelectedState(state)
                      setIsOpen(false)
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors border-b border-primary/5 last:border-b-0"
                  >
                    {state}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!selectedState}
            className={`w-full py-4 rounded-md font-medium transition-all ${
              selectedState
                ? 'btn-primary'
                : 'bg-primary/20 text-text/40 cursor-not-allowed'
            }`}
          >
            Get Started
          </button>
        </form>
        
        <p className="text-xs text-text/60 mt-6">
          Your information stays private and secure. We only use your state to provide relevant legal guidance.
        </p>
      </div>
    </div>
  )
}

export default StateSelection