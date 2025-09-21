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
