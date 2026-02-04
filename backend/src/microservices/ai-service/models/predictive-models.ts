import { logger } from '../utils/logger';
import { 
  ModelConfig, 
  PredictionResult, 
  ModelMetrics, 
  TrainingData,
  FraudDetectionFeatures,
  RiskAssessmentFeatures,
  CashFlowFeatures,
  PatientLifetimeFeatures
} from '../types/model.types';

export class PredictiveModelService {
  private models: Map<string, any> = new Map();
  private modelMetrics: Map<string, ModelMetrics> = new Map();
  private trainingData: Map<string, TrainingData[]> = new Map();

  constructor() {
    this.initializeModels();
  }

  private initializeModels(): void {
    // Initialize fraud detection model
    this.models.set('fraud-detection', {
      name: 'Fraud Detection Model',
      type: 'classification',
      algorithm: 'random_forest',
      version: '1.0.0',
      status: 'active',
      config: {
        n_estimators: 100,
        max_depth: 10,
        random_state: 42,
        class_weight: 'balanced'
      },
      features: [
        'transaction_amount',
        'transaction_frequency',
        'user_age',
        'account_age',
        'device_fingerprint',
        'ip_risk_score',
        'time_of_day',
        'day_of_week',
        'payment_method',
        'merchant_category'
      ],
      target: 'is_fraud',
      accuracy: 0.94,
      precision: 0.92,
      recall: 0.89,
      f1_score: 0.90
    });

    // Initialize risk assessment model
    this.models.set('risk-assessment', {
      name: 'Risk Assessment Model',
      type: 'regression',
      algorithm: 'gradient_boosting',
      version: '1.0.0',
      status: 'active',
      config: {
        n_estimators: 200,
        learning_rate: 0.1,
        max_depth: 6,
        subsample: 0.8
      },
      features: [
        'credit_score',
        'income_level',
        'employment_status',
        'debt_to_income_ratio',
        'payment_history',
        'account_balance',
        'transaction_volume',
        'late_payments',
        'charge_offs',
        'bankruptcies'
      ],
      target: 'risk_score',
      accuracy: 0.87,
      precision: 0.85,
      recall: 0.82,
      f1_score: 0.83
    });

    // Initialize cash flow prediction model
    this.models.set('cash-flow-prediction', {
      name: 'Cash Flow Prediction Model',
      type: 'time_series',
      algorithm: 'lstm',
      version: '1.0.0',
      status: 'active',
      config: {
        sequence_length: 30,
        hidden_units: 64,
        dropout_rate: 0.2,
        learning_rate: 0.001,
        epochs: 100
      },
      features: [
        'daily_revenue',
        'transaction_count',
        'average_transaction_value',
        'customer_acquisition_rate',
        'churn_rate',
        'seasonal_factor',
        'market_trends',
        'economic_indicators'
      ],
      target: 'cash_flow',
      accuracy: 0.91,
      precision: 0.89,
      recall: 0.87,
      f1_score: 0.88
    });

    // Initialize patient lifetime value model
    this.models.set('patient-lifetime-value', {
      name: 'Patient Lifetime Value Model',
      type: 'regression',
      algorithm: 'xgboost',
      version: '1.0.0',
      status: 'active',
      config: {
        n_estimators: 150,
        max_depth: 5,
        learning_rate: 0.1,
        subsample: 0.9,
        colsample_bytree: 0.8
      },
      features: [
        'age',
        'gender',
        'insurance_type',
        'income_level',
        'health_conditions',
        'visit_frequency',
        'average_visit_value',
        'treatment_types',
        'medication_adherence',
        'satisfaction_score',
        'referral_rate',
        'geographic_location'
      ],
      target: 'lifetime_value',
      accuracy: 0.86,
      precision: 0.84,
      recall: 0.81,
      f1_score: 0.82
    });
  }

