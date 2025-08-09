---
sidebar_position: 4
---

# Repository GitHub Package

The `@ci-dokumentor/repository-github` package provides GitHub-specific repository information and features, extending the base Git repository functionality.

## Overview

This package provides:

- **GitHub API Integration** - Rich repository metadata from GitHub
- **GitHub-Specific Features** - Issues, pull requests, releases, and more
- **Enhanced Repository Information** - Logos, topics, languages, community metrics
- **GraphQL API Support** - Efficient data fetching with GitHub's GraphQL API
- **Authentication Support** - Support for GitHub tokens and app authentication

## Installation

```bash
# Usually installed as a dependency of other packages
npm install @ci-dokumentor/repository-github
```

## Key Components

### GitHubRepositoryProvider

The main service for GitHub repository operations:

```typescript
class GitHubRepositoryProvider extends GitRepositoryProvider {
  async getRepository(url: string): Promise<GitHubRepository>
  async getRepositoryMetadata(owner: string, repo: string): Promise<GitHubMetadata>
  async getRepositoryInsights(owner: string, repo: string): Promise<GitHubInsights>
}
```

#### Enhanced Features

- ✅ **Rich Metadata** - Description, topics, language statistics
- ✅ **Community Metrics** - Stars, forks, watchers, contributors
- ✅ **Release Information** - Latest releases and tags
- ✅ **License Detection** - GitHub's license API integration
- ✅ **Repository Insights** - Traffic, clones, and popularity metrics
- ✅ **Organization Information** - Enhanced organization/user details

### GitHub-Specific Repository Model

```typescript
interface GitHubRepository extends Repository {
  // Enhanced GitHub properties
  stargazersCount: number;
  forksCount: number;
  watchersCount: number;
  openIssuesCount: number;
  
  // GitHub-specific metadata
  topics: string[];
  languages: Record<string, number>;
  
  // Visual elements
  logo?: string;
  socialPreviewUrl?: string;
  
  // Community features
  hasIssues: boolean;
  hasProjects: boolean;
  hasWiki: boolean;
  hasPages: boolean;
  
  // Repository insights
  insights?: GitHubInsights;
}
```

## Usage Examples

### Basic GitHub Repository Information

```typescript
import { GitHubRepositoryProvider } from '@ci-dokumentor/repository-github';

const provider = new GitHubRepositoryProvider();

// Get enhanced GitHub repository information
const repository = await provider.getRepository('https://github.com/microsoft/typescript');

console.log(repository.name);              // 'typescript'
console.log(repository.stargazersCount);   // 100000+ 
console.log(repository.topics);            // ['typescript', 'language', 'compiler']
console.log(repository.languages);         // { 'TypeScript': 95.2, 'JavaScript': 4.8 }
```

### Repository Metadata

```typescript
// Get detailed metadata
const metadata = await provider.getRepositoryMetadata('microsoft', 'typescript');

console.log(metadata.description);         // Repository description
console.log(metadata.homepageUrl);        // Homepage URL
console.log(metadata.defaultBranch);      // 'main'
console.log(metadata.createdAt);          // Creation date
console.log(metadata.updatedAt);          // Last update date
```

### Repository Insights

```typescript
// Get repository insights (requires authentication)
const insights = await provider.getRepositoryInsights('microsoft', 'typescript');

console.log(insights.views);              // Page views
console.log(insights.clones);             // Clone statistics
console.log(insights.popularContent);     // Most popular files
console.log(insights.referrers);          // Traffic sources
```

## Authentication

### GitHub Token Authentication

```typescript
// Configure with GitHub token
const provider = new GitHubRepositoryProvider({
  token: process.env.GITHUB_TOKEN
});

// Enhanced access with authentication
const repository = await provider.getRepository('https://github.com/private/repo');
```

### GitHub App Authentication

```typescript
// GitHub App authentication
const provider = new GitHubRepositoryProvider({
  appId: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_PRIVATE_KEY,
  installationId: process.env.GITHUB_INSTALLATION_ID
});
```

### Environment Variables

```bash
# Personal Access Token
export GITHUB_TOKEN=ghp_your_token_here

# GitHub App credentials
export GITHUB_APP_ID=123456
export GITHUB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
export GITHUB_INSTALLATION_ID=789012
```

## GitHub API Integration

### GraphQL API Usage

The provider uses GitHub's GraphQL API for efficient data fetching:

