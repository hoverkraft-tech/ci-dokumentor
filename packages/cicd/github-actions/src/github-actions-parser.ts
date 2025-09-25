import { basename, dirname, extname, join, relative } from 'node:path';
import type { ReaderAdapter, RepositoryInfo } from '@ci-dokumentor/core';
import { FileReaderAdapter, ReadableContent } from '@ci-dokumentor/core';
import { inject, injectable } from 'inversify';
import { parse } from 'yaml';

// See https://github.com/SchemaStore/schemastore/blob/master/src/schemas/json/github-action.json

export type GitHubActionInput = {
  description?: string;
  required?: boolean;
  default?: string;
  type?: string; // e.g., 'string', 'boolean', 'choice'
};

export type GitHubActionOutput = {
  description?: string;
  value?: string;
};

export type GitHubAction = {
  usesName: string; // e.g., 'hoverkraft-tech/compose-action'
  name: string;
  description?: string;
  author?: string;
  branding?: {
    icon?: string;
    color?: string;
  };
  inputs?: Record<string, GitHubActionInput>;
  outputs?: Record<string, GitHubActionOutput>;
  runs: {
    using: string; // e.g., 'node20', 'docker', 'composite'
  };
};

// See https://github.com/SchemaStore/schemastore/blob/master/src/schemas/json/github-workflow.json

export type GitHubWorkflowJob = {
  name?: string;
  'runs-on': string | string[];
  needs?: string | string[];
  strategy?: {
    matrix?: Record<string, unknown>;
  };
  environment?: string | { name: string };
  steps?: Array<{
    name?: string;
    uses?: string;
    run?: string;
    with?: Record<string, unknown>;
    env?: Record<string, string>;
    if?: string;
  }>;
};

export type GitHubWorkflow = {
  usesName: string; // e.g., 'hoverkraft-tech/ci-github-container/.github/workflows/docker-build-images.yml'
  name: string;
  description?: string; // Description extracted from comments at the beginning of the YAML file
  on: {
    [key: string]: unknown;
    workflow_dispatch?: GitHubWorkflowDispatchEvent;
    workflow_call?: GitHubWorkflowCallEvent;
  }; // Event triggers
  permissions?: Record<string, string>; // Permissions for the workflow
  jobs: Record<string, GitHubWorkflowJob>; // Jobs in the workflow
};

export type GitHubWorkflowDispatchEvent = {
  inputs?: Record<string, GitHubWorkflowInput>;
};

export type GitHubWorkflowCallEvent = {
  inputs?: Record<string, GitHubWorkflowCallInput>;
  secrets?: Record<string, GitHubWorkflowSecret>;
  outputs?: Record<string, GitHubWorkflowOutput>;
};

type GitHubWorkflowInput = {
  description: string;
  required?: boolean;
  type?: string;
  default?: string;
};

export type GitHubWorkflowDispatchInput = GitHubWorkflowInput & {
  deprecationMessage?: string;
  options?: string[];
};

export type GitHubWorkflowCallInput = GitHubWorkflowInput;

export type GitHubWorkflowSecret = {
  description?: string;
  required?: boolean;
};

export type GitHubWorkflowOutput = {
  description?: string;
  value: string;
};

export type GitHubActionsManifest = GitHubAction | GitHubWorkflow;

@injectable()
export class GitHubActionsParser {
  constructor(@inject(FileReaderAdapter) private readonly readerAdapter: ReaderAdapter) { }

  isGitHubActionFile(source: string): boolean {
    // Check if the source is a GitHub Action by looking for action.yml or action.yaml
    return /action\.ya?ml$/i.test(source);
  }

  isGitHubWorkflowFile(source: string): boolean {
    // Check if the source is a GitHub Workflow by looking for .github/workflows/
    return source.includes('.github/workflows/');
  }

