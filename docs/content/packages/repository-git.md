---
sidebar_position: 3
---

# Repository Git Package

The `@ci-dokumentor/repository-git` package provides basic Git repository information for CI Dokumentor, serving as the foundation for repository analysis.

## Overview

This package provides:

- **Git Repository Analysis** - Extract information from local Git repositories
- **URL Parsing** - Parse and validate Git repository URLs
- **Repository Metadata** - Basic repository information extraction
- **Foundation for Platform-Specific Providers** - Base functionality for GitHub, GitLab, etc.

## Installation

The repository-git package is typically installed as a dependency of other CI Dokumentor packages:

```bash
# Direct installation (if needed for custom implementations)
npm install @ci-dokumentor/repository-git
```

## Key Components

### GitRepositoryProvider

The main service for Git repository operations:

```typescript
class GitRepositoryProvider implements IRepositoryProvider {
  async getRepository(url: string): Promise<Repository>
  supportsUrl(url: string): boolean
  async getRepositoryInfo(path: string): Promise<GitRepositoryInfo>
}
```

#### Features

- ✅ **Local Repository Analysis** - Extract information from `.git` directory
- ✅ **Remote URL Detection** - Identify remote repository URLs
- ✅ **Branch Information** - Current and default branch detection
- ✅ **Commit History** - Access to recent commits and tags
- ✅ **URL Validation** - Validate Git repository URLs

### Repository Information Extraction

#### Basic Repository Data

```typescript
interface Repository {
  name: string;           // Repository name
  description?: string;   // Repository description (if available)
  url: string;           // Repository URL
  owner: string;         // Repository owner/organization
  defaultBranch: string; // Default branch name
  language?: string;     // Primary language (if detectable)
}
```

#### Git-Specific Information

```typescript
interface GitRepositoryInfo {
  path: string;          // Local repository path
  remotes: GitRemote[];  // Remote configurations
  branches: string[];    // Available branches
  currentBranch: string; // Currently checked out branch
  lastCommit: GitCommit; // Most recent commit
  tags: string[];        // Available tags
}
```

## Usage Examples

### Basic Repository Information

```typescript
import { GitRepositoryProvider } from '@ci-dokumentor/repository-git';

const provider = new GitRepositoryProvider();

// Get repository information from URL
const repository = await provider.getRepository('https://github.com/user/repo.git');

console.log(repository.name);         // 'repo'
console.log(repository.owner);        // 'user'  
console.log(repository.defaultBranch); // 'main'
```

### Local Repository Analysis

```typescript
// Analyze local Git repository
const localInfo = await provider.getRepositoryInfo('./my-project');

console.log(localInfo.currentBranch);  // 'feature-branch'
console.log(localInfo.remotes);        // [{ name: 'origin', url: '...' }]
console.log(localInfo.lastCommit);     // { hash: 'abc123', message: '...' }
```

### URL Support Detection

```typescript
// Check if provider supports a URL
const isSupported = provider.supportsUrl('https://github.com/user/repo.git');
console.log(isSupported); // true

const isNotSupported = provider.supportsUrl('https://example.com/not-a-repo');
console.log(isNotSupported); // false
```

## Supported URL Formats

The Git repository provider supports various Git URL formats:

### HTTPS URLs

```typescript
// GitHub
'https://github.com/user/repo.git'
'https://github.com/user/repo'

// GitLab
'https://gitlab.com/user/repo.git'
'https://gitlab.com/user/repo'

// Generic Git hosting
'https://git.example.com/user/repo.git'
```

### SSH URLs

```typescript
// GitHub SSH
'git@github.com:user/repo.git'

// GitLab SSH  
'git@gitlab.com:user/repo.git'

// Generic SSH
'git@git.example.com:user/repo.git'
```

### Git Protocol URLs

```typescript
// Git protocol
'git://github.com/user/repo.git'
'git://git.example.com/user/repo.git'
```

## Integration with Other Packages

### Repository Service Integration

The Git provider integrates with the core repository service:

```typescript
import { Container } from 'inversify';
import { GitRepositoryProvider } from '@ci-dokumentor/repository-git';
import { TYPES } from '@ci-dokumentor/core';

const container = new Container();

// Register Git repository provider
container.bind<IRepositoryProvider>(TYPES.RepositoryProvider)
  .to(GitRepositoryProvider)
  .whenTargetNamed('git');
```

### Platform-Specific Extensions

Other packages extend the Git provider for platform-specific features:

```typescript
// GitHub-specific provider extends Git provider
class GitHubRepositoryProvider extends GitRepositoryProvider {
  async getRepository(url: string): Promise<GitHubRepository> {
    // Get base Git information
    const baseRepository = await super.getRepository(url);
    
    // Add GitHub-specific information
    const githubInfo = await this.getGitHubSpecificInfo(url);
    
    return {
      ...baseRepository,
      ...githubInfo
    };
  }
}
```

## Error Handling

The package provides specific error types for Git operations:

### Git-Specific Errors

