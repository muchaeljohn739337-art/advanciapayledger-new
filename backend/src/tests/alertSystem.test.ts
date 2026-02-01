import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { Server } from 'socket.io'
import { createServer } from 'http'
import { RealTimeMonitoringService } from '../services/realTimeMonitoringService'
import { prisma } from '../lib/prisma'

// Mock dependencies
jest.mock('../lib/prisma')
jest.mock('../utils/logger')

describe('Alert System', () => {
  let monitoringService: RealTimeMonitoringService
  let server: any
  let io: Server

  beforeEach(() => {
    server = createServer()
    monitoringService = new RealTimeMonitoringService(server)
    io = monitoringService['io']
  })

  afterEach(() => {
    server?.close()
    io?.close()
  })

  describe('Alert Creation', () => {
    it('should create fraud alert for high risk score', async () => {
      const transactionData = {
        userId: 'user123',
        amount: 1000,
        currency: 'USD',
        paymentMethod: 'credit_card',
        riskScore: 85,
        status: 'pending',
        transactionId: 'tx123'
      }

      const alerts = await monitoringService.processTransaction(transactionData)

      expect(alerts).toHaveLength(1)
      expect(alerts[0].type).toBe('FRAUD_DETECTED')
      expect(alerts[0].severity).toBe('HIGH')
      expect(alerts[0].title).toContain('Fraud Risk Alert')
    })

    it('should create critical fraud alert for very high risk score', async () => {
      const transactionData = {
        userId: 'user123',
        amount: 5000,
        currency: 'USD',
        paymentMethod: 'wire_transfer',
        riskScore: 95,
        status: 'pending',
        transactionId: 'tx124'
      }

      const alerts = await monitoringService.processTransaction(transactionData)

      expect(alerts).toHaveLength(1)
      expect(alerts[0].type).toBe('FRAUD_DETECTED')
      expect(alerts[0].severity).toBe('CRITICAL')
    })

    it('should create large transaction alert', async () => {
      const transactionData = {
        userId: 'user123',
        amount: 15000,
        currency: 'USD',
        paymentMethod: 'ach',
        riskScore: 30,
        status: 'pending',
        transactionId: 'tx125'
      }

      const alerts = await monitoringService.processTransaction(transactionData)

      expect(alerts).toHaveLength(1)
      expect(alerts[0].type).toBe('LARGE_TRANSACTION')
      expect(alerts[0].severity).toBe('MEDIUM')
    })
  })

  describe('Alert Management', () => {
    it('should mark alert as read', async () => {
      const alertId = 'alert123'
      const userId = 'user123'

      // Mock alert in cache
      const mockAlert = {
        id: alertId,
        userId,
        type: 'FRAUD_DETECTED' as const,
        severity: 'HIGH' as const,
        title: 'Test Alert',
        message: 'Test message',
        timestamp: new Date(),
        isRead: false
      }

      monitoringService['alertCache'].set(userId, [mockAlert])

      // Mock database update
      ;(prisma.alert.update as jest.Mock).mockResolvedValue({})

      await monitoringService.markAlertAsRead(alertId, userId)

      const userAlerts = monitoringService['alertCache'].get(userId) || []
      const updatedAlert = userAlerts.find(a => a.id === alertId)

      expect(updatedAlert?.isRead).toBe(true)
      expect(prisma.alert.update).toHaveBeenCalledWith({
        where: { id: alertId },
        data: { isRead: true }
      })
    })

    it('should get user alerts from database when cache is empty', async () => {
      const userId = 'user123'
      const mockDbAlerts = [
        {
          id: 'alert1',
          userId,
          type: 'FRAUD_DETECTED',
          severity: 'HIGH',
          title: 'Fraud Alert',
          message: 'High risk detected',
          transactionId: 'tx1',
          amount: { toString: () => '1000' },
          currency: 'USD',
          paymentMethod: 'credit_card',
          riskScore: 85,
          createdAt: new Date(),
          isRead: false,
          metadata: {}
        }
      ]

      ;(prisma.alert.findMany as jest.Mock).mockResolvedValue(mockDbAlerts)

      const alerts = await monitoringService.getUserAlerts(userId)

      expect(alerts).toHaveLength(1)
      expect(alerts[0].id).toBe('alert1')
      expect(alerts[0].type).toBe('FRAUD_DETECTED')
      expect(alerts[0].amount).toBe(1000)
    })
  })

  describe('Monitoring Rules', () => {
    it('should add new monitoring rule', async () => {
      const newRule = {
        name: 'Custom Rule',
        description: 'Test rule',
        enabled: true,
        conditions: { amountThreshold: 5000 },
        actions: {
          sendAlert: true,
          blockTransaction: false,
          requireVerification: false,
          notifyAdmin: false
        },
        alertType: 'LARGE_TRANSACTION' as const,
        severity: 'MEDIUM' as const
      }

      const rule = await monitoringService.addMonitoringRule(newRule)

      expect(rule.name).toBe('Custom Rule')
      expect(rule.id).toBeDefined()
      expect(rule.enabled).toBe(true)

      const rules = monitoringService.getMonitoringRules()
      expect(rules).toContainEqual(rule)
    })

    it('should update monitoring rule', async () => {
      const ruleId = 'rule123'
      const updates = { enabled: false }

      // Mock existing rule
      const mockRule = {
        id: ruleId,
        name: 'Test Rule',
        description: 'Test',
        enabled: true,
        conditions: {},
        actions: {},
        alertType: 'FRAUD_DETECTED' as const,
        severity: 'HIGH' as const
      }

      monitoringService['monitoringRules'].set(ruleId, mockRule)

      const updatedRule = await monitoringService.updateMonitoringRule(ruleId, updates)

      expect(updatedRule?.enabled).toBe(false)
    })

    it('should delete monitoring rule', async () => {
      const ruleId = 'rule123'
      
      // Mock existing rule
      const mockRule = {
        id: ruleId,
        name: 'Test Rule',
        description: 'Test',
        enabled: true,
        conditions: {},
        actions: {},
        alertType: 'FRAUD_DETECTED' as const,
        severity: 'HIGH' as const
      }

      monitoringService['monitoringRules'].set(ruleId, mockRule)

      const deleted = await monitoringService.deleteMonitoringRule(ruleId)

      expect(deleted).toBe(true)
      expect(monitoringService['monitoringRules'].has(ruleId)).toBe(false)
    })
  })

  describe('Alert Statistics', () => {
    it('should return monitoring statistics', async () => {
      const userId = 'user123'
      const mockAlerts = [
        {
          id: 'alert1',
          userId,
          type: 'FRAUD_DETECTED' as const,
          severity: 'HIGH' as const,
          title: 'Alert 1',
          message: 'Message 1',
          timestamp: new Date(),
          isRead: false
        },
        {
          id: 'alert2',
          userId,
          type: 'LARGE_TRANSACTION' as const,
          severity: 'MEDIUM' as const,
          title: 'Alert 2',
          message: 'Message 2',
          timestamp: new Date(),
          isRead: false
        }
      ]

      monitoringService['alertCache'].set(userId, mockAlerts)

      const stats = await monitoringService.getMonitoringStats()

      expect(stats.totalAlerts).toBe(2)
      expect(stats.alertsByType['FRAUD_DETECTED']).toBe(1)
      expect(stats.alertsByType['LARGE_TRANSACTION']).toBe(1)
      expect(stats.alertsBySeverity['HIGH']).toBe(1)
      expect(stats.alertsBySeverity['MEDIUM']).toBe(1)
    })
  })

  describe('Socket Authentication', () => {
    it('should authenticate user for monitoring', async () => {
      const mockSocket = {
        id: 'socket123',
        userId: undefined,
        join: jest.fn(),
        emit: jest.fn(),
        on: jest.fn()
      }

      const mockUser = { id: 'user123', email: 'test@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      // Simulate authentication event
      await monitoringService['initializeSocketHandlers']()
      
      // This would normally be called by socket.io
      const authData = { userId: 'user123', token: 'valid_token' }
      
      // Verify the authentication logic works
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: authData.userId }
      })
    })
  })
})
