# CI Dokumentor CLI

A powerful, extensible command-line interface for generating documentation from CI/CD configuration files.

## Features

- **Clean Architecture**: Follows SOLID principles and clean architecture patterns
- **Extensible Design**: Easy to add new commands and CI/CD system support
- **Type-Safe**: Built with TypeScript for robust type checking
- **Commander.js Integration**: Professional CLI framework with excellent UX
- **Comprehensive Testing**: Well-tested with Vitest

## Architecture

This CLI package follows clean architecture principles:

### Core Components

- **Interfaces**: Define contracts for extensibility (`ICommand`, `ICommandRegistry`, `ICliApplication`)
- **Commands**: Implement specific CLI functionality (`GenerateCommand`, `HelpCommand`)
- **Registry**: Manages command registration and discovery (`CommandRegistry`)
- **Application**: Orchestrates the CLI execution (`CliApplication`)
- **Factory**: Creates and configures CLI instances (`CliFactory`)

### Design Patterns

- **Command Pattern**: Each CLI command is encapsulated as a separate class
- **Registry Pattern**: Commands are registered and discovered dynamically
- **Factory Pattern**: CLI application instances are created through a factory
- **Single Responsibility**: Each class has a single, well-defined purpose
- **Open/Closed**: Easy to extend with new commands without modifying existing code

## Installation

```bash
# Install dependencies
pnpm install

# Build the CLI
pnpm build
```

## Usage

### Generate Documentation

```bash
# Generate docs with default settings
ci-dokumentor generate

# Specify source and output directories
ci-dokumentor generate --source ./workflows --output ./docs

# Generate GitHub Actions documentation
ci-dokumentor generate --type github-actions
```

### Help Commands

```bash
# Show general help
ci-dokumentor --help

# Show help for a specific command
ci-dokumentor generate --help
ci-dokumentor help generate
```

### Version

```bash
ci-dokumentor --version
```

## API Reference

### Commands

#### Generate Command

Generates documentation from CI/CD configuration files.

**Options:**

- `-s, --source <dir>`: Source directory containing CI/CD files
- `-o, --output <dir>`: Output directory for generated documentation
- `-t, --type <type>`: Type of CI/CD system

#### Help Command

Shows help information for commands.

**Usage:**

- `ci-dokumentor help`: Show general help
- `ci-dokumentor help <command>`: Show help for specific command

## Development

### Project Structure

```
src/
├── lib/
│   ├── interfaces/          # Core interfaces and contracts
│   │   ├── command.interface.ts
│   │   ├── command-registry.interface.ts
│   │   └── cli-application.interface.ts
│   ├── commands/            # Command implementations
│   │   ├── base-command.ts
│   │   ├── generate-command.ts
│   │   └── help-command.ts
│   ├── registry/            # Command registry
│   │   └── command-registry.ts
│   ├── application/         # Main CLI application
│   │   └── cli-application.ts
│   ├── factory/             # Factory for creating CLI instances
│   │   └── cli-factory.ts
│   └── cli.ts              # Main entry point
├── bin/
│   └── ci-dokumentor.ts    # Executable script
└── index.ts                # Package entry point
```

### Adding New Commands

1. **Create a new command class** extending `BaseCommand`:

```typescript
import { BaseCommand } from './base-command.js';

export class MyCommand extends BaseCommand {
  constructor() {
    super('my-command', 'Description of my command');
  }

  async execute(args: string[]): Promise<void> {
    // Implementation
  }
}
```

2. **Register the command** in `CliApplication`:

```typescript
const myCommand = new MyCommand();
this.commandRegistry.register(myCommand);
this.setupMyCommand(myCommand);
```

3. **Setup Commander.js integration**:

```typescript
private setupMyCommand(myCommand: MyCommand): void {
  this.program
    .command('my-command')
    .description(myCommand.description)
    .action(async (options) => {
      await myCommand.execute([]);
    });
}
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

### Building

```bash
# Build the package
pnpm build

# Clean build artifacts
pnpm clean
```

## Contributing

1. Follow the existing architecture patterns
2. Ensure all code is properly typed
3. Add tests for new functionality
4. Update documentation as needed
5. Follow clean code principles

## License

[License information]
