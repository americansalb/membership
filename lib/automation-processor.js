/**
 * CRM Automation Processor
 *
 * Background processor that handles:
 * - Processing pending executions
 * - (Future) Time-based trigger checks
 * - (Future) Resuming delayed executions
 */

const { processExecution, getPendingExecutions } = require('./automation-engine');

let processorInterval = null;
let isProcessing = false;

/**
 * Start the automation processor
 */
function start() {
  if (processorInterval) {
    console.log('[Automation Processor] Already running');
    return;
  }

  console.log('[Automation Processor] Starting...');

  // Process pending executions every 30 seconds
  processorInterval = setInterval(async () => {
    await processPendingExecutions();
  }, 30000); // 30 seconds

  // Run immediately on start
  setImmediate(() => processPendingExecutions());

  console.log('[Automation Processor] Started successfully');
}

/**
 * Stop the automation processor
 */
function stop() {
  if (processorInterval) {
    clearInterval(processorInterval);
    processorInterval = null;
    console.log('[Automation Processor] Stopped');
  }
}

/**
 * Process all pending executions
 */
async function processPendingExecutions() {
  if (isProcessing) {
    console.log('[Automation Processor] Already processing, skipping...');
    return;
  }

  isProcessing = true;

  try {
    const pendingExecutions = await getPendingExecutions(10); // Process up to 10 at a time

    if (pendingExecutions.length === 0) {
      return; // No pending executions
    }

    console.log(`[Automation Processor] Found ${pendingExecutions.length} pending execution(s)`);

    for (const execution of pendingExecutions) {
      try {
        await processExecution(execution.id);
      } catch (err) {
        console.error(`[Automation Processor] Error processing execution ${execution.id}:`, err);
        // Continue with next execution
      }
    }

    console.log(`[Automation Processor] Processed ${pendingExecutions.length} execution(s)`);

  } catch (error) {
    console.error('[Automation Processor] Error in processPendingExecutions:', error);
  } finally {
    isProcessing = false;
  }
}

/**
 * Get processor status
 */
function getStatus() {
  return {
    running: !!processorInterval,
    processing: isProcessing
  };
}

module.exports = {
  start,
  stop,
  processPendingExecutions,
  getStatus
};
