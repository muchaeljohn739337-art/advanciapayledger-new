import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import AlertSystem from '../AlertSystem'

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn()
  }))
}))

// Mock fetch
global.fetch = jest.fn()

describe('AlertSystem Component', () => {
  const mockUserId = 'user123'
  const mockToken = 'valid_token'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders alert bell button', () => {
    render(<AlertSystem userId={mockUserId} token={mockToken} />)
    
    const bellButton = screen.getByRole('button')
    expect(bellButton).toBeInTheDocument()
    
    const bellIcon = screen.getByTestId('bell-icon') || document.querySelector('[data-lucide="bell"]')
    expect(bellIcon).toBeTruthy()
  })

  it('shows unread count badge when there are alerts', async () => {
    const mockAlerts = [
      {
        id: 'alert1',
        type: 'FRAUD_DETECTED',
        severity: 'HIGH',
        title: 'Fraud Alert',
        message: 'High risk detected',
        timestamp: new Date(),
        isRead: false
      },
      {
        id: 'alert2',
        type: 'LARGE_TRANSACTION',
        severity: 'MEDIUM',
        title: 'Large Transaction',
        message: 'Large amount detected',
        timestamp: new Date(),
        isRead: false
      }
    ]

    // Mock socket to emit initial alerts
    const mockSocket = {
      on: jest.fn((event, callback) => {
        if (event === 'initial_alerts') {
          callback(mockAlerts)
        }
      }),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connect: jest.fn()
    }

    require('socket.io-client').io.mockReturnValue(mockSocket)

    render(<AlertSystem userId={mockUserId} token={mockToken} />)

    await waitFor(() => {
      const unreadBadge = screen.getByText('2')
      expect(unreadBadge).toBeInTheDocument()
    })
  })

  it('opens alert dropdown when bell is clicked', async () => {
    render(<AlertSystem userId={mockUserId} token={mockToken} />)
    
    const bellButton = screen.getByRole('button')
    fireEvent.click(bellButton)

    await waitFor(() => {
      const dropdown = screen.getByText('Alerts')
      expect(dropdown).toBeInTheDocument()
    })
  })

  it('displays alert details correctly', async () => {
    const mockAlerts = [
      {
        id: 'alert1',
        type: 'FRAUD_DETECTED',
        severity: 'HIGH',
        title: 'Fraud Risk Alert - HIGH',
        message: 'High fraud risk detected for transaction of $1000 USD via credit_card',
        amount: 1000,
        currency: 'USD',
        paymentMethod: 'credit_card',
        riskScore: 85,
        timestamp: new Date(Date.now() - 60000), // 1 minute ago
        isRead: false
      }
    ]

    const mockSocket = {
      on: jest.fn((event, callback) => {
        if (event === 'initial_alerts') {
          callback(mockAlerts)
        }
      }),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connect: jest.fn()
    }

    require('socket.io-client').io.mockReturnValue(mockSocket)

    render(<AlertSystem userId={mockUserId} token={mockToken} />)

    // Open dropdown
    const bellButton = screen.getByRole('button')
    fireEvent.click(bellButton)

    await waitFor(() => {
      expect(screen.getByText('Fraud Risk Alert - HIGH')).toBeInTheDocument()
      expect(screen.getByText('High fraud risk detected for transaction of $1000 USD via credit_card')).toBeInTheDocument()
      expect(screen.getByText('$1,000.00')).toBeInTheDocument()
      expect(screen.getByText('Risk: 85')).toBeInTheDocument()
    })
  })

  it('acknowledges alert when check button is clicked', async () => {
    const mockAlerts = [
      {
        id: 'alert1',
        type: 'FRAUD_DETECTED',
        severity: 'HIGH',
        title: 'Fraud Alert',
        message: 'High risk detected',
        timestamp: new Date(),
        isRead: false
      }
    ]

    const mockSocket = {
      on: jest.fn((event, callback) => {
        if (event === 'initial_alerts') {
          callback(mockAlerts)
        }
      }),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connect: jest.fn()
    }

    require('socket.io-client').io.mockReturnValue(mockSocket)

    // Mock fetch for API call
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    })

    render(<AlertSystem userId={mockUserId} token={mockToken} />)

    // Open dropdown
    const bellButton = screen.getByRole('button')
    fireEvent.click(bellButton)

    await waitFor(() => {
      // Find and click acknowledge button
      const acknowledgeButton = screen.getByTitle('Mark as read')
      fireEvent.click(acknowledgeButton)
    })

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('acknowledge_alert', { alertId: 'alert1' })
      expect(global.fetch).toHaveBeenCalledWith('/api/monitoring/alerts/acknowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid_token'
        },
        body: JSON.stringify({ alertId: 'alert1' })
      })
    })
  })

  it('shows no alerts message when there are no alerts', async () => {
    const mockSocket = {
      on: jest.fn((event, callback) => {
        if (event === 'initial_alerts') {
          callback([])
        }
      }),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connect: jest.fn()
    }

    require('socket.io-client').io.mockReturnValue(mockSocket)

    render(<AlertSystem userId={mockUserId} token={mockToken} />)

    // Open dropdown
    const bellButton = screen.getByRole('button')
    fireEvent.click(bellButton)

    await waitFor(() => {
      expect(screen.getByText('No alerts')).toBeInTheDocument()
    })
  })

  it('formats time correctly', async () => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    const mockAlerts = [
      {
        id: 'alert1',
        type: 'FRAUD_DETECTED',
        severity: 'HIGH',
        title: 'Fraud Alert',
        message: 'High risk detected',
        timestamp: oneHourAgo,
        isRead: false
      }
    ]

    const mockSocket = {
      on: jest.fn((event, callback) => {
        if (event === 'initial_alerts') {
          callback(mockAlerts)
        }
      }),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connect: jest.fn()
    }

    require('socket.io-client').io.mockReturnValue(mockSocket)

    render(<AlertSystem userId={mockUserId} token={mockToken} />)

    // Open dropdown
    const bellButton = screen.getByRole('button')
    fireEvent.click(bellButton)

    await waitFor(() => {
      expect(screen.getByText('1h ago')).toBeInTheDocument()
    })
  })

  it('shows connecting indicator when connecting', () => {
    render(<AlertSystem userId={mockUserId} token={mockToken} />)
    
    // The connecting indicator should be present during initial connection
    const connectingIndicator = document.querySelector('.animate-pulse')
    expect(connectingIndicator).toBeTruthy()
  })
})
