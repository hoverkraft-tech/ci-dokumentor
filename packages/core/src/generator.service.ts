import { GeneratorAdapter } from './generator.adapter.js';

export class GeneratorService {
  constructor(private readonly generatorAdapters: GeneratorAdapter[]) {}
  async generateDocumentation(path: string): Promise<void> {
    for (const adapter of this.generatorAdapters) {
      await adapter.generateDocumentation(path);
    }
  }
}
