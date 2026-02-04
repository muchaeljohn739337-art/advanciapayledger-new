import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.AI_SERVICE_PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ai-orchestrator',
    timestamp: new Date().toISOString(),
  });
});

// AI Agent Orchestrator
class AIAgentOrchestrator {
  private gemini: GoogleGenerativeAI;
  private openai: OpenAI;
  private taskQueue: any[] = [];
  private activeTasks: Map<string, any> = new Map();

  constructor() {
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async routeTask(task: any) {
    const { type, input, priority = 'normal' } = task;

    // Add task to queue
    const taskId = this.generateTaskId();
    const queuedTask = {
      id: taskId,
      type,
      input,
      priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.taskQueue.push(queuedTask);
    console.log(`Task queued: ${taskId} of type ${type}`);

    // Process task based on type
    return this.processTask(queuedTask);
  }

  private async processTask(task: any) {
    const { id, type, input } = task;
    
    try {
      // Update task status
      task.status = 'running';
      task.startedAt = new Date().toISOString();
      this.activeTasks.set(id, task);

      let result;
      let tokensUsed = 0;

      switch (type) {
        case 'code':
          result = await this.handleCodeTask(input);
          tokensUsed = result.tokensUsed || 0;
          break;
        case 'analysis':
          result = await this.handleAnalysisTask(input);
          tokensUsed = result.tokensUsed || 0;
          break;
        case 'monitoring':
          result = await this.handleMonitoringTask(input);
          tokensUsed = result.tokensUsed || 0;
          break;
        case 'security':
          result = await this.handleSecurityTask(input);
          tokensUsed = result.tokensUsed || 0;
          break;
        case 'optimization':
          result = await this.handleOptimizationTask(input);
          tokensUsed = result.tokensUsed || 0;
          break;
        default:
          throw new Error(`Unknown task type: ${type}`);
      }

      // Update task with results
      task.status = 'completed';
      task.output = result.output;
      task.tokensUsed = tokensUsed;
      task.completedAt = new Date().toISOString();

      console.log(`Task completed: ${id} with ${tokensUsed} tokens`);
      return task;

    } catch (error) {
      // Handle task failure
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.completedAt = new Date().toISOString();

      console.error(`Task failed: ${id}`, error);
      
      // Log failure for analysis
      await this.logTaskFailure(task);
      
      return task;
    } finally {
      // Remove from active tasks
      this.activeTasks.delete(id);
    }
  }

  private async handleCodeTask(input: any) {
    const { prompt, language = 'javascript', context } = input;

    const systemPrompt = `You are an expert ${language} developer. 
    Generate clean, efficient, and well-documented code based on the requirements.
    Context: ${context || 'None provided'}
    Requirements: ${prompt}`;

    const response = await this.callClaude(systemPrompt);
    
    return {
      output: response.content,
      tokensUsed: response.tokensUsed,
      language,
    };
  }

  private async handleAnalysisTask(input: any) {
    const { data, analysisType, context } = input;

    let prompt = '';
    
    switch (analysisType) {
      case 'performance':
        prompt = `Analyze the following performance data and provide insights:
        Data: ${JSON.stringify(data)}
        Context: ${context || 'System performance metrics'}
        
        Provide:
        1. Key performance indicators
        2. Bottlenecks or issues
        3. Recommendations for improvement
        4. Risk assessment`;
        break;
      case 'security':
        prompt = `Analyze the following security data and identify potential threats:
        Data: ${JSON.stringify(data)}
        Context: ${context || 'Security monitoring data'}
        
        Provide:
        1. Security risk assessment
        2. Identified threats
        3. Recommended actions
        4. Compliance status`;
        break;
      case 'business':
        prompt = `Analyze the following business data and provide insights:
        Data: ${JSON.stringify(data)}
        Context: ${context || 'Business metrics'}
        
        Provide:
        1. Key business insights
        2. Trends and patterns
        3. Growth opportunities
        4. Risk factors`;
        break;
      default:
        prompt = `Analyze the following data:
        Data: ${JSON.stringify(data)}
        Context: ${context || 'General analysis'}
        
        Provide comprehensive insights and recommendations.`;
    }

    const response = await this.callOpenAI(prompt);
    
    return {
      output: response.content,
      tokensUsed: response.tokensUsed,
      analysisType,
    };
  }

  private async handleMonitoringTask(input: any) {
    const { metrics, alerts, timeRange } = input;

    const prompt = `Analyze the following monitoring data and provide system health assessment:
    Metrics: ${JSON.stringify(metrics)}
    Alerts: ${JSON.stringify(alerts)}
    Time Range: ${timeRange}
    
    Provide:
    1. Overall system health status
    2. Critical issues requiring attention
    3. Performance trends
    4. Predictive analysis for next 24 hours
    5. Automated recommendations`;

    const response = await this.callGemini(prompt);
    
    return {
      output: response.content,
      tokensUsed: response.tokensUsed,
      healthStatus: this.extractHealthStatus(response.content),
    };
  }

  private async handleSecurityTask(input: any) {
    const { events, threats, vulnerabilities } = input;

    const prompt = `Analyze the following security data and provide threat assessment:
    Events: ${JSON.stringify(events)}
    Threats: ${JSON.stringify(threats)}
    Vulnerabilities: ${JSON.stringify(vulnerabilities)}
    
    Provide:
    1. Threat severity assessment
    2. Immediate actions required
    3. Security recommendations
    4. Compliance impact
    5. Incident response plan`;

    const response = await this.callClaude(prompt);
    
    return {
      output: response.content,
      tokensUsed: response.tokensUsed,
      threatLevel: this.extractThreatLevel(response.content),
    };
  }

  private async handleOptimizationTask(input: any) {
    const { system, metrics, constraints } = input;

    const prompt = `Analyze the following system data and provide optimization recommendations:
    System: ${system}
    Metrics: ${JSON.stringify(metrics)}
    Constraints: ${JSON.stringify(constraints)}
    
    Provide:
    1. Optimization opportunities
    2. Resource allocation recommendations
    3. Performance improvements
    4. Cost optimization strategies
    5. Implementation priority`;

    const response = await this.callOpenAI(prompt);
    
    return {
      output: response.content,
      tokensUsed: response.tokensUsed,
      optimizations: this.extractOptimizations(response.content),
    };
  }

  private async callClaude(prompt: string) {
    try {
      const response = await this.gemini.generateModel('gemini-1.5-flash').generateContent(prompt);
      return {
        content: response.response.text(),
        tokensUsed: response.response.usageMetadata?.totalTokenCount || 0,
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Failed to call Claude API');
    }
  }

  private async callOpenAI(prompt: string) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7,
      });

      return {
        content: response.choices[0]?.message?.content || '',
        tokensUsed: response.usage?.total_tokens || 0,
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to call OpenAI API');
    }
  }

