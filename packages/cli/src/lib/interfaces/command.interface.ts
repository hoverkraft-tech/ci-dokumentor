import { Command as CommanderCommand } from 'commander';

export const COMMAND_IDENTIFIER = Symbol("Command");

/**
 * Command interface
 * Commands should be self-configuring and return a configured Commander command
 */
export interface Command {
    /**
     * Create and configure a Commander command
     * This method should set up the command using Commander.js methods
     */
    createCommand(): CommanderCommand;
}
