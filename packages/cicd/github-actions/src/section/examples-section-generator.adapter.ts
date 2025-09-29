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

    const sectionTitle = formatterAdapter.heading(new ReadableContent('Examples'), 2).trim();

    const blocks: ReadableContent[] = examples.map((ex) => this.renderExampleBlock(ex, formatterAdapter, manifest, version));

    return this.assembleExamplesContent(sectionTitle, blocks, formatterAdapter, examples);
  }


  /**
   * Find examples from various sources
   */
  private async findExamples(rootDir: string, destination: string, formatterAdapter: FormatterAdapter): Promise<Example[]> {
    const dirs = [join(rootDir, 'examples'), join(rootDir, '.github', 'examples')];

    const examples: Example[] = [];

    examples.push(...await this.findExamplesInDirectories(dirs, formatterAdapter));

    if (destination && this.readerAdapter.resourceExists(destination)) {
      examples.push(...await this.findExamplesFromDestination(destination, formatterAdapter));
    }

    return examples;
  }

  /**
   * Helper to scan multiple directories and aggregate examples.
   */
  private async findExamplesInDirectories(dirs: string[], formatterAdapter: FormatterAdapter): Promise<Example[]> {
    const out: Example[] = [];

    for (const dir of dirs) {
      if (!this.readerAdapter.containerExists(dir)) continue;
      out.push(...await this.findExamplesFromDirectory(dir, formatterAdapter));
    }

    return out;
  }

  /**
   * Find examples from a directory containing example files
   */
  private async findExamplesFromDirectory(dirPath: string, formatterAdapter: FormatterAdapter): Promise<Example[]> {
    const examples: Example[] = [];
    const files = await this.readerAdapter.readContainer(dirPath);

    for (const file of files) {
      const filePath = join(dirPath, file);
      if (!this.readerAdapter.resourceExists(filePath)) continue;

      const ext = extname(file).toLowerCase();

      if (this.isYamlExt(ext)) {
        // Add a heading derived from the filename and a YAML code block
        examples.push({
          type: ExampleType.Heading,
          content: new ReadableContent(file.replace(/\.(yml|yaml)$/, '')).trim(),
          level: 3,
        });

        const content = await this.readerAdapter.readResource(filePath);
        examples.push({
          type: ExampleType.Code,
          content: content.trim(),
          language: new ReadableContent('yaml'),
        });
      } else if (this.isMarkdownExt(ext)) {
        const content = await this.readerAdapter.readResource(filePath);
        examples.push(...this.parseMarkdownContent(content, formatterAdapter, 2, false));
      }
    }

    return examples;
  }

  private isYamlExt(ext: string): boolean {
    return ['.yml', '.yaml'].includes(ext);
  }

  private isMarkdownExt(ext: string): boolean {
    return ext === '.md';
  }

  /**
   * Extract examples from README.md or destination file
   */
  private async findExamplesFromDestination(destination: string, formatterAdapter: FormatterAdapter): Promise<Example[]> {
    // Read destination and extract the region delimited by the examples section markers.
    const content = await this.readerAdapter.readResource(destination);
    const lines = content.splitLines();

    const startMarker = formatterAdapter.sectionStart(SectionIdentifier.Examples);
    const endMarker = formatterAdapter.sectionEnd(SectionIdentifier.Examples);

    let inExamplesSection = false;
    const sectionLines: ReadableContent[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!inExamplesSection) {
        if (trimmedLine.equals(startMarker)) {
          inExamplesSection = true;
        }
        continue;
      }

      if (inExamplesSection && trimmedLine.equals(endMarker)) {
        break;
      }

      // Collect raw lines (ReadableContent) from the examples section. We'll
      // parse them using the shared markdown parser which understands
      // headings, code blocks and text.
      sectionLines.push(line);
    }

    if (sectionLines.length === 0) {
      return [];
    }

    // Build a ReadableContent from the collected section lines so we can reuse
    // the same parsing routine as for markdown files. Skip the top-level
    // 'Examples' heading which is the section title.
    let sectionContent = ReadableContent.empty();
    for (const l of sectionLines) {
      sectionContent = sectionContent.append(l, formatterAdapter.lineBreak());
    }

    // Skip an inner 'Examples' heading if present at the top of the section.
    const parsed = this.parseMarkdownContent(sectionContent, formatterAdapter, 0, true);
    return parsed;
  }

  /**
   * Shared markdown parser for example content. Accepts a ReadableContent
   * instance and returns parsed Example entries. The parser understands
   * headings, text lines and fenced code blocks. A headingLevelOffset can be
   * used to bump heading levels (useful when embedding file headings inside
   * a larger section). If skipExamplesHeading is true the parser will ignore
   * a top-level 'Examples' heading inside the content.
   */
  private parseMarkdownContent(content: ReadableContent, formatterAdapter: FormatterAdapter, headingLevelOffset = 0, skipExamplesHeading = false): Example[] {
    const examples: Example[] = [];

    let inCodeBlock = false;
    let codeBlockFence = '';
    let codeBlockLanguage = ReadableContent.empty();
    let codeBlockContent = ReadableContent.empty();

    const fenceRegex = /^(`{3,})(.*)/;
    const headingRegex = /^(#+)\s*(.*)$/;
    const lines = content.splitLines();

    for (const line of lines) {
      if (skipExamplesHeading && line.test(/^#+\s*examples?\s*$/i)) continue;

      const fenceMatch = line.toString().match(fenceRegex);
      if (fenceMatch) {
        const [, fence, language] = fenceMatch;

        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockFence = fence;
          codeBlockLanguage = new ReadableContent(language.trim());
          codeBlockContent = ReadableContent.empty();
          continue;
        }

        if (fence === codeBlockFence) {
          inCodeBlock = false;
          const trimmed = codeBlockContent.trim();
          if (!trimmed.isEmpty()) {
            examples.push({ type: ExampleType.Code, content: trimmed, language: codeBlockLanguage });
          }
          codeBlockFence = '';
          continue;
        }

        // If different fence while in block, treat the line as content
        codeBlockContent = codeBlockContent.append(line, formatterAdapter.lineBreak());
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent = codeBlockContent.append(line, formatterAdapter.lineBreak());
        continue;
      }

      const headingMatch = line.toString().match(headingRegex);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const heading = headingMatch[2];
        examples.push({ type: ExampleType.Heading, content: new ReadableContent(heading.trim()), level: level + headingLevelOffset });
        continue;
      }

      const trimmedLine = line.trim();
      if (!trimmedLine.isEmpty()) {
        examples.push({ type: ExampleType.Text, content: trimmedLine });
      }
    }

    return examples;
  }

  /**
   * Render a single Example into a ReadableContent block using the formatter.
   */
  private renderExampleBlock(example: Example, formatterAdapter: FormatterAdapter, manifest: GitHubActionsManifest, version?: ManifestVersion): ReadableContent {
    if (example.type === ExampleType.Heading) {
      return formatterAdapter.heading(example.content, example.level || 3).trim();
    }

    if (example.type === ExampleType.Text) {
      return formatterAdapter.paragraph(example.content).trim();
    }

    // Code block
    const processedCode = this.processCodeSnippet(formatterAdapter, example.content, manifest.usesName, version);
    return formatterAdapter.code(processedCode, example.language).trim();
  }

  /**
   * Assemble the final Examples ReadableContent from section title and
   * individual blocks. This centralizes spacing rules and keeps the
   * generator deterministic.
   */
  private assembleExamplesContent(sectionTitle: ReadableContent, blocks: ReadableContent[], formatterAdapter: FormatterAdapter, examples: Example[]): ReadableContent {
    // Start with the section title followed by a blank line.
    let examplesContent = ReadableContent.empty().append(sectionTitle, formatterAdapter.lineBreak(), formatterAdapter.lineBreak());

    // Append blocks separated by two line breaks
    for (const [i, block] of blocks.entries()) {
      examplesContent = examplesContent.append(block);
      if (i < blocks.length - 1) examplesContent = examplesContent.append(formatterAdapter.lineBreak(), formatterAdapter.lineBreak());
    }

    // Preserve legacy trailing newline behavior for code-first examples
    const trailing = (examples.length > 0 && examples[0].type === ExampleType.Code)
      ? [formatterAdapter.lineBreak(), formatterAdapter.lineBreak()]
      : [formatterAdapter.lineBreak()];

    examplesContent = examplesContent.append(...trailing);

    return examplesContent;
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

      codeSnippetContent = codeSnippetContent.append(line, formatterAdapter.lineBreak());
    });

    return codeSnippetContent.trim();
  }
}