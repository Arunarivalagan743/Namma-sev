/**
 * Async Job Queue System
 *
 * Phase 3 Feature 1: In-process job queue for background tasks
 *
 * Architecture:
 * - Non-blocking, retryable, idempotent jobs
 * - Dead-letter handling for failed jobs
 * - Timeout protection
 * - Priority-based execution
 *
 * Performance Targets:
 * - Queue operations: <1ms
 * - Memory per job: <1KB
 * - Max concurrent: 5 jobs
 */

const EventEmitter = require('events');

// Job states
const JOB_STATES = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DEAD: 'dead'  // Dead-letter after max retries
};

// Default configuration
const CONFIG = {
  maxRetries: 3,
  retryDelayMs: 1000,
  timeoutMs: 30000,
  maxConcurrent: 5,
  deadLetterRetentionMs: 7 * 24 * 60 * 60 * 1000  // 7 days
};

// Job priorities
const PRIORITY = {
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3
};

/**
 * Job Queue Class
 */
class JobQueue extends EventEmitter {
  constructor(name, options = {}) {
    super();
    this.name = name;
    this.config = { ...CONFIG, ...options };

    // Queues
    this.pending = [];       // Jobs waiting to run
    this.running = new Map(); // jobId -> job
    this.completed = [];     // Completed jobs (limited retention)
    this.deadLetter = [];    // Failed jobs after max retries

    // Handlers
    this.handlers = new Map(); // jobType -> handler function

    // Stats
    this.stats = {
      processed: 0,
      failed: 0,
      retried: 0,
      deadLettered: 0,
      totalDurationMs: 0
    };

    // Processing state
    this.isProcessing = false;
    this.isPaused = false;
  }

