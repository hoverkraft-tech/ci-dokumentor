import { injectable } from 'inversify';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type {
  PackageInfo,
  PackageService,
} from './package-service.js';

/**
 * Package service implementation that reads package.json
 */
@injectable()
export class FilePackageService implements PackageService {
  private packageInfo: PackageInfo | null = null;

  /**
   * Get package information from package.json
   */
  getPackageInfo(): PackageInfo {
    if (!this.packageInfo) {
      this.packageInfo = this.loadPackageInfo();
    }
    return this.packageInfo;
  }

  /**
   * Load package information from package.json
   */
  private loadPackageInfo(): PackageInfo {
    // Navigate up to the package root
    const packageJsonPath = this.getPackageJsonPath();

    const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

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
      if (existsSync(potentialPath)) {
        return potentialPath;
      }
    }

    throw new Error('package.json not found in "' + currentDir + '" parent directories');
  }
}
