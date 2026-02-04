export enum AgentType {
  PAYMENT_PROCESSOR = 'payment_processor',
  CUSTOMER_SUPPORT = 'customer_support',
  FINANCIAL_ANALYST = 'financial_analyst',
  HEALTHCARE_SPECIALIST = 'healthcare_specialist',
  TECHNICAL_SUPPORT = 'technical_support',
  COMPLIANCE_OFFICER = 'compliance_officer',
  RISK_ANALYST = 'risk_analyst',
  BILLING_SPECIALIST = 'billing_specialist'
}

export enum AgentCapability {
  PAYMENT_PROCESSING = 'payment_processing',
  FRAUD_DETECTION = 'fraud_detection',
  COMPLIANCE_CHECK = 'compliance_check',
  CUSTOMER_SERVICE = 'customer_service',
  TROUBLESHOOTING = 'troubleshooting',
  ESCALATION = 'escalation',
  FINANCIAL_ANALYSIS = 'financial_analysis',
  RISK_ASSESSMENT = 'risk_assessment',
  REPORTING = 'reporting',
  HEALTHCARE_COMPLIANCE = 'healthcare_compliance',
  MEDICAL_BILLING = 'medical_billing',
  PATIENT_SUPPORT = 'patient_support',
  TECHNICAL_TROUBLESHOOTING = 'technical_troubleshooting',
  API_SUPPORT = 'api_support',
  INTEGRATION_HELP = 'integration_help'
}

export interface AgentRequest {
  id: string;
  message: string;
  userId: string;
  sessionId?: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  context?: {
    previousMessages?: Array<{
      role: string;
      content: string;
      timestamp: Date;
    }>;
    userProfile?: UserProfile;
    currentTransaction?: TransactionContext;
  };
}

export interface AgentResponse {
  agentId: string;
  agentType: AgentType;
  agentName: string;
  response: string;
  confidence: number;
  metadata: {
    model: string;
    tokensUsed: number;
    processingTime: number;
    intent: IntentAnalysis;
    entities: Entity[];
  };
  suggestions?: string[];
  escalationRequired?: boolean;
  followUpActions?: FollowUpAction[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  preferences: {
    language: string;
    timezone: string;
    communicationStyle: 'formal' | 'casual' | 'technical';
  };
  history: {
    totalInteractions: number;
    averageSatisfaction: number;
    preferredAgents: AgentType[];
    escalationHistory: EscalationRecord[];
  };
}

export interface TransactionContext {
  id: string;
  type: 'payment' | 'refund' | 'dispute' | 'inquiry';
  status: string;
  amount?: number;
  currency?: string;
  timestamp: Date;
  relatedEntities: {
    patientId?: string;
    invoiceId?: string;
    providerId?: string;
    insuranceId?: string;
  };
}

export interface IntentAnalysis {
  intent: string;
  confidence: number;
  categories: string[];
}

export interface Entity {
  type: string;
  value: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export interface AgentContext {
  intent: IntentAnalysis;
  entities: Entity[];
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high';
  complexity: 'low' | 'medium' | 'high';
  confidence: number;
  keywords: string[];
}

export interface FollowUpAction {
  type: 'api_call' | 'email' | 'sms' | 'task' | 'escalation';
  description: string;
  priority: 'low' | 'medium' | 'high';
  automated: boolean;
  parameters?: Record<string, unknown>;
}

export interface EscalationRecord {
  id: string;
  timestamp: Date;
  reason: string;
  escalatedTo: AgentType;
  resolution: string;
  resolutionTime: Date;
}

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  model: string;
  maxTokens: number;
  temperature: number;
  status: 'active' | 'inactive' | 'maintenance';
  performance: {
    averageResponseTime: number;
    satisfactionScore: number;
    resolutionRate: number;
    escalationRate: number;
  };
  configuration: {
    languages: string[];
    timezones: string[];
    maxConcurrentRequests: number;
    rateLimitPerMinute: number;
  };
}

export interface EventMapping {
  eventName: string;
  signature: string;
  processor: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  conditions: {
    minValue?: number;
    maxValue?: number;
    allowedSenders: string[];
    excludedSenders: string[];
    timeWindow?: {
      start: string;
      end: string;
    };
  };
}

export interface EventProcessor {
  name: string;
  handler: (event: ContractEvent) => Promise<void>;
  retryCount: number;
  timeout: number;
}

export interface ContractEvent {
  eventName: string;
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  logIndex: number;
  transactionIndex: number;
  network: string;
  timestamp: Date;
  values: Record<string, unknown>;
  signature: string;
  topics: string[];
  data: string;
}

export interface Web3Event {
  type: 'contract_event' | 'transaction' | 'block';
  network: string;
  data: ContractEvent | any;
  processed: boolean;
  timestamp: Date;
}

export interface ModelConfig {
  name: string;
  type: 'classification' | 'regression' | 'time_series' | 'clustering';
  algorithm: string;
  version: string;
  status: 'training' | 'active' | 'deprecated' | 'maintenance';
  config: Record<string, unknown>;
  features: string[];
  target: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
}

export interface PredictionResult {
  modelId: string;
  prediction: unknown;
  confidence: number;
  probability: Record<string, number>;
  explanation: string;
  timestamp: Date;
  features: Record<string, number>;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface ModelMetrics {
  modelId: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  auc_roc: number;
  confusion_matrix: number[][];
  feature_importance: Record<string, number>;
  training_time: number;
  inference_time: number;
  last_updated: Date;
}

export interface TrainingData {
  id: string;
  features: Record<string, number>;
  target: number | string;
  timestamp: Date;
  source: string;
  quality_score: number;
}

export interface FraudDetectionFeatures {
  transactionAmount: number;
  transactionFrequency: number;
  userAge: number;
  accountAge: number;
  deviceFingerprint: string;
  ipRiskScore: number;
  paymentMethod: string;
  merchantCategory: string;
  timeOfDay: number;
  dayOfWeek: number;
}

export interface RiskAssessmentFeatures {
  creditScore: number;
  incomeLevel: number;
  employmentStatus: string;
  debtToIncomeRatio: number;
  paymentHistory: number;
  accountBalance: number;
  transactionVolume: number;
  latePayments: number;
  chargeOffs: number;
  bankruptcies: number;
}

export interface CashFlowFeatures {
  dailyRevenue: number;
  transactionCount: number;
  averageTransactionValue: number;
  customerAcquisitionRate: number;
  churnRate: number;
  seasonalFactor: number;
  marketTrends: number;
  economicIndicators: number;
}

export interface PatientLifetimeFeatures {
  age: number;
  gender: string;
  insuranceType: string;
  incomeLevel: number;
  healthConditions: string[];
  visitFrequency: number;
  averageVisitValue: number;
  treatmentTypes: string[];
  medicationAdherence: number;
  satisfactionScore: number;
  referralRate: number;
  geographicLocation: string;
}
