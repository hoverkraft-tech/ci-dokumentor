import { Mocked } from "vitest";
import { LicenseService } from "../src/license/license.service.js";

type LicenseServiceDefaults = {
    detectLicenseFromFile: Awaited<ReturnType<LicenseService['detectLicenseFromFile']>>;
}

export class LicenseServiceMockFactory {
    static create(defaults: Partial<LicenseServiceDefaults> = {}): Mocked<LicenseService> {
        const mock = {
            detectLicenseFromFile: vi.fn() as Mocked<LicenseService['detectLicenseFromFile']>,
        } as Mocked<LicenseService>;

        if (defaults.detectLicenseFromFile !== undefined) {
            mock.detectLicenseFromFile.mockResolvedValue(defaults.detectLicenseFromFile);
        }

        return mock;
    }
}
