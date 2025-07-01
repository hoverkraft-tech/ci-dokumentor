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
        return Buffer.from(
            `<!-- markdownlint-disable-next-line first-line-heading -->\n<div align="center">\n\n${input.toString()}\n\n</div>`
        );
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

    image(url: string, altText: Buffer, options?: { width?: string; align?: string }): Buffer {
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
        const normalizeCell = (cell: Buffer): string => {
            return cell.toString().replace(/\|/g, '\\|');
        };

        const splitMultilineCell = (cell: Buffer): string[] => {
            return cell.toString().split('\n');
        };

        let result = '';

        // Handle multiline content with additional rows
        const headerLines = headers.map(splitMultilineCell);
        const maxHeaderLines = Math.max(...headerLines.map(lines => lines.length));

        // First header row (main headers)
        const mainHeaderRow = `| ${headers.map(h => normalizeCell(Buffer.from(splitMultilineCell(h)[0] || ''))).join(' | ')} |`;
        const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
        result += `${mainHeaderRow}\n${separatorRow}\n`;

        // Additional header rows if multiline headers exist
        for (let lineIndex = 1; lineIndex < maxHeaderLines; lineIndex++) {
            const additionalHeaderCells = headerLines.map(lines => normalizeCell(Buffer.from(lines[lineIndex] || '')));
            result += `| ${additionalHeaderCells.join(' | ')} |\n`;
        }

        // Process data rows
        rows.forEach(row => {
            const cellLines = row.map(splitMultilineCell);
            const maxLines = Math.max(...cellLines.map(lines => lines.length));

            // First line of the row (main content)
            const mainRowCells = cellLines.map(lines => normalizeCell(Buffer.from(lines[0] || '')));
            result += `| ${mainRowCells.join(' | ')} |\n`;

            // Additional lines for multiline content
            for (let lineIndex = 1; lineIndex < maxLines; lineIndex++) {
                const additionalCells = cellLines.map(lines => normalizeCell(Buffer.from(lines[lineIndex] || '')));
                result += `| ${additionalCells.join(' | ')} |\n`;
            }
        });

        return Buffer.from(result.trimEnd());
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