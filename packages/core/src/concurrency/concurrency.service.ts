import { injectable } from 'inversify';
import pLimit from 'p-limit';

/**
 * Service for managing concurrent operations with controlled parallelism
 */
@injectable()
export class ConcurrencyService {
    /**
     * Execute multiple tasks with controlled concurrency
     * 
     * @param tasks Array of async functions to execute
     * @param concurrency Maximum number of concurrent operations (default: 5)
     * @returns Promise that resolves with all results
     */
    async executeWithLimit<T>(
        tasks: Array<() => Promise<T>>,
        concurrency: number = 5
    ): Promise<PromiseSettledResult<T>[]> {
        if (concurrency < 1) {
            throw new Error('Concurrency must be at least 1');
        }

        const limit = pLimit(concurrency);
        const limitedTasks = tasks.map(task => limit(task));
        return Promise.allSettled(limitedTasks);
    }
}
