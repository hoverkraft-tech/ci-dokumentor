// Re-export from repository platforms
export * from '@ci-dokumentor/repository-platforms-github';

// Re-export from CI/CD platforms  
export * from '@ci-dokumentor/cicd-platforms-github-actions';

// Export the combined container with explicit name
export { initContainer as initGitHubActionsContainer } from './container.js';
