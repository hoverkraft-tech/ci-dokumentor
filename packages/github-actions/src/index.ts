// Re-export types and classes from repository platforms
export { GitHubRepositoryService } from '@ci-dokumentor/repository-platforms-github';
export type { GitHubRepository } from '@ci-dokumentor/repository-platforms-github';

// Re-export from CI/CD platforms  
export * from '@ci-dokumentor/cicd-platforms-github-actions';

// Export the combined container with explicit name
export { initContainer as initGitHubActionsContainer } from './container.js';