```graphql
query GetRepository($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    name
    description
    url
    homepageUrl
    stargazerCount
    forkCount
    watchers {
      totalCount
    }
    issues(states: OPEN) {
      totalCount
    }
    repositoryTopics(first: 10) {
      nodes {
        topic {
          name
        }
      }
    }
    languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
      nodes {
        name
        color
      }
      edges {
        size
      }
    }
    licenseInfo {
      name
      spdxId
      url
    }
    owner {
      login
      avatarUrl
      ... on Organization {
        name
        description
        websiteUrl
      }
    }
  }
}
```

### REST API Fallback

For features not available in GraphQL, the provider falls back to REST API:

```typescript
// Repository insights via REST API
const insights = await this.restClient.repos.getViews({
  owner: 'microsoft',
  repo: 'typescript'
});

const clones = await this.restClient.repos.getClones({
  owner: 'microsoft', 
  repo: 'typescript'
});
```

## Enhanced Features

### Repository Logo Detection

```typescript
// Automatic logo detection
const repository = await provider.getRepository('https://github.com/nodejs/node');

// Logo sources (in order of preference):
// 1. Repository social preview image
// 2. Organization avatar
// 3. Owner avatar
// 4. Default GitHub logo
console.log(repository.logo); // URL to repository logo
```

### Language Statistics

```typescript
// Detailed language breakdown
const repository = await provider.getRepository('https://github.com/facebook/react');

console.log(repository.languages);
// {
//   'JavaScript': 95.2,
//   'HTML': 2.1,
//   'CSS': 1.9,
//   'Other': 0.8
// }
```

### Community Metrics

```typescript
// Community health metrics
const repository = await provider.getRepository('https://github.com/vuejs/vue');

console.log(`⭐ ${repository.stargazersCount} stars`);
console.log(`🍴 ${repository.forksCount} forks`);
console.log(`👀 ${repository.watchersCount} watchers`);
console.log(`🐛 ${repository.openIssuesCount} open issues`);
```

### Release Information

```typescript
// Latest release information
const metadata = await provider.getRepositoryMetadata('angular', 'angular');

console.log(metadata.latestRelease);
// {
//   tagName: 'v15.0.0',
//   name: 'Angular v15.0.0',
//   publishedAt: '2022-11-16T19:00:00Z',
//   isPrerelease: false
// }
```

## Error Handling

### GitHub-Specific Errors

```typescript
// Repository not found on GitHub
class GitHubRepositoryNotFoundError extends CiDokumentorError {
  constructor(owner: string, repo: string) {
    super(`GitHub repository not found: ${owner}/${repo}`, 'GITHUB_REPO_NOT_FOUND');
  }
}

// Rate limit exceeded
class GitHubRateLimitError extends CiDokumentorError {
  constructor(resetTime: Date) {
    super(`GitHub rate limit exceeded. Resets at ${resetTime}`, 'GITHUB_RATE_LIMIT');
  }
}

// Authentication required
class GitHubAuthenticationError extends CiDokumentorError {
  constructor() {
    super('GitHub authentication required for this operation', 'GITHUB_AUTH_REQUIRED');
  }
}
```

### Graceful Degradation

```typescript
// Graceful handling of missing features
try {
  const insights = await provider.getRepositoryInsights(owner, repo);
} catch (error) {
  if (error instanceof GitHubAuthenticationError) {
    console.warn('Repository insights require authentication. Skipping...');
    // Continue without insights
  } else {
    throw error;
  }
}
```

## Rate Limiting

### Rate Limit Handling

```typescript
// Automatic rate limit handling
const provider = new GitHubRepositoryProvider({
  token: process.env.GITHUB_TOKEN,
  rateLimitRetry: true,           // Automatically retry on rate limit
  rateLimitRetryDelay: 60000,     // Wait 1 minute before retry
  maxRetries: 3                   // Maximum retry attempts
});
```

### Rate Limit Monitoring

```typescript
// Monitor rate limit status
const rateLimit = await provider.getRateLimitStatus();

console.log(`Remaining: ${rateLimit.remaining}/${rateLimit.limit}`);
console.log(`Resets at: ${rateLimit.resetTime}`);
```

## Testing

### Mock GitHub Provider

```typescript
// Mock for testing
const mockGitHubProvider = mock<GitHubRepositoryProvider>();

// Setup mock GitHub repository
const mockGitHubRepo: GitHubRepository = {
  ...baseRepository,
  stargazersCount: 1000,
  forksCount: 200,
  topics: ['typescript', 'testing'],
  languages: { 'TypeScript': 90, 'JavaScript': 10 },
  logo: 'https://avatars.githubusercontent.com/u/12345?v=4'
};

when(mockGitHubProvider.getRepository('https://github.com/test/repo'))
  .thenResolve(mockGitHubRepo);
```

### Test Data Builders

