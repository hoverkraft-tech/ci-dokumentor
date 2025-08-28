export const PROGRAM_IDENTIFIER = Symbol('Program');

export interface Program {
  parent: Program | null;

  /**
   * Parse the command-line arguments
   */
  parseAsync(args?: string[], options?: unknown): Promise<this>;

  /**
   * Set the name of the program
   */
  name(name: string): this;

  /**
   * Get the name of the command
   */
  name(): string;

  /**
   * Set the description of the program
   */
  description(description: string): this;

  /**
   * Set the version of the program
   */
  version(version: string): this;

  /**
   * Add a global option to the program
   */
  addOption(option: unknown): this;

  /**
   * Add a command to the program
   */
  addCommand(command: unknown, options?: unknown | undefined): this;

  /**
   * Show help after an error occurs
   */
  showHelpAfterError(): this;

  /**
   * Show suggestions for commands after an error occurs
   */
  showSuggestionAfterError(): this;

  /**
   * Configure output for the program
   */
  configureOutput(options: {
    writeOut?: (str: string) => void;
    writeErr?: (str: string) => void;
  }): this;

  /**
   * Get the value of a specific option
   * @param key The option key
   */
  getOptionValue(key: string): string | undefined;
}
