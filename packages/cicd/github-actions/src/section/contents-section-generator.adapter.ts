import { Repository } from '@ci-dokumentor/core';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';
import { FormatterAdapter, SectionIdentifier } from '@ci-dokumentor/core';

export class ContentsSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Contents;
  }

  generateSection(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubActionsManifest,
    _repository: Repository
  ): Buffer {
    const tocItems: Buffer[] = [];

    // Add standard sections based on manifest type
    if ('runs' in manifest) {
      // GitHub Action sections
      tocItems.push(Buffer.from('[Usage](#usage)'));
      if (manifest.inputs && Object.keys(manifest.inputs).length > 0) {
        tocItems.push(Buffer.from('[Inputs](#inputs)'));
      }
      if (manifest.outputs && Object.keys(manifest.outputs).length > 0) {
        tocItems.push(Buffer.from('[Outputs](#outputs)'));
      }
      tocItems.push(Buffer.from('[Examples](#examples)'));
    } else {
      // GitHub Workflow sections
      tocItems.push(Buffer.from('[Overview](#overview)'));
      tocItems.push(Buffer.from('[Jobs](#jobs)'));
      tocItems.push(Buffer.from('[Usage](#usage)'));
    }

    // Common sections
    tocItems.push(Buffer.from('[Contributing](#contributing)'));
    tocItems.push(Buffer.from('[License](#license)'));

    if (tocItems.length === 0) {
      return Buffer.from('');
    }

    return Buffer.concat([
      formatterAdapter.heading(Buffer.from('Table of Contents'), 2),
      formatterAdapter.lineBreak(),
      formatterAdapter.list(tocItems, false),
      formatterAdapter.lineBreak(),
      formatterAdapter.lineBreak(),
    ]);
  }
}
