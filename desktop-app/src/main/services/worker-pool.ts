import { Worker } from 'worker_threads';
import { app } from 'electron';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';

interface WorkerTask {
  id: string;
  type: string;
  data: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timeout?: NodeJS.Timeout;
}

interface PooledWorker {
  id: number;
  worker: Worker;
  busy: boolean;
  currentTask?: WorkerTask;
}

export class WorkerPool extends EventEmitter {
  private workers: PooledWorker[] = [];
  private taskQueue: WorkerTask[] = [];
  private workerScript: string;
  private maxWorkers: number;
  private taskTimeout: number;
  private isTerminated = false;

  constructor(
    workerScript: string,
    maxWorkers: number = os.cpus().length,
    taskTimeout: number = 30000
  ) {
    super();
    this.workerScript = workerScript;
    this.maxWorkers = Math.max(1, Math.min(maxWorkers, os.cpus().length));
    this.taskTimeout = taskTimeout;
    this.initialize();
  }

  private initialize(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      this.createWorker(i);
    }
  }

  private createWorker(id: number): void {
    const worker = new Worker(this.workerScript, {
      workerData: { workerId: id }
    });

    const pooledWorker: PooledWorker = {
      id,
      worker,
      busy: false
    };

    worker.on('message', (message) => {
      this.handleWorkerMessage(pooledWorker, message);
    });

    worker.on('error', (error) => {
      this.handleWorkerError(pooledWorker, error);
    });

    worker.on('exit', (code) => {
      this.handleWorkerExit(pooledWorker, code);
    });

    this.workers.push(pooledWorker);
    this.emit('workerCreated', id);
  }

  private handleWorkerMessage(pooledWorker: PooledWorker, message: any): void {
    const task = pooledWorker.currentTask;
    if (!task) return;

    switch (message.type) {
      case 'result':
        if (task.timeout) clearTimeout(task.timeout);
        task.resolve(message.data);
        this.completeTask(pooledWorker);
        break;

      case 'error':
        if (task.timeout) clearTimeout(task.timeout);
        task.reject(new Error(message.error));
        this.completeTask(pooledWorker);
        break;

      case 'progress':
        this.emit('progress', {
          workerId: pooledWorker.id,
          taskId: task.id,
          ...message.data
        });
        break;
    }
  }

  private handleWorkerError(pooledWorker: PooledWorker, error: Error): void {
    console.error(`Worker ${pooledWorker.id} error:`, error);
    
    if (pooledWorker.currentTask) {
      pooledWorker.currentTask.reject(error);
    }
    
    // Worker 재시작
    this.restartWorker(pooledWorker);
  }

  private handleWorkerExit(pooledWorker: PooledWorker, code: number): void {
    if (code !== 0) {
      console.error(`Worker ${pooledWorker.id} exited with code ${code}`);
    }
    
    if (!this.isTerminated) {
      this.restartWorker(pooledWorker);
    }
  }

  private restartWorker(pooledWorker: PooledWorker): void {
    const index = this.workers.indexOf(pooledWorker);
    if (index !== -1) {
      this.workers.splice(index, 1);
    }
    
    if (!this.isTerminated) {
      this.createWorker(pooledWorker.id);
      this.processQueue();
    }
  }

  private completeTask(pooledWorker: PooledWorker): void {
    pooledWorker.busy = false;
    pooledWorker.currentTask = undefined;
    this.emit('taskCompleted', pooledWorker.id);
    this.processQueue();
  }

  private processQueue(): void {
    if (this.taskQueue.length === 0) return;

    const availableWorker = this.workers.find(w => !w.busy);
    if (!availableWorker) return;

    const task = this.taskQueue.shift()!;
    availableWorker.busy = true;
    availableWorker.currentTask = task;

    // 타임아웃 설정
    task.timeout = setTimeout(() => {
      task.reject(new Error('Task timeout'));
      this.completeTask(availableWorker);
    }, this.taskTimeout);

    // Worker에 작업 전송
    availableWorker.worker.postMessage({
      type: task.type,
      data: task.data
    });

    this.emit('taskStarted', {
      workerId: availableWorker.id,
      taskId: task.id
    });
  }

  async execute(type: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isTerminated) {
        reject(new Error('Worker pool is terminated'));
        return;
      }

      const task: WorkerTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        resolve,
        reject
      };

      this.taskQueue.push(task);
      this.emit('taskQueued', task.id);
      this.processQueue();
    });
  }

  async executeBatch(type: string, items: any[]): Promise<any[]> {
    const batchSize = Math.ceil(items.length / this.maxWorkers);
    const batches = [];

    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    const promises = batches.map(batch => 
      this.execute(type, { items: batch })
    );

    const results = await Promise.all(promises);
    return results.flat();
  }

  getStats(): {
    totalWorkers: number;
    busyWorkers: number;
    queueLength: number;
    isTerminated: boolean;
  } {
    return {
      totalWorkers: this.workers.length,
      busyWorkers: this.workers.filter(w => w.busy).length,
      queueLength: this.taskQueue.length,
      isTerminated: this.isTerminated
    };
  }

  async terminate(): Promise<void> {
    this.isTerminated = true;

    // 대기 중인 작업 취소
    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift()!;
      task.reject(new Error('Worker pool terminated'));
    }

    // 모든 Worker 종료
    await Promise.all(
      this.workers.map(async (pooledWorker) => {
        try {
          await pooledWorker.worker.terminate();
        } catch (error) {
          console.error(`Failed to terminate worker ${pooledWorker.id}:`, error);
        }
      })
    );

    this.workers = [];
    this.emit('terminated');
  }
}

// 싱글톤 인스턴스
let analysisWorkerPool: WorkerPool | null = null;

export function getAnalysisWorkerPool(): WorkerPool {
  if (!analysisWorkerPool) {
    const workerPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'workers', 'analysis-worker.js')
      : path.join(__dirname, '../workers/analysis-worker.js');
    analysisWorkerPool = new WorkerPool(workerPath, os.cpus().length - 1);
  }
  return analysisWorkerPool;
}

export async function terminateAnalysisWorkerPool(): Promise<void> {
  if (analysisWorkerPool) {
    await analysisWorkerPool.terminate();
    analysisWorkerPool = null;
  }
}