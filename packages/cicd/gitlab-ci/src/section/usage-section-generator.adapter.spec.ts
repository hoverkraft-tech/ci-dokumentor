import { describe, it, expect, beforeEach, Mocked } from 'vitest';
import {
  FormatterAdapter,
  SectionIdentifier,
  MarkdownFormatterAdapter,
  RepositoryProvider,
  ReadableContent,
  VersionService,
} from '@ci-dokumentor/core';
import { RepositoryProviderMockFactory } from '@ci-dokumentor/core/tests';
import { GitLabComponentMockFactory } from '../../__tests__/gitlab-component-mock.factory.js';
import { GitLabCIPipelineMockFactory } from '../../__tests__/gitlab-pipeline-mock.factory.js';
import { initTestContainer } from '../container.js';
import { UsageSectionGenerator } from './usage-section-generator.adapter.js';

describe('UsageSectionGenerator', () => {
  let mockRepositoryProvider: Mocked<RepositoryProvider>;
  let mockVersionService: Mocked<VersionService>;
  let formatterAdapter: FormatterAdapter;
  let generator: UsageSectionGenerator;

  beforeEach(() => {
    vi.resetAllMocks();

    mockRepositoryProvider = RepositoryProviderMockFactory.create();
    mockVersionService = {
      getVersion: vi.fn().mockResolvedValue({ ref: 'v1.0.0', sha: 'abc123' })
    } as unknown as Mocked<VersionService>;

    const container = initTestContainer();
    formatterAdapter = container.get(MarkdownFormatterAdapter);

    generator = new UsageSectionGenerator(mockVersionService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getSectionIdentifier', () => {
    it('should return Usage section identifier', () => {
      // Act
      const result = generator.getSectionIdentifier();

      // Assert
      expect(result).toBe(SectionIdentifier.Usage);
    });
  });

  describe('generateSection', () => {
    describe('with GitLab Component manifest', () => {
      it('should generate component usage example', async () => {
        // Arrange
        const manifest = GitLabComponentMockFactory.create({
          usesName: 'gitlab.com/test-user/test-repo@templates/docker-build/template.yml'
        });

        // Act
        const result = await generator.generateSection({
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider,
          destination: 'docs.md'
        });

        // Assert
        expect(result).toBeInstanceOf(ReadableContent);
        const content = result.toString();
        expect(content).toEqual(`\`\`\`yaml
include:
  - component: gitlab.com/test-user/test-repo@templates/docker-build/template.yml
    with:
      # Add component inputs here
\`\`\`
`);
      });
    });

    describe('with GitLab CI Pipeline manifest', () => {
      it('should generate pipeline usage example', async () => {
        // Arrange
        const manifest = GitLabCIPipelineMockFactory.create({
          usesName: 'test-user/test-repo'
        });

        // Act
        const result = await generator.generateSection({
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider,
          destination: 'README.md'
        });

        // Assert
        expect(result).toBeInstanceOf(ReadableContent);
        const content = result.toString();
        expect(content).toEqual(`\`\`\`yaml
include:
  - project: 'test-user/test-repo'
    file: '.gitlab-ci.yml'
    ref: 'v1.0.0'
\`\`\`
`);
      });
    });
  });
});