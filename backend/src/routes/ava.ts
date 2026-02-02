/**
 * Ava AI Assistant Routes
 * Handles chat interactions and support ticket creation
 */

import { Router } from 'express';
import { processWithAva, createSupportTicket } from '../services/avaService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/ava/chat
 * Chat with Ava AI assistant
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
      });
    }

    const response = await processWithAva(message, context);

    res.json({
      response: response.message,
      confidence: response.confidence,
      shouldEscalate: response.shouldEscalate,
      escalationReason: response.escalationReason,
    });
  } catch (error) {
    logger.error('Ava chat error:', error);
    res.status(500).json({
      error: 'Failed to process message',
      message: 'An error occurred while processing your request. Please try again or contact support.',
    });
  }
});

/**
 * POST /api/ava/ticket
 * Create support ticket
 */
router.post('/ticket', async (req, res) => {
  try {
    const {
      customerName,
      email,
      country,
      issueType,
      priority,
      message,
    } = req.body;

    if (!customerName || !email || !issueType || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['customerName', 'email', 'issueType', 'message'],
      });
    }

    const ticket = await createSupportTicket({
      customerName,
      email,
      country,
      issueType,
      priority: priority || 'Medium',
      status: 'Open',
      aiHandled: false,
      messages: [
        {
          role: 'user',
          content: message,
          timestamp: new Date(),
        },
      ],
    });

    res.status(201).json({
      success: true,
      ticket: {
        id: ticket.id,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
      message: 'Support ticket created successfully. Our team will respond within 2 hours.',
    });
  } catch (error) {
    logger.error('Ticket creation error:', error);
    res.status(500).json({
      error: 'Failed to create ticket',
      message: 'An error occurred while creating your support ticket. Please try again.',
    });
  }
});

/**
 * GET /api/ava/status
 * Get Ava service status
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    name: 'Ava',
    version: '1.0.0',
    features: {
      chat: true,
      ticketing: true,
      slackIntegration: !!process.env.SLACK_WEBHOOK_URL,
      notionIntegration: !!(process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID),
    },
    aiProviders: {
      openai: !!process.env.OPENAI_API_KEY,
      claude: !!process.env.ANTHROPIC_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
    },
  });
});

export { router as avaRoutes };
