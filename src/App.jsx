import React, { useState, useEffect } from 'react'
import { Shield, FileText, Mic, Users, Settings, Menu, X } from 'lucide-react'
import AppShell from './components/AppShell'
import StateSelection from './components/StateSelection'
import LegalGuides from './components/LegalGuides'
import DeescalationScripts from './components/DeescalationScripts'
import IncidentRecorder from './components/IncidentRecorder'
import TrustedContacts from './components/TrustedContacts'
import UserSettings from './components/UserSettings'

function App() {
  const [user, setUser] = useState({
    userId: 'user_' + Date.now(),
    state: localStorage.getItem('userState') || '',
    preferredLanguage: localStorage.getItem('userLanguage') || 'en',
    trustedContacts: JSON.parse(localStorage.getItem('trustedContacts') || '[]'),
    subscriptionStatus: 'free',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  const [activeTab, setActiveTab] = useState('guides')
  const [isOnboarding, setIsOnboarding] = useState(!user.state)

  // Save user data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('userState', user.state)
    localStorage.setItem('userLanguage', user.preferredLanguage)
    localStorage.setItem('trustedContacts', JSON.stringify(user.trustedContacts))
  }, [user])

  const updateUser = (updates) => {
    setUser(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString()
    }))
  }

  const completeOnboarding = (state) => {
    updateUser({ state })
    setIsOnboarding(false)
  }

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
        <StateSelection onComplete={completeOnboarding} />
      </div>
    )
  }

  const navigation = [
    { id: 'guides', label: 'Legal Guides', icon: FileText },
    { id: 'scripts', label: 'De-escalation', icon: Shield },
    { id: 'record', label: 'Record', icon: Mic },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'guides':
        return <LegalGuides user={user} />
      case 'scripts':
        return <DeescalationScripts user={user} />
      case 'record':
        return <IncidentRecorder user={user} />
      case 'contacts':
        return <TrustedContacts user={user} updateUser={updateUser} />
      case 'settings':
        return <UserSettings user={user} updateUser={updateUser} />
      default:
        return <LegalGuides user={user} />
    }
  }

  return (
    <AppShell
      navigation={navigation}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      user={user}
    >
      {renderActiveTab()}
    </AppShell>
  )
}

export default App