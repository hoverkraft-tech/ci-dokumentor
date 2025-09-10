import { RepositoryInfo, VersionService, ManifestVersion, SectionGenerationPayload, SectionOptions, RepositoryProvider } from '@ci-dokumentor/core';
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
import { FormatterAdapter, SectionIdentifier, SectionGeneratorAdapter } from '@ci-dokumentor/core';
import { Document } from 'yaml';
import { basename } from 'node:path';
import { inject, injectable } from 'inversify';

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

  async generateSection({ formatterAdapter, manifest, repositoryProvider }: SectionGenerationPayload<GitHubActionsManifest>): Promise<Buffer> {

    // Resolve version information from section options or auto-detection
    const version = await this.versionService.getVersion(this.version, repositoryProvider);

    const usageExample = await this.generateUsageExample(
      formatterAdapter,
      manifest,
      repositoryProvider,
      version
    );
    return formatterAdapter.appendContent(
      formatterAdapter.heading(Buffer.from('Usage'), 2),
      formatterAdapter.lineBreak(),
      usageExample,
    );
  }

  private async generateUsageExample(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubActionsManifest,
    repositoryProvider: RepositoryProvider,
    version?: ManifestVersion
  ): Promise<Buffer> {
    // Get repository info on-demand for usage example generation
    const repositoryInfo = await repositoryProvider.getRepositoryInfo();

    const usageContent = this.isGitHubAction(manifest)
      ? this.generateActionUsage(manifest, repositoryInfo, version)
      : this.generateWorkflowUsage(manifest, repositoryInfo, version);
    return formatterAdapter.code(
      Buffer.from(
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
      Buffer.from('yaml')
    );
  }

  private generateActionUsage(
    manifest: GitHubAction,
    repositoryInfo: RepositoryInfo,
    version?: ManifestVersion
  ): Document {
    const inputs = manifest.inputs || {};
    const withUsage = this.generateInputsUsage(inputs);

    const usesName = this.buildUsesNameWithVersion(manifest.usesName, repositoryInfo, version);

    return new Document([
      {
        uses: usesName,
        with: withUsage,
      },
    ]);
  }

  private generateWorkflowUsage(
    workflow: GitHubWorkflow,
    repositoryInfo: RepositoryInfo,
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
    const secretsUsage = this.generateInputsUsage(secrets);

    const inputs = workflow.on?.workflow_call?.inputs || workflow.on?.workflow_dispatch?.inputs || {};
    const withUsage = this.generateInputsUsage(inputs) || undefined;

    const jobName = basename(workflow.usesName);
    const usesName = this.buildUsesNameWithVersion(workflow.usesName, repositoryInfo, version);

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

  private generateInputsUsage(
    inputs: Record<
      string,
      GitHubActionInput | GitHubWorkflowCallInput | GitHubWorkflowDispatchInput | GitHubWorkflowSecret
    >
  ): Document | undefined {
    if (!inputs || Object.keys(inputs).length === 0) {
      return undefined;
    }

    const inputsUsageDocument = new Document({});

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
    inputsUsageDocument.contents =
      inputsUsageDocument.createNode(processedInputs);

    // Add comments to each key using the internal YAML API
    if (
      inputsUsageDocument.contents &&
      typeof inputsUsageDocument.contents === 'object' &&
      'items' in inputsUsageDocument.contents
    ) {
      const items = (inputsUsageDocument.contents as { items: { key?: { value?: string, spaceBefore?: boolean, commentBefore?: string }; }[] })
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

    return inputsUsageDocument;
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

  /**
   * Build the uses name with version information
   */
  private buildUsesNameWithVersion(usesName: string, repositoryInfo: RepositoryInfo, version?: ManifestVersion): string {
    if (!version) {
      return usesName;
    }

    // Prefer SHA over ref for precision, but use ref if that's all we have
    const versionSuffix = version.sha || version.ref;
    if (!versionSuffix) {
      return usesName;
    }

    return `${usesName}@${versionSuffix}`;
  }
}
