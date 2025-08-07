# GitHub Copilot Instructions for CI Dokumentor

## Project Overview

CI Dokumentor is an automated documentation generator for CI/CD components. The project uses a clean architecture pattern with strict separation of concerns in a TypeScript NX monorepo.

## Core Principles

### Clean Code
- Use descriptive variable and function names that express intent
- Keep functions small and focused on a single responsibility
- Write self-documenting code with minimal but meaningful comments
- Follow consistent naming conventions: camelCase for variables/functions, PascalCase for classes/interfaces
- Prefer composition over inheritance
- Use TypeScript strict mode features for type safety

### Clean Architecture
- Respect the dependency inversion principle: high-level modules should not depend on low-level modules
- Follow the established layered architecture:
  - **Core**: Contains business logic and abstractions (no external dependencies)
  - **Repository**: Platform-specific repository implementations (GitHub, Git)
  - **CI/CD**: Platform-specific CI/CD manifest parsers and generators
  - **CLI**: Application entry point and user interface
- Use dependency injection for loose coupling
- Implement adapters for external dependencies
- Keep business logic separate from framework-specific code

### SOLID Principles
- **Single Responsibility**: Each class/module should have one reason to change
- **Open/Closed**: Open for extension, closed for modification (use interfaces and adapters)
- **Liskov Substitution**: Derived classes must be substitutable for their base classes
- **Interface Segregation**: Many client-specific interfaces are better than one general-purpose interface
- **Dependency Inversion**: Depend on abstractions, not concretions

## Technology Stack Guidelines

### NX Monorepo Structure
- Respect package boundaries defined in `nx.json` and ESLint configuration
- Use NX generators for creating new packages/components
- Follow the established package naming convention: `@ci-dokumentor/package-name`
- Import from other packages using their public API only (index.ts exports)

### TypeScript Best Practices
- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use union types and discriminated unions for variants
- Always specify return types for public methods
- Use generics for reusable components
- Avoid `any` type - use `unknown` for truly dynamic content

### Dependency Management
- Use pnpm for package management
- Keep dependencies in the appropriate package.json (root for shared dev deps, package-specific for runtime deps)
- Prefer peer dependencies for shared libraries
- Use exact versions for critical dependencies

### Testing Standards
- Write tests using Vitest framework
- Follow AAA pattern: Arrange, Act, Assert
- Use descriptive test names that explain the scenario and expected outcome
- Mock external dependencies using the established patterns
- Maintain high test coverage for business logic
- Write both unit tests and integration tests where appropriate

### Code Organization
- Use barrel exports in index.ts files for clean public APIs
- Group related functionality in services
- Use adapters for external library integrations
- Implement providers for dependency injection setup
- Follow the established folder structure patterns

## Project-Specific Patterns

### Service Pattern
```typescript
// Services contain business logic and orchestrate adapters
export class DocumentationGeneratorService {
  constructor(
    private readonly parser: ManifestParser,
    private readonly generator: DocumentationGenerator,
    private readonly output: OutputAdapter
  ) {}
}
```

### Adapter Pattern
```typescript
// Adapters implement interfaces and handle external dependencies
export class GitHubRepositoryAdapter implements RepositoryProvider {
  async getRepository(url: string): Promise<Repository> {
    // Implementation details
  }
}
```

### Container Pattern
```typescript
// Use dependency injection containers for setup
export function initContainer(): Container {
  const container = new Container();
  container.bind<Interface>(TYPES.Service).to(Implementation);
  return container;
}
```

## Documentation Standards

### README Files
- Each package must have a README.md with purpose, API, and usage examples
- Keep documentation concise but comprehensive
- Include code examples for public APIs
- Document breaking changes and migration guides

### Code Comments
- Document complex business logic and algorithms
- Explain "why" not "what" in comments
- Use JSDoc for public APIs
- Keep comments up-to-date with code changes

### Architecture Documentation
- Document architectural decisions in `/docs` folder
- Explain design patterns and their rationale
- Maintain up-to-date architecture diagrams

## CI/CD Guidelines

### GitHub Actions
- All CI checks must pass before merging
- Use semantic pull request titles
- Run linting, testing, and building in CI pipeline
- Use dependency scanning and security checks
- Pin action versions to specific SHAs for security

### Quality Gates
- Maintain ESLint configuration for code quality
- Use Prettier for consistent code formatting
- Ensure TypeScript compilation without errors
- Maintain test coverage standards
- Use automated dependency updates (Dependabot)

## Development Workflow

### Pull Requests
- Create focused PRs with single responsibility
- Write descriptive PR titles and descriptions
- Include tests for new functionality
- Update documentation for public API changes
- Ensure all CI checks pass

### Git Practices
- Use conventional commit messages
- Create feature branches from main
- Squash commits when merging
- Keep commit history clean and meaningful

### Make Commands
Running make commands to check and fix code:
- `make lint`: Execute linting
- `make ci`: Execute all formats and checks

## Error Handling

### Error Management
- Use typed errors with specific error classes
- Provide meaningful error messages for users
- Log errors appropriately (info, warn, error levels)
- Handle edge cases gracefully
- Use Result/Option types for operations that may fail

### Validation
- Validate inputs at service boundaries
- Use schema validation for external data
- Provide clear validation error messages
- Sanitize user inputs appropriately

## Performance Considerations

### Optimization Guidelines
- Minimize external dependencies
- Use lazy loading for optional features
- Cache expensive operations when appropriate
- Profile and measure performance impacts
- Optimize for common use cases

### Memory Management
- Dispose of resources properly
- Avoid memory leaks in event handlers
- Use streaming for large data processing
- Monitor memory usage in tests

## Security Practices

### Code Security
- Validate all external inputs
- Use parameterized queries/safe APIs
- Avoid exposing sensitive information in logs
- Follow principle of least privilege
- Keep dependencies updated

### CI/CD Security
- Pin action versions for reproducibility
- Use secrets management for sensitive data
- Scan for vulnerabilities in dependencies
- Review security advisories regularly

## Guidelines for AI Assistance

When suggesting code changes:
1. Respect the existing architecture and patterns
2. Maintain consistency with the established codebase style
3. Suggest the minimal change that achieves the goal
4. Consider the impact on other packages and dependencies
5. Include appropriate tests for new functionality
6. Update documentation when changing public APIs
7. Ensure TypeScript compilation and linting will pass
8. Follow the established error handling patterns
9. Respect the package boundaries and dependencies defined in NX configuration
10. Consider performance and security implications of suggested changes

Remember: This is a production-grade library used by other developers. Prioritize reliability, maintainability, and clear APIs over clever solutions.