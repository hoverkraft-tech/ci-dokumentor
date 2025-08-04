import { injectable } from 'inversify';
import { Command as CommanderCommand } from 'commander';
import type { Command } from '../interfaces/command.interface.js';

/**
 * Abstract base class for commands that creates Commander Command instances
 * Commands are self-configuring and call dedicated use cases
 */
@injectable()
export abstract class BaseCommand implements Command {

    /**
     * Create and configure a Commander command instance
     * Must be implemented by subclasses to set up their specific configuration
     */
    abstract createCommand(): CommanderCommand;
}
