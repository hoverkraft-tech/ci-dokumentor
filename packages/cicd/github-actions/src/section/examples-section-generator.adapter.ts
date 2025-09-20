import { VersionService, ManifestVersion, SectionGenerationPayload, SectionOptions } from '@ci-dokumentor/core';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';
import { SectionIdentifier, SectionGeneratorAdapter } from '@ci-dokumentor/core';
import { inject, injectable } from 'inversify';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

export interface ExamplesSectionOptions extends SectionOptions {
  version?: string;
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
    @inject(VersionService) private readonly versionService: VersionService
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

  async generateSection({ formatterAdapter, manifest, repositoryProvider, destination }: SectionGenerationPayload<GitHubActionsManifest>): Promise<Buffer> {
    const version = await this.versionService.getVersion(this.version, repositoryProvider);
    const repositoryInfo = await repositoryProvider.getRepositoryInfo();

    const examples = await this.findExamples(repositoryInfo.rootDir, destination);

    if (examples.length === 0) {
      return Buffer.alloc(0);
    }

    const examplesContent = [
      formatterAdapter.heading(Buffer.from('Examples'), 2),
      formatterAdapter.lineBreak(),
    ];

    for (const example of examples) {
      if (example.type === ExampleType.Heading) {
        examplesContent.push(
          formatterAdapter.heading(Buffer.from(example.content), example.level || 3),
          formatterAdapter.lineBreak()
        );
      } else if (example.type === ExampleType.Text) {
        examplesContent.push(
          formatterAdapter.paragraph(Buffer.from(example.content)),
          formatterAdapter.lineBreak()
        );
      } else if (example.type === ExampleType.Code) {
        const processedCode = this.processCodeSnippet(example.content, manifest.usesName, version);
        examplesContent.push(
          formatterAdapter.code(Buffer.from(processedCode), Buffer.from(example.language || 'yaml')),
          formatterAdapter.lineBreak()
        );
      }
    }

    return formatterAdapter.appendContent(...examplesContent);
  }

  /**
   * Find examples from various sources
   */
  private async findExamples(rootDir: string, destination?: string): Promise<Example[]> {
    const examples: Example[] = [];

    // Strategy 1: Look for examples/ directory
    const examplesDir = join(rootDir, 'examples');
    if (existsSync(examplesDir) && statSync(examplesDir).isDirectory()) {
      examples.push(...this.findExamplesFromDirectory(examplesDir));
    }

    // Strategy 2: Look for .github/examples/ directory
    const githubExamplesDir = join(rootDir, '.github', 'examples');
    if (existsSync(githubExamplesDir) && statSync(githubExamplesDir).isDirectory()) {
      examples.push(...this.findExamplesFromDirectory(githubExamplesDir));
    }

    // Strategy 3: Look for examples in destination file (if it exists)
    if (destination && existsSync(destination)) {
      examples.push(...this.findExamplesFromDestination(destination));
    }

    return examples;
  }

  /**
   * Find examples from a directory containing example files
   */
  private findExamplesFromDirectory(dirPath: string): Example[] {
    const examples: Example[] = [];

    try {
      const files = readdirSync(dirPath);

      for (const file of files) {
        const filePath = join(dirPath, file);
        const stat = statSync(filePath);

        if (stat.isFile()) {
          const ext = extname(file).toLowerCase();
          if (['.yml', '.yaml'].includes(ext)) {
            const content = readFileSync(filePath, 'utf8');
            examples.push({
              type: ExampleType.Heading,
              content: file.replace(/\.(yml|yaml)$/, ''),
              level: 3
            });
            examples.push({
              type: ExampleType.Code,
              content: content,
              language: 'yaml'
            });
          } else if (ext === '.md') {
            examples.push(...this.parseMarkdownExamples(filePath));
          }
        }
      }
    } catch (error) {
      // Silently handle directory read errors
    }

    return examples;
  }

  /**
   * Extract examples from README.md or destination file
   */
  private findExamplesFromDestination(destination: string): Example[] {
    const examples: Example[] = [];

    try {
      const content = readFileSync(destination, 'utf8');
      const lines = content.split('\n');

      let inExamplesSection = false;
      let inCodeBlock = false;
      let codeBlockLanguage = '';
      let codeBlockContent = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if we've entered an examples section
        if (line.match(/^#+\s*examples?/i)) {
          inExamplesSection = true;
          continue;
        }

        // Check if we've left the examples section (next major heading)
        if (inExamplesSection && line.match(/^#[^#]/)) {
          break;
        }

        if (inExamplesSection) {
          // Handle code blocks
          if (line.startsWith('```')) {
            if (!inCodeBlock) {
              inCodeBlock = true;
              codeBlockLanguage = line.slice(3).trim() || 'yaml';
              codeBlockContent = '';
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
            codeBlockContent += line + '\n';
          } else if (line.match(/^#+/)) {
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
    } catch (error) {
      // Silently handle file read errors
    }

    return examples;
  }

  /**
   * Parse markdown files for examples
   */
  private parseMarkdownExamples(filePath: string): Example[] {
    const examples: Example[] = [];

    try {
      const content = readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      let inCodeBlock = false;
      let codeBlockLanguage = '';
      let codeBlockContent = '';

      for (const line of lines) {
        if (line.startsWith('```')) {
          if (!inCodeBlock) {
            inCodeBlock = true;
            codeBlockLanguage = line.slice(3).trim() || 'yaml';
            codeBlockContent = '';
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
          codeBlockContent += line + '\n';
        } else if (line.match(/^#+/)) {
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
    } catch (error) {
      // Silently handle file read errors
    }

    return examples;
  }

  /**
   * Process code snippets to replace or add version information for action calls
   */
  private processCodeSnippet(code: string, usesName: string, version?: ManifestVersion): string {
    if (!version || !version.sha) {
      return code;
    }

    const lines = code.split('\n');
    const processedLines = lines.map(line => {
      // Look for uses: lines that reference the current action (both YAML list syntax and regular uses)
      const usesMatch = line.match(/^(\s*-?\s*uses:\s*)(.+)$/);
      if (usesMatch) {
        const [, prefix, actionRef] = usesMatch;

        // Check if this is referencing the current action
        if (actionRef.includes(usesName) || actionRef === './' || actionRef === '.') {
          // Replace or add version information
          const baseActionRef = actionRef.split('@')[0];
          const versionComment = version.ref ? ` # ${version.ref}` : '';
          return `${prefix}${baseActionRef}@${version.sha}${versionComment}`;
        }
      }

      return line;
    });

    return processedLines.join('\n');
  }
}

export enum ExampleType {
  Heading = 'heading',
  Text = 'text',
  Code = 'code',
}

interface Example {
  type: ExampleType;
  content: string;
  language?: string;
  level?: number;
}