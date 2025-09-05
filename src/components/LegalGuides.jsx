import React, { useState, useEffect } from 'react'
import { FileText, Shield, Car, Home, Users, Loader2 } from 'lucide-react'
import ContentCard from './ContentCard'
import { generateLegalGuide } from '../services/openai'

const GUIDE_CATEGORIES = [
  {
    id: 'traffic-stop',
    title: 'Traffic Stops',
    icon: Car,
    description: 'Your rights during vehicle stops and searches'
  },
  {
    id: 'home-search',
    title: 'Home Searches',
    icon: Home,
    description: 'Fourth Amendment protections for your residence'
  },
  {
    id: 'public-interaction',
    title: 'Public Interactions',
    icon: Users,
    description: 'Know your rights in public spaces'
  },
  {
    id: 'arrest-rights',
    title: 'Arrest Rights',
    icon: Shield,
    description: 'What to do if you are detained or arrested'
  }
]

const LegalGuides = ({ user }) => {
  const [selectedGuide, setSelectedGuide] = useState(null)
  const [guideContent, setGuideContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const loadGuide = async (category) => {
    setIsLoading(true)
    setError('')
    setSelectedGuide(category)
    
    try {
      const content = await generateLegalGuide(user.state, category.id)
      setGuideContent(content)
    } catch (err) {
      setError('Failed to load guide. Please try again.')
      console.error('Guide loading error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const backToList = () => {
    setSelectedGuide(null)
    setGuideContent('')
    setError('')
  }

  if (selectedGuide) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={backToList}
            className="text-primary hover:text-primary/80 font-medium"
          >
            ← Back to Guides
          </button>
        </div>

        <ContentCard>
          <div className="flex items-center space-x-3 mb-4">
            <selectedGuide.icon className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">{selectedGuide.title}</h2>
              <p className="text-sm text-text/70">Legal guidance for {user.state}</p>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-text/70">Loading legal guide...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-800">{error}</p>
              <button
                onClick={() => loadGuide(selectedGuide)}
                className="text-red-600 hover:text-red-800 font-medium mt-2"
              >
                Try Again
              </button>
            </div>
          )}

          {guideContent && !isLoading && (
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-text leading-relaxed">
                {guideContent}
              </div>
            </div>
          )}
        </ContentCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-text mb-2">Legal Guides</h1>
        <p className="text-text/70">
          State-specific guidance for {user.state}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {GUIDE_CATEGORIES.map((category) => {
          const Icon = category.icon
          return (
            <ContentCard
              key={category.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => loadGuide(category)}
            >
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-md">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text mb-1">{category.title}</h3>
                  <p className="text-sm text-text/70 leading-relaxed">
                    {category.description}
                  </p>
                </div>
              </div>
            </ContentCard>
          )
        })}
      </div>

      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Shield className="h-5 w-5 text-accent" />
          <div className="flex-1">
            <p className="text-sm font-medium text-text">Legal Disclaimer</p>
            <p className="text-xs text-text/70 mt-1">
              This information is for educational purposes only and does not constitute legal advice. 
              Consult with a qualified attorney for specific legal questions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LegalGuides