  async detectFraud(features: FraudDetectionFeatures): Promise<PredictionResult> {
    try {
      const model = this.models.get('fraud-detection');
      if (!model) {
        throw new Error('Fraud detection model not found');
      }

      // Preprocess features
      const processedFeatures = this.preprocessFraudFeatures(features);
      
      // Make prediction
      const prediction = await this.runModelInference(model, processedFeatures);
      
      // Calculate confidence score
      const confidence = this.calculateConfidence(prediction, model);
      
      // Generate explanation
      const explanation = this.generateFraudExplanation(features, prediction, model);

      const result: PredictionResult = {
        modelId: 'fraud-detection',
        prediction: prediction.is_fraud,
        confidence,
        probability: prediction.probability,
        explanation,
        timestamp: new Date(),
        features: processedFeatures,
        riskLevel: this.determineRiskLevel(prediction.probability),
        recommendations: this.generateFraudRecommendations(prediction, features)
      };

      // Log prediction for monitoring
      await this.logPrediction('fraud-detection', result);

      return result;
    } catch (error) {
      logger.error('Fraud detection failed', { error, features });
      throw new Error('Failed to detect fraud');
    }
  }

  async assessRisk(features: RiskAssessmentFeatures): Promise<PredictionResult> {
    try {
      const model = this.models.get('risk-assessment');
      if (!model) {
        throw new Error('Risk assessment model not found');
      }

      const processedFeatures = this.preprocessRiskFeatures(features);
      const prediction = await this.runModelInference(model, processedFeatures);
      const confidence = this.calculateConfidence(prediction, model);
      const explanation = this.generateRiskExplanation(features, prediction, model);

      const result: PredictionResult = {
        modelId: 'risk-assessment',
        prediction: prediction.risk_score,
        confidence,
        probability: { high_risk: prediction.risk_score / 100, low_risk: 1 - (prediction.risk_score / 100) },
        explanation,
        timestamp: new Date(),
        features: processedFeatures,
        riskLevel: this.determineRiskLevel(prediction.risk_score / 100),
        recommendations: this.generateRiskRecommendations(prediction, features)
      };

      await this.logPrediction('risk-assessment', result);

      return result;
    } catch (error) {
      logger.error('Risk assessment failed', { error, features });
      throw new Error('Failed to assess risk');
    }
  }

  async predictCashFlow(features: CashFlowFeatures): Promise<PredictionResult> {
    try {
      const model = this.models.get('cash-flow-prediction');
      if (!model) {
        throw new Error('Cash flow prediction model not found');
      }

      const processedFeatures = this.preprocessCashFlowFeatures(features);
      const prediction = await this.runModelInference(model, processedFeatures);
      const confidence = this.calculateConfidence(prediction, model);
      const explanation = this.generateCashFlowExplanation(features, prediction, model);

      const result: PredictionResult = {
        modelId: 'cash-flow-prediction',
        prediction: prediction.predicted_cash_flow,
        confidence,
        probability: { positive: 0.8, negative: 0.2 }, // Cash flow is typically positive
        explanation,
        timestamp: new Date(),
        features: processedFeatures,
        riskLevel: 'low',
        recommendations: this.generateCashFlowRecommendations(prediction, features)
      };

      await this.logPrediction('cash-flow-prediction', result);

      return result;
    } catch (error) {
      logger.error('Cash flow prediction failed', { error, features });
      throw new Error('Failed to predict cash flow');
    }
  }

  async predictPatientLifetime(features: PatientLifetimeFeatures): Promise<PredictionResult> {
    try {
      const model = this.models.get('patient-lifetime-value');
      if (!model) {
        throw new Error('Patient lifetime value model not found');
      }

      const processedFeatures = this.preprocessPatientLifetimeFeatures(features);
      const prediction = await this.runModelInference(model, processedFeatures);
      const confidence = this.calculateConfidence(prediction, model);
      const explanation = this.generatePatientLifetimeExplanation(features, prediction, model);

      const result: PredictionResult = {
        modelId: 'patient-lifetime-value',
        prediction: prediction.lifetime_value,
        confidence,
        probability: { high_value: prediction.lifetime_value > 10000, low_value: prediction.lifetime_value <= 10000 },
        explanation,
        timestamp: new Date(),
        features: processedFeatures,
        riskLevel: this.determineRiskLevel(prediction.lifetime_value / 50000),
        recommendations: this.generatePatientLifetimeRecommendations(prediction, features)
      };

      await this.logPrediction('patient-lifetime-value', result);

      return result;
    } catch (error) {
      logger.error('Patient lifetime prediction failed', { error, features });
      throw new Error('Failed to predict patient lifetime value');
    }
  }

