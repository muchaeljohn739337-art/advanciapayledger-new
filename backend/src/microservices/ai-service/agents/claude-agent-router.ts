import { logger } from '../utils/logger';
import { 
  AgentType, 
  AgentRequest, 
  AgentResponse, 
  AgentCapability,
  AgentContext 
} from '../types/agent.types';

export class ClaudeAgentRouter {
  private agents: Map<AgentType, any> = new Map();
  private routingRules: Map<string, AgentType[]> = new Map();

  constructor() {
    this.initializeAgents();
    this.initializeRoutingRules();
  }

  private initializeAgents(): void {
    // Initialize specialized Claude agents
    this.agents.set(AgentType.PAYMENT_PROCESSOR, {
      id: 'payment-processor',
      type: AgentType.PAYMENT_PROCESSOR,
      name: 'Payment Processing Agent',
      description: 'Handles payment processing, validation, and compliance',
      capabilities: [
        AgentCapability.PAYMENT_PROCESSING,
        AgentCapability.FRAUD_DETECTION,
        AgentCapability.COMPLIANCE_CHECK
      ],
      model: 'claude-3-sonnet',
      maxTokens: 4000,
      temperature: 0.1
    });

    this.agents.set(AgentType.CUSTOMER_SUPPORT, {
      id: 'customer-support',
      type: AgentType.CUSTOMER_SUPPORT,
      name: 'Customer Support Agent',
      description: 'Provides customer assistance and support',
      capabilities: [
        AgentCapability.CUSTOMER_SERVICE,
        AgentCapability.TROUBLESHOOTING,
        AgentCapability.ESCALATION
      ],
      model: 'claude-3-sonnet',
      maxTokens: 3000,
      temperature: 0.3
    });

    this.agents.set(AgentType.FINANCIAL_ANALYST, {
      id: 'financial-analyst',
      type: AgentType.FINANCIAL_ANALYST,
      name: 'Financial Analysis Agent',
      description: 'Analyzes financial data and provides insights',
      capabilities: [
        AgentCapability.FINANCIAL_ANALYSIS,
        AgentCapability.RISK_ASSESSMENT,
        AgentCapability.REPORTING
      ],
      model: 'claude-3-opus',
      maxTokens: 6000,
      temperature: 0.2
    });

    this.agents.set(AgentType.HEALTHCARE_SPECIALIST, {
      id: 'healthcare-specialist',
      type: AgentType.HEALTHCARE_SPECIALIST,
      name: 'Healthcare Specialist Agent',
      description: 'Handles healthcare-specific queries and compliance',
      capabilities: [
        AgentCapability.HEALTHCARE_COMPLIANCE,
        AgentCapability.MEDICAL_BILLING,
        AgentCapability.PATIENT_SUPPORT
      ],
      model: 'claude-3-sonnet',
      maxTokens: 4000,
      temperature: 0.1
    });

    this.agents.set(AgentType.TECHNICAL_SUPPORT, {
      id: 'technical-support',
      type: AgentType.TECHNICAL_SUPPORT,
      name: 'Technical Support Agent',
      description: 'Provides technical assistance and troubleshooting',
      capabilities: [
        AgentCapability.TECHNICAL_TROUBLESHOOTING,
        AgentCapability.API_SUPPORT,
        AgentCapability.INTEGRATION_HELP
      ],
      model: 'claude-3-sonnet',
      maxTokens: 3000,
      temperature: 0.2
    });
  }

  private initializeRoutingRules(): void {
    // Define routing rules based on intent and keywords
    this.routingRules.set('payment', [
      AgentType.PAYMENT_PROCESSOR,
      AgentType.FINANCIAL_ANALYST
    ]);

    this.routingRules.set('fraud', [
      AgentType.PAYMENT_PROCESSOR,
      AgentType.FINANCIAL_ANALYST
    ]);

    this.routingRules.set('billing', [
      AgentType.HEALTHCARE_SPECIALIST,
      AgentType.PAYMENT_PROCESSOR
    ]);

    this.routingRules.set('hipaa', [
      AgentType.HEALTHCARE_SPECIALIST
    ]);

    this.routingRules.set('compliance', [
      AgentType.HEALTHCARE_SPECIALIST,
      AgentType.PAYMENT_PROCESSOR
    ]);

    this.routingRules.set('support', [
      AgentType.CUSTOMER_SUPPORT,
      AgentType.TECHNICAL_SUPPORT
    ]);

    this.routingRules.set('technical', [
      AgentType.TECHNICAL_SUPPORT
    ]);

    this.routingRules.set('api', [
      AgentType.TECHNICAL_SUPPORT
    ]);

    this.routingRules.set('financial', [
      AgentType.FINANCIAL_ANALYST
    ]);

    this.routingRules.set('risk', [
      AgentType.FINANCIAL_ANALYST,
      AgentType.PAYMENT_PROCESSOR
    ]);

    this.routingRules.set('patient', [
      AgentType.HEALTHCARE_SPECIALIST,
      AgentType.CUSTOMER_SUPPORT
    ]);
  }

