import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mockFs from 'mock-fs';
import { GitHubActionsParser, GitHubAction, GitHubWorkflow } from './github-actions-parser.js';

describe('GitHubActionsParser', () => {
    let parser: GitHubActionsParser;

    beforeEach(() => {
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
outputs:
    output-name:
        description: Output description 
        value: \${{ steps.step-id.outputs.value }}
runs:
  using: composite
`
                    }
                });

                // Act
                const result = parser.parseFile('/test/action.yml') as GitHubAction;

                // Assert
                expect(result).toBeDefined();
                expect(result.name).toBe('Test Action');
                expect(result.description).toBe('A test GitHub Action');
                expect(result.author).toBe('Test Author');
                expect(result.branding).toEqual({
                    icon: 'activity',
                    color: 'blue'
                });

                expect(result.inputs).toBeDefined();
                expect(result.inputs!['input-name']).toEqual({
                    description: 'Input description',
                    required: true,
                    default: 'default-value',
                    type: 'string'
                });
                expect(result.inputs!['optional-input']).toEqual({
                    description: 'Optional input',
                    required: false,
                    type: 'choice',
                    options: ['option1', 'option2']
                });

                expect(result.outputs).toBeDefined();
                expect(result.outputs!['output-name']).toEqual({
                    description: 'Output description',
                    value: '${{ steps.step-id.outputs.value }}'
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
                            'workflows': {
                                'workflow.yml': `name: Test Workflow
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
`
                            }
                        }
                    }
                });

                // Act
                const result = parser.parseFile('/test/.github/workflows/workflow.yml') as GitHubWorkflow;

                // Assert
                expect(result).toBeDefined();
                expect(result.name).toBe('Test Workflow');

            });

            it('should parse a workflow without defined name', async () => {
                // Arrange
                mockFs({
                    '/test': {
                        '.github': {
                            'workflows': {
                                'workflow-test.yml': `on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
`
                            }
                        }
                    }
                });

                // Act
                const result = parser.parseFile('/test/.github/workflows/workflow-test.yml') as GitHubWorkflow;

                // Assert
                expect(result).toBeDefined();
                expect(result.name).toBe("Workflow Test"); // Default name based on file name
            });
        });

        describe('Error handling', () => {
            it('should throw error for invalid YAML', async () => {
                // Arrange
                mockFs({
                    '/test': {
                        'invalid.yml': `invalid: yaml: content`
                    }
                });

                // Act & Assert
                expect(() => parser.parseFile('/test/invalid.yml')).toThrow();
            });

            it('should throw error for empty file', async () => {
                // Arrange
                mockFs({
                    '/test': {
                        'empty.yml': ''
                    }
                });

                // Act & Assert
                expect(() => parser.parseFile('/test/empty.yml')).toThrow('Unsupported source file');
            });

            it('should throw error for plain text when parseable as YAML', async () => {
                // Arrange
                mockFs({
                    '/test': {
                        'plain-text.yml': `This is not a YAML file`
                    }
                });

                // Act & Assert
                expect(
                    () => parser.parseFile('/test/plain-text.yml')
                ).toThrow("Unsupported GitHub Actions file format: /test/plain-text.yml");
            });

            it('should throw error for valid YAML but unsupported structure', async () => {
                // Arrange
                mockFs({
                    '/test': {
                        'object-without-required-fields.yml': `someField: value
anotherField: 123
`                    }
                });

                // Act & Assert
                expect(
                    () => parser.parseFile("/test/object-without-required-fields.yml")
                ).toThrow('Unsupported GitHub Actions file format: /test/object-without-required-fields.yml');
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
`
                    }
                });

                // Act
                const result = parser.parseFile('/test/action.yml');

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
                        'workflow.yml': `name: Test Workflow
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
`
                    }
                });

                // Act
                const result = parser.parseFile('/test/workflow.yml');

                // Assert
                expect(result).toBeDefined();
                expect('on' in result).toBe(true); // It's a GitHubWorkflow
            });
        });
    });
});
