export interface GeneratorAdapter {
  generateDocumentation(path: string): Promise<void>;
}
