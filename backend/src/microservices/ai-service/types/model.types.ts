export interface ModelConfig {
  name: string;
  type: 'classification' | 'regression' | 'time_series' | 'clustering' | 'anomaly_detection';
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
  auc_roc?: number;
  mse?: number;
  mae?: number;
  rmse?: number;
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
  metadata?: {
    processingTime: number;
    modelVersion: string;
    featureImportance?: Record<string, number>;
    shapValues?: Record<string, number>;
  };
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
  training_data_size: number;
  validation_data_size: number;
  test_data_size: number;
  hyperparameters: Record<string, unknown>;
}

export interface TrainingData {
  id: string;
  features: Record<string, number>;
  target: number | string;
  timestamp: Date;
  source: string;
  quality_score: number;
  label_confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface ModelTrainingJob {
  id: string;
  modelId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  config: TrainingConfig;
  progress: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
  metrics?: ModelMetrics;
  logs: TrainingLog[];
}

export interface TrainingConfig {
  algorithm: string;
  hyperparameters: Record<string, unknown>;
  training_data: {
    source: string;
    size: number;
    validation_split: number;
    test_split: number;
  };
  preprocessing: {
    scaling: boolean;
    encoding: string;
    feature_selection: boolean;
    outlier_removal: boolean;
  };
  cross_validation: {
    folds: number;
    scoring: string;
  };
  early_stopping: {
    enabled: boolean;
    patience: number;
    min_delta: number;
  };
}

export interface TrainingLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  metrics?: Record<string, number>;
  step?: number;
  epoch?: number;
}

export interface ModelDeployment {
  id: string;
  modelId: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  endpoint: string;
  status: 'deploying' | 'active' | 'inactive' | 'failed';
  config: DeploymentConfig;
  metrics: DeploymentMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeploymentConfig {
  replicas: number;
  cpu_limit: string;
  memory_limit: string;
  gpu_enabled: boolean;
  auto_scaling: {
    enabled: boolean;
    min_replicas: number;
    max_replicas: number;
    target_cpu_utilization: number;
  };
  monitoring: {
    enabled: boolean;
    metrics_interval: number;
    alert_thresholds: Record<string, number>;
  };
}

export interface DeploymentMetrics {
  requests_per_second: number;
  average_response_time: number;
  error_rate: number;
  cpu_utilization: number;
  memory_utilization: number;
  gpu_utilization?: number;
  last_updated: Date;
}

export interface ModelMonitoring {
  modelId: string;
  metrics: {
    prediction_drift: number;
    feature_drift: Record<string, number>;
    data_quality: number;
    model_performance: number;
    uptime: number;
  };
  alerts: ModelAlert[];
  recommendations: string[];
  last_updated: Date;
}

export interface ModelAlert {
  id: string;
  type: 'performance' | 'drift' | 'data_quality' | 'infrastructure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolved_at?: Date;
  resolution?: string;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  direction: 'positive' | 'negative';
  contribution: number;
  shap_value?: number;
}

export interface PredictionExplanation {
  method: 'shap' | 'lime' | 'permutation' | 'partial_dependence';
  explanation: string;
  feature_contributions: FeatureImportance[];
  confidence: number;
  visualizations?: {
    chart_type: string;
    data: any;
    description: string;
  }[];
}

export interface ModelComparison {
  models: Array<{
    modelId: string;
    name: string;
    metrics: ModelMetrics;
  }>;
  winner: {
    modelId: string;
    reason: string;
    confidence: number;
  };
  comparison_date: Date;
}

export interface HyperparameterTuning {
  method: 'grid_search' | 'random_search' | 'bayesian_optimization' | 'genetic_algorithm';
  parameters: Record<string, any[]>;
  best_parameters: Record<string, unknown>;
  best_score: number;
  trials: TrialResult[];
  optimization_time: number;
}

export interface TrialResult {
  trial_id: number;
  parameters: Record<string, unknown>;
  score: number;
  training_time: number;
  status: 'completed' | 'failed' | 'running';
  error?: string;
}

export interface ModelRegistry {
  models: Record<string, ModelConfig>;
  versions: Record<string, ModelVersion[]>;
  deployments: Record<string, ModelDeployment[]>;
  experiments: Record<string, ModelExperiment[]>;
}

export interface ModelVersion {
  version: string;
  model_id: string;
  created_at: Date;
  metrics: ModelMetrics;
  config: ModelConfig;
  training_job_id?: string;
  parent_version?: string;
  changelog: string;
  tags: string[];
}

export interface ModelExperiment {
  id: string;
  name: string;
  description: string;
  models: Array<{
    model_id: string;
    version: string;
    metrics: ModelMetrics;
  }>;
  baseline_model?: string;
  winner?: string;
  status: 'running' | 'completed' | 'failed';
  created_at: Date;
  completed_at?: Date;
  conclusion?: string;
}

export interface DataDriftDetection {
  feature_drift: Record<string, {
    drift_score: number;
    drift_type: 'covariate' | 'prior' | 'concept';
    significance: number;
    threshold: number;
    alert: boolean;
  }>;
  overall_drift_score: number;
  recommendation: 'retrain' | 'monitor' | 'no_action';
  last_checked: Date;
}

export interface ModelPerformanceTracking {
  model_id: string;
  time_series: Array<{
    timestamp: Date;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    prediction_count: number;
    response_time: number;
  }>;
  degradation_alerts: Array<{
    timestamp: Date;
    metric: string;
    threshold: number;
    current_value: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  performance_trend: 'improving' | 'stable' | 'degrading';
}

export interface AITestSuite {
  id: string;
  name: string;
  model_id: string;
  test_cases: TestCase[];
  results: TestResult[];
  coverage: number;
  last_run: Date;
  status: 'passed' | 'failed' | 'partial';
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  input_data: Record<string, unknown>;
  expected_output: unknown;
  tolerance?: number;
  category: 'functional' | 'performance' | 'security' | 'fairness' | 'robustness';
}

export interface TestResult {
  test_case_id: string;
  status: 'passed' | 'failed' | 'skipped';
  actual_output: unknown;
  expected_output: unknown;
  difference?: number;
  error?: string;
  execution_time: number;
  timestamp: Date;
}

export interface ModelFairnessAudit {
  model_id: string;
  protected_attributes: string[];
  fairness_metrics: Record<string, {
    demographic_parity: number;
    equal_opportunity: number;
    equalized_odds: number;
    disparate_impact: number;
    overall_fairness_score: number;
  }>;
  recommendations: string[];
  audit_date: Date;
  auditor: string;
  status: 'compliant' | 'non_compliant' | 'needs_review';
}

export interface ModelExplainabilityReport {
  model_id: string;
  global_explanations: {
    feature_importance: FeatureImportance[];
    partial_dependence: Array<{
      feature: string;
      values: number[];
      effects: number[];
    }>;
  };
  local_explanations: Array<{
    prediction_id: string;
    explanation: PredictionExplanation;
  }>;
  report_date: Date;
  methodology: string;
  confidence_score: number;
}
