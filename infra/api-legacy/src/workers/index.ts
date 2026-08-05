import { createWorkflowWorker } from './workflow.worker';
import logger from '@/utils/logger';
import config from '@/config';

/**
 * Start all workers
 */
const startWorkers = async () => {
  logger.info('🚀 Starting FlowForge Workers...');
  logger.info(`Environment: ${config.env}`);

  try {
    // Start workflow worker
    const workflowWorker = createWorkflowWorker();
    
    logger.info('✅ Workflow worker started');

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('⏳ Shutting down workers...');
      
      await workflowWorker.close();
      
      logger.info('✅ Workers shut down successfully');
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    logger.info('✅ All workers started successfully');
  } catch (error) {
    logger.error('❌ Failed to start workers:', error);
    process.exit(1);
  }
};

// Start workers
startWorkers();
