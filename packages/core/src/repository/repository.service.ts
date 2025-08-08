
import { injectable, multiInject, optional } from 'inversify';
import { RepositoryProvider, REPOSITORY_PROVIDER_IDENTIFIER } from './repository.provider.js';

export type Repository = {
    owner: string;
    name: string;
    url: string; // The URL of the repository, without the .git suffix
    fullName: string; // owner/name format
    logo?: string; // Optional logo URI
    license?: {
        name: string;
        spdxId: string | null;
        url: string | null;
    }; // Optional license information
}

@injectable()
export class RepositoryService {
    constructor(
        @multiInject(REPOSITORY_PROVIDER_IDENTIFIER) @optional() private providers: RepositoryProvider[] = []
    ) {}

    /**
     * Get list of supported repository platforms based on registered providers
     */
    getSupportedRepositoryPlatforms(): string[] {
        return this.providers.map(provider => provider.getPlatformName());
    }

    /**
     * Auto-detect repository platform for the current context
     */
    async autoDetectRepositoryPlatform(): Promise<string | null> {
        const detectedProvider = await this.autoDetectProvider();
        return detectedProvider ? detectedProvider.getPlatformName() : null;
    }

    async getRepository(): Promise<Repository> {
        // Try to auto-detect using providers first
        const detectedProvider = await this.autoDetectProvider();
        if (detectedProvider) {
            return await detectedProvider.getRepository();
        }

        // If no provider supports the current context, throw an error
        throw new Error('No repository provider found that supports the current context');
    }

    /**
     * Auto-detect the appropriate repository provider for the current context
     */
    private async autoDetectProvider(): Promise<RepositoryProvider | null> {
        for (const provider of this.providers) {
            if (await provider.supports()) {
                return provider;
            }
        }
        return null;
    }
}