  async routeRequest(request: AgentRequest): Promise<AgentResponse> {
    try {
      // Analyze the request to determine the best agent
      const context = await this.analyzeRequest(request);
      
      // Select the best agent based on context
      const selectedAgent = await this.selectAgent(context);
      
      if (!selectedAgent) {
        throw new Error('No suitable agent found for this request');
      }

      // Execute the request with the selected agent
      const response = await this.executeAgentRequest(selectedAgent, request, context);
      
      logger.info('Request routed successfully', {
        requestId: request.id,
        agentType: selectedAgent.type,
        confidence: context.confidence
      });

      return response;
    } catch (error) {
      logger.error('Failed to route request', { error, request });
      
      // Fallback to customer support
      return await this.fallbackToCustomerSupport(request, error);
    }
  }

  private async analyzeRequest(request: AgentRequest): Promise<AgentContext> {
    const intent = await this.extractIntent(request.message);
    const entities = await this.extractEntities(request.message);
    const sentiment = await this.analyzeSentiment(request.message);
    const urgency = await this.assessUrgency(request.message, request.metadata);
    const complexity = await this.assessComplexity(request.message);

    // Determine confidence in routing
    let confidence = 0.5;
    
    if (intent.confidence > 0.8) {
      confidence += 0.3;
    }
    
    if (entities.length > 0) {
      confidence += 0.1;
    }
    
    if (sentiment === 'negative' && urgency === 'high') {
      confidence += 0.1;
    }

    return {
      intent,
      entities,
      sentiment,
      urgency,
      complexity,
      confidence: Math.min(confidence, 1.0),
      keywords: this.extractKeywords(request.message)
    };
  }

  private async extractIntent(message: string): Promise<{
    intent: string;
    confidence: number;
    categories: string[];
  }> {
    // Use NLP to extract intent
    const lowerMessage = message.toLowerCase();
    
    const intentPatterns = {
      payment: {
        keywords: ['payment', 'pay', 'transaction', 'charge', 'billing', 'invoice'],
        confidence: 0.0,
        categories: ['financial', 'transaction']
      },
      support: {
        keywords: ['help', 'support', 'issue', 'problem', 'trouble', 'error'],
        confidence: 0.0,
        categories: ['assistance', 'troubleshooting']
      },
      technical: {
        keywords: ['api', 'integration', 'technical', 'code', 'developer', 'sdk'],
        confidence: 0.0,
        categories: ['development', 'integration']
      },
      compliance: {
        keywords: ['hipaa', 'compliance', 'regulation', 'security', 'privacy'],
        confidence: 0.0,
        categories: ['legal', 'healthcare']
      },
      fraud: {
        keywords: ['fraud', 'suspicious', 'unauthorized', 'security', 'scam'],
        confidence: 0.0,
        categories: ['security', 'risk']
      }
    };

    // Calculate confidence for each intent
    for (const [intentName, pattern] of Object.entries(intentPatterns)) {
      const matches = pattern.keywords.filter(keyword => 
        lowerMessage.includes(keyword)
      ).length;
      
      pattern.confidence = matches / pattern.keywords.length;
    }

    // Find the best matching intent
    let bestIntent = 'general';
    let bestConfidence = 0.0;
    let bestCategories = [];

    for (const [intentName, pattern] of Object.entries(intentPatterns)) {
      if (pattern.confidence > bestConfidence) {
        bestIntent = intentName;
        bestConfidence = pattern.confidence;
        bestCategories = pattern.categories;
      }
    }

    return {
      intent: bestIntent,
      confidence: bestConfidence,
      categories: bestCategories
    };
  }

