import { describe, it, expect, beforeEach, afterEach, Mocked } from 'vitest';
import { FilePackageService } from './file-package.service.js';
import { ReaderAdapterMockFactory } from '@ci-dokumentor/core/tests';
import { ReaderAdapter } from '@ci-dokumentor/core';

describe('FilePackageService', () => {
  let mockReaderAdapter: Mocked<ReaderAdapter>;

  let filePackageService: FilePackageService;

  beforeEach(() => {
    vi.resetAllMocks();

    mockReaderAdapter = ReaderAdapterMockFactory.create();

    filePackageService = new FilePackageService(mockReaderAdapter);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getPackageInfo', () => {
    it('should read package info from package.json at package root path', async () => {
      // Arrange
      const packageJson = {
        name: '@ci-dokumentor/cli',
        version: '1.0.0',
        description: 'CLI for generating documentation',
      };

      mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(JSON.stringify(packageJson, null, 2)));
      mockReaderAdapter.resourceExists.mockReturnValue(true);

      // Act
      const packageInfo = await filePackageService.getPackageInfo();

      // Assert
      expect(packageInfo).toEqual({
        name: '@ci-dokumentor/cli',
        version: '1.0.0',
        description: 'CLI for generating documentation',
      });
    });


    it('should cache package info after first load', async () => {
      // Arrange
      const packageJson = {
        name: '@ci-dokumentor/cli',
        version: '1.0.0',
        description: 'CLI for generating documentation',
      };

      mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(JSON.stringify(packageJson, null, 2)));
      mockReaderAdapter.resourceExists.mockReturnValue(true);

      // Act
      // First call
      const packageInfo1 = await filePackageService.getPackageInfo();

      // Change the file system but should return cached result
      // Simulate file changed on disk but service should return cached value
      mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(JSON.stringify({
        name: 'different-name',
        version: '2.0.0',
        description: 'Different description',
      }, null, 2)));
      mockReaderAdapter.resourceExists.mockReturnValue(true);

      // Second call should return cached result
      const packageInfo2 = await filePackageService.getPackageInfo();

      // Assert
      expect(packageInfo1).toEqual(packageInfo2);
      expect(packageInfo2).toEqual({
        name: '@ci-dokumentor/cli',
        version: '1.0.0',
        description: 'CLI for generating documentation',
      });
    });

    it('should throw error when package.json is missing name', async () => {
      // Arrange
      const packageJson = {
        version: '1.0.0',
        description: 'CLI for generating documentation',
      };

      mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(JSON.stringify(packageJson, null, 2)));
      mockReaderAdapter.resourceExists.mockReturnValue(true);

      // Act & Assert
      await expect(filePackageService.getPackageInfo()).rejects.toThrow(
        'Invalid package.json: name, version, and description are required'
      );
    });

    it('should throw error when package.json is missing version', async () => {
      // Arrange
      const packageJson = {
        name: '@ci-dokumentor/cli',
        description: 'CLI for generating documentation',
      };

      mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(JSON.stringify(packageJson, null, 2)));
      mockReaderAdapter.resourceExists.mockReturnValue(true);

      // Act & Assert
      await expect(filePackageService.getPackageInfo()).rejects.toThrow(
        'Invalid package.json: name, version, and description are required'
      );
    });

    it('should throw error when package.json is missing description', async () => {
      // Arrange
      const packageJson = {
        name: '@ci-dokumentor/cli',
        version: '1.0.0',
      };

      mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(JSON.stringify(packageJson, null, 2)));
      mockReaderAdapter.resourceExists.mockReturnValue(true);

      // Act & Assert
      await expect(filePackageService.getPackageInfo()).rejects.toThrow(
        'Invalid package.json: name, version, and description are required'
      );
    });

    it('should throw error when package.json contains invalid JSON', async () => {
      // Arrange
      mockReaderAdapter.readResource.mockResolvedValue(Buffer.from('invalid json content'));
      mockReaderAdapter.resourceExists.mockReturnValue(true);

      // Act & Assert
      await expect(filePackageService.getPackageInfo()).rejects.toThrow(`Unexpected token 'i', "invalid json content" is not valid JSON`);
    });

    it('should handle package.json with additional properties', async () => {
      // Arrange
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

      mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(JSON.stringify(packageJson, null, 2)));
      mockReaderAdapter.resourceExists.mockReturnValue(true);

      // Act
      const packageInfo = await filePackageService.getPackageInfo();

      // Assert
      expect(packageInfo).toEqual({
        name: '@ci-dokumentor/cli',
        version: '1.0.0',
        description: 'CLI for generating documentation',
      });
    });

    it('should work with empty string values for required fields', async () => {
      // Arrange
      const packageJson = {
        name: '',
        version: '',
        description: '',
      };

      mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(JSON.stringify(packageJson, null, 2)));
      mockReaderAdapter.resourceExists.mockReturnValue(true);

      // Act & Assert
      await expect(filePackageService.getPackageInfo()).rejects.toThrow(
        'Invalid package.json: name, version, and description are required'
      );
    });
  });
});