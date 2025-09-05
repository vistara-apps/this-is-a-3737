import React, { useState, useEffect } from 'react'
import { MessageCircle, Globe, Volume2, Copy, Check } from 'lucide-react'
import ContentCard from './ContentCard'
import { generateDeescalationScript } from '../services/openai'

const SCRIPT_SCENARIOS = [
  {
    id: 'traffic-stop',
    title: 'Traffic Stop',
    description: 'Calm responses during vehicle stops'
  },
  {
    id: 'identification-request',
    title: 'ID Request',
    description: 'When asked to provide identification'
  },
  {
    id: 'search-request',
    title: 'Search Request',
    description: 'Declining searches politely but firmly'
  },
  {
    id: 'questioning',
    title: 'Questioning',
    description: 'Exercising your right to remain silent'
  }
]

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' }
]

const DeescalationScripts = ({ user }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(user.preferredLanguage)
  const [selectedScript, setSelectedScript] = useState(null)
  const [scriptContent, setScriptContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)

  const loadScript = async (scenario) => {
    setIsLoading(true)
    setSelectedScript(scenario)
    
    try {
      const content = await generateDeescalationScript(scenario.id, selectedLanguage)
      setScriptContent(content)
    } catch (err) {
      console.error('Script loading error:', err)
      setScriptContent('Error loading script. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = selectedLanguage === 'es' ? 'es-ES' : 'en-US'
      speechSynthesis.speak(utterance)
    }
  }

  const backToList = () => {
    setSelectedScript(null)
    setScriptContent('')
  }

  if (selectedScript) {
    const phrases = scriptContent.split('\n').filter(line => line.trim() && !line.startsWith('#'))

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={backToList}
            className="text-primary hover:text-primary/80 font-medium"
          >
            ← Back to Scripts
          </button>
          
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-text/70" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="text-sm border border-primary/20 rounded px-2 py-1 bg-surface"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
        </div>

        <ContentCard>
          <div className="flex items-center space-x-3 mb-4">
            <MessageCircle className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">{selectedScript.title}</h2>
              <p className="text-sm text-text/70">{selectedScript.description}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-text/70">Loading script...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {phrases.map((phrase, index) => (
                <div key={index} className="bg-primary/5 rounded-md p-4 border border-primary/10">
                  <div className="flex items-start justify-between space-x-3">
                    <p className="text-text flex-1 leading-relaxed">{phrase}</p>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => speakText(phrase)}
                        className="p-2 hover:bg-primary/10 rounded-md transition-colors"
                        title="Read aloud"
                      >
                        <Volume2 className="h-4 w-4 text-primary" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(phrase, index)}
                        className="p-2 hover:bg-primary/10 rounded-md transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedIndex === index ? (
                          <Check className="h-4 w-4 text-accent" />
                        ) : (
                          <Copy className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ContentCard>

        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
          <p className="text-sm text-text/80">
            <strong>Remember:</strong> Stay calm, speak clearly, and keep your hands visible. 
            These scripts are designed to de-escalate situations while protecting your rights.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-text mb-2">De-escalation Scripts</h1>
        <p className="text-text/70">
          Ready-to-use phrases for tense situations
        </p>
      </div>

      <div className="flex items-center justify-center space-x-4 mb-6">
        <Globe className="h-5 w-5 text-text/70" />
        <div className="flex space-x-2">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => setSelectedLanguage(lang.code)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedLanguage === lang.code
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text border border-primary/20 hover:bg-primary/5'
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {SCRIPT_SCENARIOS.map((scenario) => (
          <ContentCard
            key={scenario.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => loadScript(scenario)}
          >
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 p-3 rounded-md">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-text mb-1">{scenario.title}</h3>
                <p className="text-sm text-text/70">{scenario.description}</p>
              </div>
            </div>
          </ContentCard>
        ))}
      </div>
    </div>
  )
}

export default DeescalationScripts