import React, { useState } from 'react'
import { User, Globe, MapPin, CreditCard, Shield, ChevronRight } from 'lucide-react'
import ContentCard from './ContentCard'

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' }
]

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

const UserSettings = ({ user, updateUser }) => {
  const [isEditingState, setIsEditingState] = useState(false)
  const [tempState, setTempState] = useState(user.state)

  const updateLanguage = (language) => {
    updateUser({ preferredLanguage: language })
  }

  const updateState = () => {
    updateUser({ state: tempState })
    setIsEditingState(false)
  }

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.removeItem('userState')
      localStorage.removeItem('userLanguage')
      localStorage.removeItem('trustedContacts')
      localStorage.removeItem('incidents')
      updateUser({
        state: '',
        preferredLanguage: 'en',
        trustedContacts: []
      })
      alert('All data has been cleared.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-text mb-2">Settings</h1>
        <p className="text-text/70">
          Manage your preferences and account
        </p>
      </div>

      {/* Profile Section */}
      <ContentCard>
        <div className="flex items-center space-x-3 mb-4">
          <User className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold text-text">Profile</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-primary/10 last:border-b-0">
            <div>
              <p className="font-medium text-text">User ID</p>
              <p className="text-sm text-text/70">{user.userId}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-primary/10 last:border-b-0">
            <div>
              <p className="font-medium text-text">Account Created</p>
              <p className="text-sm text-text/70">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </ContentCard>

      {/* Location Settings */}
      <ContentCard>
        <div className="flex items-center space-x-3 mb-4">
          <MapPin className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold text-text">Location</h2>
        </div>
        
        {isEditingState ? (
          <div className="space-y-4">
            <select
              value={tempState}
              onChange={(e) => setTempState(e.target.value)}
              className="input"
            >
              <option value="">Select your state...</option>
              {US_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <div className="flex space-x-3">
              <button onClick={updateState} className="btn-primary flex-1">
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditingState(false)
                  setTempState(user.state)
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingState(true)}
            className="flex items-center justify-between py-3 cursor-pointer hover:bg-primary/5 rounded-md px-2 -mx-2"
          >
            <div>
              <p className="font-medium text-text">State</p>
              <p className="text-sm text-text/70">{user.state || 'Not set'}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-text/40" />
          </div>
        )}
      </ContentCard>

      {/* Language Settings */}
      <ContentCard>
        <div className="flex items-center space-x-3 mb-4">
          <Globe className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold text-text">Language</h2>
        </div>
        
        <div className="space-y-2">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => updateLanguage(lang.code)}
              className={`w-full flex items-center justify-between p-3 rounded-md transition-colors ${
                user.preferredLanguage === lang.code
                  ? 'bg-primary text-white'
                  : 'hover:bg-primary/5'
              }`}
            >
              <span className="font-medium">{lang.name}</span>
              {user.preferredLanguage === lang.code && (
                <Shield className="h-5 w-5" />
              )}
            </button>
          ))}
        </div>
      </ContentCard>

      {/* Subscription Status */}
      <ContentCard>
        <div className="flex items-center space-x-3 mb-4">
          <CreditCard className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold text-text">Subscription</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text">Current Plan</p>
              <p className="text-sm text-text/70 capitalize">{user.subscriptionStatus}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              user.subscriptionStatus === 'free'
                ? 'bg-primary/10 text-primary'
                : 'bg-accent/10 text-accent'
            }`}>
              {user.subscriptionStatus === 'free' ? 'Free' : 'Premium'}
            </span>
          </div>
          
          {user.subscriptionStatus === 'free' && (
            <button className="w-full btn-primary">
              Upgrade to Premium
            </button>
          )}
        </div>
      </ContentCard>

      {/* Data Management */}
      <ContentCard>
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold text-text">Data & Privacy</h2>
        </div>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              <strong>Privacy Notice:</strong> All your data is stored locally on your device. 
              We do not collect or store personal information on our servers.
            </p>
          </div>
          
          <button
            onClick={clearAllData}
            className="w-full py-3 px-4 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors"
          >
            Clear All Data
          </button>
          
          <p className="text-xs text-text/60 text-center">
            This will remove all incidents, contacts, and settings from this device.
          </p>
        </div>
      </ContentCard>

      {/* App Info */}
      <ContentCard>
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-text">KnowYourRights AI</p>
          <p className="text-xs text-text/60">Version 1.0.0</p>
          <p className="text-xs text-text/60">
            Your pocket guide to legal rights and incident response
          </p>
        </div>
      </ContentCard>
    </div>
  )
}

export default UserSettings