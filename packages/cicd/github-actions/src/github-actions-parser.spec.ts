import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mockFs from 'mock-fs';
import {
  GitHubActionsParser,
  GitHubAction,
  GitHubWorkflow,
  GitHubActionInput,
  GitHubActionOutput,
} from './github-actions-parser.js';
import { RepositoryInfo } from '@ci-dokumentor/core';
import { RepositoryInfoMockFactory } from '@ci-dokumentor/core/tests';

describe('GitHubActionsParser', () => {
  let repositoryInfo: RepositoryInfo;
  let parser: GitHubActionsParser;

  beforeEach(() => {
    repositoryInfo = RepositoryInfoMockFactory.create();

    parser = new GitHubActionsParser();
  });

  afterEach(() => {
    mockFs.restore();
  });

  describe('parseFile', () => {
    describe('GitHub Actions', () => {
      it('should parse an action file', async () => {
        // Arrange
        mockFs({
          '/test': {
            'action.yml': `name: Test Action
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
`,
          },
        });

        // Act
        const result = parser.parseFile(
          '/test/action.yml',
          repositoryInfo
        ) as GitHubAction;

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
        mockFs({
          '/test': {
            '.github': {
              workflows: {
                'workflow.yml': `name: Test Workflow
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
`,
              },
            },
          },
        });

        // Act
        const result = parser.parseFile(
          '/test/.github/workflows/workflow.yml',
          repositoryInfo
        ) as GitHubWorkflow;

        // Assert
        expect(result).toBeDefined();
        expect(result.usesName).toBe(
          'owner/repo/.github/workflows/workflow.yml'
        );
        expect(result.name).toBe('Test Workflow');
      });

      it('should parse a workflow without defined name', async () => {
        // Arrange
        mockFs({
          '/test': {
            '.github': {
              workflows: {
                'workflow-test.yml': `on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
`,
              },
            },
          },
        });

        // Act
        const result = parser.parseFile(
          '/test/.github/workflows/workflow-test.yml',
          repositoryInfo
        ) as GitHubWorkflow;

        // Assert
        expect(result).toBeDefined();
        expect(result.name).toBe('Workflow Test'); // Default name based on file name
      });
    });

    describe('Error handling', () => {
      it('should throw error for invalid YAML', async () => {
        // Arrange
        mockFs({
          '/test': {
            '.github': {
              workflows: {
                'invalid.yml': `invalid: yaml: content`,
              },
            },
          },
        });

        // Act & Assert
        expect(() =>
          parser.parseFile('/test/.github/workflows/invalid.yml', repositoryInfo)
        ).toThrow('Nested mappings are not allowed in compact mappings at line 1, column 10');
      });

      it('should throw error for empty file', async () => {
        // Arrange
        mockFs({
          '/test': {
            '.github': {
              workflows: {
                'empty.yml': '',
              },
            },
          },
        });

        // Act & Assert
        expect(() =>
          parser.parseFile('/test/.github/workflows/empty.yml', repositoryInfo)
        ).toThrow('Unsupported source file');
      });

      it('should throw error for plain text when parseable as YAML', async () => {
        // Arrange
        mockFs({
          '/test': {
            '.github': {
              workflows: {
                'plain-text.yml': `This is not a YAML file`,
              },
            },
          },
        });

        // Act & Assert
        expect(() =>
          parser.parseFile('/test/.github/workflows/plain-text.yml', repositoryInfo)
        ).toThrow(
          'Unsupported GitHub Actions file format: /test/.github/workflows/plain-text.yml'
        );
      });

      it('should throw error for valid YAML but unsupported structure', async () => {
        // Arrange
        mockFs({
          '/test': {
            '.github': {
              workflows: {
                'object-without-required-fields.yml': `someField: value
anotherField: 123
`,
              },
            },
          },
        });

        // Act & Assert
        expect(() =>
          parser.parseFile(
            '/test/.github/workflows/object-without-required-fields.yml',
            repositoryInfo
          )
        ).toThrow(
          'Unsupported GitHub Actions file format: /test/.github/workflows/object-without-required-fields.yml'
        );
      });
    });

    describe('Type detection', () => {
      it('should detect GitHub Action when it has name but no on/jobs properties', async () => {
        // Arrange
        mockFs({
          '/test': {
            'action.yml': `name: Simple Action
description: A simple GitHub Action
runs:
  using: node20
`,
          },
        });

        // Act
        const result = parser.parseFile('/test/action.yml', repositoryInfo);

        // Assert
        expect(result).toBeDefined();
        expect('runs' in result).toBe(true); // It's a GitHubAction
        expect('on' in result).toBe(false);
        expect('jobs' in result).toBe(false);
      });

      it('should detect GitHub Workflow when it has on property', async () => {
        // Arrange
        mockFs({
          '/test': {
            '.github': {
              workflows: {
                'workflow.yml': `name: Test Workflow
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
`,
              },
            },
          },
        });

        // Act
        const result = parser.parseFile(
          '/test/.github/workflows/workflow.yml',
          repositoryInfo
        );

        // Assert
        expect(result).toBeDefined();
        expect('on' in result).toBe(true); // It's a GitHubWorkflow
      });
    });
  });
});
