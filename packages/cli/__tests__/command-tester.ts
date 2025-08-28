import { Command as CommanderCommand } from 'commander';
import { LoggerMockFactory } from "./logger-mock.factory.js";
import { Logger } from "../src/lib/interfaces/logger.interface.js";
import { Command } from '../src/lib/interfaces/command.interface.js';

export class CommandTester {

    private readonly program: CommanderCommand;

    private readonly logger: Logger;

    constructor(private readonly command: Command) {
        this.logger = LoggerMockFactory.create();

        this.program = new CommanderCommand();
        this.program.configureOutput({
            writeOut: (str: string) => this.logger.log(str),
            writeErr: (str: string) => this.logger.error(str),
        });

        this.command.configure();
        this.command.configureOutput({
            writeOut: (str: string) => this.logger.log(str),
            writeErr: (str: string) => this.logger.error(str),
        });
        this.program.addCommand(this.command);
    }

    test(args: string[]) {
        return this.program.parseAsync([this.command.name(), ...args], { from: 'user' });
    }

    getLogger() {
        return this.logger;
    }
}