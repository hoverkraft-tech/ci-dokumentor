import { describe, it, expect, beforeEach } from 'vitest';
import { OutputService } from './output.service.js';
import { OutputAdapter } from './output.adapter.js';

class MockOutputAdapter implements OutputAdapter {
  public sectionsWritten: Array<{ identifier: string; data: Buffer }> = [];

  async writeSection(sectionIdentifier: string, data: Buffer): Promise<void> {
    this.sectionsWritten.push({ identifier: sectionIdentifier, data });
  }

  getSectionsWritten() {
    return this.sectionsWritten;
  }

  clear() {
    this.sectionsWritten = [];
  }
}

describe('OutputService', () => {
  let outputService: OutputService;
  let mockAdapter1: MockOutputAdapter;
  let mockAdapter2: MockOutputAdapter;

  beforeEach(() => {
    outputService = new OutputService();
    mockAdapter1 = new MockOutputAdapter();
    mockAdapter2 = new MockOutputAdapter();
  });

  describe('registerAdapter', () => {
    it('should register an output adapter', () => {
      // Act
      outputService.registerAdapter('test-adapter', mockAdapter1);

      // Assert
      expect(outputService.getAdapterIdentifiers()).toEqual(['test-adapter']);
    });

    it('should register multiple adapters', () => {
      // Act
      outputService.registerAdapter('adapter1', mockAdapter1);
      outputService.registerAdapter('adapter2', mockAdapter2);

      // Assert
      expect(outputService.getAdapterIdentifiers()).toContain('adapter1');
      expect(outputService.getAdapterIdentifiers()).toContain('adapter2');
      expect(outputService.getAdapterIdentifiers()).toHaveLength(2);
    });

    it('should replace adapter with same identifier', () => {
      // Arrange
      outputService.registerAdapter('test-adapter', mockAdapter1);

      // Act
      outputService.registerAdapter('test-adapter', mockAdapter2);

      // Assert
      expect(outputService.getAdapterIdentifiers()).toEqual(['test-adapter']);
    });
  });

  describe('writeSection', () => {
    it('should write to single registered adapter', async () => {
      // Arrange
      outputService.registerAdapter('test-adapter', mockAdapter1);
      const sectionId = 'test-section';
      const data = Buffer.from('test data');

      // Act
      await outputService.writeSection(sectionId, data);

      // Assert
      expect(mockAdapter1.getSectionsWritten()).toHaveLength(1);
      expect(mockAdapter1.getSectionsWritten()[0]).toEqual({
        identifier: sectionId,
        data: data,
      });
    });

    it('should write to multiple registered adapters', async () => {
      // Arrange
      outputService.registerAdapter('adapter1', mockAdapter1);
      outputService.registerAdapter('adapter2', mockAdapter2);
      const sectionId = 'test-section';
      const data = Buffer.from('test data');

      // Act
      await outputService.writeSection(sectionId, data);

      // Assert
      expect(mockAdapter1.getSectionsWritten()).toHaveLength(1);
      expect(mockAdapter2.getSectionsWritten()).toHaveLength(1);
      
      expect(mockAdapter1.getSectionsWritten()[0]).toEqual({
        identifier: sectionId,
        data: data,
      });
      expect(mockAdapter2.getSectionsWritten()[0]).toEqual({
        identifier: sectionId,
        data: data,
      });
    });

    it('should handle empty data', async () => {
      // Arrange
      outputService.registerAdapter('test-adapter', mockAdapter1);
      const sectionId = 'empty-section';
      const data = Buffer.alloc(0);

      // Act
      await outputService.writeSection(sectionId, data);

      // Assert
      expect(mockAdapter1.getSectionsWritten()).toHaveLength(1);
      expect(mockAdapter1.getSectionsWritten()[0].data).toEqual(data);
    });

    it('should handle no registered adapters', async () => {
      // Arrange
      const sectionId = 'test-section';
      const data = Buffer.from('test data');

      // Act & Assert - should not throw
      await expect(outputService.writeSection(sectionId, data)).resolves.toBeUndefined();
    });
  });

  describe('clearAdapters', () => {
    it('should remove all registered adapters', () => {
      // Arrange
      outputService.registerAdapter('adapter1', mockAdapter1);
      outputService.registerAdapter('adapter2', mockAdapter2);

      // Act
      outputService.clearAdapters();

      // Assert
      expect(outputService.getAdapterIdentifiers()).toHaveLength(0);
    });
  });

  describe('getAdapterIdentifiers', () => {
    it('should return empty array when no adapters registered', () => {
      // Assert
      expect(outputService.getAdapterIdentifiers()).toEqual([]);
    });

    it('should return identifiers of registered adapters', () => {
      // Arrange
      outputService.registerAdapter('adapter1', mockAdapter1);
      outputService.registerAdapter('adapter2', mockAdapter2);

      // Act
      const identifiers = outputService.getAdapterIdentifiers();

      // Assert
      expect(identifiers).toContain('adapter1');
      expect(identifiers).toContain('adapter2');
      expect(identifiers).toHaveLength(2);
    });
  });
});