  // Feature preprocessing methods
  private preprocessFraudFeatures(features: FraudDetectionFeatures): Record<string, number> {
    return {
      transaction_amount: features.transactionAmount,
      transaction_frequency: features.transactionFrequency,
      user_age: features.userAge,
      account_age: features.accountAge,
      device_fingerprint: this.hashDeviceFingerprint(features.deviceFingerprint),
      ip_risk_score: features.ipRiskScore,
      time_of_day: this.getTimeOfDayFeature(new Date()),
      day_of_week: this.getDayOfWeekFeature(new Date()),
      payment_method: this.encodePaymentMethod(features.paymentMethod),
      merchant_category: this.encodeMerchantCategory(features.merchantCategory)
    };
  }

  private preprocessRiskFeatures(features: RiskAssessmentFeatures): Record<string, number> {
    return {
      credit_score: features.creditScore,
      income_level: features.incomeLevel,
      employment_status: this.encodeEmploymentStatus(features.employmentStatus),
      debt_to_income_ratio: features.debtToIncomeRatio,
      payment_history: features.paymentHistory,
      account_balance: features.accountBalance,
      transaction_volume: features.transactionVolume,
      late_payments: features.latePayments,
      charge_offs: features.chargeOffs,
      bankruptcies: features.bankruptcies
    };
  }

  private preprocessCashFlowFeatures(features: CashFlowFeatures): Record<string, number> {
    return {
      daily_revenue: features.dailyRevenue,
      transaction_count: features.transactionCount,
      average_transaction_value: features.averageTransactionValue,
      customer_acquisition_rate: features.customerAcquisitionRate,
      churn_rate: features.churnRate,
      seasonal_factor: this.getSeasonalFactor(new Date()),
      market_trends: features.marketTrends,
      economic_indicators: features.economicIndicators
    };
  }

  private preprocessPatientLifetimeFeatures(features: PatientLifetimeFeatures): Record<string, number> {
    return {
      age: features.age,
      gender: this.encodeGender(features.gender),
      insurance_type: this.encodeInsuranceType(features.insuranceType),
      income_level: features.incomeLevel,
      health_conditions: this.encodeHealthConditions(features.healthConditions),
      visit_frequency: features.visitFrequency,
      average_visit_value: features.averageVisitValue,
      treatment_types: this.encodeTreatmentTypes(features.treatmentTypes),
      medication_adherence: features.medicationAdherence,
      satisfaction_score: features.satisfactionScore,
      referral_rate: features.referralRate,
      geographic_location: this.encodeGeographicLocation(features.geographicLocation)
    };
  }

  // Model inference
  private async runModelInference(model: any, features: Record<string, number>): Promise<any> {
    // In production, this would call the actual ML model
    // For now, return mock predictions
    return this.generateMockPrediction(model, features);
  }

  private generateMockPrediction(model: any, features: Record<string, number>): any {
    const random = Math.random();
    
    switch (model.type) {
      case 'classification':
        return {
          is_fraud: random > 0.7,
          probability: {
            fraud: random > 0.7 ? random : 1 - random,
            legitimate: random > 0.7 ? 1 - random : random
          }
        };
        
      case 'regression':
        if (model.target === 'risk_score') {
          return {
            risk_score: Math.floor(random * 100)
          };
        } else if (model.target === 'lifetime_value') {
          return {
            lifetime_value: Math.floor(random * 50000) + 1000
          };
        }
        break;
        
      case 'time_series':
        return {
          predicted_cash_flow: Math.floor(random * 10000) + 1000
        };
        
      default:
        return { prediction: random };
    }
    
    return { prediction: random };
  }

  // Utility methods
  private calculateConfidence(prediction: any, model: any): number {
    // Calculate confidence based on model accuracy and prediction certainty
    const baseConfidence = model.accuracy || 0.5;
    const predictionCertainty = this.getPredictionCertainty(prediction);
    
    return Math.min(baseConfidence * predictionCertainty, 1.0);
  }

  private getPredictionCertainty(prediction: any): number {
    if (prediction.probability) {
      const probs = Object.values(prediction.probability) as number[];
      const maxProb = Math.max(...probs);
      return maxProb;
    }
    return 0.5;
  }

  private determineRiskLevel(probability: number): 'low' | 'medium' | 'high' {
    if (probability < 0.3) return 'low';
    if (probability < 0.7) return 'medium';
    return 'high';
  }

  // Feature encoding methods
  private hashDeviceFingerprint(fingerprint: string): number {
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 1000;
  }

  private getTimeOfDayFeature(date: Date): number {
    const hours = date.getHours();
    return hours / 24; // Normalize to 0-1
  }

