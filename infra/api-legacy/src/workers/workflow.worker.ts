import { Worker, Job } from 'bullmq';
import redis from '@/utils/redis';
import prisma from '@/utils/prisma';
import logger from '@/utils/logger';
import aiService from '@/services/ai.service';
import { WorkflowJobData } from '@/queues/workflow.queue';
import axios from 'axios';

/**
 * Execute workflow actions
 */
const executeWorkflow = async (job: Job<WorkflowJobData>) => {
  const { workflowId, executionId, actions } = job.data;
  
  logger.info('Starting workflow execution', {
    workflowId,
    executionId,
    jobId: job.id,
  });

  const startTime = Date.now();
  let totalAITokens = 0;
  let totalAICost = 0;
  const results: any[] = [];
  let currentInput = job.data.input;

  try {
    // Update execution status to RUNNING
    await prisma.executionLog.update({
      where: { id: executionId },
      data: { status: 'RUNNING' },
    });

    // Execute each action sequentially
    for (const [index, action] of actions.entries()) {
      logger.info(`Executing action ${index + 1}/${actions.length}`, {
        type: action.type,
        executionId,
      });

      let actionResult;

      switch (action.type) {
        case 'http':
          actionResult = await withTimeout(
            executeHttpAction(action.config, currentInput),
            30000,
            'HTTP action timeout'
          );
          break;

        case 'ai':
          actionResult = await withTimeout(
            executeAIAction(action.config, currentInput),
            60000,
            'AI action timeout'
          );
          totalAITokens += actionResult.tokensUsed || 0;
          totalAICost += actionResult.estimatedCost || 0;
          break;

        case 'database':
          actionResult = await withTimeout(
            executeDatabaseAction(action.config, currentInput),
            15000,
            'Database action timeout'
          );
          break;

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      results.push({
        action: action.type,
        result: actionResult,
      });

      // Use output of previous action as input for next
      currentInput = actionResult;

      // Update progress
      await job.updateProgress(((index + 1) / actions.length) * 100);
    }

    const duration = Date.now() - startTime;

    // Update execution log with success
    await prisma.executionLog.update({
      where: { id: executionId },
      data: {
        status: 'SUCCESS',
        completedAt: new Date(),
        duration,
        output: results,
        aiTokensUsed: totalAITokens,
        aiCost: totalAICost,
      },
    });

    // Update usage metrics
    await updateUsageMetrics(
      job.data.organizationId,
      totalAITokens,
      totalAICost
    );

    logger.info('Workflow execution completed', {
      workflowId,
      executionId,
      duration,
      aiTokensUsed: totalAITokens,
    });

    return { success: true, results };
  } catch (error: any) {
    const duration = Date.now() - startTime;

    logger.error('Workflow execution failed', {
      workflowId,
      executionId,
      error: error.message,
    });

    // Update execution log with failure
    await prisma.executionLog.update({
      where: { id: executionId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        duration,
        error: error.message,
        output: results,
        aiTokensUsed: totalAITokens,
        aiCost: totalAICost,
      },
    });

    throw error;
  }
};

/**
 * Execute HTTP action
 */
const executeHttpAction = async (config: any, input: any) => {
  const { method = 'POST', url, headers = {}, body } = config;

  const response = await axios({
    method,
    url,
    headers,
    data: body || input,
    timeout: 30000,
  });

  return {
    status: response.status,
    data: response.data,
  };
};

/**
 * Execute AI action
 */
const executeAIAction = async (config: any, input: any) => {
  const { operation, instruction, schema } = config;

  let result;

  try {
    switch (operation) {
      case 'summarize':
        result = await aiService.summarizeText(
          typeof input === 'string' ? input : JSON.stringify(input)
        );
        break;

      case 'transform':
        result = await aiService.transformText(
          typeof input === 'string' ? input : JSON.stringify(input),
          instruction
        );
        break;

      case 'extract':
        result = await aiService.extractData(
          typeof input === 'string' ? input : JSON.stringify(input),
          schema
        );
        break;

      default:
        throw new Error(`Unknown AI operation: ${operation}`);
    }
  } catch (error: any) {
    logger.error('AI action failed', {
      operation,
      error: error.message,
    });
    throw new Error(`AI action failed: ${error.message}`);
  }

  return result;
};

/**
 * Execute database action
 */
const executeDatabaseAction = async (config: any, input: any) => {
  const { operation, table, data } = config;

  // This is a simplified example
  // In production, you'd want more sophisticated database operations
  switch (operation) {
    case 'insert':
      // Example: Insert data into a custom table
      // This would require dynamic table handling
      return { success: true, operation: 'insert', table, data: data || input };

    case 'update':
      return { success: true, operation: 'update', table, data: data || input };

    case 'query':
      return { success: true, operation: 'query', table, data: data || input };

    default:
      throw new Error(`Unknown database operation: ${operation}`);
  }
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
  const timeout = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]);
};

/**
 * Update usage metrics for organization
 */
const updateUsageMetrics = async (
  organizationId: string,
  aiTokens: number,
  aiCost: number
) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.usageMetric.upsert({
    where: {
      organizationId_date: {
        organizationId,
        date: today,
      },
    },
    create: {
      organizationId,
      date: today,
      workflowRuns: 1,
      aiTokensUsed: aiTokens,
      estimatedCost: aiCost,
    },
    update: {
      workflowRuns: { increment: 1 },
      aiTokensUsed: { increment: aiTokens },
      estimatedCost: { increment: aiCost },
    },
  });
};

/**
 * Create and start workflow worker
 */
export const createWorkflowWorker = () => {
  const worker = new Worker<WorkflowJobData>(
    'workflow-execution',
    executeWorkflow,
    {
      connection: redis,
      concurrency: 5, // Process 5 jobs concurrently
      limiter: {
        max: 10, // Max 10 jobs
        duration: 1000, // per second
      },
    }
  );

  worker.on('completed', (job) => {
    logger.info(`Worker completed job ${job.id}`);
  });

  worker.on('failed', (job, error) => {
    logger.error(`Worker failed job ${job?.id}:`, error);
  });

  worker.on('error', (error) => {
    logger.error('Worker error:', error);
  });

  return worker;
};

export default createWorkflowWorker;
