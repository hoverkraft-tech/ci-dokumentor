export type OptionDescriptor = {
    flags: string; // CLI style flags, e.g. '--github-token <token>'
    description?: string;
    env?: string;
};
