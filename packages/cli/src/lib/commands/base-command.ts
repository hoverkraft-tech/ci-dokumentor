import { injectable } from 'inversify';
import { Command as CommanderCommand } from 'commander';
import type { Command } from '../interfaces/command.interface.js';

/**
 * Abstract base class for commands that extends Commander Command
 * Commands are self-configuring and call dedicated use cases
 */
@injectable()
export abstract class BaseCommand extends CommanderCommand implements Command {
  /**
   * Configure the command with name, description, options, and action
   * Must be implemented by subclasses to set up their specific configuration
   */
  abstract configure(): this;
}
