'use client'

import React, { useState, useEffect } from 'react'
import { Shield, AlertTriangle, Users, Activity, TrendingUp, Settings, Bell, Filter } from 'lucide-react'

interface Alert {
  id: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  message: string
  userId?: string
  transactionId?: string
  amount?: number
  currency?: string
  paymentMethod?: string
  riskScore?: number
  timestamp: Date
  isRead: boolean
  metadata?: Record<string, any>
}

interface MonitoringStats {
  totalAlerts: number
  alertsByType: Record<string, number>
  alertsBySeverity: Record<string, number>
  activeRules: number
  connectedUsers: number
}

interface MonitoringRule {
  id: string
  name: string
  description: string
  enabled: boolean
  conditions: {
    amountThreshold?: number
    riskScoreThreshold?: number
    transactionFrequency?: number
    timeWindowMinutes?: number
    paymentMethods?: string[]
    countries?: string[]
  }
  actions: {
    sendAlert: boolean
    blockTransaction: boolean
    requireVerification: boolean
    notifyAdmin: boolean
  }
  alertType: string
  severity: string
}

export default function AdminAlertDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<MonitoringStats | null>(null)
  const [rules, setRules] = useState<MonitoringRule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showRules, setShowRules] = useState(false)

  const severityColors = {
    LOW: 'bg-blue-100 text-blue-800 border-blue-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
    CRITICAL: 'bg-red-100 text-red-800 border-red-200'
  }

  const severityIcons = {
    LOW: Shield,
    MEDIUM: Bell,
    HIGH: AlertTriangle,
    CRITICAL: Activity
  }

  useEffect(() => {
    fetchData()
  }, [selectedSeverity, selectedType])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [alertsResponse, statsResponse, rulesResponse] = await Promise.all([
        fetch('/api/monitoring/admin/alerts' + (selectedSeverity !== 'all' ? `?severity=${selectedSeverity}` : '')),
        fetch('/api/monitoring/admin/stats'),
        fetch('/api/monitoring/admin/rules')
      ])

      const alertsData = await alertsResponse.json()
      const statsData = await statsResponse.json()
      const rulesData = await rulesResponse.json()

      if (alertsData.success) {
        setAlerts(alertsData.alerts.map((alert: any) => ({
          ...alert,
          timestamp: new Date(alert.timestamp)
        })))
      }

      if (statsData.success) {
        setStats(statsData.stats)
      }

      if (rulesData.success) {
        setRules(rulesData.rules)
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/monitoring/admin/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })

      if (response.ok) {
        setRules(prev => prev.map(rule => 
          rule.id === ruleId ? { ...rule, enabled } : rule
        ))
      }
    } catch (error) {
      console.error('Error toggling rule:', error)
    }
  }

  const sendTestAlert = async (userId: string, alertType: string, severity: string) => {
    try {
      const response = await fetch('/api/monitoring/admin/test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, alertType, severity })
      })

      if (response.ok) {
        fetchData() // Refresh alerts
      }
    } catch (error) {
      console.error('Error sending test alert:', error)
    }
  }

  const formatAmount = (amount?: number, currency?: string) => {
    if (!amount || !currency) return ''
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp)
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alert Management</h1>
          <p className="text-gray-600">Monitor and manage system alerts</p>
        </div>
        <button
          onClick={() => setShowRules(!showRules)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Settings className="h-4 w-4" />
          <span>{showRules ? 'View Alerts' : 'Manage Rules'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAlerts}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-600">{stats.alertsBySeverity.CRITICAL || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Rules</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeRules}</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Connected Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.connectedUsers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {!showRules ? (
        <>
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-500" />
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Severity:</label>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Type:</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All</option>
                  <option value="FRAUD_DETECTED">Fraud Detected</option>
                  <option value="LARGE_TRANSACTION">Large Transaction</option>
                  <option value="SUSPICIOUS_ACTIVITY">Suspicious Activity</option>
                  <option value="PAYMENT_FAILED">Payment Failed</option>
                  <option value="LIMIT_EXCEEDED">Limit Exceeded</option>
                </select>
              </div>
            </div>
          </div>

          {/* Alerts List */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No alerts found</p>
                </div>
              ) : (
                alerts.map((alert) => {
                  const IconComponent = severityIcons[alert.severity]
                  return (
                    <div key={alert.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg border ${severityColors[alert.severity]}`}>
                          <IconComponent className={`h-4 w-4`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {alert.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {alert.message}
                              </p>
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-xs text-gray-500">
                                  {formatTime(alert.timestamp)}
                                </span>
                                {alert.userId && (
                                  <span className="text-xs text-gray-500">
                                    User: {alert.userId}
                                  </span>
                                )}
                                {alert.amount && (
                                  <span className="text-sm font-medium text-gray-700">
                                    {formatAmount(alert.amount, alert.currency)}
                                  </span>
                                )}
                                {alert.riskScore && (
                                  <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                                    Risk: {alert.riskScore}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${severityColors[alert.severity]}`}>
                              {alert.severity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      ) : (
        /* Rules Management */
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Monitoring Rules</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {rules.map((rule) => (
              <div key={rule.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900">{rule.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rule.enabled ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${severityColors[rule.severity as keyof typeof severityColors]}`}>
                        {rule.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                    <div className="mt-2 space-y-1">
                      {rule.conditions.amountThreshold && (
                        <p className="text-xs text-gray-500">
                          Amount threshold: ${rule.conditions.amountThreshold}
                        </p>
                      )}
                      {rule.conditions.riskScoreThreshold && (
                        <p className="text-xs text-gray-500">
                          Risk score threshold: {rule.conditions.riskScoreThreshold}
                        </p>
                      )}
                      {rule.conditions.transactionFrequency && (
                        <p className="text-xs text-gray-500">
                          Frequency: {rule.conditions.transactionFrequency} in {rule.conditions.timeWindowMinutes}min
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleRule(rule.id, !rule.enabled)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        rule.enabled 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {rule.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
