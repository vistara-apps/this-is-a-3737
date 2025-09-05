import React, { useState } from 'react'
import { AlertTriangle, Scale, Shield, Info, X } from 'lucide-react'
import ContentCard from './ContentCard'

const LegalDisclaimer = ({ onAccept, onDecline, showModal = false }) => {
  const [accepted, setAccepted] = useState(false)

  const handleAccept = () => {
    setAccepted(true)
    if (onAccept) onAccept()
  }

  const handleDecline = () => {
    if (onDecline) onDecline()
  }

  const DisclaimerContent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Scale className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-text mb-2">Legal Disclaimer</h2>
        <p className="text-text/70">
          Important information about using KnowYourRights AI
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 mb-2">Not Legal Advice</h3>
              <p className="text-sm text-red-800">
                The information provided by KnowYourRights AI is for educational purposes only and does not constitute legal advice. 
                This application cannot replace the advice of a qualified attorney who is familiar with the facts and circumstances 
                of your specific situation.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">Use at Your Own Risk</h3>
              <p className="text-sm text-yellow-800">
                Laws vary significantly by jurisdiction and change frequently. While we strive to provide accurate information, 
                we cannot guarantee the completeness, accuracy, or timeliness of the legal information provided. Always consult 
                with a qualified attorney for legal advice specific to your situation.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Recording Laws Vary</h3>
              <p className="text-sm text-blue-800">
                Recording laws differ significantly between states and jurisdictions. Some states require consent from all parties, 
                while others require consent from only one party. Recording without proper consent may be illegal and could result 
                in criminal charges. Research your local laws before recording any interactions.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-primary/20 pt-6">
        <h3 className="font-semibold text-text mb-3">Key Limitations</h3>
        <ul className="space-y-2 text-sm text-text/80">
          <li className="flex items-start space-x-2">
            <span className="text-primary mt-1">•</span>
            <span>Information may not reflect the most current legal developments</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-primary mt-1">•</span>
            <span>AI-generated content may contain errors or omissions</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-primary mt-1">•</span>
            <span>Local ordinances and regulations may supersede general state laws</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-primary mt-1">•</span>
            <span>Emergency situations may have different legal considerations</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-primary mt-1">•</span>
            <span>This app does not create an attorney-client relationship</span>
          </li>
        </ul>
      </div>

      <div className="border-t border-primary/20 pt-6">
        <h3 className="font-semibold text-text mb-3">Recommendations</h3>
        <ul className="space-y-2 text-sm text-text/80">
          <li className="flex items-start space-x-2">
            <span className="text-accent mt-1">✓</span>
            <span>Consult with a qualified attorney for legal advice</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-accent mt-1">✓</span>
            <span>Research current laws in your specific jurisdiction</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-accent mt-1">✓</span>
            <span>Contact local legal aid organizations for assistance</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-accent mt-1">✓</span>
            <span>Prioritize your safety in all interactions</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-accent mt-1">✓</span>
            <span>Keep records of any legal interactions or incidents</span>
          </li>
        </ul>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <h3 className="font-semibold text-text mb-2">Emergency Situations</h3>
        <p className="text-sm text-text/80">
          If you are in immediate danger or experiencing an emergency, call 911 immediately. 
          Do not rely on this app for emergency legal guidance. Your safety is the top priority.
        </p>
      </div>
    </div>
  )

  if (showModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-surface rounded-lg shadow-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text">Legal Disclaimer</h2>
              <button
                onClick={handleDecline}
                className="p-2 hover:bg-primary/10 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-text/60" />
              </button>
            </div>
            
            <DisclaimerContent />
            
            <div className="flex space-x-4 mt-8">
              <button
                onClick={handleAccept}
                className="flex-1 btn-primary"
              >
                I Understand and Accept
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 btn-secondary"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ContentCard>
      <DisclaimerContent />
      
      {onAccept && (
        <div className="flex space-x-4 mt-8">
          <button
            onClick={handleAccept}
            className="flex-1 btn-primary"
          >
            I Understand and Accept
          </button>
          {onDecline && (
            <button
              onClick={handleDecline}
              className="flex-1 btn-secondary"
            >
              Decline
            </button>
          )}
        </div>
      )}
    </ContentCard>
  )
}

// Compact disclaimer for inline use
export const InlineLegalDisclaimer = ({ className = "" }) => (
  <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 ${className}`}>
    <div className="flex items-start space-x-2">
      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-yellow-800">
          <strong>Disclaimer:</strong> This information is for educational purposes only and does not constitute legal advice. 
          Consult with a qualified attorney for legal guidance specific to your situation.
        </p>
      </div>
    </div>
  </div>
)

// Recording-specific disclaimer
export const RecordingDisclaimer = ({ state, className = "" }) => (
  <div className={`bg-red-50 border border-red-200 rounded-lg p-3 ${className}`}>
    <div className="flex items-start space-x-2">
      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-red-800">
          <strong>Recording Warning:</strong> Recording laws vary by state. {state ? `In ${state}, specific` : 'Specific'} consent 
          requirements may apply. Recording without proper consent may be illegal. Research your local laws and prioritize your safety.
        </p>
      </div>
    </div>
  </div>
)

export default LegalDisclaimer
