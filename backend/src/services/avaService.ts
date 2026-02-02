/**
 * Ava AI Service
 * Handles AI-powered customer support interactions
 */

import { avaConfig, generateAvaPrompt, AI_CONFIDENCE_THRESHOLD } from '../config/ava';
import { logger } from '../utils/logger';

// Type definitions for AI API responses
interface OpenAIChatCompletion {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface ClaudeMessage {
  content: {
    text: string;
  }[];
}

interface GeminiGenerateContentResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

interface AvaResponse {
  message: string;
  confidence: number;
  shouldEscalate: boolean;
  escalationReason?: string;
}

interface SupportTicket {
  id: string;
  customerName: string;
  email: string;
  country?: string;
  issueType: 'Billing' | 'Technical' | 'Account' | 'General';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  aiHandled: boolean;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Process user message with Ava AI
 */
export async function processWithAva(
  userMessage: string,
  context?: any
): Promise<AvaResponse> {
  try {
    // Check for escalation triggers
    const shouldEscalate = checkEscalationTriggers(userMessage);
    if (shouldEscalate.escalate) {
      return {
        message: avaConfig.sampleResponses.unknown,
        confidence: 1.0,
        shouldEscalate: true,
        escalationReason: shouldEscalate.reason,
      };
    }

    // Generate AI response using configured AI provider
    const aiResponse = await generateAIResponse(userMessage, context);

    return aiResponse;
  } catch (error) {
    logger.error('Ava AI processing error:', error);
    return {
      message: avaConfig.sampleResponses.unknown,
      confidence: 0,
      shouldEscalate: true,
      escalationReason: 'AI processing error',
    };
  }
}

/**
 * Check if message contains escalation triggers
 */
function checkEscalationTriggers(message: string): {
  escalate: boolean;
  reason?: string;
} {
  const lowerMessage = message.toLowerCase();

  for (const trigger of avaConfig.escalationTriggers) {
    if (lowerMessage.includes(trigger.toLowerCase())) {
      return {
        escalate: true,
        reason: trigger,
      };
    }
  }

  return { escalate: false };
}

/**
 * Generate AI response using OpenAI, Claude, or Gemini
 */
async function generateAIResponse(
  userMessage: string,
  context?: any
): Promise<AvaResponse> {
  const prompt = generateAvaPrompt(userMessage, context);

  // Try OpenAI first
  try {
    const openaiResponse = await callOpenAI(prompt);
    return openaiResponse;
  } catch (error) {
    logger.warn('OpenAI failed, trying Claude:', error);
  }

  // Fallback to Claude
  try {
    const claudeResponse = await callClaude(prompt);
    return claudeResponse;
  } catch (error) {
    logger.warn('Claude failed, trying Gemini:', error);
  }

  // Fallback to Gemini
  try {
    const geminiResponse = await callGemini(prompt);
    return geminiResponse;
  } catch (error) {
    logger.error('All AI providers failed:', error);
    throw new Error('AI service unavailable');
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt: string): Promise<AvaResponse> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = (await response.json()) as OpenAIChatCompletion;
  const message = data.choices[0]?.message?.content || "";

  return {
    message,
    confidence: 0.85,
    shouldEscalate: false,
  };
}

/**
 * Call Claude API
 */
async function callClaude(prompt: string): Promise<AvaResponse> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = (await response.json()) as ClaudeMessage;
  const message = data.content[0]?.text || "";

  return {
    message,
    confidence: 0.9,
    shouldEscalate: false,
  };
}

/**
 * Call Gemini API
 */
async function callGemini(prompt: string): Promise<AvaResponse> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = (await response.json()) as GeminiGenerateContentResponse;
  const message = data.candidates[0]?.content.parts[0]?.text || "";

  return {
    message,
    confidence: 0.8,
    shouldEscalate: false,
  };
}

/**
 * Create support ticket
 */
export async function createSupportTicket(
  ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SupportTicket> {
  const newTicket: SupportTicket = {
    ...ticket,
    id: generateTicketId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Send to Notion if configured
  if (process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID) {
    await sendToNotion(newTicket);
  }

  // Send to Slack if configured
  if (process.env.SLACK_WEBHOOK_URL) {
    await sendToSlack(newTicket);
  }

  logger.info('Support ticket created:', { ticketId: newTicket.id });
  return newTicket;
}

/**
 * Generate unique ticket ID
 */
/**
 * Removes undefined properties from an object. Necessary for Notion API.
 */
function cleanObject(obj: any) {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    if (val !== undefined) {
      acc[key] = val;
    }
    return acc;
  }, {} as any);
}

function generateTicketId(): string {
  return `AVA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
}

/**
 * Send ticket to Notion
 */
async function sendToNotion(ticket: SupportTicket): Promise<void> {
  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    return;
  }

  try {
    await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: cleanObject({
          "Ticket ID": { title: [{ text: { content: ticket.id } }] },
          "Customer Name": {
            rich_text: [{ text: { content: ticket.customerName } }],
          },
          Email: { email: ticket.email },
          Country: ticket.country
            ? { select: { name: ticket.country } }
            : undefined,
          "Issue Type": { select: { name: ticket.issueType } },
          Priority: { select: { name: ticket.priority } },
          Status: { select: { name: ticket.status } },
          "AI Handled": { checkbox: ticket.aiHandled },
          Messages: {
            rich_text: [
              {
                text: {
                  content: ticket.messages
                    .map((m) => `[${m.role}]: ${m.content}`)
                    .join("\n\n"),
                },
              },
            ],
          },
        }),
      }),
    });

    logger.info('Ticket sent to Notion:', { ticketId: ticket.id });
  } catch (error) {
    logger.error('Failed to send ticket to Notion:', error);
  }
}

/**
 * Send ticket to Slack
 */
async function sendToSlack(ticket: SupportTicket): Promise<void> {
  const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

  if (!SLACK_WEBHOOK_URL) {
    return;
  }

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🎫 New Support Ticket: ${ticket.id}`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `🎫 New Support Ticket: ${ticket.id}`,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Customer:*\n${ticket.customerName}` },
              { type: 'mrkdwn', text: `*Email:*\n${ticket.email}` },
              { type: 'mrkdwn', text: `*Issue Type:*\n${ticket.issueType}` },
              { type: 'mrkdwn', text: `*Priority:*\n${ticket.priority}` },
              { type: 'mrkdwn', text: `*Status:*\n${ticket.status}` },
              { type: 'mrkdwn', text: `*AI Handled:*\n${ticket.aiHandled ? 'Yes' : 'No'}` },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Latest Message:*\n${ticket.messages[ticket.messages.length - 1]?.content || 'N/A'}`,
            },
          },
        ],
      }),
    });

    logger.info('Ticket sent to Slack:', { ticketId: ticket.id });
  } catch (error) {
    logger.error('Failed to send ticket to Slack:', error);
  }
}
