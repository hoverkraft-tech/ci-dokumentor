import { inject } from "inversify";
import { LoggerService } from "../logger/logger.service.js";
import { Program } from "./program.js";

export class ProgramConfiguratorService {
    constructor(
        @inject(LoggerService) private readonly loggerService: LoggerService
    ) { }

    /**
     * Configure all commands with the necessary dependencies
     */
    configureOutput(program: Program): void {
        program.configureOutput({
            writeOut: (str: string) => {
                this.loggerService.info(str, this.getOutputFormatOption(program));
            },
            writeErr: (str: string) => {
                this.loggerService.error(str, this.getOutputFormatOption(program));
            },
        });
    }

    configureHelp(program: Program): void {
        program.showHelpAfterError();
        program.showSuggestionAfterError();
    }

    private getOutputFormatOption(program: Program): string | undefined {
        const format = program.getOptionValue('outputFormat');
        if (format !== undefined) {
            return format;
        }
        if (program.parent) {
            return this.getOutputFormatOption(program.parent);
        }
        return undefined;
    }
}
