import { FormatterAdapter } from "src/formatter/formatter.adapter.js";
import { OutputAdapter } from "../output/output.adapter.js";

export const GENERATOR_ADAPTER_IDENTIFIER = Symbol("GeneratorAdapter");

export interface GeneratorAdapter {

  /**
   * Checks if the adapter supports the given source file.
   * @param source The source file path.
   * @returns True if the adapter supports the source, false otherwise.
   */
  supportsSource(source: string): boolean;

  /**
   * Returns the documentation path for the given source file.
   * @param source The source file path.
   * @returns The documentation path.
   */
  getDocumentationPath(source: string): string;

  generateDocumentation(source: string,
    formatterAdapter: FormatterAdapter,
    outputAdapter: OutputAdapter
  ): Promise<void>;
}
