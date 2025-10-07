import { Mocked, vi } from "vitest";
import { VersionService } from "../src/version/version.service.js";

type VersionServiceDefaults = {
    getVersion: Awaited<ReturnType<VersionService['getVersion']>>;
}

export class VersionServiceMockFactory {
    static create(defaults: Partial<VersionServiceDefaults> = {}): Mocked<VersionService> {
        const mock = {
            getVersion: vi.fn() as Mocked<VersionService['getVersion']>,
        } as Mocked<VersionService>;

        if (defaults.getVersion !== undefined) {
            mock.getVersion.mockResolvedValue(defaults.getVersion);
        }

        return mock;
    }
}
