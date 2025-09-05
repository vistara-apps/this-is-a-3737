/**
 * Database service for KnowYourRights AI
 * Implements the PRD-specified database schema with local storage and cloud sync capabilities
 */
import { handleError } from '../utils/errorHandler'
import { isPinataConfigured, uploadIncidentSummary } from './pinata'

// Database configuration
const DB_VERSION = 1
const DB_NAME = 'KnowYourRightsDB'

// Storage keys
const STORAGE_KEYS = {
  USERS: 'users',
  INCIDENTS: 'incidents',
  LEGAL_GUIDES: 'legal_guides',
  DEESCALATION_SCRIPTS: 'deescalation_scripts',
  SYNC_STATUS: 'sync_status'
}

/**
 * Base database class with CRUD operations
 */
class BaseDatabase {
  constructor(storageKey) {
    this.storageKey = storageKey
  }

  // Get all records
  getAll() {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error(`Error reading ${this.storageKey}:`, error)
      return []
    }
  }

  // Get record by ID
  getById(id) {
    const records = this.getAll()
    return records.find(record => record.id === id) || null
  }

  // Create new record
  create(data) {
    try {
      const records = this.getAll()
      const newRecord = {
        ...data,
        id: data.id || this.generateId(),
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      records.push(newRecord)
      this.saveAll(records)
      return newRecord
    } catch (error) {
      throw handleError(error, { service: 'database', operation: 'create', storageKey: this.storageKey })
    }
  }

  // Update existing record
  update(id, updates) {
    try {
      const records = this.getAll()
      const index = records.findIndex(record => record.id === id)
      
      if (index === -1) {
        throw new Error(`Record with id ${id} not found`)
      }

      records[index] = {
        ...records[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }

      this.saveAll(records)
      return records[index]
    } catch (error) {
      throw handleError(error, { service: 'database', operation: 'update', storageKey: this.storageKey, id })
    }
  }

  // Delete record
  delete(id) {
    try {
      const records = this.getAll()
      const filteredRecords = records.filter(record => record.id !== id)
      
      if (records.length === filteredRecords.length) {
        throw new Error(`Record with id ${id} not found`)
      }

      this.saveAll(filteredRecords)
      return true
    } catch (error) {
      throw handleError(error, { service: 'database', operation: 'delete', storageKey: this.storageKey, id })
    }
  }

  // Save all records
  saveAll(records) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(records))
      this.updateSyncStatus()
    } catch (error) {
      throw handleError(error, { service: 'database', operation: 'saveAll', storageKey: this.storageKey })
    }
  }

  // Generate unique ID
  generateId() {
    return `${this.storageKey}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Update sync status
  updateSyncStatus() {
    const syncStatus = JSON.parse(localStorage.getItem(STORAGE_KEYS.SYNC_STATUS) || '{}')
    syncStatus[this.storageKey] = {
      lastModified: new Date().toISOString(),
      needsSync: true
    }
    localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(syncStatus))
  }

  // Query with filters
  query(filters = {}) {
    const records = this.getAll()
    
    return records.filter(record => {
      return Object.entries(filters).every(([key, value]) => {
        if (typeof value === 'function') {
          return value(record[key])
        }
        return record[key] === value
      })
    })
  }

  // Count records
  count(filters = {}) {
    return this.query(filters).length
  }

  // Clear all data
  clear() {
    localStorage.removeItem(this.storageKey)
    this.updateSyncStatus()
  }
}

/**
 * User database operations
 */
export class UserDatabase extends BaseDatabase {
  constructor() {
    super(STORAGE_KEYS.USERS)
  }

  // Get or create user
  getOrCreateUser(userData) {
    let user = this.getById(userData.userId)
    
    if (!user) {
      user = this.create({
        userId: userData.userId,
        state: userData.state || '',
        preferredLanguage: userData.preferredLanguage || 'en',
        trustedContacts: userData.trustedContacts || [],
        subscriptionStatus: userData.subscriptionStatus || 'free',
        settings: userData.settings || {}
      })
    }
    
    return user
  }

  // Update user preferences
  updatePreferences(userId, preferences) {
    return this.update(userId, preferences)
  }

  // Add trusted contact
  addTrustedContact(userId, contact) {
    const user = this.getById(userId)
    if (!user) throw new Error('User not found')

    const trustedContacts = [...(user.trustedContacts || []), contact]
    return this.update(userId, { trustedContacts })
  }

  // Remove trusted contact
  removeTrustedContact(userId, contactId) {
    const user = this.getById(userId)
    if (!user) throw new Error('User not found')

    const trustedContacts = (user.trustedContacts || []).filter(contact => contact.id !== contactId)
    return this.update(userId, { trustedContacts })
  }
}

/**
 * Incident database operations
 */
export class IncidentDatabase extends BaseDatabase {
  constructor() {
    super(STORAGE_KEYS.INCIDENTS)
  }

  // Create incident with cloud backup
  async createIncident(incidentData) {
    const incident = this.create({
      incidentId: incidentData.incidentId || this.generateId(),
      userId: incidentData.userId,
      timestamp: incidentData.timestamp || new Date().toISOString(),
      location: incidentData.location,
      recordingUrl: incidentData.recordingUrl,
      recordingType: incidentData.recordingType,
      summaryText: incidentData.summaryText,
      notes: incidentData.notes || '',
      ipfsHash: incidentData.ipfsHash,
      isCloudBacked: false
    })

    // Attempt cloud backup if Pinata is configured
    if (isPinataConfigured() && incident.summaryText) {
      try {
        const summaryData = {
          incidentId: incident.incidentId,
          userId: incident.userId,
          timestamp: incident.timestamp,
          location: incident.location,
          summaryText: incident.summaryText,
          notes: incident.notes,
          recordingType: incident.recordingType
        }

        const uploadResult = await uploadIncidentSummary(summaryData, {
          incidentId: incident.incidentId,
          userId: incident.userId,
          timestamp: incident.timestamp
        })

        // Update incident with IPFS hash
        const updatedIncident = this.update(incident.id, {
          summaryIpfsHash: uploadResult.ipfsHash,
          isCloudBacked: true
        })

        return updatedIncident
      } catch (error) {
        console.warn('Failed to backup incident to cloud:', error)
        // Return local incident even if cloud backup fails
        return incident
      }
    }

    return incident
  }

  // Get incidents by user
  getByUser(userId, limit = null) {
    const incidents = this.query({ userId })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    
    return limit ? incidents.slice(0, limit) : incidents
  }

  // Get incidents by date range
  getByDateRange(userId, startDate, endDate) {
    return this.query({
      userId,
      timestamp: (timestamp) => {
        const date = new Date(timestamp)
        return date >= new Date(startDate) && date <= new Date(endDate)
      }
    })
  }

  // Get incidents this month
  getThisMonth(userId) {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    return this.getByDateRange(userId, startOfMonth, endOfMonth)
  }

  // Search incidents
  search(userId, searchTerm) {
    return this.query({
      userId,
      summaryText: (text) => text && text.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }
}

/**
 * Legal Guide database operations
 */
export class LegalGuideDatabase extends BaseDatabase {
  constructor() {
    super(STORAGE_KEYS.LEGAL_GUIDES)
  }

  // Get guide by state and category
  getGuide(state, category) {
    return this.query({ state, category })[0] || null
  }

  // Save generated guide
  saveGuide(state, category, content) {
    const existingGuide = this.getGuide(state, category)
    
    if (existingGuide) {
      return this.update(existingGuide.id, {
        content,
        lastUpdated: new Date().toISOString()
      })
    } else {
      return this.create({
        state,
        category,
        content,
        lastUpdated: new Date().toISOString()
      })
    }
  }

  // Check if guide needs update (older than 30 days)
  needsUpdate(state, category) {
    const guide = this.getGuide(state, category)
    if (!guide) return true

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    return new Date(guide.lastUpdated) < thirtyDaysAgo
  }
}

/**
 * De-escalation Script database operations
 */
export class DeescalationScriptDatabase extends BaseDatabase {
  constructor() {
    super(STORAGE_KEYS.DEESCALATION_SCRIPTS)
  }

  // Get script by scenario and language
  getScript(scenario, language) {
    return this.query({ scenario, language })[0] || null
  }

  // Save generated script
  saveScript(scenario, language, content) {
    const existingScript = this.getScript(scenario, language)
    
    if (existingScript) {
      return this.update(existingScript.id, {
        content,
        lastUpdated: new Date().toISOString()
      })
    } else {
      return this.create({
        scriptId: this.generateId(),
        scenario,
        language,
        content,
        lastUpdated: new Date().toISOString()
      })
    }
  }

  // Get all scripts for a scenario
  getScriptsByScenario(scenario) {
    return this.query({ scenario })
  }

  // Get all scripts for a language
  getScriptsByLanguage(language) {
    return this.query({ language })
  }
}

/**
 * Database manager - main interface
 */
export class DatabaseManager {
  constructor() {
    this.users = new UserDatabase()
    this.incidents = new IncidentDatabase()
    this.legalGuides = new LegalGuideDatabase()
    this.deescalationScripts = new DeescalationScriptDatabase()
  }

  // Initialize database
  async initialize() {
    try {
      // Check if migration is needed
      const currentVersion = localStorage.getItem('db_version')
      if (!currentVersion || parseInt(currentVersion) < DB_VERSION) {
        await this.migrate(currentVersion ? parseInt(currentVersion) : 0)
        localStorage.setItem('db_version', DB_VERSION.toString())
      }
      
      return true
    } catch (error) {
      throw handleError(error, { service: 'database', operation: 'initialize' })
    }
  }

  // Database migration
  async migrate(fromVersion) {
    console.log(`Migrating database from version ${fromVersion} to ${DB_VERSION}`)
    
    // Add migration logic here as needed
    if (fromVersion < 1) {
      // Initial migration - ensure all storage keys exist
      Object.values(STORAGE_KEYS).forEach(key => {
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, '[]')
        }
      })
    }
  }

  // Export all data
  exportData() {
    const data = {}
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      data[key.toLowerCase()] = JSON.parse(localStorage.getItem(storageKey) || '[]')
    })
    
    return {
      version: DB_VERSION,
      exportDate: new Date().toISOString(),
      data
    }
  }

  // Import data
  importData(importData) {
    try {
      if (!importData.data) {
        throw new Error('Invalid import data format')
      }

      Object.entries(importData.data).forEach(([key, records]) => {
        const storageKey = STORAGE_KEYS[key.toUpperCase()]
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(records))
        }
      })

      return true
    } catch (error) {
      throw handleError(error, { service: 'database', operation: 'importData' })
    }
  }

  // Clear all data
  clearAll() {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
    localStorage.removeItem('db_version')
  }

  // Get storage usage
  getStorageUsage() {
    let totalSize = 0
    const usage = {}

    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      const data = localStorage.getItem(storageKey) || ''
      const size = new Blob([data]).size
      usage[key.toLowerCase()] = {
        size,
        records: JSON.parse(data || '[]').length
      }
      totalSize += size
    })

    return {
      total: totalSize,
      breakdown: usage,
      formatted: this.formatBytes(totalSize)
    }
  }

  // Format bytes for display
  formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }
}

// Global database instance
export const db = new DatabaseManager()
