import { AbstractGeneratedSectionGenerator, ReadableContent, SectionIdentifier, SectionGenerationPayload } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import { GitLabCIManifest } from '../gitlab-ci-parser.js';
import { GitLabCISectionGeneratorAdapter } from './gitlab-ci-section-generator.adapter.js';

const abstractHelper = new AbstractGeneratedSectionGenerator();

@injectable()
export class GeneratedSectionGenerator extends GitLabCISectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return abstractHelper.getSectionIdentifier();
  }

  async generateSection(payload: SectionGenerationPayload<GitLabCIManifest>): Promise<ReadableContent> {
    return abstractHelper.generateSection(payload);
  }
}
