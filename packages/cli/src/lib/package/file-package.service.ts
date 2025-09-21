import { injectable, inject } from 'inversify';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';
import type {
  PackageInfo,
  PackageService,
} from './package-service.js';
import { FileReaderAdapter } from '@ci-dokumentor/core';
import type { ReaderAdapter } from '@ci-dokumentor/core';

/**
 * Package service implementation that reads package.json
 */
@injectable()
export class FilePackageService implements PackageService {
  private packageInfo: PackageInfo | null = null;
  constructor(@inject(FileReaderAdapter) private readonly readerAdapter: ReaderAdapter) { }

  /**
   * Get package information from package.json
   */
  async getPackageInfo(): Promise<PackageInfo> {
    if (!this.packageInfo) {
      this.packageInfo = await this.loadPackageInfo();
    }
    return this.packageInfo;
  }

  /**
   * Load package information from package.json
   */
  private async loadPackageInfo(): Promise<PackageInfo> {
    // Navigate up to the package root
    const packageJsonPath = this.getPackageJsonPath();
    const packageJsonContent = await this.readerAdapter.readResource(packageJsonPath);
    const packageJson = JSON.parse(packageJsonContent.toString('utf8'));

    if (!packageJson.name || !packageJson.version || !packageJson.description) {
      throw new Error(
        'Invalid package.json: name, version, and description are required'
      );
    }

    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
    };
  }

  private getPackageJsonPath(): string {
    // Get the directory of the current module
    const currentDir = dirname(fileURLToPath(import.meta.url));

    let level = 1;
    while (level++ < 4) {
      const potentialPath = join(currentDir, ...Array(level).fill('..'), 'package.json');
      if (this.readerAdapter.resourceExists(potentialPath)) {
        return potentialPath;
      }
    }

    throw new Error('package.json not found in "' + currentDir + '" parent directories');
  }
}
