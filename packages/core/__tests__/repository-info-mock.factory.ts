import type { Mocked } from 'vitest';
import { RepositoryInfo } from '../src/repository/repository.provider.js';

export class RepositoryInfoMockFactory {
    static create(defaults?: Partial<RepositoryInfo>): Mocked<RepositoryInfo> {
        return {
            rootDir: '/test',
            owner: 'owner',
            name: 'repo',
            url: 'https://github.com/owner/repo',
            fullName: 'owner/repo',
            ...defaults
        }
    }
}
