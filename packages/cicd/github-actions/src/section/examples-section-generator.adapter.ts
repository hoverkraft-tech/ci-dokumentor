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

  async generateSection({ formatterAdapter, manifest, repositoryProvider }: SectionGenerationPayload<GitHubActionsManifest>): Promise<Buffer> {
    const version = await this.versionService.getVersion(this.version, repositoryProvider);
    const repositoryInfo = await repositoryProvider.getRepositoryInfo();
    
    const examples = await this.findExamples(repositoryInfo.rootDir, manifest, version);
    
    if (examples.length === 0) {
      return Buffer.alloc(0);
    }

    const examplesContent = [
      formatterAdapter.heading(Buffer.from('Examples'), 2),
      formatterAdapter.lineBreak(),
    ];

    for (const example of examples) {
      if (example.type === 'heading') {
        examplesContent.push(
          formatterAdapter.heading(Buffer.from(example.content), example.level || 3),
          formatterAdapter.lineBreak()
        );
      } else if (example.type === 'text') {
        examplesContent.push(
          formatterAdapter.paragraph(Buffer.from(example.content)),
          formatterAdapter.lineBreak()
        );
      } else if (example.type === 'code') {
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
  private async findExamples(rootDir: string, manifest: GitHubActionsManifest, version?: ManifestVersion): Promise<Example[]> {
    const examples: Example[] = [];
    
    // Strategy 1: Look for examples/ directory
    const examplesDir = join(rootDir, 'examples');
    if (existsSync(examplesDir) && statSync(examplesDir).isDirectory()) {
      examples.push(...this.findExamplesFromDirectory(examplesDir, manifest, version));
    }

    // Strategy 2: Look for .github/examples/ directory
    const githubExamplesDir = join(rootDir, '.github', 'examples');
    if (existsSync(githubExamplesDir) && statSync(githubExamplesDir).isDirectory()) {
      examples.push(...this.findExamplesFromDirectory(githubExamplesDir, manifest, version));
    }

    // Strategy 3: Look for example workflows in .github/workflows/
    const workflowsDir = join(rootDir, '.github', 'workflows');
    if (existsSync(workflowsDir) && statSync(workflowsDir).isDirectory()) {
      examples.push(...this.findExampleWorkflows(workflowsDir, manifest, version));
    }

    // Strategy 4: Look for examples in README.md
    const readmePath = join(rootDir, 'README.md');
    if (existsSync(readmePath)) {
      examples.push(...this.findExamplesFromReadme(readmePath, manifest, version));
    }

    return examples;
  }

  /**
   * Find examples from a directory containing example files
   */
  private findExamplesFromDirectory(dirPath: string, manifest: GitHubActionsManifest, version?: ManifestVersion): Example[] {
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
              type: 'heading',
              content: file.replace(/\.(yml|yaml)$/, ''),
              level: 3
            });
            examples.push({
              type: 'code',
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
   * Find example workflows that use the current action
   */
  private findExampleWorkflows(workflowsDir: string, manifest: GitHubActionsManifest, version?: ManifestVersion): Example[] {
    const examples: Example[] = [];
    
    try {
      const files = readdirSync(workflowsDir);
      
      for (const file of files) {
        if (!['.yml', '.yaml'].includes(extname(file).toLowerCase())) {
          continue;
        }
        
        const filePath = join(workflowsDir, file);
        const content = readFileSync(filePath, 'utf8');
        
        // Check if this workflow uses the current action
        if (content.includes(manifest.usesName) || content.includes('uses: ./')) {
          examples.push({
            type: 'heading',
            content: `Example: ${file.replace(/\.(yml|yaml)$/, '')}`,
            level: 3
          });
          examples.push({
            type: 'code',
            content: content,
            language: 'yaml'
          });
        }
      }
    } catch (error) {
      // Silently handle directory read errors
    }
    
    return examples;
  }

  /**
   * Extract examples from README.md
   */
  private findExamplesFromReadme(readmePath: string, manifest: GitHubActionsManifest, version?: ManifestVersion): Example[] {
    const examples: Example[] = [];
    
    try {
      const content = readFileSync(readmePath, 'utf8');
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
                  type: 'code',
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
              type: 'heading',
              content: heading,
              level: level + 2 // Offset since examples is already h2
            });
          } else if (line.trim()) {
            // Regular text content
            examples.push({
              type: 'text',
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
                type: 'code',
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
            type: 'heading',
            content: heading,
            level: level + 2
          });
        } else if (line.trim()) {
          examples.push({
            type: 'text',
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

interface Example {
  type: 'heading' | 'text' | 'code';
  content: string;
  language?: string;
  level?: number;
}