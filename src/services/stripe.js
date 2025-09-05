/**
 * Stripe payment service for subscription management
 */
import { loadStripe } from '@stripe/stripe-js'
import { handleError } from '../utils/errorHandler'

// Initialize Stripe
let stripePromise
const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    if (!publishableKey || publishableKey === 'your-stripe-publishable-key-here') {
      console.warn('Stripe publishable key not configured. Payment features will be disabled.')
      return null
    }
    stripePromise = loadStripe(publishableKey)
  }
  return stripePromise
}

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'usd',
    interval: 'month',
    features: [
      'Basic legal guides',
      'De-escalation scripts',
      'Limited incident recording (5 per month)',
      'Local storage only',
      'Community support'
    ],
    limits: {
      incidentsPerMonth: 5,
      storageGB: 0.1,
      cloudBackup: false,
      prioritySupport: false
    }
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    currency: 'usd',
    interval: 'month',
    stripeProductId: 'prod_premium_monthly', // Replace with actual Stripe product ID
    stripePriceId: 'price_premium_monthly', // Replace with actual Stripe price ID
    features: [
      'All legal guides with AI updates',
      'Advanced de-escalation scripts',
      'Unlimited incident recording',
      'Cloud backup and sync',
      'Advanced incident analytics',
      'Priority support',
      'Legal professional network access'
    ],
    limits: {
      incidentsPerMonth: -1, // unlimited
      storageGB: 10,
      cloudBackup: true,
      prioritySupport: true
    }
  },
  PREMIUM_YEARLY: {
    id: 'premium_yearly',
    name: 'Premium (Yearly)',
    price: 99.99,
    currency: 'usd',
    interval: 'year',
    stripeProductId: 'prod_premium_yearly',
    stripePriceId: 'price_premium_yearly',
    features: [
      'All Premium features',
      '2 months free',
      'Extended storage (50GB)',
      'Advanced legal research tools'
    ],
    limits: {
      incidentsPerMonth: -1,
      storageGB: 50,
      cloudBackup: true,
      prioritySupport: true
    }
  }
}

/**
 * Check if Stripe is properly configured
 */
export const isStripeConfigured = () => {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  return !!(publishableKey && publishableKey !== 'your-stripe-publishable-key-here')
}

/**
 * Create a checkout session for subscription
 */
export const createCheckoutSession = async (planId, userId, successUrl, cancelUrl) => {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured')
  }

  const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()]
  if (!plan || !plan.stripePriceId) {
    throw new Error('Invalid subscription plan')
  }

  try {
    // In a real application, this would call your backend API
    // For now, we'll simulate the checkout session creation
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: plan.stripePriceId,
        userId,
        successUrl,
        cancelUrl,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create checkout session')
    }

    const session = await response.json()
    return session
  } catch (error) {
    throw handleError(error, { service: 'stripe', operation: 'createCheckoutSession', planId, userId })
  }
}

/**
 * Redirect to Stripe Checkout
 */
export const redirectToCheckout = async (sessionId) => {
  try {
    const stripe = await getStripe()
    if (!stripe) {
      throw new Error('Stripe not available')
    }

    const { error } = await stripe.redirectToCheckout({ sessionId })
    
    if (error) {
      throw error
    }
  } catch (error) {
    throw handleError(error, { service: 'stripe', operation: 'redirectToCheckout', sessionId })
  }
}

/**
 * Create subscription checkout flow
 */
export const subscribeToplan = async (planId, userId) => {
  try {
    const successUrl = `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${window.location.origin}/subscription/cancel`

    const session = await createCheckoutSession(planId, userId, successUrl, cancelUrl)
    await redirectToCheckout(session.id)
  } catch (error) {
    throw handleError(error, { service: 'stripe', operation: 'subscribeToplan', planId, userId })
  }
}

/**
 * Get user's subscription status
 */
