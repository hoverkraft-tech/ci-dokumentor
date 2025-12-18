import { describe, it, expect } from 'vitest';
import { ReadableContent } from './readable-content.js';

describe('ReadableContent', () => {
    describe('constructor', () => {
        it('creates from string', () => {
            // Arrange
            const content = new ReadableContent('hello');

            // Act
            const str = content.toString();

            // Assert
            expect(str).toEqual('hello');
        });
    });

    describe('empty', () => {
        it('returns an empty content', () => {
            // Arrange
            const empty = ReadableContent.empty();

            // Act
            const isEmpty = empty.isEmpty();

            // Assert
            expect(isEmpty).toEqual(true);
        });
    });

    describe('startsWith', () => {
        it('detects prefix using string', () => {
            // Arrange
            const content = new ReadableContent('abcdef');

            // Act
            const result = content.startsWith('abc');

            // Assert
            expect(result).toEqual(true);
        });
        it('detects prefix using ReadableContent', () => {
            // Arrange
            const content = new ReadableContent('abcdef');

            // Act
            const result = content.startsWith(new ReadableContent('ab'));

            // Assert
            expect(result).toEqual(true);
        });
    });

    describe('equals', () => {
        it('returns true for equal contents', () => {
            // Arrange
            const a = new ReadableContent('same');
            const b = new ReadableContent('same');

            // Act
            const ab = a.equals(b);

            // Assert
            expect(ab).toEqual(true);
        });

        it('returns false for different contents', () => {
            // Arrange
            const a = new ReadableContent('same');
            const c = new ReadableContent('other');

            // Act
            const ac = a.equals(c);

            // Assert
            expect(ac).toEqual(false);
        });
    });

    describe('test', () => {
        it('returns true for matching regex', () => {
            // Arrange
            const content = new ReadableContent('Line 123');

            // Act
            const ok = content.test(/\d+/);

            // Assert
            expect(ok).toEqual(true);
        });

        it('returns false for non-matching regex', () => {
            // Arrange
            const content = new ReadableContent('Line 123');

            // Act
            const no = content.test(/^xyz/);

            // Assert
            expect(no).toEqual(false);
        });
    });

    describe('match', () => {
        it('returns null for empty content', () => {
            // Arrange
            const content = ReadableContent.empty();

            // Act
            const result = content.match(/.*/);

            // Assert
            expect(result).toBeNull();
        });

        it('returns matches for non-empty content', () => {
            // Arrange
            const content = new ReadableContent('abc123');

            // Act
            const result = content.match(/([a-z]+)(\d+)/);

            // Assert
            expect(result).toEqual(expect.arrayContaining([
                'abc123',
                'abc',
                '123',

            ]));
        });
    });

    describe('execRegExp', () => {
        it('returns null for empty content', () => {
            // Arrange
            const content = ReadableContent.empty();

            // Act
            const result = content.execRegExp(/.*/);

            // Assert
            expect(result).toBeNull();
        });

        it('returns matches for non-empty content', () => {
            // Arrange
            const content = new ReadableContent('abc123');

            // Act
            const result = content.execRegExp(/([a-z]+)(\d+)/);

            // Assert
            expect(result).toEqual(expect.arrayContaining([
                'abc123',
                'abc',
                '123',

            ]));
        });
    });

    describe('search', () => {
        it('finds string occurrences', () => {
            // Arrange
            const content = new ReadableContent('ab\x00cd');

            // Act
            const idxStr = content.search('cd');

            // Assert
            expect(idxStr).toEqual(3);
        });

        it('finds ReadableContent occurrences', () => {
            // Arrange
            const content = new ReadableContent('ab\x00cd');

            // Act
            const idxRC = content.search(new ReadableContent('ab'));

            // Assert
            expect(idxRC).toEqual(0);
        });

        it('finds byte values', () => {
            // Arrange
            const content = new ReadableContent('ab\x00cd');

            // Act
            const idxByte = content.search(0x00);

            // Assert
            expect(idxByte).toEqual(2);
        });
    });

    describe('searchLast', () => {
        it('finds string occurrences', () => {
            // Arrange
            const content = new ReadableContent('ab\x00cd');

            // Act
            const idxStr = content.searchLast('cd');

            // Assert
            expect(idxStr).toEqual(3);
        });

        it('finds ReadableContent occurrences', () => {
            // Arrange
            const content = new ReadableContent('ab\x00cd');

            // Act
            const idxRC = content.searchLast(new ReadableContent('ab'));

            // Assert
            expect(idxRC).toEqual(0);
        });

        it('finds byte values', () => {
            // Arrange
            const content = new ReadableContent('ab\x00cd');

            // Act
            const idxByte = content.searchLast(0x00);

            // Assert
            expect(idxByte).toEqual(2);
        });
    });

    describe('includesAt', () => {
        it('returns true when character matches at position', () => {
            // Arrange
            const content = new ReadableContent('xyz');

            // Act
            const at0 = content.includesAt('x', 0);

            // Assert
            expect(at0).toEqual(true);
        });

        it('returns true when byte value matches at position', () => {
            // Arrange
            const content = new ReadableContent('xyz');

            // Act
            const at1 = content.includesAt(0x79, 1); // 'y' is 0x79

            // Assert
            expect(at1).toEqual(true);
        });

        it('returns false for out-of-range position', () => {
            // Arrange
            const content = new ReadableContent('xyz');

            // Act
            const out = content.includesAt('z', 5);

            // Assert
            expect(out).toEqual(false);
        });
    });

    describe('append', () => {
        it('appends strings and ReadableContent and mutates original', () => {
            // Arrange
            const a = new ReadableContent('one');

            // Act: append returns a new instance, original remains unchanged
            const b = a.append('two', new ReadableContent('three'));

            // Assert
            expect(b.toString()).toEqual('onetwothree');
            expect(a.toString()).toEqual('one');
        });
    });

    describe('replace', () => {
        it('replaces occurrences with provided string value', () => {
            // Arrange
            const src = new ReadableContent('a-b-a');

            // Act
            const out = src.replace('-', '+');

            // Assert
            expect(out.toString()).toEqual('a+b-a');
            // original should remain unchanged
            expect(src.toString()).toEqual('a-b-a');
        });

        it('replaces occurrences with provided ReadableContent value', () => {
            // Arrange
            const src = new ReadableContent('a-b-a');

            // Act
            const out = src.replace('-', new ReadableContent('+'));

            // Assert
            expect(out.toString()).toEqual('a+b-a');
            // original should remain unchanged
            expect(src.toString()).toEqual('a-b-a');
        });

        it('replaces occurrences with provided RegExp', () => {
            // Arrange
            const src = new ReadableContent('a-b-a');

            // Act
            const out = src.replace(/-/g, '+');

            // Assert
            expect(out.toString()).toEqual('a+b+a');
            // original should remain unchanged
            expect(src.toString()).toEqual('a-b-a');
        });

        it('streams and replaces for large buffers with RegExp', () => {
            // Arrange: create >64KB content containing many 'foo' occurrences
            const repeat = 70 * 1024 / 4; // ~70KB
            const parts: string[] = [];
            for (let i = 0; i < repeat; i++) {
                parts.push(`foo${i % 10} `);
            }
            const big = parts.join('');
            const content = new ReadableContent(big);

            // Act: replace /foo(\d)/ with 'bar$1'
            const replaced = content.replace(/foo(\d)/g, 'bar$1');

            // Assert: sample-check a few positions
            const out = replaced.toString();
            expect(out.length).toBeGreaterThan(big.length - 10);
            expect(out.startsWith('bar0 ')).toBeTruthy();
            expect(out.includes('bar9 ')).toBeTruthy();
        });
    });

    describe('trim', () => {
        it('trims whitespace from both ends', () => {
            // Arrange
            const src = new ReadableContent('\n  hello \r\n');

            // Act
            const trimmed = src.trim();

            // Assert
            expect(trimmed.toString()).toEqual('hello');
        });
    });

    describe('trimStart', () => {
        it('trims only the start', () => {
            // Arrange
            const src = new ReadableContent('  hi  ');

            // Act
            const t = src.trimStart();

            // Assert
            expect(t.toString()).toEqual('hi  ');
        });
    });

    describe('toUpperCase', () => {
        it('returns upper-cased content', () => {
            // Arrange
            const src = new ReadableContent('AbC');

            // Act
            const up = src.toUpperCase();

            // Assert
            expect(up.toString()).toEqual('ABC');
            // original unchanged
            expect(src.toString()).toEqual('AbC');
        });
    });

    describe('escape', () => {
        it('escapes a single character', () => {
            // Arrange
            const src = new ReadableContent('a=b');

            // Act
            const out = src.escape('=');

            // Assert
            expect(out.toString()).toEqual('a\\=b');
        });

        it('escapes multiple characters when passed an array', () => {
            // Arrange
            const src = new ReadableContent('<&>');

            // Act
            const out = src.escape(['<', '&', '>']);

            // Assert
            expect(out.toString()).toEqual('\\<\\&\\>');
        });
    });

    describe('padEnd', () => {
        it('pads content to requested width', () => {
            // Arrange
            const src = new ReadableContent('  x  ');

            // Act
            const out = src.padEnd(4, '.');

            // Assert
            expect(out.toString()).toEqual('  x  ....');
        });
    });

    describe('htmlEscape', () => {
        it('escapes &, < and > to HTML entities', () => {
            // Arrange
            const src = new ReadableContent('a & b < c > d');

            // Act
            const out = src.htmlEscape();

            // Assert
            expect(out.toString()).toEqual('a &amp; b &lt; c &gt; d');
        });
    });

    describe('slice', () => {
        it('returns a portion of the content', () => {
            // Arrange
            const src = new ReadableContent('012345');

            // Act
            const part = src.slice(2, 5);

            // Assert
            expect(part.toString()).toEqual('234');
        });

        it('returns a portion of the content containing emojis', () => {
            // Arrange
            const src = new ReadableContent('0😀2😃4😁6');

            // Act
            const part = src.slice(2, 5);

            // Assert
            expect(part.toString()).toEqual('2😃4');
        });

        it('returns empty content when start equals end', () => {
            // Arrange
            const src = new ReadableContent('hello');

            // Act
            const part = src.slice(2, 2);

            // Assert
            expect(part.isEmpty()).toEqual(true);
        });

        it('returns content from start to end when end is omitted', () => {
            // Arrange
            const src = new ReadableContent('abcdef');

            // Act
            const part = src.slice(3);

            // Assert
            expect(part.toString()).toEqual('def');
        });
    });

    describe('isMultiLine', () => {
        it('returns false for empty content', () => {
            // Arrange
            const src = ReadableContent.empty();

            // Act
            const result = src.isMultiLine();

            // Assert
            expect(result).toEqual(false);
        });

        it('returns false for single-line content', () => {
            // Arrange
            const src = new ReadableContent('hello world');

            // Act
            const result = src.isMultiLine();

            // Assert
            expect(result).toEqual(false);
        });

        it('returns true when content contains LF', () => {
            // Arrange
            const src = new ReadableContent('a\nb');

            // Act
            const result = src.isMultiLine();

            // Assert
            expect(result).toEqual(true);
        });

        it('returns true when content contains CRLF', () => {
            // Arrange
            const src = new ReadableContent('a\r\nb');

            // Act
            const result = src.isMultiLine();

            // Assert
            expect(result).toEqual(true);
        });

        it('returns false when content contains CR but no LF', () => {
            // Arrange
            const src = new ReadableContent('a\rb');

            // Act
            const result = src.isMultiLine();

            // Assert
            expect(result).toEqual(false);
        });
    });

    describe('splitLines', () => {
        it('splits LF separated lines and handles trailing newline', () => {
            // Arrange
            const src = new ReadableContent('l1\nl2\n');

            // Act
            const lines = src.splitLines();

            // Assert
            expect(lines.length).toEqual(3);
            expect(lines[0].toString()).toEqual('l1');
            expect(lines[1].toString()).toEqual('l2');
            expect(lines[2].toString()).toEqual('');
        });

        it('splits CRLF correctly', () => {
            // Arrange
            const src = new ReadableContent('a\r\nb\r\n');

            // Act
            const lines = src.splitLines();

            // Assert
            expect(lines.length).toEqual(3);
            expect(lines[0].toString()).toEqual('a');
            expect(lines[1].toString()).toEqual('b');
        });
    });
});