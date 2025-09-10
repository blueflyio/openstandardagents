import { Command } from 'commander';
export interface GenerateOptions {
    lang?: string;
    framework?: string;
    output?: string;
    spec?: string;
    template?: string;
    additionalProperties?: string;
    format?: string;
}
export declare const generateCommand: Command;