export const getSubscriptionStatus = async (userId) => {
  try {
    // In a real application, this would call your backend API
    const response = await fetch(`/api/subscription/status/${userId}`)
    
    if (!response.ok) {
      throw new Error('Failed to get subscription status')
    }

    const subscription = await response.json()
    return subscription
  } catch (error) {
    // Return free tier as fallback
    console.warn('Could not fetch subscription status, defaulting to free tier')
    return {
      status: 'active',
      plan: SUBSCRIPTION_PLANS.FREE,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false
    }
  }
}

/**
 * Cancel subscription
 */
export const cancelSubscription = async (subscriptionId) => {
  try {
    const response = await fetch(`/api/subscription/cancel/${subscriptionId}`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Failed to cancel subscription')
    }

    return await response.json()
  } catch (error) {
    throw handleError(error, { service: 'stripe', operation: 'cancelSubscription', subscriptionId })
  }
}

/**
 * Update subscription
 */
export const updateSubscription = async (subscriptionId, newPriceId) => {
  try {
    const response = await fetch(`/api/subscription/update/${subscriptionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: newPriceId,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to update subscription')
    }

    return await response.json()
  } catch (error) {
    throw handleError(error, { service: 'stripe', operation: 'updateSubscription', subscriptionId, newPriceId })
  }
}

/**
 * Create customer portal session
 */
export const createPortalSession = async (customerId, returnUrl) => {
  try {
    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        returnUrl: returnUrl || window.location.origin,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create portal session')
    }

    const session = await response.json()
    return session
  } catch (error) {
    throw handleError(error, { service: 'stripe', operation: 'createPortalSession', customerId })
  }
}

/**
 * Redirect to customer portal
 */
export const redirectToCustomerPortal = async (customerId) => {
  try {
    const session = await createPortalSession(customerId)
    window.location.href = session.url
  } catch (error) {
    throw handleError(error, { service: 'stripe', operation: 'redirectToCustomerPortal', customerId })
  }
}

/**
 * Check if user has premium features
 */
export const hasPremiumFeatures = (subscription) => {
  if (!subscription) return false
  
  return subscription.status === 'active' && 
         subscription.plan && 
         subscription.plan.id !== 'free'
}

/**
 * Check if user can access specific feature
 */
export const canAccessFeature = (subscription, feature) => {
  if (!subscription) return false

  const plan = subscription.plan || SUBSCRIPTION_PLANS.FREE
  
  switch (feature) {
    case 'unlimited_recording':
      return plan.limits.incidentsPerMonth === -1
    case 'cloud_backup':
      return plan.limits.cloudBackup
    case 'priority_support':
      return plan.limits.prioritySupport
    case 'advanced_analytics':
      return hasPremiumFeatures(subscription)
    default:
      return true // Basic features available to all
  }
}

/**
 * Get usage limits for current plan
 */
export const getUsageLimits = (subscription) => {
  const plan = subscription?.plan || SUBSCRIPTION_PLANS.FREE
  return plan.limits
}

/**
 * Calculate usage percentage
 */
export const calculateUsagePercentage = (used, limit) => {
  if (limit === -1) return 0 // Unlimited
  if (limit === 0) return 100 // No allowance
  return Math.min(Math.round((used / limit) * 100), 100)
}

/**
 * Format price for display
 */
export const formatPrice = (price, currency = 'usd') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(price)
}

/**
 * Get plan recommendation based on usage
 */
export const getPlanRecommendation = (currentUsage) => {
  const { incidentsThisMonth, storageUsedGB } = currentUsage
  
  // If user is hitting free tier limits, recommend premium
  if (incidentsThisMonth >= SUBSCRIPTION_PLANS.FREE.limits.incidentsPerMonth ||
      storageUsedGB >= SUBSCRIPTION_PLANS.FREE.limits.storageGB) {
    return SUBSCRIPTION_PLANS.PREMIUM
  }
  
  return SUBSCRIPTION_PLANS.FREE
}
