import { describe, it, expect, beforeEach, afterEach, Mocked, vi } from 'vitest';
import {
  GitHubActionsParser,
  GitHubAction,
  GitHubWorkflow,
  GitHubActionInput,
  GitHubActionOutput,
} from './github-actions-parser.js';
import { ReaderAdapter, RepositoryInfo } from '@ci-dokumentor/core';
import { ReaderAdapterMockFactory, RepositoryInfoMockFactory } from '@ci-dokumentor/core/tests';

describe('GitHubActionsParser', () => {
  let mockReaderAdapter: Mocked<ReaderAdapter>;
  let mockRepositoryInfo: Mocked<RepositoryInfo>;
  let parser: GitHubActionsParser;

  beforeEach(() => {
    vi.resetAllMocks();

    mockReaderAdapter = ReaderAdapterMockFactory.create();
    mockRepositoryInfo = RepositoryInfoMockFactory.create();

    parser = new GitHubActionsParser(mockReaderAdapter);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('parseFile', () => {
    describe('GitHub Actions', () => {
      it('should parse an action file', async () => {
        // Arrange
        const filePath = '/test/action.yml';
        const fileContent = `name: Test Action
description: A test GitHub Action
author: Test Author
branding:
  icon: activity
  color: blue  
inputs:
  input-name:
    description: Input description
    required: true
    default: default-value
    type: string
  optional-input:
    description: Optional input
    required: false
    type: choice
    options:
      - option1
      - option2
  optional-input-with-multiline-description:
    description: |
      An optional input
      with multiline
      description
    type: string
    required: false
outputs:
    output-name:
        description: Output description 
        value: \${{ steps.step-id.outputs.value }}
runs:
  using: composite
`;

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(fileContent));

        // Act
        const result = await parser.parseFile(filePath, mockRepositoryInfo) as GitHubAction;

        // Assert
        expect(result).toBeDefined();
        expect(result.usesName).toBe('owner/repo');
        expect(result.name).toBe('Test Action');
        expect(result.description).toBe('A test GitHub Action');
        expect(result.author).toBe('Test Author');
        expect(result.branding).toEqual({
          icon: 'activity',
          color: 'blue',
        });

        expect(result.inputs).toBeDefined();
        expect((result.inputs as Record<string, GitHubActionInput>)['input-name']).toEqual({
          description: 'Input description',
          required: true,
          default: 'default-value',
          type: 'string',
        });
        expect((result.inputs as Record<string, GitHubActionInput>)['optional-input']).toEqual({
          description: 'Optional input',
          required: false,
          type: 'choice',
          options: ['option1', 'option2'],
        });
        expect((result.inputs as Record<string, GitHubActionInput>)['optional-input-with-multiline-description']).toEqual({
          description: 'An optional input\nwith multiline\ndescription\n',
          required: false,
          type: 'string',
        });


        expect(result.outputs).toBeDefined();
        expect((result.outputs as Record<string, GitHubActionOutput>)['output-name']).toEqual({
          description: 'Output description',
          value: '${{ steps.step-id.outputs.value }}',
        });

        expect(result.runs).toBeDefined();
        expect(result.runs.using).toBe('composite');
      });
    });

    describe('GitHub Workflows', () => {
      it('should parse a workflow with description from comments', async () => {
        // Arrange
        const filePath = '/test/.github/workflows/greetings.yml';
        const fileContent = `# Workflow to greet new contributors.
# Mainly using [First Interaction Action](https://github.com/actions/first-interaction), with some opinionated defaults.
# - On issue creation, a comment is added to the issue.
# - On first contribution, a comment is added to the pull request.
---
name: Greetings

on:
  issues:
    types: [opened]
  pull_request_target:
    branches: [main]

jobs:
  greet:
    runs-on: ubuntu-latest
    steps:
      - name: Greet
        uses: actions/first-interaction@v1
`;

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(fileContent));

        // Act
        const result = await parser.parseFile(filePath, mockRepositoryInfo) as GitHubWorkflow;

        // Assert
        expect(result).toBeDefined();
        expect(result.name).toBe('Greetings');
        expect(result.description).toBe(
          'Workflow to greet new contributors.\n' +
          'Mainly using [First Interaction Action](https://github.com/actions/first-interaction), with some opinionated defaults.\n' +
          '- On issue creation, a comment is added to the issue.\n' +
          '- On first contribution, a comment is added to the pull request.'
        );
      });

      it('should parse a workflow with single line description', async () => {
        // Arrange
        const filePath = '/test/.github/workflows/simple.yml';
        const fileContent = `# Simple workflow description
name: Simple Workflow
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Test
        run: echo "test"
`;

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(fileContent));

        // Act
        const result = await parser.parseFile(filePath, mockRepositoryInfo) as GitHubWorkflow;

        // Assert
        expect(result).toBeDefined();
        expect(result.name).toBe('Simple Workflow');
        expect(result.description).toBe('Simple workflow description');
      });

      it('should parse a workflow without description comments', async () => {
        // Arrange
        const filePath = '/test/.github/workflows/no-description.yml';
        const fileContent = `name: No Description Workflow
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Test
        run: echo "test"
`;

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(fileContent));

        // Act
        const result = await parser.parseFile(filePath, mockRepositoryInfo) as GitHubWorkflow;

        // Assert
        expect(result).toBeDefined();
        expect(result.name).toBe('No Description Workflow');
        expect(result.description).toBeUndefined();
      });

      it('should parse a workflow with empty comments', async () => {
        // Arrange
        const filePath = '/test/.github/workflows/empty-comments.yml';
        const fileContent = `#
#
#
name: Empty Comments Workflow
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Test
        run: echo "test"
`;

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(fileContent));

        // Act
        const result = await parser.parseFile(filePath, mockRepositoryInfo) as GitHubWorkflow;

        // Assert
        expect(result).toBeDefined();
        expect(result.name).toBe('Empty Comments Workflow');
        expect(result.description).toBeUndefined();
      });

      it('should parse a workflow with comments and empty lines', async () => {
        // Arrange
        const filePath = '/test/.github/workflows/comments-with-spaces.yml';
        const fileContent = `# First line of description
#
# Second line after empty comment
# Third line
---
name: Comments With Spaces
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Test
        run: echo "test"
`;

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(fileContent));

        // Act
        const result = await parser.parseFile(filePath, mockRepositoryInfo) as GitHubWorkflow;

        // Assert
        expect(result).toBeDefined();
        expect(result.name).toBe('Comments With Spaces');
        expect(result.description).toBe('First line of description\n\nSecond line after empty comment\nThird line');
      });

      it('should parse a workflow with leading empty lines before comments', async () => {
        // Arrange
        const filePath = '/test/.github/workflows/leading-empty-lines.yml';
        const fileContent = `

# Description after empty lines
# Second line
name: Leading Empty Lines
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Test
        run: echo "test"
`;

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(fileContent));

        // Act
        const result = await parser.parseFile(filePath, mockRepositoryInfo) as GitHubWorkflow;

        // Assert
        expect(result).toBeDefined();
        expect(result.name).toBe('Leading Empty Lines');
        expect(result.description).toBe('Description after empty lines\nSecond line');
      });

      it('should not extract description from action files', async () => {
        // Arrange
        const filePath = '/test/action.yml';
        const fileContent = `# This is an action comment
name: Test Action
description: Action description from field
runs:
  using: composite
`;

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(fileContent));

        // Act
        const result = await parser.parseFile(filePath, mockRepositoryInfo) as GitHubAction;

        // Assert
        expect(result).toBeDefined();
        expect(result.name).toBe('Test Action');
        expect(result.description).toBe('Action description from field');
        expect('description' in result && typeof result.description === 'string').toBe(true);
      });

      it('should parse a complete workflow file', async () => {
        // Arrange
        const filePath = '/test/.github/workflows/workflow.yml';
        const fileContent = `name: Test Workflow
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
`;

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(fileContent));

        // Act
        const result = await parser.parseFile(filePath, mockRepositoryInfo) as GitHubWorkflow;

        // Assert
        expect(result).toBeDefined();
        expect(result.usesName).toBe(
          'owner/repo/.github/workflows/workflow.yml'
        );
        expect(result.name).toBe('Test Workflow');
      });

      it('should parse a workflow without defined name', async () => {
        // Arrange
        const filePath = '/test/.github/workflows/workflow-test.yml';
        const fileContent = `on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
`;

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(fileContent));

        // Act
        const result = await parser.parseFile(filePath, mockRepositoryInfo) as GitHubWorkflow;

        // Assert
        expect(result).toBeDefined();
        expect(result.name).toBe('Workflow Test'); // Default name based on file name
      });
    });

    describe('Error handling', () => {
      it('should throw error for invalid YAML', async () => {
        // Arrange
        const filePath = '/test/.github/workflows/invalid.yml';
        const fileContent = `invalid: yaml: content`;

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(fileContent));

        // Act & Assert
        await expect(parser.parseFile(filePath, mockRepositoryInfo)).rejects.toThrow();
      });

      it('should throw error for empty file', async () => {
        // Arrange
        const filePath = '/test/.github/workflows/empty.yml';

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(''));

        // Act & Assert
        await expect(parser.parseFile(filePath, mockRepositoryInfo)).rejects.toThrow();
      });

      it('should throw error for plain text when parseable as YAML', async () => {
        // Arrange
        const filePath = '/test/.github/workflows/plain-text.yml';
        const fileContent = `This is not a YAML file`;

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(fileContent));

        // Act & Assert
        await expect(parser.parseFile(filePath, mockRepositoryInfo)).rejects.toThrow();
      });

      it('should throw error for valid YAML but unsupported structure', async () => {
        // Arrange
        const filePath = '/test/.github/workflows/object-without-required-fields.yml';
        const fileContent = `someField: value
anotherField: 123
`;

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(fileContent));

        // Act & Assert
        await expect(parser.parseFile(filePath, mockRepositoryInfo)).rejects.toThrow();
      });
    });

    describe('Type detection', () => {
      it('should detect GitHub Action when it has name but no on/jobs properties', async () => {
        // Arrange
        const filePath = '/test/action.yml';
        const fileContent = `name: Simple Action
description: A simple GitHub Action
runs:
  using: node20
`;

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(fileContent));

        // Act
        const result = await parser.parseFile(filePath, mockRepositoryInfo);

        // Assert
        expect(result).toBeDefined();
        expect('runs' in result).toBe(true); // It's a GitHubAction
        expect('on' in result).toBe(false);
        expect('jobs' in result).toBe(false);
      });

      it('should detect GitHub Workflow when it has on property', async () => {
        // Arrange
        const filePath = '/test/.github/workflows/workflow.yml';
        const fileContent = `name: Test Workflow
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
`;

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(fileContent));

        // Act
        const result = await parser.parseFile(filePath, mockRepositoryInfo);

        // Assert
        expect(result).toBeDefined();
        expect('on' in result).toBe(true); // It's a GitHubWorkflow
      });
    });
  });
});
