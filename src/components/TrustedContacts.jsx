import React, { useState } from 'react'
import { Plus, Trash2, Phone, Mail, AlertTriangle } from 'lucide-react'
import ContentCard from './ContentCard'

const TrustedContacts = ({ user, updateUser }) => {
  const [isAdding, setIsAdding] = useState(false)
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: ''
  })

  const addContact = (e) => {
    e.preventDefault()
    
    if (!newContact.name || !newContact.phone) {
      alert('Name and phone number are required.')
      return
    }

    const contact = {
      id: 'contact_' + Date.now(),
      ...newContact,
      createdAt: new Date().toISOString()
    }

    updateUser({
      trustedContacts: [...user.trustedContacts, contact]
    })

    setNewContact({ name: '', phone: '', email: '', relationship: '' })
    setIsAdding(false)
  }

  const removeContact = (contactId) => {
    updateUser({
      trustedContacts: user.trustedContacts.filter(c => c.id !== contactId)
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-text mb-2">Trusted Contacts</h1>
        <p className="text-text/70">
          People to alert in case of an emergency
        </p>
      </div>

      {/* Add Contact Form */}
      {isAdding ? (
        <ContentCard>
          <h3 className="text-lg font-semibold text-text mb-4">Add New Contact</h3>
          <form onSubmit={addContact} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Name *</label>
              <input
                type="text"
                value={newContact.name}
                onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                className="input"
                placeholder="Enter full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Phone Number *</label>
              <input
                type="tel"
                value={newContact.phone}
                onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                className="input"
                placeholder="(555) 123-4567"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Email (Optional)</label>
              <input
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                className="input"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Relationship</label>
              <select
                value={newContact.relationship}
                onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
                className="input"
              >
                <option value="">Select relationship</option>
                <option value="family">Family Member</option>
                <option value="friend">Friend</option>
                <option value="lawyer">Lawyer</option>
                <option value="emergency">Emergency Contact</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <button type="submit" className="btn-primary flex-1">
                Add Contact
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </ContentCard>
      ) : (
        <ContentCard>
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center space-x-2 py-4 border-2 border-dashed border-primary/30 rounded-lg text-primary hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Add Trusted Contact</span>
          </button>
        </ContentCard>
      )}

      {/* Existing Contacts */}
      {user.trustedContacts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-text mb-4">Your Contacts</h2>
          <div className="space-y-4">
            {user.trustedContacts.map((contact) => (
              <ContentCard key={contact.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text mb-1">{contact.name}</h3>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm text-text/70">
                        <Phone className="h-4 w-4" />
                        <span>{contact.phone}</span>
                      </div>
                      {contact.email && (
                        <div className="flex items-center space-x-2 text-sm text-text/70">
                          <Mail className="h-4 w-4" />
                          <span>{contact.email}</span>
                        </div>
                      )}
                      {contact.relationship && (
                        <span className="inline-block bg-primary/10 text-primary text-xs px-2 py-1 rounded-full capitalize">
                          {contact.relationship.replace('-', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeContact(contact.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove contact"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </ContentCard>
            ))}
          </div>
        </div>
      )}

      {/* Information Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">How Emergency Alerts Work</p>
            <p className="text-xs text-blue-800 mt-1">
              When you tap "Send Emergency Alert" during incident recording, your trusted contacts 
              will receive a message with your location and a notification that you may need assistance.
            </p>
          </div>
        </div>
      </div>

      {user.trustedContacts.length === 0 && !isAdding && (
        <div className="text-center py-12 text-text/60">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No trusted contacts added yet.</p>
          <p className="text-sm mt-1">Add contacts to enable emergency alerts.</p>
        </div>
      )}
    </div>
  )
}

export default TrustedContacts