  private async extractEntities(message: string): Promise<Array<{
    type: string;
    value: string;
    confidence: number;
  }>> {
    // Extract entities like payment amounts, dates, IDs, etc.
    const entities = [];
    
    // Payment amounts
    const amountPattern = /\$?\d+(?:,\d{3})*(?:\.\d{2})?/g;
    const amounts = message.match(amountPattern);
    if (amounts) {
      amounts.forEach(amount => {
        entities.push({
          type: 'amount',
          value: amount,
          confidence: 0.8
        });
      });
    }

    // Transaction IDs
    const idPattern = /(txn_|tx_|payment_|id_)[a-zA-Z0-9]+/gi;
    const ids = message.match(idPattern);
    if (ids) {
      ids.forEach(id => {
        entities.push({
          type: 'transaction_id',
          value: id,
          confidence: 0.9
        });
      });
    }

    // Dates
    const datePattern = /\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/g;
    const dates = message.match(datePattern);
    if (dates) {
      dates.forEach(date => {
        entities.push({
          type: 'date',
          value: date,
          confidence: 0.7
        });
      });
    }

    return entities;
  }

  private async analyzeSentiment(message: string): Promise<'positive' | 'negative' | 'neutral'> {
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'thank', 'helpful', 'resolved'];
    const negativeWords = ['bad', 'terrible', 'awful', 'problem', 'issue', 'error', 'failed'];
    
    const lowerMessage = message.toLowerCase();
    
    const positiveCount = positiveWords.filter(word => 
      lowerMessage.includes(word)
    ).length;
    
    const negativeCount = negativeWords.filter(word => 
      lowerMessage.includes(word)
    ).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private async assessUrgency(message: string, metadata: Record<string, unknown>): Promise<'low' | 'medium' | 'high'> {
    const urgentKeywords = ['urgent', 'emergency', 'asap', 'immediately', 'critical'];
    const lowerMessage = message.toLowerCase();
    
    const hasUrgentKeyword = urgentKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );

