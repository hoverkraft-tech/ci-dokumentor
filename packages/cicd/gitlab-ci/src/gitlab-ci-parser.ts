import { basename, extname, relative, dirname } from 'node:path';
import type { ReaderAdapter, RepositoryInfo } from '@ci-dokumentor/core';
import { FileReaderAdapter, ReadableContent } from '@ci-dokumentor/core';
import { inject, injectable } from 'inversify';
import { parse } from 'yaml';

// GitLab CI Component manifest structure
// See https://docs.gitlab.com/ci/components/
export type GitLabComponent = {
  usesName: string;
  name: string;
  description?: string;
  inputs?: Record<string, GitLabComponentInput>;
  spec: {
    inputs: Record<string, GitLabComponentInput>;
  };
};

export type GitLabComponentInput = {
  description?: string;
  default?: string;
  type?: string; // string, number, boolean, array
  required?: boolean;
  options?: string[]; // for select type inputs
};

// GitLab CI Pipeline structure  
// See https://docs.gitlab.com/ci/yaml/
export type GitLabCIJob = {
  stage?: string;
  image?: string | { name: string; entrypoint?: string[] };
  script?: string[];
  before_script?: string[];
  after_script?: string[];
  rules?: Array<{
    if?: string;
    when?: string;
    allow_failure?: boolean;
  }>;
  variables?: Record<string, string>;
  artifacts?: {
    paths?: string[];
    reports?: Record<string, string[]>;
  };
  dependencies?: string[];
  needs?: string[];
  parallel?: number | { matrix: Record<string, string[]> };
  trigger?: string | { project: string; strategy?: string };
  extends?: string | string[];
};

export type GitLabCIPipeline = {
  usesName: string;
  name: string;
  description?: string;
  stages?: string[];
  variables?: Record<string, string>;
  include?: Array<{
    project?: string;
    file?: string;
    template?: string;
    component?: string;
  }>;
  workflow?: {
    rules?: Array<{
      if?: string;
      when?: string;
    }>;
  };
  default?: {
    image?: string;
    before_script?: string[];
    after_script?: string[];
  };
  jobs: Record<string, GitLabCIJob>;
};

export type GitLabCIManifest = GitLabComponent | GitLabCIPipeline;

@injectable()
export class GitLabCIParser {
  constructor(@inject(FileReaderAdapter) private readonly readerAdapter: ReaderAdapter) { }


  isGitLabComponentFile(source: string): boolean {
    // Determine the filename and its parent directory to support two valid
    // GitLab component layouts:
    // 1) Single-file components directly under `templates/`, e.g.
    //    templates/secret-detection.yml
    // 2) Component subdirectory containing a `template.yml`, e.g.
    //    templates/secret-detection/template.yml
    const fileName = basename(source);
    const parentDir = dirname(source).split(/[/\\]/).pop() || '';
    const parentDir2 = dirname(dirname(source)).split(/[/\\]/).pop() || '';

    // If the file itself is named `template.yml` (or .yaml) anywhere under
    // a `templates/` directory, treat it as a component.
    if (/template\.ya?ml$/i.test(fileName) && parentDir2 === 'templates') {
      return true;
    }

    // If the file is a YAML file directly inside the `templates` directory
    // (not nested deeper), treat it as a single-file component.
    if (/\.ya?ml$/i.test(fileName) && parentDir === 'templates') {
      return true;
    }

    return false;
  }

  isGitLabCIFile(source: string): boolean {
    // Check if the source is a GitLab CI file by looking for .gitlab-ci.yml or .gitlab-ci.yaml
    return /\.gitlab-ci\.ya?ml$/i.test(source) || !!basename(source).match(/^\.gitlab-ci\.ya?ml$/i);
  }

  async parseFile(
    source: string,
    repositoryInfo: RepositoryInfo
  ): Promise<GitLabCIManifest> {
    if (!this.readerAdapter.resourceExists(source)) {
      throw new Error(`Source file does not exist: "${source}"`);
    }

    const content = await this.readerAdapter.readResource(source);
    const parsed = parse(content.toString());

    if (!parsed) {
      throw new Error(`Unsupported source file: ${source}`);
    }

    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`Unsupported GitLab CI file format: ${source}`);
    }

    if (!parsed.name) {
      // Extract filename without extension and convert to readable name
      const fileName = basename(source, extname(source));
      const readableName = fileName
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      parsed.name = readableName;
    }

    parsed.usesName = this.getUsesName(source, repositoryInfo);

    // Extract description from comments
    const description = this.extractDescriptionFromComments(content);
    if (description) {
      parsed.description = description.toString();
    }

    if (this.isGitLabComponent(parsed)) {
      return parsed as GitLabComponent;
    }

    if (this.isGitLabCIPipeline(parsed)) {
      // Convert job-like objects to jobs record
      const jobs: Record<string, GitLabCIJob> = {};
      const reservedKeys = ['stages', 'variables', 'include', 'workflow', 'default', 'name', 'description', 'usesName'];

      for (const [key, value] of Object.entries(parsed)) {
        if (!reservedKeys.includes(key) && typeof value === 'object' && value !== null) {
          // This looks like a job definition
          jobs[key] = value as GitLabCIJob;
        }
      }

      (parsed as GitLabCIPipeline).jobs = jobs;
      return parsed as GitLabCIPipeline;
    }

    throw new Error(`Unsupported GitLab CI file format: ${source}`);
  }

  private getUsesName(source: string, repositoryInfo: RepositoryInfo): string {
    const sourceRelativePath = relative(repositoryInfo.rootDir, source);

    if (this.isGitLabComponentFile(source)) {
      // For GitLab components, use the project path with component reference
      return `${repositoryInfo.fullName}@${sourceRelativePath}`;
    }

    if (this.isGitLabCIFile(source)) {
      // For GitLab CI files, use the project path
      return repositoryInfo.fullName;
    }

    throw new Error(`Unsupported source file: ${source}`);
  }

  private extractDescriptionFromComments(content: ReadableContent): ReadableContent | undefined {
    const lines = content.splitLines();
    const commentLines: ReadableContent[] = [];

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
        const hashIndex = line.search('#');
        let commentPart = line.slice(hashIndex + 1);
        if (commentPart.startsWith(' ')) {
          commentPart = commentPart.slice(1);
        }
        commentLines.push(commentPart);
      } else if (trimmedLineIsEmpty && commentLines.length > 0) {
        commentLines.push(ReadableContent.empty());
      }
    }

    if (commentLines.length === 0) {
      return undefined;
    }

    // Remove leading and trailing empty lines
    while (commentLines.length > 0 && commentLines[0].trim().isEmpty()) {
      commentLines.shift();
    }
    while (commentLines.length > 0 && commentLines[commentLines.length - 1].trim().isEmpty()) {
      commentLines.pop();
    }

    if (commentLines.length === 0) {
      return undefined;
    }

    // Join comment lines
    let descriptionRC = commentLines[0];
    for (let i = 1; i < commentLines.length; i++) {
      descriptionRC = descriptionRC.append('\n').append(commentLines[i]);
    }

    return descriptionRC || undefined;
  }

  private isGitLabComponent(parsed: unknown): parsed is GitLabComponent {
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'name' in parsed &&
      typeof parsed.name === 'string' &&
      'spec' in parsed &&
      typeof parsed.spec === 'object' &&
      parsed.spec !== null &&
      'inputs' in parsed.spec
    );
  }

  private isGitLabCIPipeline(parsed: unknown): parsed is GitLabCIPipeline {
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'name' in parsed &&
      typeof parsed.name === 'string'
      // GitLab CI files can have various structures, so we're more lenient here
    );
  }
}