```typescript
// GitHub repository builder
const testGitHubRepo = new GitHubRepositoryBuilder()
  .withName('test-repo')
  .withOwner('test-org')
  .withStars(1500)
  .withForks(300)
  .withTopics(['typescript', 'testing', 'ci'])
  .withLanguages({ 'TypeScript': 85, 'JavaScript': 15 })
  .withLogo('https://example.com/logo.png')
  .build();
```

## Configuration

### Provider Configuration

```typescript
interface GitHubRepositoryProviderConfig {
  // Authentication
  token?: string;
  appId?: string;
  privateKey?: string;
  installationId?: string;
  
  // API configuration
  baseUrl?: string;              // GitHub Enterprise URL
  apiVersion?: string;           // API version
  userAgent?: string;            // Custom user agent
  
  // Rate limiting
  rateLimitRetry?: boolean;      // Auto-retry on rate limit
  rateLimitRetryDelay?: number;  // Delay between retries
  maxRetries?: number;           // Maximum retry attempts
  
  // Caching
  cacheEnabled?: boolean;        // Enable response caching
  cacheTtl?: number;            // Cache time-to-live (ms)
  
  // Features
  includeInsights?: boolean;     // Include repository insights
  includeTopics?: boolean;       // Include repository topics
  includeLanguages?: boolean;    // Include language statistics
}
```

### Dependency Injection Setup

```typescript
// Container configuration
container.bind<GitHubRepositoryProvider>(TYPES.GitHubRepositoryProvider)
  .toConstantValue(new GitHubRepositoryProvider({
    token: process.env.GITHUB_TOKEN,
    rateLimitRetry: true,
    includeInsights: true,
    includeTopics: true,
    includeLanguages: true
  }));

// Register as primary repository provider for GitHub URLs
container.bind<IRepositoryProvider>(TYPES.RepositoryProvider)
  .to(GitHubRepositoryProvider)
  .whenTargetNamed('github');
```

## Performance Optimization

### Caching Strategy

```typescript
// Enable caching for better performance
const provider = new GitHubRepositoryProvider({
  token: process.env.GITHUB_TOKEN,
  cacheEnabled: true,
  cacheTtl: 300000  // 5 minutes
});

// First call fetches from GitHub
const repo1 = await provider.getRepository('https://github.com/user/repo');

// Second call uses cached data
const repo2 = await provider.getRepository('https://github.com/user/repo');
```

### Batch Operations

```typescript
// Batch multiple repository requests
const repositories = await Promise.all([
  provider.getRepository('https://github.com/user/repo1'),
  provider.getRepository('https://github.com/user/repo2'),
  provider.getRepository('https://github.com/user/repo3')
]);
```

## Advanced Usage

### GitHub Enterprise Support

```typescript
// GitHub Enterprise configuration
const provider = new GitHubRepositoryProvider({
  baseUrl: 'https://github.company.com/api/v3',
  token: process.env.GITHUB_ENTERPRISE_TOKEN
});

const repository = await provider.getRepository('https://github.company.com/team/project');
```

### Custom GraphQL Queries

```typescript
// Extend provider with custom queries
class ExtendedGitHubProvider extends GitHubRepositoryProvider {
  async getRepositoryCollaborators(owner: string, repo: string): Promise<Collaborator[]> {
    const query = `
      query GetCollaborators($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          collaborators(first: 100) {
            nodes {
              login
              name
              avatarUrl
              permission
            }
          }
        }
      }
    `;
    
    const result = await this.graphqlClient.query(query, { owner, name: repo });
    return result.repository.collaborators.nodes;
  }
}
```

## Building and Development

### Build Commands

```bash
# Build the package
nx build repository-github

# Run tests
nx test repository-github

# Run linting
nx lint repository-github
```

### Development Dependencies

```json
{
  "dependencies": {
    "@ci-dokumentor/core": "workspace:*",
    "@ci-dokumentor/repository-git": "workspace:*",
    "@octokit/graphql": "^9.0.1",
    "inversify": "^7.5.2"
  }
}
```

## Related Packages

- [Core Package](./core) - Base abstractions and services
- [Repository Git](./repository-git) - Base Git repository functionality
- [CI/CD GitHub Actions](./cicd-github-actions) - GitHub Actions integration
- [CLI Package](./cli) - Command-line interface

## Contributing

When contributing to the repository-github package:

1. **Respect Rate Limits** - Implement proper rate limiting and retry logic
2. **Handle Authentication** - Support both token and app authentication
3. **Test with Real Data** - Test with actual GitHub repositories
4. **Error Handling** - Provide clear error messages for GitHub API failures
5. **Performance** - Use efficient GraphQL queries and caching
6. **Security** - Never log or expose authentication tokens