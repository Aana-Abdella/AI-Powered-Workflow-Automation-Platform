import { Queue, Worker, Job } from 'bullmq';
import redis from '@/utils/redis';
import logger from '@/utils/logger';

export interface WorkflowJobData {
  workflowId: string;
  executionId: string;
  userId: string;
  organizationId: string;
  trigger: any;
  actions: any[];
  input: any;
}

// Create workflow queue
export const workflowQueue = new Queue<WorkflowJobData>('workflow-execution', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Keep for 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs
      age: 7 * 24 * 3600, // Keep for 7 days
    },
  },
});

/**
 * Add workflow execution job to queue
 */
export const enqueueWorkflowExecution = async (data: WorkflowJobData) => {
  try {
    const job = await workflowQueue.add('execute-workflow', data, {
      jobId: data.executionId,
    });

    logger.info('Workflow execution enqueued', {
      jobId: job.id,
      workflowId: data.workflowId,
      executionId: data.executionId,
    });

    return job;
  } catch (error) {
    logger.error('Failed to enqueue workflow execution:', error);
    throw error;
  }
};

/**
 * Get queue metrics
 */
export const getQueueMetrics = async () => {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    workflowQueue.getWaitingCount(),
    workflowQueue.getActiveCount(),
    workflowQueue.getCompletedCount(),
    workflowQueue.getFailedCount(),
    workflowQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
};

// Queue event listeners
workflowQueue.on('error', (error) => {
  logger.error('Queue error:', error);
});

workflowQueue.on('waiting', (job) => {
  logger.debug(`Job ${job.id} is waiting`);
});

workflowQueue.on('active', (job) => {
  logger.debug(`Job ${job.id} is active`);
});

workflowQueue.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`);
});

workflowQueue.on('failed', (job, error) => {
  logger.error(`Job ${job?.id} failed:`, error);
});

export default workflowQueue;
