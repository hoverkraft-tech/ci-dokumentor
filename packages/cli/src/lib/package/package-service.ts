export const PACKAGE_SERVICE_IDENTIFIER = Symbol('PackageService');

export type PackageInfo = {
  name: string;
  version: string;
  description: string;
};

/**
 * Package service interface for retrieving package information
 */
export interface PackageService {
  /**
   * Get package information
   */
  getPackageInfo(): Promise<PackageInfo>;
}
