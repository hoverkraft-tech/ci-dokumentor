import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mockFs from 'mock-fs';
import { FilePackageService } from './file-package.service.js';
import { join } from 'path';

describe('FilePackageService', () => {
  let filePackageService: FilePackageService;
  let packageJsonPath: string;

  beforeEach(() => {
    packageJsonPath = join(__dirname, '../../../package.json');
    filePackageService = new FilePackageService();
  });

  afterEach(() => {
    mockFs.restore();
  });

  describe('getPackageInfo', () => {
    it('should read package info from package.json at package root path', () => {
      const packageJson = {
        name: '@ci-dokumentor/cli',
        version: '1.0.0',
        description: 'CLI for generating documentation',
      };

      mockFs({
        [packageJsonPath]: JSON.stringify(packageJson, null, 2),
      });

      const packageInfo = filePackageService.getPackageInfo();

      expect(packageInfo).toEqual({
        name: '@ci-dokumentor/cli',
        version: '1.0.0',
        description: 'CLI for generating documentation',
      });
    });


    it('should cache package info after first load', () => {
      const packageJson = {
        name: '@ci-dokumentor/cli',
        version: '1.0.0',
        description: 'CLI for generating documentation',
      };

      mockFs({
        [packageJsonPath]: JSON.stringify(packageJson, null, 2),
      });

      // First call
      const packageInfo1 = filePackageService.getPackageInfo();

      // Change the file system but should return cached result
      mockFs({
        [packageJsonPath]: JSON.stringify({
          name: 'different-name',
          version: '2.0.0',
          description: 'Different description',
        }, null, 2),
      });

      // Second call should return cached result
      const packageInfo2 = filePackageService.getPackageInfo();

      expect(packageInfo1).toEqual(packageInfo2);
      expect(packageInfo2).toEqual({
        name: '@ci-dokumentor/cli',
        version: '1.0.0',
        description: 'CLI for generating documentation',
      });
    });

    it('should throw error when package.json is missing name', () => {
      const packageJson = {
        version: '1.0.0',
        description: 'CLI for generating documentation',
      };

      mockFs({
        [packageJsonPath]: JSON.stringify(packageJson, null, 2),
      });

      expect(() => filePackageService.getPackageInfo()).toThrow(
        'Invalid package.json: name, version, and description are required'
      );
    });

    it('should throw error when package.json is missing version', () => {
      const packageJson = {
        name: '@ci-dokumentor/cli',
        description: 'CLI for generating documentation',
      };

      mockFs({
        [packageJsonPath]: JSON.stringify(packageJson, null, 2),
      });

      expect(() => filePackageService.getPackageInfo()).toThrow(
        'Invalid package.json: name, version, and description are required'
      );
    });

    it('should throw error when package.json is missing description', () => {
      const packageJson = {
        name: '@ci-dokumentor/cli',
        version: '1.0.0',
      };

      mockFs({
        [packageJsonPath]: JSON.stringify(packageJson, null, 2),
      });

      expect(() => filePackageService.getPackageInfo()).toThrow(
        'Invalid package.json: name, version, and description are required'
      );
    });

    it('should throw error when package.json contains invalid JSON', () => {
      mockFs({
        [packageJsonPath]: 'invalid json content',
      });

      expect(() => filePackageService.getPackageInfo()).toThrow(`Unexpected token 'i', "invalid json content" is not valid JSON`);
    });

    it('should handle package.json with additional properties', () => {
      const packageJson = {
        name: '@ci-dokumentor/cli',
        version: '1.0.0',
        description: 'CLI for generating documentation',
        main: 'index.js',
        scripts: {
          test: 'vitest',
          build: 'tsc',
        },
        dependencies: {
          commander: '^9.0.0',
        },
      };

      mockFs({
        [packageJsonPath]: JSON.stringify(packageJson, null, 2),
      });

      const packageInfo = filePackageService.getPackageInfo();

      expect(packageInfo).toEqual({
        name: '@ci-dokumentor/cli',
        version: '1.0.0',
        description: 'CLI for generating documentation',
      });
    });

    it('should work with empty string values for required fields', () => {
      const packageJson = {
        name: '',
        version: '',
        description: '',
      };

      mockFs({
        [packageJsonPath]: JSON.stringify(packageJson, null, 2),
      });

      expect(() => filePackageService.getPackageInfo()).toThrow(
        'Invalid package.json: name, version, and description are required'
      );
    });
  });
});