```typescript
// Repository not found
class GitRepositoryNotFoundError extends CiDokumentorError {
  constructor(path: string) {
    super(`Git repository not found: ${path}`, 'GIT_REPO_NOT_FOUND');
  }
}

// Invalid Git URL
class InvalidGitUrlError extends CiDokumentorError {
  constructor(url: string) {
    super(`Invalid Git URL: ${url}`, 'INVALID_GIT_URL');
  }
}

// Git command failed
class GitCommandError extends CiDokumentorError {
  constructor(command: string, output: string) {
    super(`Git command failed: ${command}\n${output}`, 'GIT_COMMAND_FAILED');
  }
}
```

### Error Handling Examples

```typescript
try {
  const repository = await provider.getRepository('invalid-url');
} catch (error) {
  if (error instanceof InvalidGitUrlError) {
    console.error('The provided URL is not a valid Git repository URL');
  } else if (error instanceof GitRepositoryNotFoundError) {
    console.error('Repository not found or not accessible');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Testing

The package includes comprehensive testing utilities:

### Mock Git Provider

```typescript
// Mock for testing
const mockGitProvider = mock<GitRepositoryProvider>();

// Setup mock behavior
when(mockGitProvider.getRepository('https://github.com/test/repo.git'))
  .thenResolve({
    name: 'repo',
    owner: 'test',
    url: 'https://github.com/test/repo.git',
    defaultBranch: 'main'
  });

// Use in tests
const repository = await instance(mockGitProvider)
  .getRepository('https://github.com/test/repo.git');
```

### Test Builders

```typescript
// Repository builder for tests
const testRepository = new RepositoryBuilder()
  .withName('test-repo')
  .withOwner('test-owner')
  .withUrl('https://github.com/test-owner/test-repo.git')
  .withDefaultBranch('main')
  .build();

// Git info builder for tests
const testGitInfo = new GitRepositoryInfoBuilder()
  .withPath('/path/to/repo')
  .withCurrentBranch('feature-branch')
  .withRemote('origin', 'https://github.com/test/repo.git')
  .withLastCommit('abc123', 'Initial commit')
  .build();
```

## Configuration

### Git Configuration

The provider respects standard Git configuration:

```bash
# Git config affects repository analysis
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Repository-specific config
git config user.name "Project Name"
git config user.email "project@example.com"
```

### Provider Configuration

Configure the Git provider through dependency injection:

```typescript
// Custom Git provider configuration
container.bind<GitRepositoryProvider>(TYPES.GitRepositoryProvider)
  .toConstantValue(new GitRepositoryProvider({
    timeout: 5000,           // Git command timeout
    maxCommits: 100,         // Maximum commits to analyze
    includeRemotes: true,    // Include remote information
    analyzeBranches: true,   // Analyze branch information
  }));
```

## Performance Considerations

### Optimization Tips

- **Local Repository Analysis** - Faster than remote API calls
- **Shallow Clone Detection** - Handles shallow Git repositories
- **Caching** - Repository information is cached for repeated access
- **Timeout Configuration** - Configure timeouts for slow Git operations

### Benchmarks

Typical performance characteristics:

```typescript
// Local repository analysis: ~10-50ms
const localRepo = await provider.getRepositoryInfo('./project');

// Remote URL parsing: ~1-5ms  
const isSupported = provider.supportsUrl(url);

// Full repository information: ~50-200ms
const repository = await provider.getRepository(url);
```

## Building and Development

### Build Commands

```bash
# Build the package
nx build repository-git

# Run tests
nx test repository-git

# Run linting
nx lint repository-git
```

### Development Dependencies

```json
{
  "dependencies": {
    "@ci-dokumentor/core": "workspace:*",
    "git-url-parse": "^16.1.0",
    "simple-git": "^3.28.0",
    "inversify": "^7.5.2"
  },
  "devDependencies": {
    "@types/git-url-parse": "^9.0.3"
  }
}
```

## Advanced Usage

### Custom Git Operations

```typescript
// Extend for custom Git operations
class CustomGitProvider extends GitRepositoryProvider {
  async getRepositoryStats(path: string): Promise<GitStats> {
    const gitInfo = await this.getRepositoryInfo(path);
    
    return {
      commitCount: await this.getCommitCount(path),
      contributorCount: await this.getContributorCount(path),
      fileCount: await this.getFileCount(path),
      codeLines: await this.getCodeLines(path),
    };
  }
}
```

### Multi-Repository Analysis

```typescript
// Analyze multiple repositories
const repositories = [
  'https://github.com/user/repo1.git',
  'https://github.com/user/repo2.git',
  'https://github.com/user/repo3.git',
];

const repoInfos = await Promise.all(
  repositories.map(url => provider.getRepository(url))
);

repoInfos.forEach(repo => {
  console.log(`${repo.name}: ${repo.description}`);
});
```

## Related Packages

- [Core Package](./core) - Base abstractions and services
- [Repository GitHub](./repository-github) - GitHub-specific repository provider
- [CLI Package](./cli) - Command-line interface
- [CI/CD GitHub Actions](./cicd-github-actions) - GitHub Actions integration

## Contributing

When contributing to the repository-git package:

1. **Test with Various Git Configurations** - Test with different Git setups
2. **Handle Edge Cases** - Empty repositories, shallow clones, etc.
3. **Performance** - Ensure Git operations are efficient
4. **Error Handling** - Provide clear error messages for Git failures
5. **Platform Compatibility** - Test on Windows, macOS, and Linux