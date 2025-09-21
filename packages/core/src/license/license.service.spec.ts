import { describe, it, expect, beforeEach, afterEach, vi, Mocked } from 'vitest';
import { LicenseService } from './license.service.js';
import { ReaderAdapterMockFactory } from '../../__tests__/reader-adapter-mock.factory.js';
import { ReaderAdapter } from '../reader/reader.adapter.js';

describe('LicenseService', () => {
  let licenseService: LicenseService;
  let mockReaderAdapter: Mocked<ReaderAdapter>;

  beforeEach(() => {
    vi.resetAllMocks();

    mockReaderAdapter = ReaderAdapterMockFactory.create();
    licenseService = new LicenseService(mockReaderAdapter);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('detectLicenseFromFile', () => {
    it('should return undefined when no license files exist', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValue(false);

      // Act
      const result = await licenseService.detectLicenseFromFile();

      // Assert
      expect(result).toBeUndefined();
      expect(mockReaderAdapter.resourceExists).toHaveBeenCalledWith('LICENSE');
      expect(mockReaderAdapter.resourceExists).toHaveBeenCalledWith('LICENSE.txt');
      expect(mockReaderAdapter.resourceExists).toHaveBeenCalledWith('LICENSE.md');
      expect(mockReaderAdapter.resourceExists).toHaveBeenCalledWith('license');
      expect(mockReaderAdapter.resourceExists).toHaveBeenCalledWith('license.txt');
      expect(mockReaderAdapter.resourceExists).toHaveBeenCalledWith('license.md');
      expect(mockReaderAdapter.resourceExists).toHaveBeenCalledWith('COPYING');
      expect(mockReaderAdapter.resourceExists).toHaveBeenCalledWith('COPYING.txt');
    });

    it('should detect MIT license from LICENSE file', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValue(true);
      mockReaderAdapter.readResource.mockImplementation((path: string) => {
        if (path === 'LICENSE') {
          return Promise.resolve(Buffer.from('MIT License\n\nCopyright (c) 2023'));
        }
        return Promise.resolve(Buffer.alloc(0));
      });

      // Act
      const result = await licenseService.detectLicenseFromFile();

      // Assert
      expect(result).toEqual({
        name: 'MIT License',
        spdxId: 'MIT',
        url: undefined,
      });
    });

    it('should detect Apache 2.0 license from LICENSE.txt file', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValue(true);
      mockReaderAdapter.readResource.mockImplementation((path: string) => {
        if (path === 'LICENSE.txt') {
          return Promise.resolve(Buffer.from('Apache License\nVersion 2.0, January 2004'));
        }
        return Promise.resolve(Buffer.alloc(0));
      });

      // Act
      const result = await licenseService.detectLicenseFromFile();

      // Assert
      expect(result).toEqual({
        name: 'Apache License 2.0',
        spdxId: 'Apache-2.0',
        url: undefined,
      });
    });

    it('should detect GPL v3 license from LICENSE.md file', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValue(true);
      mockReaderAdapter.readResource.mockImplementation((path: string) => {
        if (path === 'LICENSE.md') {
          return Promise.resolve(Buffer.from('GNU GENERAL PUBLIC LICENSE\nVersion 3, 29 June 2007'));
        }
        return Promise.resolve(Buffer.alloc(0));
      });

      // Act
      const result = await licenseService.detectLicenseFromFile();

      // Assert
      expect(result).toEqual({
        name: 'GNU General Public License v3.0',
        spdxId: 'GPL-3.0',
        url: undefined,
      });
    });

    it('should detect GPL v2 license', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValue(true);
      mockReaderAdapter.readResource.mockImplementation((path: string) => {
        if (path === 'LICENSE') {
          return Promise.resolve(Buffer.from('GNU GENERAL PUBLIC LICENSE\nVersion 2, June 1991'));
        }
        return Promise.resolve(Buffer.alloc(0));
      });

      // Act
      const result = await licenseService.detectLicenseFromFile();

      // Assert
      expect(result).toEqual({
        name: 'GNU General Public License v2.0',
        spdxId: 'GPL-2.0',
        url: undefined,
      });
    });

    it('should detect BSD 3-Clause license', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValue(true);
      mockReaderAdapter.readResource.mockImplementation((path: string) => {
        if (path === 'LICENSE') {
          return Promise.resolve(Buffer.from('BSD 3-Clause License'));
        }
        return Promise.resolve(Buffer.alloc(0));
      });

      // Act
      const result = await licenseService.detectLicenseFromFile();

      // Assert
      expect(result).toEqual({
        name: 'BSD 3-Clause "New" or "Revised" License',
        spdxId: 'BSD-3-Clause',
        url: undefined,
      });
    });

    it('should detect BSD 2-Clause license', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValue(true);
      mockReaderAdapter.readResource.mockImplementation((path: string) => {
        if (path === 'LICENSE') {
          return Promise.resolve(Buffer.from('BSD 2-Clause License'));
        }
        return Promise.resolve(Buffer.alloc(0));
      });

      // Act
      const result = await licenseService.detectLicenseFromFile();

      // Assert
      expect(result).toEqual({
        name: 'BSD 2-Clause "Simplified" License',
        spdxId: 'BSD-2-Clause',
        url: undefined,
      });
    });

    it('should detect ISC license', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValue(true);
      mockReaderAdapter.readResource.mockImplementation((path: string) => {
        if (path === 'LICENSE') {
          return Promise.resolve(Buffer.from('ISC License'));
        }
        return Promise.resolve(Buffer.alloc(0));
      });

      // Act
      const result = await licenseService.detectLicenseFromFile();

      // Assert
      expect(result).toEqual({
        name: 'ISC License',
        spdxId: 'ISC',
        url: undefined,
      });
    });

    it('should detect custom license when content does not match known patterns', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValue(true);
      mockReaderAdapter.readResource.mockImplementation((path: string) => {
        if (path === 'LICENSE') {
          return Promise.resolve(Buffer.from('Custom proprietary license'));
        }
        return Promise.resolve(Buffer.alloc(0));
      });

      // Act
      const result = await licenseService.detectLicenseFromFile();

      // Assert
      expect(result).toEqual({
        name: 'Custom License',
        spdxId: undefined,
        url: undefined,
      });
    });

    it('should throws on file read errors', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValue(true);
      mockReaderAdapter.readResource.mockRejectedValue(new Error('Unexpected read error'));

      // Act & Assert
      await expect(licenseService.detectLicenseFromFile()).rejects.toThrow('Unexpected read error');
    });

    it('should check multiple license file paths in order', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValue(true);
      mockReaderAdapter.readResource.mockImplementation((path: string) => {
        if (path === 'license.txt') {
          return Promise.resolve(Buffer.from('MIT License'));
        }
        return Promise.resolve(Buffer.alloc(0));
      });

      // Act
      const result = await licenseService.detectLicenseFromFile();

      // Assert
      expect(result).toEqual({
        name: 'MIT License',
        spdxId: 'MIT',
        url: undefined,
      });
      expect(mockReaderAdapter.readResource).toHaveBeenCalledWith('LICENSE');
      expect(mockReaderAdapter.readResource).toHaveBeenCalledWith('LICENSE.txt');
      expect(mockReaderAdapter.readResource).toHaveBeenCalledWith('LICENSE.md');
      expect(mockReaderAdapter.readResource).toHaveBeenCalledWith('license');
      expect(mockReaderAdapter.readResource).toHaveBeenCalledWith('license.txt');
    });

    it('should use first found license file', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValue(true);
      mockReaderAdapter.readResource.mockImplementation((path: string) => {
        if (path === 'LICENSE') {
          return Promise.resolve(Buffer.from('MIT License'));
        }
        if (path === 'LICENSE.txt') {
          return Promise.resolve(Buffer.from('Apache License Version 2.0'));
        }
        return Promise.resolve(Buffer.alloc(0));
      });

      // Act
      const result = await licenseService.detectLicenseFromFile();

      // Assert
      expect(result).toEqual({
        name: 'MIT License',
        spdxId: 'MIT',
        url: undefined,
      });
    });

    it('should handle case-insensitive detection', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValue(true);
      mockReaderAdapter.readResource.mockImplementation((path: string) => {
        if (path === 'LICENSE') {
          return Promise.resolve(Buffer.from('mit license'));
        }
        return Promise.resolve(Buffer.alloc(0));
      });

      // Act
      const result = await licenseService.detectLicenseFromFile();

      // Assert
      expect(result).toEqual({
        name: 'MIT License',
        spdxId: 'MIT',
        url: undefined,
      });
    });

    it('should handle license with "licence" spelling', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValue(true);
      mockReaderAdapter.readResource.mockImplementation((path: string) => {
        if (path === 'LICENSE') {
          return Promise.resolve(Buffer.from('MIT Licence'));
        }
        return Promise.resolve(Buffer.alloc(0));
      });

      // Act
      const result = await licenseService.detectLicenseFromFile();

      // Assert
      expect(result).toEqual({
        name: 'MIT License',
        spdxId: 'MIT',
        url: undefined,
      });
    });

    it('should return correct SPDX ID for known licenses', async () => {
      const testCases = [
        { content: 'MIT License', expected: 'MIT' },
        { content: 'Apache License Version 2.0', expected: 'Apache-2.0' },
        { content: 'GNU GENERAL PUBLIC LICENSE Version 3', expected: 'GPL-3.0' },
        { content: 'GNU GENERAL PUBLIC LICENSE Version 2', expected: 'GPL-2.0' },
        { content: 'BSD 3-Clause', expected: 'BSD-3-Clause' },
        { content: 'BSD 2-Clause', expected: 'BSD-2-Clause' },
        { content: 'ISC License', expected: 'ISC' },
      ];

      for (const testCase of testCases) {
        // Arrange
        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockImplementation((path: string) => {
          if (path === 'LICENSE') {
            return Promise.resolve(Buffer.from(testCase.content));
          }
          return Promise.resolve(Buffer.alloc(0));
        });

        // Act
        const result = await licenseService.detectLicenseFromFile();

        // Assert
        expect(result?.spdxId).toBe(testCase.expected);
      }
    });

    it('should return undefined SPDX ID for unknown licenses', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValue(true);
      mockReaderAdapter.readResource.mockImplementation((path: string) => {
        if (path === 'LICENSE') {
          return Promise.resolve(Buffer.from('Unknown License'));
        }
        return Promise.resolve(Buffer.alloc(0));
      });

      // Act
      const result = await licenseService.detectLicenseFromFile();

      // Assert
      expect(result?.spdxId).toBeUndefined();
    });
  });
});