  async parseFile(
    source: string,
    repositoryInfo: RepositoryInfo
  ): Promise<GitHubActionsManifest> {
    if (!this.readerAdapter.resourceExists(source)) {
      throw new Error(`Source file does not exist: "${source}"`);
    }

    const content = await this.readerAdapter.readResource(source);
    const parsed = parse(content.toString());
    if (!parsed) {
      throw new Error(`Unsupported source file: ${source}`);
    }

    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`Unsupported GitHub Actions file format: ${source}`);
    }

    if (!parsed.name) {
      // Extract filename without extension and convert to PascalCase
      const fileName = basename(source, extname(source));
      const pascalCaseName = fileName
        .split(/[-_\s]/)
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(' ');
      parsed.name = pascalCaseName;
    }

    parsed.usesName = this.getUsesName(source, repositoryInfo);

    // Extract description from comments for workflows
    if (this.isGitHubWorkflowFile(source) && this.isGitHubWorkflow(parsed)) {
      const description = this.extractDescriptionFromComments(content);
      if (description) {
        (parsed as GitHubWorkflow).description = description.toString();
      }
    }

    if (this.isGitHubAction(parsed)) {
      return parsed as GitHubAction;
    }

    if (this.isGitHubWorkflow(parsed)) {
      return parsed as GitHubWorkflow;
    }

    throw new Error(`Unsupported GitHub Actions file format: ${source}`);
  }

  private getUsesName(source: string, repositoryInfo: RepositoryInfo): string {
    // For GitHub Actions, the usesName is typically the repository name
    const sourceRelativePath = relative(repositoryInfo.rootDir, source);
    if (this.isGitHubActionFile(source)) {

      return join(repositoryInfo.owner, repositoryInfo.name, dirname(sourceRelativePath));
    }

    // For GitHub Workflows, the usesName is the workflow file path
    if (this.isGitHubWorkflowFile(source)) {
      return join(repositoryInfo.owner, repositoryInfo.name, sourceRelativePath);
    }

    throw new Error(`Unsupported source file: ${source}`);
  }

  private extractDescriptionFromComments(content: ReadableContent): ReadableContent | undefined {
    const lines = content.splitLines();
    const commentLines: ReadableContent[] = [];
    let inCodeFence = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      const trimmedLineIsEmpty = trimmedLine.isEmpty();

      // Stop if we encounter the YAML document separator
      if (trimmedLine.equals('---')) {
        break;
      }

      // Skip empty lines at the beginning
      if (trimmedLineIsEmpty && commentLines.length === 0) {
        continue;
      }

      // If we encounter a non-comment line after starting to collect comments, stop
      if (!trimmedLineIsEmpty && !trimmedLine.startsWith('#')) {
        break;
      }

      // Extract comment content
      if (trimmedLine.startsWith('#')) {
        // Find the position of the first '#' in the raw line (handles leading spaces)
        const hashIndex = line.search('#');
        // Slice after the '#' to get the comment content as ReadableContent
        let commentPart = line.slice(hashIndex + 1);
        // Remove a single space if present (conventional `# ` style)
        if (commentPart.startsWith(' ')) {
          commentPart = commentPart.slice(1);
        }

        // Detect code fence opening/closing (e.g. ``` or ```yaml)
        const startsWithFence = commentPart.trimStart().startsWith('```');
        if (startsWithFence) {
          inCodeFence = !inCodeFence;
        }

        commentLines.push(commentPart);
      } else if (trimmedLineIsEmpty && commentLines.length > 0) {
        // Allow empty lines within comment blocks
        commentLines.push(ReadableContent.empty());
      }
    }

    if (commentLines.length === 0) {
      return undefined;
    }

    // Remove leading empty comment lines
    while (commentLines.length > 0 && commentLines[0].trim().isEmpty()) {
      commentLines.shift();
    }
    // Remove trailing empty comment lines
    while (commentLines.length > 0 && commentLines[commentLines.length - 1].trim().isEmpty()) {
      commentLines.pop();
    }

    if (commentLines.length === 0) {
      return undefined;
    }

    // Build a single ReadableContent by joining with newlines to avoid
    // converting each line to string individually.
    let descriptionRC = commentLines[0];
    for (let i = 1; i < commentLines.length; i++) {
      descriptionRC = descriptionRC.append('\n').append(commentLines[i]);
    }

    // If the last non-empty comment line is a code fence, ensure the
    // description ends with a newline so code fences are preserved
    // exactly as expected in tests (closing fence followed by a newline).
    const lastNonEmpty = commentLines[commentLines.length - 1];
    if (lastNonEmpty.trimStart().startsWith('```')) {
      // append a trailing newline to match expected formatting
      descriptionRC = descriptionRC.append('\n');
    }

    return descriptionRC || undefined;
  }

  private isGitHubAction(parsed: unknown): parsed is GitHubAction {
    // Validate all required fields for a GitHub Action
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'name' in parsed &&
      typeof parsed.name === 'string' &&
      'runs' in parsed &&
      typeof parsed.runs === 'object' &&
      parsed.runs !== null &&
      'using' in parsed.runs &&
      typeof parsed.runs.using === 'string'
    );
  }

  private isGitHubWorkflow(parsed: unknown): parsed is GitHubWorkflow {
    // Validate all required fields for a GitHub Workflow
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'name' in parsed &&
      typeof parsed.name === 'string' &&
      'on' in parsed &&
      (typeof parsed.on === 'object' ||
        Array.isArray(parsed.on) ||
        typeof parsed.on === 'string')
    );
  }
}
