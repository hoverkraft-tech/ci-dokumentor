import { Command as CommanderCommand } from 'commander';
import { Mocked } from 'vitest';
import { Command } from '../src/lib/commands/command.js';
import { LoggerService } from '../src/lib/logger/logger.service.js';
import { ProgramConfiguratorService } from '../src/lib/application/program-configurator.service.js';
import { Program } from '../src/lib/application/program.js';
import { LoggerServiceMockFactory } from './logger-service-mock.factory.js';

export class CommandTester {

    private readonly program: Program;

    private readonly loggerService: Mocked<LoggerService>;

    constructor(private readonly command: Command) {
        this.loggerService = LoggerServiceMockFactory.create({
            getSupportedFormats: ["test"]
        });
        const programConfiguratorService = new ProgramConfiguratorService(this.loggerService);

        this.program = new CommanderCommand();
        programConfiguratorService.configureOutput(this.program);

        this.command.configure();
        programConfiguratorService.configureOutput(this.command);

        this.program.addCommand(this.command);
    }

    test(args: string[]) {
        return this.program.parseAsync([this.command.name(), ...args], { from: 'user' });
    }

    getLoggerService() {
        return this.loggerService;
    }
}