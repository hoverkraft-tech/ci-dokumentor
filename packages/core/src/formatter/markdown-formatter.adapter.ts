import { FormatterLanguage } from "./formatter-language.js";
import { FormatterAdapter } from "./formatter.adapter.js";

export class MarkdownFormatterAdapter implements FormatterAdapter {
    supportsLanguage(language: FormatterLanguage): boolean {
        return language === FormatterLanguage.Markdown;
    }

    heading(input: Buffer, level = 1): Buffer {
        const hashes = '#'.repeat(Math.max(1, Math.min(6, level)));
        return Buffer.from(`${hashes} ${input.toString()}`);
    }

    center(input: Buffer): Buffer {
        return Buffer.from(`<div align="center">\n\n${input.toString()}\n\n</div>`);
    }

    comment(input: Buffer): Buffer {
        return Buffer.from(`<!-- ${input.toString()} -->`);
    }

    paragraph(input: Buffer): Buffer {
        return Buffer.from(`${input.toString()}\n`);
    }

    bold(input: Buffer): Buffer {
        return Buffer.from(`**${input.toString()}**`);
    }

    italic(input: Buffer): Buffer {
        return Buffer.from(`*${input.toString()}*`);
    }

    code(input: Buffer, language?: string): Buffer {
        const lang = language || '';
        return Buffer.from(`\`\`\`${lang}\n${input.toString()}\n\`\`\``);
    }

    inlineCode(input: Buffer): Buffer {
        return Buffer.from(`\`${input.toString()}\``);
    }

    link(text: Buffer, url: string): Buffer {
        return Buffer.from(`[${text.toString()}](${url})`);
    }

    image(altText: Buffer, url: string, options?: { width?: string; align?: string }): Buffer {
        if (options?.width || options?.align) {
            // Use HTML img tag for advanced formatting
            const attributes = [];
            if (options.width) attributes.push(`width="${options.width}"`);
            if (options.align) attributes.push(`align="${options.align}"`);
            const attributeStr = attributes.length > 0 ? ` ${attributes.join(' ')}` : '';
            return Buffer.from(`<img src="${url}"${attributeStr} alt="${altText.toString()}" />`);
        }
        return Buffer.from(`![${altText.toString()}](${url})`);
    }

    list(items: Buffer[], ordered = false): Buffer {
        const prefix = ordered ? '1. ' : '- ';
        const listItems = items.map((item, index) => {
            const actualPrefix = ordered ? `${index + 1}. ` : prefix;
            return `${actualPrefix}${item.toString()}`;
        }).join('\n');
        return Buffer.from(listItems);
    }

    table(headers: Buffer[], rows: Buffer[][]): Buffer {
        const headerRow = `| ${headers.map(h => h.toString()).join(' | ')} |`;
        const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
        const dataRows = rows.map(row =>
            `| ${row.map(cell => cell.toString()).join(' | ')} |`
        ).join('\n');

        return Buffer.from(`${headerRow}\n${separatorRow}\n${dataRows}`);
    }

    badge(label: string, url: string): Buffer {
        return Buffer.from(`![${label}](${url})`);
    }

    blockquote(input: Buffer): Buffer {
        const lines = input.toString().split('\n');
        const quotedLines = lines.map(line => `> ${line}`).join('\n');
        return Buffer.from(quotedLines);
    }

    details(summary: Buffer, content: Buffer): Buffer {
        return Buffer.from(`<details>\n<summary>${summary.toString()}</summary>\n\n${content.toString()}\n\n</details>`);
    }

    lineBreak(): Buffer {
        return Buffer.from('\n');
    }

    horizontalRule(): Buffer {
        return Buffer.from('---');
    }
}