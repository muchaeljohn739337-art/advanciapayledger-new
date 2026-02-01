'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Bell, X, Shield, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react'
import { io, Socket } from 'socket.io-client'

interface Alert {
  id: string
  type: 'FRAUD_DETECTED' | 'LARGE_TRANSACTION' | 'SUSPICIOUS_ACTIVITY' | 'PAYMENT_FAILED' | 'LIMIT_EXCEEDED'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  message: string
  transactionId?: string
  amount?: number
  currency?: string
  paymentMethod?: string
  riskScore?: number
  timestamp: Date
  isRead: boolean
  metadata?: Record<string, any>
}

interface AlertSystemProps {
  userId: string
  token: string
  className?: string
}

export default function AlertSystem({ userId, token, className = '' }: AlertSystemProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const severityColors = {
    LOW: 'bg-blue-50 border-blue-200 text-blue-800',
    MEDIUM: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    HIGH: 'bg-orange-50 border-orange-200 text-orange-800',
    CRITICAL: 'bg-red-50 border-red-200 text-red-800'
  }

  const severityIcons = {
    LOW: Info,
    MEDIUM: AlertCircle,
    HIGH: AlertTriangle,
    CRITICAL: Shield
  }

  const connectSocket = useCallback(() => {
    if (!userId || !token || socket) return

    setIsConnecting(true)
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      auth: {
        token
      }
    })

    newSocket.on('connect', () => {
      console.log('Connected to alert system')
      newSocket.emit('authenticate', { userId, token })
    })

    newSocket.on('authenticated', (data) => {
      console.log('Alert system authenticated')
      setIsConnecting(false)
    })

    newSocket.on('authentication_error', (error) => {
      console.error('Alert authentication failed:', error)
      setIsConnecting(false)
    })

    newSocket.on('initial_alerts', (initialAlerts: Alert[]) => {
      setAlerts(initialAlerts.map(alert => ({
        ...alert,
        timestamp: new Date(alert.timestamp)
      })))
      updateUnreadCount(initialAlerts)
    })

    newSocket.on('transaction_alert', (alert: Alert) => {
      const newAlert = {
        ...alert,
        timestamp: new Date(alert.timestamp)
      }
      setAlerts(prev => [newAlert, ...prev])
      updateUnreadCount([newAlert, ...alerts])
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from alert system')
      setIsConnecting(false)
    })

    setSocket(newSocket)
  }, [userId, token, socket, alerts])

  useEffect(() => {
    connectSocket()
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [connectSocket])

  const updateUnreadCount = (alertList: Alert[]) => {
    const unread = alertList.filter(alert => !alert.isRead).length
    setUnreadCount(unread)
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      if (socket) {
        socket.emit('acknowledge_alert', { alertId })
      }
      
      // Also call API to acknowledge
      await fetch('/api/monitoring/alerts/acknowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ alertId })
      })

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ))
      updateUnreadCount(alerts.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ))
    } catch (error) {
      console.error('Error acknowledging alert:', error)
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
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className={`relative ${className}`}>
      {/* Alert Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {isConnecting && (
          <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
        )}
      </button>

      {/* Alert Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Alerts</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {unreadCount} unread alert{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="overflow-y-auto max-h-80">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No alerts</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {alerts.map((alert) => {
                  const IconComponent = severityIcons[alert.severity]
                  return (
                    <div
                      key={alert.id}
                      className={`p-4 ${!alert.isRead ? 'bg-blue-50' : 'bg-white'} hover:bg-gray-50 transition-colors`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${severityColors[alert.severity].split(' ')[0]}`}>
                          <IconComponent className={`h-4 w-4 ${severityColors[alert.severity].split(' ')[2]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {alert.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {alert.message}
                              </p>
                              {alert.amount && (
                                <p className="text-sm font-medium text-gray-700 mt-1">
                                  {formatAmount(alert.amount, alert.currency)}
                                </p>
                              )}
                              <div className="flex items-center space-x-2 mt-2">
                                <span className="text-xs text-gray-500">
                                  {formatTime(alert.timestamp)}
                                </span>
                                {alert.riskScore && (
                                  <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                                    Risk: {alert.riskScore}
                                  </span>
                                )}
                              </div>
                            </div>
                            {!alert.isRead && (
                              <button
                                onClick={() => acknowledgeAlert(alert.id)}
                                className="ml-2 p-1 hover:bg-gray-200 rounded"
                                title="Mark as read"
                              >
                                <CheckCircle className="h-4 w-4 text-gray-400" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
