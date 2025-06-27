export interface OutputAdapter {
    writeSection(sectionIdentifier: string, data: Buffer): Promise<void>;
}