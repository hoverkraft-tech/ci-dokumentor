import { Repository } from '@ci-dokumentor/core';
import { dirname, basename } from 'path';

/**
 * Creates a mock repository for dry-run mode to avoid network calls
 */
export function createMockRepository(source: string): Repository {
  const sourceDir = dirname(source);
  const repoName = basename(sourceDir === '.' ? process.cwd() : sourceDir);
  
  return {
    owner: 'example-owner',
    name: repoName,
    url: `https://github.com/example-owner/${repoName}`,
    fullName: `example-owner/${repoName}`,
    logo: undefined,
    license: {
      name: 'MIT License',
      spdxId: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    },
    contributing: {
      url: `https://github.com/example-owner/${repoName}/blob/main/CONTRIBUTING.md`
    }
  };
}