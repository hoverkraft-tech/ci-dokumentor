import { join, extname } from 'node:path';
import { inject, injectable } from 'inversify';
import {
  FileReaderAdapter,
  SectionIdentifier,
  SectionGeneratorAdapter,
  VersionService,
  ManifestVersion,
  SectionGenerationPayload,
  SectionOptions,
  ReadableContent
} from '@ci-dokumentor/core';
import type { FormatterAdapter, ReaderAdapter } from '@ci-dokumentor/core';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';

export type ExamplesSectionOptions = SectionOptions & {
  version?: string;
}

export enum ExampleType {
  Heading = 'heading',
  Text = 'text',
  Code = 'code',
}

type Example = {
  type: ExampleType;
  content: ReadableContent;
  language?: ReadableContent;
  level?: number;
}

/**
 * Generates examples section for GitHub Actions documentation.
 * 
 * Examples can be stored in multiple formats and locations:
 * - YAML files (.yml/.yaml): Pure code snippets containing workflow examples
 * - Markdown files (.md): Rich content with descriptions and/or code snippets
 * - Destination file: Existing examples in the documentation being generated (examples section)
 * 
 * Detection strategies:
 * 1. Examples directory: Scans `examples/` folder for YAML and Markdown files
 * 2. GitHub examples: Checks `.github/examples/` directory for examples
 * 3. Destination file: Extracts existing examples from the target documentation file
 */
@injectable()
export class ExamplesSectionGenerator extends GitHubActionsSectionGeneratorAdapter implements SectionGeneratorAdapter<GitHubActionsManifest, ExamplesSectionOptions> {
  private version?: string;

