import React, { useState, useEffect } from 'react'
import { Crown, Check, X, CreditCard, Settings, AlertTriangle } from 'lucide-react'
import ContentCard from './ContentCard'
import { 
  SUBSCRIPTION_PLANS, 
  getSubscriptionStatus, 
  subscribeToplan, 
  redirectToCustomerPortal,
  formatPrice,
  hasPremiumFeatures,
  canAccessFeature,
  calculateUsagePercentage,
  isStripeConfigured
} from '../services/stripe'
import { useErrorHandler } from './ErrorBoundary'

const SubscriptionManager = ({ user, onSubscriptionChange }) => {
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [usage, setUsage] = useState({
    incidentsThisMonth: 0,
    storageUsedGB: 0
  })
  const { handleError } = useErrorHandler()

  useEffect(() => {
    loadSubscriptionStatus()
    loadUsageStats()
  }, [user.userId])

  const loadSubscriptionStatus = async () => {
    try {
      setLoading(true)
      const status = await getSubscriptionStatus(user.userId)
      setSubscription(status)
      if (onSubscriptionChange) {
        onSubscriptionChange(status)
      }
    } catch (error) {
      handleError(error, { component: 'SubscriptionManager', operation: 'loadSubscriptionStatus' })
    } finally {
      setLoading(false)
    }
  }

  const loadUsageStats = () => {
    // Load usage from localStorage (in real app, this would come from API)
    const incidents = JSON.parse(localStorage.getItem('incidents') || '[]')
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const incidentsThisMonth = incidents.filter(incident => {
      const incidentDate = new Date(incident.timestamp)
      return incidentDate.getMonth() === currentMonth && incidentDate.getFullYear() === currentYear
    }).length

    // Estimate storage usage (simplified)
    const storageUsedGB = incidents.length * 0.01 // Rough estimate: 10MB per incident

    setUsage({ incidentsThisMonth, storageUsedGB })
  }

  const handleUpgrade = async (planId) => {
    if (!isStripeConfigured()) {
      alert('Payment processing is not configured. Please contact support.')
      return
    }

    try {
      setUpgrading(true)
      setSelectedPlan(planId)
      await subscribeToplan(planId, user.userId)
    } catch (error) {
      handleError(error, { component: 'SubscriptionManager', operation: 'handleUpgrade', planId })
      alert('Failed to start upgrade process. Please try again.')
    } finally {
      setUpgrading(false)
      setSelectedPlan(null)
    }
  }

  const handleManageSubscription = async () => {
    if (!subscription?.customerId) {
      alert('No subscription found to manage.')
      return
    }

    try {
      await redirectToCustomerPortal(subscription.customerId)
    } catch (error) {
      handleError(error, { component: 'SubscriptionManager', operation: 'handleManageSubscription' })
      alert('Failed to open subscription management. Please try again.')
    }
  }

  const PlanCard = ({ plan, isCurrentPlan, isRecommended }) => {
    const isPremium = plan.id !== 'free'
    const usagePercentage = plan.limits.incidentsPerMonth > 0 
      ? calculateUsagePercentage(usage.incidentsThisMonth, plan.limits.incidentsPerMonth)
      : 0

    return (
      <ContentCard className={`relative ${isCurrentPlan ? 'ring-2 ring-primary' : ''} ${isRecommended ? 'ring-2 ring-accent' : ''}`}>
        {isRecommended && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-accent text-white px-3 py-1 rounded-full text-sm font-medium">
              Recommended
            </span>
          </div>
        )}
        
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-2">
            {isPremium && <Crown className="h-6 w-6 text-yellow-500 mr-2" />}
            <h3 className="text-xl font-semibold text-text">{plan.name}</h3>
          </div>
          
          <div className="mb-4">
            <span className="text-3xl font-bold text-primary">
              {formatPrice(plan.price)}
            </span>
            {plan.price > 0 && (
              <span className="text-text/60">/{plan.interval}</span>
            )}
          </div>

          {isCurrentPlan && (
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
              Current Plan
            </div>
          )}
        </div>

        <div className="space-y-3 mb-6">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-2">
              <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
              <span className="text-sm text-text/80">{feature}</span>
            </div>
          ))}
        </div>

        {/* Usage indicator for current plan */}
        {isCurrentPlan && plan.limits.incidentsPerMonth > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-text/70 mb-1">
              <span>Incidents this month</span>
              <span>{usage.incidentsThisMonth}/{plan.limits.incidentsPerMonth}</span>
            </div>
            <div className="w-full bg-primary/10 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  usagePercentage >= 90 ? 'bg-red-500' : 
                  usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-accent'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-auto">
          {isCurrentPlan ? (
            <div className="space-y-2">
              {isPremium && (
                <button
                  onClick={handleManageSubscription}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Manage Subscription</span>
                </button>
              )}
              {!isPremium && usagePercentage >= 80 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-900">Usage Warning</p>
                      <p className="text-xs text-orange-800">
                        You're approaching your monthly limit. Consider upgrading for unlimited access.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleUpgrade(plan.id)}
              disabled={upgrading}
              className={`w-full flex items-center justify-center space-x-2 ${
                isPremium ? 'btn-primary' : 'btn-secondary'
              } ${upgrading && selectedPlan === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {upgrading && selectedPlan === plan.id ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  <span>{isPremium ? 'Upgrade' : 'Current Plan'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </ContentCard>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const currentPlan = subscription?.plan || SUBSCRIPTION_PLANS.FREE
  const recommendedPlan = usage.incidentsThisMonth >= SUBSCRIPTION_PLANS.FREE.limits.incidentsPerMonth 
    ? SUBSCRIPTION_PLANS.PREMIUM 
    : null

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-text mb-2">Subscription Plans</h1>
        <p className="text-text/70">
          Choose the plan that best fits your needs
        </p>
      </div>

      {!isStripeConfigured() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">Payment Processing Unavailable</p>
              <p className="text-xs text-yellow-800 mt-1">
                Payment processing is not configured. All features are currently available for testing.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <PlanCard 
          plan={SUBSCRIPTION_PLANS.FREE} 
          isCurrentPlan={currentPlan.id === 'free'}
        />
        <PlanCard 
          plan={SUBSCRIPTION_PLANS.PREMIUM} 
          isCurrentPlan={currentPlan.id === 'premium'}
          isRecommended={recommendedPlan?.id === 'premium'}
        />
        <PlanCard 
          plan={SUBSCRIPTION_PLANS.PREMIUM_YEARLY} 
          isCurrentPlan={currentPlan.id === 'premium_yearly'}
        />
      </div>

      {/* Feature Comparison */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-text mb-6 text-center">Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-primary/20">
                <th className="text-left py-3 px-4 font-medium text-text">Feature</th>
                <th className="text-center py-3 px-4 font-medium text-text">Free</th>
                <th className="text-center py-3 px-4 font-medium text-text">Premium</th>
                <th className="text-center py-3 px-4 font-medium text-text">Premium Yearly</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Legal Guides', free: true, premium: true, yearly: true },
                { feature: 'De-escalation Scripts', free: true, premium: true, yearly: true },
                { feature: 'Incident Recording', free: '5/month', premium: 'Unlimited', yearly: 'Unlimited' },
                { feature: 'Cloud Backup', free: false, premium: true, yearly: true },
                { feature: 'Storage', free: '100MB', premium: '10GB', yearly: '50GB' },
                { feature: 'Priority Support', free: false, premium: true, yearly: true },
                { feature: 'Advanced Analytics', free: false, premium: true, yearly: true },
              ].map((row, index) => (
                <tr key={index} className="border-b border-primary/10">
                  <td className="py-3 px-4 text-text">{row.feature}</td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.free === 'boolean' ? (
                      row.free ? <Check className="h-4 w-4 text-accent mx-auto" /> : <X className="h-4 w-4 text-red-500 mx-auto" />
                    ) : (
                      <span className="text-text/70">{row.free}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.premium === 'boolean' ? (
                      row.premium ? <Check className="h-4 w-4 text-accent mx-auto" /> : <X className="h-4 w-4 text-red-500 mx-auto" />
                    ) : (
                      <span className="text-text/70">{row.premium}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.yearly === 'boolean' ? (
                      row.yearly ? <Check className="h-4 w-4 text-accent mx-auto" /> : <X className="h-4 w-4 text-red-500 mx-auto" />
                    ) : (
                      <span className="text-text/70">{row.yearly}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionManager
