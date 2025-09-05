import React, { useState } from 'react'
import { Menu, X } from 'lucide-react'

const AppShell = ({ children, navigation, activeTab, onTabChange, user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-surface border-b border-primary/10 sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-lg font-semibold text-text">KnowYourRights AI</h1>
              <p className="text-xs text-text/70">{user.state || 'Select State'}</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-2 rounded-md hover:bg-primary/5"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden bg-surface border-t border-primary/10 animate-fade-in">
            <nav className="max-w-xl mx-auto px-4 py-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-md text-left transition-colors ${
                      activeTab === item.id
                        ? 'bg-primary text-white'
                        : 'text-text hover:bg-primary/5'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Desktop Navigation */}
      <div className="hidden sm:block bg-surface border-b border-primary/10">
        <nav className="max-w-xl mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-t-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === item.id
                      ? 'bg-primary text-white'
                      : 'text-text hover:bg-primary/5'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}

export default AppShell