  constructor(
    @inject(VersionService) private readonly versionService: VersionService,
    @inject(FileReaderAdapter) private readonly readerAdapter: ReaderAdapter
  ) {
    super();
  }

  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Examples;
  }

  override getSectionOptions() {
    return {
      version: {
        flags: '--version <version>',
        description: 'Version identifier of the manifest (tag, branch, commit SHA, etc.)',
      },
    };
  }

  override setSectionOptions({
    version,
  }: Partial<ExamplesSectionOptions>): void {
    this.version = version;
  }

  async generateSection({ formatterAdapter, manifest, repositoryProvider, destination }: SectionGenerationPayload<GitHubActionsManifest>): Promise<ReadableContent> {
    const version = await this.versionService.getVersion(this.version, repositoryProvider);
    const repositoryInfo = await repositoryProvider.getRepositoryInfo();

    const examples = await this.findExamples(
      repositoryInfo.rootDir,
      destination,
      formatterAdapter
    );

    if (examples.length === 0) {
      return ReadableContent.empty();
    }

    let examplesContent = formatterAdapter.heading(new ReadableContent('Examples'), 2).append(
      formatterAdapter.lineBreak(),
    );

    for (const example of examples) {
      if (example.type === ExampleType.Heading) {
        examplesContent = examplesContent.append(
          formatterAdapter.heading(example.content, example.level || 3),
          formatterAdapter.lineBreak()
        );
      } else if (example.type === ExampleType.Text) {
        examplesContent = examplesContent.append(
          formatterAdapter.paragraph(example.content),
          formatterAdapter.lineBreak()
        );
      } else if (example.type === ExampleType.Code) {
        const processedCode = this.processCodeSnippet(formatterAdapter, example.content, manifest.usesName, version);
        examplesContent = examplesContent.append(
          formatterAdapter.code(processedCode, example.language ?? new ReadableContent('yaml')),
          formatterAdapter.lineBreak()
        );
      }
    }

    return examplesContent;
  }

  /**
   * Find examples from various sources
   */
  private async findExamples(rootDir: string, destination: string, formatterAdapter: FormatterAdapter): Promise<Example[]> {
    const examples: Example[] = [];

    // Strategy 1: Look for examples/ directory
    const examplesDir = join(rootDir, 'examples');
    const examplesDirExists = this.readerAdapter.containerExists(examplesDir);
    if (examplesDirExists) {
      examples.push(...await this.findExamplesFromDirectory(examplesDir, formatterAdapter));
    }

    // Strategy 2: Look for .github/examples/ directory
    const githubExamplesDir = join(rootDir, '.github', 'examples');
    const githubExamplesDirExists = this.readerAdapter.containerExists(githubExamplesDir);
    if (githubExamplesDirExists) {
      examples.push(...await this.findExamplesFromDirectory(githubExamplesDir, formatterAdapter));
    }

    // Strategy 3: Look for examples in destination file (if it exists)
    if (destination && this.readerAdapter.resourceExists(destination)) {
      examples.push(...await this.findExamplesFromDestination(destination, formatterAdapter));
    }

    return examples;
  }

  /**
   * Find examples from a directory containing example files
   */
  private async findExamplesFromDirectory(dirPath: string, formatterAdapter: FormatterAdapter): Promise<Example[]> {
    const examples: Example[] = [];

    const files = await this.readerAdapter.readContainer(dirPath);

    for (const file of files) {
      const filePath = join(dirPath, file);
      if (!this.readerAdapter.resourceExists(filePath)) {
        continue;
      }

      const ext = extname(file).toLowerCase();
      if (['.yml', '.yaml'].includes(ext)) {
        examples.push({
          type: ExampleType.Heading,
          content: new ReadableContent(file.replace(/\.(yml|yaml)$/, '')),
          level: 3
        });

        const content = await this.readerAdapter.readResource(filePath);
        examples.push({
          type: ExampleType.Code,
          content: content,
          language: new ReadableContent('yaml')
        });
      } else if (ext === '.md') {
        examples.push(...await this.parseMarkdownExamples(filePath, formatterAdapter));
      }
    }

    return examples;
  }

  /**
   * Extract examples from README.md or destination file
   */
  private async findExamplesFromDestination(destination: string, formatterAdapter: FormatterAdapter): Promise<Example[]> {
    const examples: Example[] = [];
    const content = await this.readerAdapter.readResource(destination);
    const lines = content.splitLines();

    let inExamplesSection = false;
    let inCodeBlock = false;
    let codeBlockLanguage = ReadableContent.empty();
    let codeBlockContent = ReadableContent.empty();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if we've entered an examples section
      if (line.test(/^#+\s*examples?/i)) {
        inExamplesSection = true;
        continue;
      }

      // Check if we've left the examples section (next major heading)
      if (inExamplesSection && line.test(/^#[^#]/)) {
        break;
      }

      if (inExamplesSection) {
        // Handle code blocks
        if (line.startsWith('```')) {
          if (!inCodeBlock) {
            inCodeBlock = true;
            codeBlockLanguage = line.slice(3).trim() || new ReadableContent('yaml');
            codeBlockContent = ReadableContent.empty();
          } else {
            inCodeBlock = false;
            if (codeBlockContent.trim()) {
              examples.push({
                type: ExampleType.Code,
                content: codeBlockContent.trim(),
                language: codeBlockLanguage
              });
            }
          }
        } else if (inCodeBlock) {
          codeBlockContent = codeBlockContent.append(line, formatterAdapter.lineBreak());
        } else if (line.test(/^#+/)) {
          // Sub-heading within examples section
          const level = (line.match(/^#+/) || [''])[0].length;
          const heading = line.replace(/^#+\s*/, '');
          examples.push({
            type: ExampleType.Heading,
            content: heading,
            level: level + 2 // Offset since examples is already h2
          });
        } else if (line.trim()) {
          // Regular text content
          examples.push({
            type: ExampleType.Text,
            content: line
          });
        }
      }
    }

    return examples;
  }

  /**
   * Parse markdown files for examples
   */
  private async parseMarkdownExamples(filePath: string, formatterAdapter: FormatterAdapter): Promise<Example[]> {
    const examples: Example[] = [];
    const content = await this.readerAdapter.readResource(filePath);
    const lines = content.splitLines();

    let inCodeBlock = false;
    let codeBlockLanguage = ReadableContent.empty();
    let codeBlockContent = ReadableContent.empty();

    for (const line of lines) {
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLanguage = line.slice(3).trim() || new ReadableContent('yaml');
          codeBlockContent = ReadableContent.empty();
        } else {
          inCodeBlock = false;
          if (codeBlockContent.trim()) {
            examples.push({
              type: ExampleType.Code,
              content: codeBlockContent.trim(),
              language: codeBlockLanguage
            });
          }
        }
      } else if (inCodeBlock) {
        codeBlockContent = codeBlockContent.append(line, formatterAdapter.lineBreak());
      } else if (line.test(/^#+/)) {
        const level = (line.match(/^#+/) || [''])[0].length;
        const heading = line.replace(/^#+\s*/, '');
        examples.push({
          type: ExampleType.Heading,
          content: heading,
          level: level + 2
        });
      } else if (line.trim()) {
        examples.push({
          type: ExampleType.Text,
          content: line
        });
      }
    }

    return examples;
  }

  /**
   * Process code snippets to replace or add version information for action calls
   */
  private processCodeSnippet(formatterAdapter: FormatterAdapter, code: ReadableContent, usesName: string, version?: ManifestVersion): ReadableContent {
    if (!version || !version.sha) {
      return code;
    }

    let codeSnippetContent = ReadableContent.empty();
    const lines = code.splitLines();
    lines.forEach(line => {
      // Look for uses: lines that reference the current action (both YAML list syntax and regular uses)
      const usesMatch = line.match(/^(\s*-?\s*uses:\s*)(.+)$/);
      if (usesMatch) {
        const [, prefix, actionRef] = usesMatch;

        // Check if this is referencing the current action
        if (actionRef.includes(usesName) || actionRef === './' || actionRef === '.') {
          // Replace or add version information
          const baseActionRef = actionRef.split('@')[0];
          const versionComment = version.ref ? ` # ${version.ref}` : '';
          codeSnippetContent = codeSnippetContent.append(
            `${prefix}${baseActionRef}@${version.sha}${versionComment}`,
            formatterAdapter.lineBreak()
          );
          return;
        }
      }

      codeSnippetContent = codeSnippetContent.append(line.trimTrailingLineBreaks());
    });

    return codeSnippetContent.trimTrailingLineBreaks().append(formatterAdapter.lineBreak());
  }
}