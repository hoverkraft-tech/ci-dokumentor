import { describe, it, expect, beforeEach, afterEach, Mocked, vi } from 'vitest';
import { ReadableContent, ReaderAdapter, RepositoryInfo } from '@ci-dokumentor/core';
import { ReaderAdapterMockFactory, RepositoryInfoMockFactory } from '@ci-dokumentor/core/tests';
import {
  GitHubActionsParser,
  GitHubAction,
  GitHubWorkflow,
  GitHubActionInput,
  GitHubActionOutput,
} from './github-actions-parser.js';

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
  input-with-multiline-description:
    description: |
      An input
      with multiline
      description
    type: string
    required: false
  input-with-description-with-code-block:
    description: |
      An input with code block:
      \`\`\`yaml
      key: value
      list:
        - item1
        - item2
      \`\`\`
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
        mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(fileContent));

        // Act
        const result = await parser.parseFile(filePath, mockRepositoryInfo) as GitHubAction;

        // Assert
        expect(result).toBeDefined();
        expect(result.usesName).toBe('owner/repo');
        expect(result.name).toBe('Test Action');
        expect(result.description).toBe('A test GitHub Action');
        expect(result.author).toBe('Test Author');
        expect(result.branding).toEqual({ icon: 'activity', color: 'blue' });

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
        expect((result.inputs as Record<string, GitHubActionInput>)['input-with-multiline-description']).toEqual({
          description: 'An input\nwith multiline\ndescription\n',
          required: false,
          type: 'string',
        });
        expect((result.inputs as Record<string, GitHubActionInput>)['input-with-description-with-code-block']).toEqual({
          description:
            'An input with code block:\n' +
            '```yaml\n' +
            'key: value\n' +
            'list:\n' +
            '  - item1\n' +
            '  - item2\n' +
            '```\n',
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
      const cases = [
        {
          title: 'description from multiple comment lines',
          content: `# Workflow to greet new contributors.
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
`,
          expectedName: 'Greetings',
          expectedDescription:
            'Workflow to greet new contributors.\n' +
            'Mainly using [First Interaction Action](https://github.com/actions/first-interaction), with some opinionated defaults.\n' +
            '- On issue creation, a comment is added to the issue.\n' +
            '- On first contribution, a comment is added to the pull request.',
        },
        {
          title: 'description with fenced code block',
          content: `# This workflow does something important.
# It uses the following code snippet:
# \`\`\`yaml
# name: Example
# on: [push]
# jobs:
#   build:
#     runs-on: ubuntu-latest
#     steps:
#       - name: Checkout code
#         uses: actions/checkout@v2
# \`\`\`
---
name: Code Snippet Workflow

on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
`,
          expectedName: 'Code Snippet Workflow',
          expectedDescription:
            'This workflow does something important.\n' +
            'It uses the following code snippet:\n' +
            '```yaml\n' +
            'name: Example\n' +
            'on: [push]\n' +
            'jobs:\n' +
            '  build:\n' +
            '    runs-on: ubuntu-latest\n' +
            '    steps:\n' +
            '      - name: Checkout code\n' +
            '        uses: actions/checkout@v2\n' +
            '```\n',
        },
        {
          title: 'single line description',
          content: `# Simple workflow description
name: Simple Workflow
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Test
        run: echo "test"
`,
          expectedName: 'Simple Workflow',
          expectedDescription: 'Simple workflow description',
        },
        {
          title: 'no description comments',
          content: `name: No Description Workflow
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Test
        run: echo "test"
`,
          expectedName: 'No Description Workflow',
          expectedDescription: undefined,
        },
        {
          title: 'empty comments only',
          content: `#
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
`,
          expectedName: 'Empty Comments Workflow',
          expectedDescription: undefined,
        },
        {
          title: 'comments with empty lines',
          content: `# First line of description
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
`,
          expectedName: 'Comments With Spaces',
          expectedDescription: 'First line of description\n\nSecond line after empty comment\nThird line',
        },
        {
          title: 'leading empty lines before comments',
          content: `

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
`,
          expectedName: 'Leading Empty Lines',
          expectedDescription: 'Description after empty lines\nSecond line',
        },
      ];

      it.each(cases)('should parse a workflow with $title', async ({ content: fileContent, expectedName, expectedDescription }) => {
        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(fileContent));

        const result = await parser.parseFile('/test/.github/workflows/test.yml', mockRepositoryInfo) as GitHubWorkflow;

        expect(result).toBeDefined();
        expect(result.name).toBe(expectedName);
        if (expectedDescription === undefined) {
          expect(result.description).toBeUndefined();
        } else {
          expect(result.description).toBe(expectedDescription);
        }
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
        mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(fileContent));

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
        mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(fileContent));

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
        mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(fileContent));

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
        mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(fileContent));

        // Act & Assert
        await expect(parser.parseFile(filePath, mockRepositoryInfo)).rejects.toThrow();
      });

      it('should throw error for empty file', async () => {
        // Arrange
        const filePath = '/test/.github/workflows/empty.yml';

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(''));

        // Act & Assert
        await expect(parser.parseFile(filePath, mockRepositoryInfo)).rejects.toThrow();
      });

      it('should throw error for plain text when parseable as YAML', async () => {
        // Arrange
        const filePath = '/test/.github/workflows/plain-text.yml';
        const fileContent = `This is not a YAML file`;

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(fileContent));

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
        mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(fileContent));

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
        mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(fileContent));

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
        mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(fileContent));

        // Act
        const result = await parser.parseFile(filePath, mockRepositoryInfo);

        // Assert
        expect(result).toBeDefined();
        expect('on' in result).toBe(true); // It's a GitHubWorkflow
      });
    });
  });
});
