import { Queue, Worker, Job } from 'bullmq'

// Job types
export enum JobType {
  DOCUMENT_PROCESSING = 'document_processing',
  EMAIL_SYNC = 'email_sync',
  CASE_ANALYSIS = 'case_analysis',
  OCR_PROCESSING = 'ocr_processing',
  BACKUP = 'backup',
  REPORT_GENERATION = 'report_generation'
}

// Job interfaces
interface BaseJobData {
  id: string
  userId: string
  timestamp: number
}

interface DocumentProcessingJob extends BaseJobData {
  type: JobType.DOCUMENT_PROCESSING
  documentId: string
  filePath: string
  operations: ('ocr' | 'analysis' | 'indexing')[]
}

interface EmailSyncJob extends BaseJobData {
  type: JobType.EMAIL_SYNC
  accountId: string
  since?: Date
}

interface CaseAnalysisJob extends BaseJobData {
  type: JobType.CASE_ANALYSIS
  caseId: string
  analysisType: 'risk' | 'timeline' | 'evidence' | 'full'
}

export type JobData = DocumentProcessingJob | EmailSyncJob | CaseAnalysisJob

// Job Queue Manager
export class JobQueueManager {
  private static instance: JobQueueManager
  private queues: Map<JobType, Queue> = new Map()
  private workers: Map<JobType, Worker> = new Map()
  
  private constructor() {
    // Initialize queues for each job type
    Object.values(JobType).forEach(type => {
      this.initializeQueue(type)
    })
  }
  
  static getInstance(): JobQueueManager {
    if (!JobQueueManager.instance) {
      JobQueueManager.instance = new JobQueueManager()
    }
    return JobQueueManager.instance
  }
  
  private initializeQueue(type: JobType): void {
    // In Electron, we'll use IPC to communicate with backend
    const queue = new Queue(type, {
      connection: {
        host: 'localhost',
        port: 6379
      }
    })
    
    this.queues.set(type, queue)
    
    // Create worker for processing
    const worker = new Worker(
      type,
      async (job: Job) => {
        return this.processJob(job)
      },
      {
        connection: {
          host: 'localhost',
          port: 6379
        },
        concurrency: this.getConcurrency(type)
      }
    )
    
    // Event handlers
    worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed successfully`)
    })
    
    worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err)
    })
    
    this.workers.set(type, worker)
  }
  
  private getConcurrency(type: JobType): number {
    switch (type) {
      case JobType.DOCUMENT_PROCESSING:
        return 2 // Heavy processing
      case JobType.OCR_PROCESSING:
        return 1 // Very heavy
      case JobType.EMAIL_SYNC:
        return 3 // IO bound
      default:
        return 2
    }
  }
  
  private async processJob(job: Job): Promise<any> {
    const { type, ...data } = job.data
    
    // In Electron app, use IPC to call backend
    if (window.api) {
      return window.api.processBackgroundJob(type, data)
    }
    
    // Fallback for development
    console.log(`Processing job ${job.id} of type ${type}`)
    return { success: true }
  }
  
  async addJob(data: JobData): Promise<Job> {
    const queue = this.queues.get(data.type)
    if (!queue) {
      throw new Error(`Queue for job type ${data.type} not found`)
    }
    
    return queue.add(data.type, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: true,
      removeOnFail: false
    })
  }
  
  async getJobStatus(type: JobType, jobId: string): Promise<Job | undefined> {
    const queue = this.queues.get(type)
    if (!queue) return undefined
    
    return queue.getJob(jobId)
  }
  
  async getActiveJobs(type: JobType): Promise<Job[]> {
    const queue = this.queues.get(type)
    if (!queue) return []
    
    return queue.getActive()
  }
  
  async getWaitingJobs(type: JobType): Promise<Job[]> {
    const queue = this.queues.get(type)
    if (!queue) return []
    
    return queue.getWaiting()
  }
  
  async pauseQueue(type: JobType): Promise<void> {
    const queue = this.queues.get(type)
    if (queue) {
      await queue.pause()
    }
  }
  
  async resumeQueue(type: JobType): Promise<void> {
    const queue = this.queues.get(type)
    if (queue) {
      await queue.resume()
    }
  }
  
  async clearQueue(type: JobType): Promise<void> {
    const queue = this.queues.get(type)
    if (queue) {
      await queue.obliterate({ force: true })
    }
  }
  
  async shutdown(): Promise<void> {
    // Close all workers
    for (const [, worker] of this.workers) {
      await worker.close()
    }
    
    // Close all queues
    for (const [, queue] of this.queues) {
      await queue.close()
    }
    
    this.workers.clear()
    this.queues.clear()
  }
}

// Helper functions for common job creation
export const createDocumentProcessingJob = (
  documentId: string,
  filePath: string,
  operations: ('ocr' | 'analysis' | 'indexing')[]
): DocumentProcessingJob => ({
  type: JobType.DOCUMENT_PROCESSING,
  id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  userId: 'current-user', // Get from auth context
  timestamp: Date.now(),
  documentId,
  filePath,
  operations
})

export const createEmailSyncJob = (
  accountId: string,
  since?: Date
): EmailSyncJob => {
  const job: EmailSyncJob = {
    type: JobType.EMAIL_SYNC,
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: 'current-user',
    timestamp: Date.now(),
    accountId
  }
  if (since) job.since = since
  return job
}

export const createCaseAnalysisJob = (
  caseId: string,
  analysisType: 'risk' | 'timeline' | 'evidence' | 'full'
): CaseAnalysisJob => ({
  type: JobType.CASE_ANALYSIS,
  id: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  userId: 'current-user',
  timestamp: Date.now(),
  caseId,
  analysisType
})