  /**
   * Register a job handler
   */
  register(jobType, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }
    this.handlers.set(jobType, handler);
    return this;
  }

  /**
   * Add a job to the queue
   */
  add(jobType, data, options = {}) {
    const job = {
      id: `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: jobType,
      data,
      priority: options.priority ?? PRIORITY.NORMAL,
      retries: 0,
      maxRetries: options.maxRetries ?? this.config.maxRetries,
      timeoutMs: options.timeoutMs ?? this.config.timeoutMs,
      state: JOB_STATES.PENDING,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      error: null,
      result: null
    };

    // Insert by priority (lower number = higher priority)
    const insertIndex = this.pending.findIndex(j => j.priority > job.priority);
    if (insertIndex === -1) {
      this.pending.push(job);
    } else {
      this.pending.splice(insertIndex, 0, job);
    }

    this.emit('job:added', job);
    this._processNext();

    return job.id;
  }

  /**
   * Process next job in queue
   */
  async _processNext() {
    if (this.isPaused) return;
    if (this.running.size >= this.config.maxConcurrent) return;
    if (this.pending.length === 0) return;

    const job = this.pending.shift();
    if (!job) return;

    const handler = this.handlers.get(job.type);
    if (!handler) {
      job.state = JOB_STATES.FAILED;
      job.error = `No handler registered for job type: ${job.type}`;
      this._handleFailure(job);
      return;
    }

    // Start job
    job.state = JOB_STATES.RUNNING;
    job.startedAt = new Date();
    this.running.set(job.id, job);
    this.emit('job:started', job);

    // Set timeout
    const timeoutId = setTimeout(() => {
      if (this.running.has(job.id)) {
        job.error = `Job timed out after ${job.timeoutMs}ms`;
        this._handleFailure(job);
      }
    }, job.timeoutMs);

    try {
      // Execute handler
      job.result = await handler(job.data, job);
      clearTimeout(timeoutId);

      // Success
      job.state = JOB_STATES.COMPLETED;
      job.completedAt = new Date();
      job.durationMs = job.completedAt - job.startedAt;

      this.running.delete(job.id);
      this.stats.processed++;
      this.stats.totalDurationMs += job.durationMs;

      // Keep limited completed jobs for reference
      this.completed.push(job);
      if (this.completed.length > 100) {
        this.completed.shift();
      }

      this.emit('job:completed', job);

    } catch (error) {
      clearTimeout(timeoutId);
      job.error = error.message || String(error);
      this._handleFailure(job);
    }

    // Process next
    setImmediate(() => this._processNext());
  }

  /**
   * Handle job failure
   */
  _handleFailure(job) {
    this.running.delete(job.id);
    job.completedAt = new Date();
    job.durationMs = job.startedAt ? job.completedAt - job.startedAt : 0;

    if (job.retries < job.maxRetries) {
      // Retry
      job.retries++;
      job.state = JOB_STATES.PENDING;
      job.startedAt = null;
      job.completedAt = null;
      this.stats.retried++;

      // Add back to queue with delay
      setTimeout(() => {
        this.pending.push(job);
        this.emit('job:retrying', job);
        this._processNext();
      }, this.config.retryDelayMs * job.retries);

    } else {
      // Dead letter
      job.state = JOB_STATES.DEAD;
      this.deadLetter.push(job);
      this.stats.failed++;
      this.stats.deadLettered++;

      this.emit('job:dead', job);

      // Cleanup old dead letters
      const cutoff = Date.now() - this.config.deadLetterRetentionMs;
      this.deadLetter = this.deadLetter.filter(j =>
        new Date(j.completedAt).getTime() > cutoff
      );
    }
  }

  /**
   * Pause queue processing
   */
  pause() {
    this.isPaused = true;
    this.emit('queue:paused');
  }

  /**
   * Resume queue processing
   */
  resume() {
    this.isPaused = false;
    this.emit('queue:resumed');
    this._processNext();
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      name: this.name,
      isPaused: this.isPaused,
      pending: this.pending.length,
      running: this.running.size,
      completed: this.completed.length,
      deadLetter: this.deadLetter.length,
      stats: {
        ...this.stats,
        avgDurationMs: this.stats.processed > 0
          ? Math.round(this.stats.totalDurationMs / this.stats.processed)
          : 0
      }
    };
  }

  /**
   * Get dead letter jobs
   */
  getDeadLetterJobs() {
    return this.deadLetter.map(j => ({
      id: j.id,
      type: j.type,
      error: j.error,
      retries: j.retries,
      createdAt: j.createdAt,
      failedAt: j.completedAt
    }));
  }

  /**
   * Retry a dead letter job
   */
  retryDeadLetter(jobId) {
    const index = this.deadLetter.findIndex(j => j.id === jobId);
    if (index === -1) return false;

    const job = this.deadLetter.splice(index, 1)[0];
    job.state = JOB_STATES.PENDING;
    job.retries = 0;
    job.error = null;
    job.startedAt = null;
    job.completedAt = null;

    this.pending.push(job);
    this._processNext();
    return true;
  }

  /**
   * Clear completed jobs
   */
  clearCompleted() {
    const count = this.completed.length;
    this.completed = [];
    return count;
  }

  /**
   * Drain queue (wait for all jobs to complete)
   */
  async drain() {
    return new Promise(resolve => {
      const check = () => {
        if (this.pending.length === 0 && this.running.size === 0) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }
}

// Global queues registry
const queues = new Map();

/**
 * Get or create a named queue
 */
const getQueue = (name, options = {}) => {
  if (!queues.has(name)) {
    queues.set(name, new JobQueue(name, options));
  }
  return queues.get(name);
};

/**
 * Get all queues status
 */
const getAllQueuesStatus = () => {
  const status = {};
  for (const [name, queue] of queues) {
    status[name] = queue.getStatus();
  }
  return status;
};

/**
 * Pre-configured queues for NamSev
 */
const createDefaultQueues = () => {
  // Complaint processing queue
  getQueue('complaints', { maxConcurrent: 3, timeoutMs: 10000 });

  // Content indexing queue
  getQueue('indexing', { maxConcurrent: 1, timeoutMs: 60000 });

  // Cache operations queue
  getQueue('cache', { maxConcurrent: 2, timeoutMs: 5000 });

  // Daily batch queue
  getQueue('daily-batch', { maxConcurrent: 1, timeoutMs: 300000 });

  // Weekly batch queue
  getQueue('weekly-batch', { maxConcurrent: 1, timeoutMs: 600000 });

  return {
    complaints: getQueue('complaints'),
    indexing: getQueue('indexing'),
    cache: getQueue('cache'),
    dailyBatch: getQueue('daily-batch'),
    weeklyBatch: getQueue('weekly-batch')
  };
};

module.exports = {
  JobQueue,
  getQueue,
  getAllQueuesStatus,
  createDefaultQueues,
  JOB_STATES,
  PRIORITY
};