    if (hasUrgentKeyword) return 'high';
    if (metadata.priority === 'high') return 'high';
    if (metadata.priority === 'medium') return 'medium';
    return 'low';
  }

  private async assessComplexity(message: string): Promise<'low' | 'medium' | 'high'> {
    // Assess complexity based on message length and technical terms
    const technicalTerms = ['api', 'integration', 'blockchain', 'cryptocurrency', 'compliance'];
    const lowerMessage = message.toLowerCase();
    
    const technicalCount = technicalTerms.filter(term => 
      lowerMessage.includes(term)
    ).length;

    const wordCount = message.split(/\s+/).length;

    if (wordCount > 100 || technicalCount > 2) return 'high';
    if (wordCount > 50 || technicalCount > 0) return 'medium';
    return 'low';
  }

  private extractKeywords(message: string): string[] {
    // Extract important keywords for routing
    const keywords = message.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 10); // Limit to top 10 keywords

    return keywords;
  }

  private async selectAgent(context: AgentContext): Promise<any> {
    const { intent, confidence, urgency, complexity } = context;
    
    // Get candidate agents based on intent
    const candidateTypes = this.routingRules.get(intent.intent) || [
      AgentType.CUSTOMER_SUPPORT // Default fallback
    ];

    // Select the best agent based on context
    for (const agentType of candidateTypes) {
      const agent = this.agents.get(agentType);
      
      if (!agent) continue;

      // Check if agent has the right capabilities
      const hasRequiredCapability = this.checkAgentCapabilities(agent, context);
      
      if (hasRequiredCapability) {
        return agent;
      }
    }

    // Fallback to customer support
    return this.agents.get(AgentType.CUSTOMER_SUPPORT);
  }

  private checkAgentCapabilities(agent: any, context: AgentContext): boolean {
    const { intent, urgency, complexity } = context;
    
    // Check if agent has relevant capabilities
    const capabilityMap = {
      'payment': [AgentCapability.PAYMENT_PROCESSING],
      'fraud': [AgentCapability.FRAUD_DETECTION],
      'support': [AgentCapability.CUSTOMER_SERVICE],
      'technical': [AgentCapability.TECHNICAL_TROUBLESHOOTING],
      'compliance': [AgentCapability.HEALTHCARE_COMPLIANCE],
      'financial': [AgentCapability.FINANCIAL_ANALYSIS]
    };

    const requiredCapabilities = capabilityMap[intent.intent] || [];
    
    return requiredCapabilities.some(capability => 
      agent.capabilities.includes(capability)
    );
  }

  private async executeAgentRequest(
    agent: any, 
    request: AgentRequest, 
    context: AgentContext
  ): Promise<AgentResponse> {
    try {
      // Prepare the prompt for the agent
      const prompt = this.prepareAgentPrompt(agent, request, context);
      
      // Call Claude API
      const response = await this.callClaudeAPI(agent, prompt);
      
      return {
        agentId: agent.id,
        agentType: agent.type,
        agentName: agent.name,
        response: response.content,
        confidence: context.confidence,
        metadata: {
          model: agent.model,
          tokensUsed: response.tokensUsed,
          processingTime: response.processingTime,
          intent: context.intent,
          entities: context.entities
        }
      };
    } catch (error) {
      logger.error('Failed to execute agent request', { error, agentId: agent.id });
      throw error;
    }
  }

  private prepareAgentPrompt(agent: any, request: AgentRequest, context: AgentContext): string {
    const basePrompt = `You are ${agent.name}, a specialized AI assistant for Advancia Pay Ledger.

Your capabilities: ${agent.capabilities.join(', ')}
Your expertise: ${agent.description}

User Context:
- Intent: ${context.intent.intent} (confidence: ${context.confidence})
- Urgency: ${context.urgency}
- Complexity: ${context.complexity}
- Sentiment: ${context.sentiment}
- Entities: ${JSON.stringify(context.entities)}

User Message: ${request.message}

User Metadata: ${JSON.stringify(request.metadata)}

Please provide a helpful, accurate, and contextually appropriate response. Focus on your area of expertise and escalate if needed.`;

    return basePrompt;
  }

  private async callClaudeAPI(agent: any, prompt: string): Promise<{
    content: string;
    tokensUsed: number;
    processingTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      // In production, call actual Claude API
      // For now, return mock response
      const mockResponse = await this.generateMockResponse(agent, prompt);
      
      return {
        content: mockResponse,
        tokensUsed: Math.floor(prompt.length / 4) + Math.floor(mockResponse.length / 4),
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      logger.error('Claude API call failed', { error, agentId: agent.id });
      throw error;
    }
  }

  private async generateMockResponse(agent: any, prompt: string): Promise<string> {
    // Generate contextual mock responses based on agent type
    const responses = {
      [AgentType.PAYMENT_PROCESSOR]: 
        "I understand you need assistance with payment processing. I can help you with transaction status, payment methods, fraud detection, and compliance requirements. Could you please provide more details about your specific payment-related question?",
      
      [AgentType.CUSTOMER_SUPPORT]: 
        "Hello! I'm here to help you with any questions or issues you might be experiencing. I can assist with account management, payment inquiries, technical support, and general guidance. How can I best assist you today?",
      
      [AgentType.FINANCIAL_ANALYST]: 
        "I can help you analyze financial data, assess risks, and provide insights on payment trends and cash flow. What specific financial analysis or reporting do you need assistance with?",
      
      [AgentType.HEALTHCARE_SPECIALIST]: 
        "As a healthcare specialist, I can assist with HIPAA compliance, medical billing, patient payment processing, and healthcare-specific payment workflows. What healthcare-related payment question can I help you with?",
      
      [AgentType.TECHNICAL_SUPPORT]: 
        "I'm here to help with technical issues, API integration, SDK usage, and development questions. What technical challenge are you facing that I can assist you with?"
    };

    return responses[agent.type] || "I'm here to help you with your Advancia Pay Ledger needs. How can I assist you today?";
  }

  private async fallbackToCustomerSupport(request: AgentRequest, error: Error): Promise<AgentResponse> {
    const customerSupportAgent = this.agents.get(AgentType.CUSTOMER_SUPPORT);
    
    if (!customerSupportAgent) {
      throw new Error('Customer support agent not available');
    }

    return await this.executeAgentRequest(
      customerSupportAgent, 
      request, 
      {
        intent: { intent: 'support', confidence: 0.5, categories: ['fallback'] },
        entities: [],
        sentiment: 'neutral',
        urgency: 'medium',
        complexity: 'medium',
        confidence: 0.3,
        keywords: []
      }
    );
  }

  // Public methods for agent management
  getAvailableAgents(): Array<{
    id: string;
    type: AgentType;
    name: string;
    description: string;
    capabilities: AgentCapability[];
  }> {
    return Array.from(this.agents.values()).map(agent => ({
      id: agent.id,
      type: agent.type,
      name: agent.name,
      description: agent.description,
      capabilities: agent.capabilities
    }));
  }

  getAgent(agentId: string): any {
    return Array.from(this.agents.values()).find(agent => agent.id === agentId);
  }

  updateRoutingRules(intent: string, agentTypes: AgentType[]): void {
    this.routingRules.set(intent, agentTypes);
    logger.info('Routing rules updated', { intent, agentTypes });
  }
}
