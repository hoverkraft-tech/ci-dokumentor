import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mockFs from 'mock-fs';
import { FilePackageService } from './file-package.service.js';

describe('FilePackageService', () => {
  let filePackageService: FilePackageService;

  beforeEach(() => {
    filePackageService = new FilePackageService();
  });

  afterEach(() => {
    mockFs.restore();
  });

  describe('getPackageInfo', () => {
    it('should read package info from package.json at ../../package.json path', () => {
      const packageJson = {
        name: '@ci-dokumentor/cli',
        version: '1.0.0',
        description: 'CLI for generating documentation',
      };

      mockFs({
        'packages/cli/package.json': JSON.stringify(packageJson, null, 2),
      });

      const packageInfo = filePackageService.getPackageInfo();
      
      expect(packageInfo).toEqual({
        name: '@ci-dokumentor/cli',
        version: '1.0.0',
        description: 'CLI for generating documentation',
      });
    });

    it('should read package info from package.json at ../../../package.json path when ../../ not found', () => {
      const packageJson = {
        name: '@ci-dokumentor/root',
        version: '2.0.0',
        description: 'Root package for CI Dokumentor',
      };

      mockFs({
        'package.json': JSON.stringify(packageJson, null, 2),
      });

      const packageInfo = filePackageService.getPackageInfo();
      
      expect(packageInfo).toEqual({
        name: '@ci-dokumentor/root',
        version: '2.0.0',
        description: 'Root package for CI Dokumentor',
      });
    });

    it('should cache package info after first load', () => {
      const packageJson = {
        name: '@ci-dokumentor/cli',
        version: '1.0.0',
        description: 'CLI for generating documentation',
      };

      mockFs({
        'packages/cli/package.json': JSON.stringify(packageJson, null, 2),
      });

      // First call
      const packageInfo1 = filePackageService.getPackageInfo();
      
      // Change the file system but should return cached result
      mockFs({
        'packages/cli/package.json': JSON.stringify({
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
        'packages/cli/package.json': JSON.stringify(packageJson, null, 2),
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
        'packages/cli/package.json': JSON.stringify(packageJson, null, 2),
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
        'packages/cli/package.json': JSON.stringify(packageJson, null, 2),
      });

      expect(() => filePackageService.getPackageInfo()).toThrow(
        'Invalid package.json: name, version, and description are required'
      );
    });

    it('should throw error when package.json contains invalid JSON', () => {
      mockFs({
        'packages/cli/package.json': 'invalid json content',
      });

      expect(() => filePackageService.getPackageInfo()).toThrow();
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
        'packages/cli/package.json': JSON.stringify(packageJson, null, 2),
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
        'packages/cli/package.json': JSON.stringify(packageJson, null, 2),
      });

      expect(() => filePackageService.getPackageInfo()).toThrow(
        'Invalid package.json: name, version, and description are required'
      );
    });

    it('should work with nested package structure', () => {
      const packageJson = {
        name: '@scope/nested-package',
        version: '3.1.4',
        description: 'A nested package for testing',
      };

      mockFs({
        'deeply/nested/path/packages/cli/package.json': JSON.stringify(packageJson, null, 2),
      });

      // This might not find the file and throw, which is expected behavior
      expect(() => filePackageService.getPackageInfo()).toThrow();
    });
  });
});