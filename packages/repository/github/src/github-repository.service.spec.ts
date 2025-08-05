import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitHubRepositoryService } from './github-repository.service.js';

describe('GitHubRepositoryService', () => {
    let service: GitHubRepositoryService;

    beforeEach(() => {
        service = new GitHubRepositoryService();
    });

    describe('getRepository', () => {
        it('should extend base repository with logo information', async () => {
            // Mock the parent class method
            const mockBaseRepo = {
                owner: 'test-owner',
                name: 'test-repo',
                url: 'https://github.com/test-owner/test-repo',
                fullName: 'test-owner/test-repo'
            };

            vi.spyOn(service.constructor.prototype.__proto__, 'getRepository')
                .mockResolvedValue(mockBaseRepo);

            // Mock file system check
            vi.mock('node:fs', () => ({
                existsSync: vi.fn().mockReturnValue(false)
            }));

            // Mock GitHub API
            vi.mock('@octokit/graphql', () => ({
                graphql: vi.fn().mockResolvedValue({
                    repository: {
                        openGraphImageUrl: 'https://github.com/test-owner/test-repo/social-preview.png'
                    }
                })
            }));

            const result = await service.getRepository();

            expect(result).toEqual({
                ...mockBaseRepo,
                logo: 'https://github.com/test-owner/test-repo/social-preview.png'
            });
        });
    });
});