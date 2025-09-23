import { basename } from 'node:path';
import { VersionService, ManifestVersion, SectionGenerationPayload, SectionOptions, ReadableContent , FormatterAdapter, SectionIdentifier, SectionGeneratorAdapter } from '@ci-dokumentor/core';
import { Document, isScalar } from 'yaml';
import { inject, injectable } from 'inversify';
import {
  GitHubAction,
  GitHubActionInput,
  GitHubActionsManifest,
  GitHubWorkflow,
  GitHubWorkflowCallInput,
  GitHubWorkflowDispatchInput,
  GitHubWorkflowSecret,
} from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';

export interface UsageSectionOptions extends SectionOptions {
  version?: string;
}

export type UsageInput = {
  name: string;
} & (GitHubActionInput | GitHubWorkflowCallInput | GitHubWorkflowSecret);

@injectable()
export class UsageSectionGenerator extends GitHubActionsSectionGeneratorAdapter implements SectionGeneratorAdapter<GitHubActionsManifest, UsageSectionOptions> {
  private version?: string;

  constructor(
    @inject(VersionService) private readonly versionService: VersionService
  ) {
    super();
  }

  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Usage;
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
  }: Partial<UsageSectionOptions>): void {
    this.version = version;
  }

  async generateSection({ formatterAdapter, manifest, repositoryProvider }: SectionGenerationPayload<GitHubActionsManifest>): Promise<ReadableContent> {
    // Resolve version information from section options or auto-detection
    const version = await this.versionService.getVersion(this.version, repositoryProvider);

    const usageExample = await this.generateUsageExample(
      formatterAdapter,
      manifest,
      version
    );

    return formatterAdapter.heading(new ReadableContent('Usage'), 2).append(
      formatterAdapter.lineBreak(),
      usageExample,
    );
  }

  private async generateUsageExample(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubActionsManifest,
    version?: ManifestVersion
  ): Promise<ReadableContent> {
    const usageContent = this.isGitHubAction(manifest)
      ? this.generateActionUsage(manifest, version)
      : this.generateWorkflowUsage(manifest, version);

    return formatterAdapter.code(
      new ReadableContent(
        usageContent.toString({
          commentString: (comment: string) =>
            comment
              .trim()
              .split('\n')
              .map((line) => {
                line = line.trim();
                if (line === '') {
                  return '#';
                }
                return `# ${line}`;
              })
              .join('\n'),
        })
      ),
      new ReadableContent('yaml')
    );
  }

  private generateActionUsage(
    manifest: GitHubAction,
    version?: ManifestVersion
  ): Document {
    const usesName = this.generateUsesSection(manifest.usesName, version);
    const withUsage = this.generateWithSection(manifest.inputs || {});

    return new Document([
      {
        uses: usesName,
        with: withUsage,
      },
    ]);
  }

  private generateWorkflowUsage(
    workflow: GitHubWorkflow,
    version?: ManifestVersion
  ): Document {
    const filteredOnAllowList = ['workflow_call', 'workflow_dispatch'];

    const filteredOn = Object.keys(workflow.on || {})
      .filter((key) => !filteredOnAllowList.includes(key))
      .reduce((acc, key) => {
        acc[key] = workflow.on[key as keyof typeof workflow.on] || {};
        return acc;
      }, {} as Record<string, unknown>);

    const onContent =
      Object.keys(filteredOn).length > 0
        ? filteredOn
        : { push: { branches: ['main'] } };

    const permissions = workflow.permissions || undefined;

    const secrets = workflow.on?.workflow_call?.secrets || {};
    const secretsUsage = this.generateWithSection(secrets);

    const inputs = workflow.on?.workflow_call?.inputs || workflow.on?.workflow_dispatch?.inputs || {};
    const withUsage = this.generateWithSection(inputs) || undefined;

    const jobName = basename(workflow.usesName);
    const usesName = this.generateUsesSection(workflow.usesName, version);

    return new Document({
      name: `${workflow.name}`,
      on: onContent,
      permissions,
      jobs: {
        [jobName]: {
          uses: usesName,
          secrets: secretsUsage,
          with: withUsage,
        },
      },
    });
  }

  /**
   * Build the uses name with version information
   */
  private generateUsesSection(usesName: string, version?: ManifestVersion): Document {
    const usesSectionDocument = new Document({});

    const { value, comment } = this.getUsesSectionData(usesName, version);

    usesSectionDocument.contents = usesSectionDocument.createNode(value);
    // createNode returns a YAML node (a scalar for strings). To add an end-of-line
    // comment we must set the node's `comment` property. Previously the code
    // checked the contents' typeof against 'string' which never matches a node.
    if (comment && isScalar(usesSectionDocument.contents)) {
      (usesSectionDocument.contents as { comment?: string }).comment = comment;
    }

    return usesSectionDocument;
  }

  private getUsesSectionData(usesName: string, version?: ManifestVersion): { value: string; comment?: string } {
    if (!version) {
      return { value: usesName };
    }

    // Prefer SHA over ref for precision, but use ref if that's all we have
    if (!version.sha) {
      if (!version.ref) {
        return { value: usesName };
      }
      return { value: `${usesName}@${version.ref}` };
    }

    return { value: `${usesName}@${version.sha}`, comment: version.ref };
  }

  private generateWithSection(
    inputs: Record<
      string,
      GitHubActionInput | GitHubWorkflowCallInput | GitHubWorkflowDispatchInput | GitHubWorkflowSecret
    >
  ): Document | undefined {
    if (!inputs || Object.keys(inputs).length === 0) {
      return undefined;
    }

    const withSectionDocument = new Document({});

    // Process inputs using the dedicated method
    const processedInputs: Record<string, unknown> = {};
    const inputComments: Array<{ key: string; comment: string }> = [];

    for (const key in inputs) {
      const input = inputs[key];
      const processed = this.generateInputUsage({ name: key, ...input });
      processedInputs[key] = processed.value;
      if (processed.comment) {
        inputComments.push({ key, comment: processed.comment });
      }
    }

    // Set the document contents
    withSectionDocument.contents =
      withSectionDocument.createNode(processedInputs);

    // Add comments to each key using the internal YAML API
    if (
      withSectionDocument.contents &&
      typeof withSectionDocument.contents === 'object' &&
      'items' in withSectionDocument.contents
    ) {
      const items = (withSectionDocument.contents as { items: { key?: { value?: string, spaceBefore?: boolean, commentBefore?: string }; }[] })
        .items;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.key || !item.key.value) {
          continue;
        }

        const inputData = inputComments.find((c) => item.key && c.key === item.key.value);
        if (!inputData) {
          continue;
        }

        item.key.spaceBefore = i > 0;

        if (inputData.comment) {
          item.key.commentBefore = inputData.comment;
        }
      }
    }

    return withSectionDocument;
  }

  private generateInputUsage(input: UsageInput): {
    value: unknown;
    comment?: string;
  } {
    let defaultValue: unknown = (
      input as GitHubActionInput | GitHubWorkflowCallInput | GitHubWorkflowDispatchInput
    ).default;
    const typeValue = (input as GitHubWorkflowCallInput | GitHubWorkflowDispatchInput).type || 'string';
    const optionsValue = (input as GitHubWorkflowDispatchInput).options;

    // Define comments for the input
    let commentBefore = ``;
    if (input.description) {
      commentBefore = input.description;
    }

    if (input.required) {
      commentBefore += `\nThis input is required.`;
    }

    if (defaultValue) {
      commentBefore += `\nDefault: \`${defaultValue}\``;
    }

    if (optionsValue && optionsValue.length > 0) {
      commentBefore += `\nOptions:\n${optionsValue
        .map((option) => `- \`${option}\``)
        .join('\n')}`;
    }

    if (!defaultValue) {
      switch (typeValue) {
        case 'number':
          defaultValue = 0;
          break;
        case 'boolean':
          defaultValue = false;
          break;
        case 'choice':
          defaultValue = optionsValue ? optionsValue[0] : '';
          break;
        case 'string':
        default:
          defaultValue = '';
      }
    } else {
      // Convert default value to appropriate type
      switch (typeValue) {
        case 'number':
          defaultValue =
            typeof defaultValue === 'string'
              ? parseInt(defaultValue, 10)
              : defaultValue;
          break;
        case 'boolean':
          defaultValue =
            typeof defaultValue === 'string'
              ? defaultValue === 'true'
              : defaultValue;
          break;
      }
    }

    return {
      value: defaultValue,
      comment: commentBefore || undefined,
    };
  }
}
