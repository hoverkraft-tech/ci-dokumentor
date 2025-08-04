import { Command as CommanderCommander } from 'commander';

export const COMMAND_IDENTIFIER = Symbol("Command");

/**
 * Command interface
 * Commands should be self-configuring and call dedicated use cases
 */
export interface Command extends CommanderCommander {
    /**
     * Configure the command with name, description, options, and action
     * This method should set up the command using Commander.js methods
     */
    configure(): this;
}
