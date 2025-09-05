import { useState, useEffect, useContext, createContext } from 'react'
import { 
  getSubscriptionStatus, 
  SUBSCRIPTION_PLANS, 
  canAccessFeature, 
  hasPremiumFeatures,
  getUsageLimits 
} from '../services/stripe'
import { handleError } from '../utils/errorHandler'

// Create subscription context
const SubscriptionContext = createContext()

// Subscription provider component
export const SubscriptionProvider = ({ children, userId }) => {
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (userId) {
      loadSubscription()
    }
  }, [userId])

  const loadSubscription = async () => {
    try {
      setLoading(true)
      setError(null)
      const status = await getSubscriptionStatus(userId)
      setSubscription(status)
    } catch (err) {
      const handledError = handleError(err, { context: 'SubscriptionProvider', userId })
      setError(handledError)
      // Set default free subscription on error
      setSubscription({
        status: 'active',
        plan: SUBSCRIPTION_PLANS.FREE,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshSubscription = () => {
    loadSubscription()
  }

  const value = {
    subscription,
    loading,
    error,
    refreshSubscription,
    // Helper functions
    isPremium: hasPremiumFeatures(subscription),
    canAccess: (feature) => canAccessFeature(subscription, feature),
    limits: getUsageLimits(subscription),
    plan: subscription?.plan || SUBSCRIPTION_PLANS.FREE
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

// Hook to use subscription context
export const useSubscription = () => {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}

// Hook for feature gating
export const useFeatureAccess = (feature) => {
  const { canAccess, loading, isPremium } = useSubscription()
  
  return {
    hasAccess: canAccess(feature),
    loading,
    isPremium,
    requiresUpgrade: !canAccess(feature) && !loading
  }
}

// Hook for usage tracking
export const useUsageTracking = () => {
  const { limits, plan } = useSubscription()
  const [usage, setUsage] = useState({
    incidentsThisMonth: 0,
    storageUsedGB: 0
  })

  useEffect(() => {
    loadUsage()
  }, [])

  const loadUsage = () => {
    // Load from localStorage (in real app, this would be from API)
    const incidents = JSON.parse(localStorage.getItem('incidents') || '[]')
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const incidentsThisMonth = incidents.filter(incident => {
      const incidentDate = new Date(incident.timestamp)
      return incidentDate.getMonth() === currentMonth && incidentDate.getFullYear() === currentYear
    }).length

    const storageUsedGB = incidents.length * 0.01 // Rough estimate

    setUsage({ incidentsThisMonth, storageUsedGB })
  }

  const refreshUsage = () => {
    loadUsage()
  }

  const canCreateIncident = () => {
    if (limits.incidentsPerMonth === -1) return true // Unlimited
    return usage.incidentsThisMonth < limits.incidentsPerMonth
  }

  const getUsagePercentage = (type) => {
    switch (type) {
      case 'incidents':
        if (limits.incidentsPerMonth === -1) return 0
        return Math.min(Math.round((usage.incidentsThisMonth / limits.incidentsPerMonth) * 100), 100)
      case 'storage':
        if (limits.storageGB === -1) return 0
        return Math.min(Math.round((usage.storageUsedGB / limits.storageGB) * 100), 100)
      default:
        return 0
    }
  }

  const getRemainingQuota = (type) => {
    switch (type) {
      case 'incidents':
        if (limits.incidentsPerMonth === -1) return 'Unlimited'
        return Math.max(0, limits.incidentsPerMonth - usage.incidentsThisMonth)
      case 'storage':
        if (limits.storageGB === -1) return 'Unlimited'
        return Math.max(0, limits.storageGB - usage.storageUsedGB).toFixed(2)
      default:
        return 0
    }
  }

  return {
    usage,
    limits,
    plan,
    refreshUsage,
    canCreateIncident,
    getUsagePercentage,
    getRemainingQuota,
    isNearLimit: (type, threshold = 80) => getUsagePercentage(type) >= threshold,
    isOverLimit: (type) => getUsagePercentage(type) >= 100
  }
}

// Hook for premium feature prompts
export const usePremiumPrompt = () => {
  const { isPremium } = useSubscription()
  const [showPrompt, setShowPrompt] = useState(false)
  const [promptFeature, setPromptFeature] = useState('')

  const promptForUpgrade = (feature, message) => {
    if (isPremium) return true

    setPromptFeature(feature)
    setShowPrompt(true)
    
    // You could show a modal or toast here
    console.log(`Premium feature required: ${feature}`, message)
    
    return false
  }

  const dismissPrompt = () => {
    setShowPrompt(false)
    setPromptFeature('')
  }

  return {
    showPrompt,
    promptFeature,
    promptForUpgrade,
    dismissPrompt,
    isPremium
  }
}

// Hook for subscription status checks
export const useSubscriptionStatus = () => {
  const { subscription, loading, error } = useSubscription()

  const isActive = subscription?.status === 'active'
  const isCanceled = subscription?.cancelAtPeriodEnd
  const isExpired = subscription?.status === 'canceled' || subscription?.status === 'unpaid'
  const willExpire = isCanceled && subscription?.currentPeriodEnd
  
  const daysUntilExpiry = willExpire 
    ? Math.ceil((new Date(subscription.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  return {
    subscription,
    loading,
    error,
    isActive,
    isCanceled,
    isExpired,
    willExpire,
    daysUntilExpiry,
    needsAttention: isExpired || (willExpire && daysUntilExpiry <= 7)
  }
}
