import { createRequire } from "node:module";
import type { ReaderAdapter } from "@ci-dokumentor/core";
import { FileReaderAdapter } from "@ci-dokumentor/core";
import { inject, injectable } from "inversify";
import type { PackageInfo, PackageService } from "./package-service.js";

/**
 * Package service implementation that reads package.json
 */
@injectable()
export class FilePackageService implements PackageService {
  private packageInfo: PackageInfo | null = null;
  constructor(
    @inject(FileReaderAdapter) private readonly readerAdapter: ReaderAdapter,
  ) {}

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
    const packageJsonPath = createRequire(import.meta.url).resolve(
      "@ci-dokumentor/cli/package.json",
    );
    const packageJsonContent =
      await this.readerAdapter.readResource(packageJsonPath);
    const packageJson = JSON.parse(packageJsonContent.toString());

    if (!packageJson.name || !packageJson.version || !packageJson.description) {
      throw new Error(
        "Invalid package.json: name, version, and description are required",
      );
    }

    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
    };
  }
}
