import { Command } from "./command.interface.js";

export const PROGRAM_IDENTIFIER = Symbol("Program");

export interface Program {
    /**
     * Parse the command-line arguments
     */
    parseAsync(args?: string[]): Promise<this>;

    /**
     * Set the name of the program
     */
    name(name: string): this;

    /**
     * Set the description of the program
     */
    description(description: string): this;

    /**
     * Set the version of the program
     */
    version(version: string): this;

    /**
     * Add a command to the program
     */
    addCommand(command: Command): this;

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
}