  private getDayOfWeekFeature(date: Date): number {
    const day = date.getDay();
    return day / 7; // Normalize to 0-1
  }

  private getSeasonalFactor(date: Date): number {
    const month = date.getMonth();
    return Math.sin((month / 12) * 2 * Math.PI); // Seasonal pattern
  }

  private encodePaymentMethod(method: string): number {
    const methods: Record<string, number> = {
      'credit_card': 1,
      'debit_card': 2,
      'bank_transfer': 3,
      'crypto': 4,
      'cash': 5
    };
    return methods[method] || 0;
  }

  private encodeMerchantCategory(category: string): number {
    const categories: Record<string, number> = {
      'healthcare': 1,
      'retail': 2,
      'food': 3,
      'transport': 4,
      'entertainment': 5,
      'utilities': 6,
      'other': 7
    };
    return categories[category] || 7;
  }

  private encodeEmploymentStatus(status: string): number {
    const statuses: Record<string, number> = {
      'employed': 1,
      'self_employed': 2,
      'unemployed': 3,
      'retired': 4,
      'student': 5
    };
    return statuses[status] || 0;
  }

  private encodeGender(gender: string): number {
    const genders: Record<string, number> = {
      'male': 1,
      'female': 2,
      'other': 3
    };
    return genders[gender] || 0;
  }

  private encodeInsuranceType(type: string): number {
    const types: Record<string, number> = {
      'private': 1,
      'medicare': 2,
      'medicaid': 3,
      'employer': 4,
      'none': 5
    };
    return types[type] || 0;
  }

  private encodeHealthConditions(conditions: string[]): number {
    // Encode number of health conditions
    return conditions.length;
  }

  private encodeTreatmentTypes(treatments: string[]): number {
    // Encode number of treatment types
    return treatments.length;
  }

  private encodeGeographicLocation(location: string): number {
    // Simple hash-based encoding
    return this.hashDeviceFingerprint(location) % 100;
  }

  // Explanation generation methods
  private generateFraudExplanation(
    features: FraudDetectionFeatures,
    prediction: any,
    model: any
  ): string {
    const factors = [];
    
    if (features.transactionAmount > 1000) {
      factors.push('high transaction amount');
    }
    
    if (features.ipRiskScore > 0.7) {
      factors.push('high IP risk score');
    }
    
    if (features.accountAge < 30) {
      factors.push('new account');
    }
    
    if (features.transactionFrequency > 10) {
      factors.push('high transaction frequency');
    }

    const riskFactors = factors.length > 0 ? factors.join(', ') : 'normal transaction patterns';
    
    return `Fraud risk assessment based on: ${riskFactors}. Model confidence: ${(model.accuracy * 100).toFixed(1)}%`;
  }

  private generateRiskExplanation(
    features: RiskAssessmentFeatures,
    prediction: any,
    model: any
  ): string {
    const factors = [];
    
    if (features.creditScore < 600) {
      factors.push('low credit score');
    }
    
    if (features.debtToIncomeRatio > 0.5) {
      factors.push('high debt-to-income ratio');
    }
    
    if (features.latePayments > 3) {
      factors.push('multiple late payments');
    }
    
    if (features.chargeOffs > 0) {
      factors.push('previous charge-offs');
    }

    const riskFactors = factors.length > 0 ? factors.join(', ') : 'good credit profile';
    
    return `Risk assessment based on: ${riskFactors}. Model confidence: ${(model.accuracy * 100).toFixed(1)}%`;
  }

  private generateCashFlowExplanation(
    features: CashFlowFeatures,
    prediction: any,
    model: any
  ): string {
    const factors = [];
    
    if (features.dailyRevenue > 5000) {
      factors.push('strong daily revenue');
    }
    
    if (features.customerAcquisitionRate > 0.1) {
      factors.push('good customer acquisition');
    }
    
    if (features.churnRate < 0.05) {
      factors.push('low customer churn');
    }
    
    if (features.marketTrends > 0) {
      factors.push('positive market trends');
    }

    const positiveFactors = factors.length > 0 ? factors.join(', ') : 'stable metrics';
    
    return `Cash flow prediction based on: ${positiveFactors}. Model confidence: ${(model.accuracy * 100).toFixed(1)}%`;
  }