  private async callGemini(prompt: string) {
    try {
      const response = await this.gemini.generateModel('gemini-1.5-pro').generateContent(prompt);
      return {
        content: response.response.text(),
        tokensUsed: response.response.usageMetadata?.totalTokenCount || 0,
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to call Gemini API');
    }
  }

  private extractHealthStatus(content: string): string {
    // Extract health status from AI response
    const healthKeywords = ['healthy', 'warning', 'critical', 'degraded'];
    for (const keyword of healthKeywords) {
      if (content.toLowerCase().includes(keyword)) {
        return keyword;
      }
    }
    return 'unknown';
  }

  private extractThreatLevel(content: string): string {
    // Extract threat level from AI response
    const threatKeywords = ['low', 'medium', 'high', 'critical'];
    for (const keyword of threatKeywords) {
      if (content.toLowerCase().includes(keyword)) {
        return keyword;
      }
    }
    return 'unknown';
  }

  private extractOptimizations(content: string): string[] {
    // Extract optimization recommendations from AI response
    const optimizations: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.includes('optimization') || line.includes('recommendation') || line.includes('improvement')) {
        optimizations.push(line.trim());
      }
    }
    
    return optimizations;
  }

  private async logTaskFailure(task: any) {
    // Log task failure for analysis
    console.log('Task failure logged:', {
      taskId: task.id,
      type: task.type,
      error: task.error,
      timestamp: new Date().toISOString(),
    });
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getTaskQueue(): any[] {
    return this.taskQueue;
  }

  getActiveTasks(): any[] {
    return Array.from(this.activeTasks.values());
  }

  getTaskStats() {
    const completed = this.taskQueue.filter(t => t.status === 'completed').length;
    const failed = this.taskQueue.filter(t => t.status === 'failed').length;
    const running = this.activeTasks.size;
    const pending = this.taskQueue.filter(t => t.status === 'pending').length;

    return {
      total: this.taskQueue.length,
      completed,
      failed,
      running,
      pending,
      successRate: this.taskQueue.length > 0 ? (completed / this.taskQueue.length) * 100 : 0,
    };
  }
}

const aiOrchestrator = new AIAgentOrchestrator();

// API Routes

// Submit task
app.post('/tasks', async (req, res) => {
  try {
    const task = await aiOrchestrator.routeTask(req.body);
    res.json(task);
  } catch (error) {
    console.error('Error submitting task:', error);
    res.status(500).json({
      error: 'Failed to submit task',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get task queue
app.get('/tasks/queue', (req, res) => {
  const queue = aiOrchestrator.getTaskQueue();
  res.json({
    queue,
    count: queue.length,
  });
});

// Get active tasks
app.get('/tasks/active', (req, res) => {
  const activeTasks = aiOrchestrator.getActiveTasks();
  res.json({
    activeTasks,
    count: activeTasks.length,
  });
});

// Get task statistics
app.get('/tasks/stats', (req, res) => {
  const stats = aiOrchestrator.getTaskStats();
  res.json(stats);
});

// Get task by ID
app.get('/tasks/:id', (req, res) => {
  const { id } = req.params;
  const queue = aiOrchestrator.getTaskQueue();
  const activeTasks = aiOrchestrator.getActiveTasks();
  
  const task = queue.find(t => t.id === id) || activeTasks.find(t => t.id === id);
  
  if (!task) {
    return res.status(404).json({
      error: 'Task not found',
      id,
    });
  }
  
  res.json(task);
});

// Cancel task
app.delete('/tasks/:id', (req, res) => {
  const { id } = req.params;
  const queue = aiOrchestrator.getTaskQueue();
  
  const taskIndex = queue.findIndex(t => t.id === id && t.status === 'pending');
  
  if (taskIndex === -1) {
    return res.status(404).json({
      error: 'Task not found or cannot be cancelled',
      id,
    });
  }
  
  const task = queue.splice(taskIndex, 1)[0];
  task.status = 'cancelled';
  task.completedAt = new Date().toISOString();
  
  res.json({
    success: true,
    message: 'Task cancelled',
    task,
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 AI Orchestrator running on port ${PORT}`);
    console.log(`🤖 Available AI models: Claude, OpenAI, Gemini`);
  });
}

export default app;
