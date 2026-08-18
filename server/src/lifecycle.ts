import type { Server } from 'http';
import type { Response } from 'express';
import { createLogger } from './logger';

const logger = createLogger('lifecycle');

export type LifecycleState = 'BOOTING' | 'LOCAL_READY' | 'SERVING' | 'DRAINING' | 'STOPPED';

class LifecycleManager {
  private state: LifecycleState = 'BOOTING';
  private intervals = new Set<NodeJS.Timeout>();
  private timers = new Set<NodeJS.Timeout>();
  private activeStreams = new Set<Response>();
  private shutdownHooks: Array<() => Promise<void> | void> = [];

  getState(): LifecycleState {
    return this.state;
  }

  setState(state: LifecycleState) {
    this.state = state;
    logger.info('Lifecycle state transition', `State changed to ${state}`);
  }

  registerInterval(timer: NodeJS.Timeout): () => void {
    this.intervals.add(timer);
    return () => {
      clearInterval(timer);
      this.intervals.delete(timer);
    };
  }

  registerTimer(timer: NodeJS.Timeout): () => void {
    this.timers.add(timer);
    return () => {
      clearTimeout(timer);
      this.timers.delete(timer);
    };
  }

  registerStream(res: Response): () => void {
    this.activeStreams.add(res);
    return () => {
      this.activeStreams.delete(res);
    };
  }

  onShutdown(hook: () => Promise<void> | void) {
    this.shutdownHooks.push(hook);
  }

  async shutdown(server?: Server, timeoutMs = 5000): Promise<void> {
    if (this.state === 'DRAINING' || this.state === 'STOPPED') {
      return;
    }
    this.setState('DRAINING');
    logger.info('Starting graceful shutdown', `Graceful shutdown initiated with timeout ${timeoutMs}ms`);

    const shutdownPromise = (async () => {
      // 1. Drain active SSE streams
      for (const res of this.activeStreams) {
        try {
          if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ error: 'Server shutting down' })}\n\ndata: [DONE]\n\n`);
            res.end();
          }
        } catch (err) {
          // ignore
        }
      }
      this.activeStreams.clear();

      // 2. Clear all intervals and timers
      for (const interval of this.intervals) {
        clearInterval(interval);
      }
      this.intervals.clear();

      for (const timer of this.timers) {
        clearTimeout(timer);
      }
      this.timers.clear();

      // 3. Execute shutdown hooks
      for (const hook of this.shutdownHooks) {
        try {
          await hook();
        } catch (err: any) {
          logger.warn('Shutdown hook error', err.message);
        }
      }

      // 4. Close HTTP server
      if (server) {
        await new Promise<void>((resolve) => {
          server.close(() => resolve());
        });
      }

      this.setState('STOPPED');
      logger.info('Graceful shutdown complete', 'All resources and servers stopped');
    })();

    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        logger.warn('Shutdown timeout reached', `Forced shutdown after ${timeoutMs}ms`);
        this.setState('STOPPED');
        resolve();
      }, timeoutMs);
    });

    await Promise.race([shutdownPromise, timeoutPromise]);
  }
}

export const lifecycle = new LifecycleManager();