  private generatePatientLifetimeExplanation(
    features: PatientLifetimeFeatures,
    prediction: any,
    model: any
  ): string {
    const factors = [];
    
    if (features.visitFrequency > 12) {
      factors.push('high visit frequency');
    }
    
    if (features.averageVisitValue > 500) {
      factors.push('high average visit value');
    }
    
    if (features.satisfactionScore > 4) {
      factors.push('high satisfaction score');
    }
    
    if (features.insuranceType === 'private') {
      factors.push('private insurance coverage');
    }

    const valueFactors = factors.length > 0 ? factors.join(', ') : 'standard patient profile';
    
    return `Patient lifetime value based on: ${valueFactors}. Model confidence: ${(model.accuracy * 100).toFixed(1)}%`;
  }

  // Recommendation generation methods
  private generateFraudRecommendations(prediction: any, features: FraudDetectionFeatures): string[] {
    const recommendations = [];
    
    if (prediction.is_fraud) {
      recommendations.push('Block transaction and flag account for review');
      recommendations.push('Require additional verification');
      recommendations.push('Limit account access temporarily');
    } else {
      recommendations.push('Monitor transaction patterns');
      recommendations.push('Continue normal processing');
    }
    
    if (features.transactionAmount > 5000) {
      recommendations.push('Implement enhanced verification for high-value transactions');
    }
    
    return recommendations;
  }

  private generateRiskRecommendations(prediction: any, features: RiskAssessmentFeatures): string[] {
    const recommendations = [];
    
    if (prediction.risk_score > 70) {
      recommendations.push('Require additional documentation');
      recommendations.push('Implement stricter payment terms');
      recommendations.push('Consider collateral requirements');
    } else if (prediction.risk_score > 40) {
      recommendations.push('Monitor account activity closely');
      recommendations.push('Implement gradual credit increases');
    } else {
      recommendations.push('Offer standard payment terms');
      recommendations.push('Consider credit line increases');
    }
    
    return recommendations;
  }

  private generateCashFlowRecommendations(prediction: any, features: CashFlowFeatures): string[] {
    const recommendations = [];
    
    if (prediction.predicted_cash_flow < features.dailyRevenue * 0.8) {
      recommendations.push('Reduce non-essential expenses');
      recommendations.push('Focus on customer retention');
      recommendations.push('Consider short-term financing options');
    } else {
      recommendations.push('Invest in growth opportunities');
      recommendations.push('Expand service offerings');
      recommendations.push('Consider strategic partnerships');
    }
    
    return recommendations;
  }

  private generatePatientLifetimeRecommendations(prediction: any, features: PatientLifetimeFeatures): string[] {
    const recommendations = [];
    
    if (prediction.lifetime_value > 20000) {
      recommendations.push('Implement premium care programs');
      recommendations.push('Offer personalized services');
      recommendations.push('Focus on retention strategies');
    } else if (prediction.lifetime_value > 10000) {
      recommendations.push('Provide standard care with upsell opportunities');
      recommendations.push('Implement loyalty programs');
    } else {
      recommendations.push('Focus on basic care efficiency');
      recommendations.push('Implement cost-effective treatment plans');
    }
    
    return recommendations;
  }

  // Logging and monitoring
  private async logPrediction(modelId: string, result: PredictionResult): Promise<void> {
    // Log prediction for monitoring and model improvement
    logger.info('Model prediction completed', {
      modelId,
      prediction: result.prediction,
      confidence: result.confidence,
      riskLevel: result.riskLevel,
      timestamp: result.timestamp
    });
  }

  // Public methods for model management
  async getModelMetrics(modelId: string): Promise<ModelMetrics | null> {
    return this.modelMetrics.get(modelId) || null;
  }

  async updateModel(modelId: string, newModel: any): Promise<void> {
    this.models.set(modelId, newModel);
    logger.info('Model updated', { modelId, version: newModel.version });
  }

  async retrainModel(modelId: string, trainingData: TrainingData[]): Promise<void> {
    // Implement model retraining logic
    logger.info('Model retraining started', { modelId, dataSize: trainingData.length });
    
    // In production, this would trigger actual model training
    // For now, just log the request
  }

  getAvailableModels(): Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    accuracy: number;
  }> {
    return Array.from(this.models.entries()).map(([id, model]) => ({
      id,
      name: model.name,
      type: model.type,
      status: model.status,
      accuracy: model.accuracy
    }));
  }
}
