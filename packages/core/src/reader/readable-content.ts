/**
 * ReadableContent class - a wrapper around Buffer that provides a clean API
 * for content manipulation without exposing Buffer-specific operations.
 */
export class ReadableContent {
  static readonly SPACE_CHAR_CODE = 0x20; // ' '
  static readonly TAB_CHAR_CODE = 0x09; // '\t'
  static readonly NEW_LINE_CHAR_CODE = 0x0A; // '\n'
  static readonly CARRIAGE_RETURN_CHAR_CODE = 0x0D; // '\r'

  // Maximum buffer size (in bytes) allowed for running user-provided RegExp
  // operations. This prevents potential catastrophic backtracking when a
  // (possibly user-controlled) regular expression is run against very large
  // inputs. The value is conservative; adjust if you have a measured need.
  private static readonly REGEX_SAFE_MAX_BYTES = 24 * 1024; // 24 KB

  private buffer: Buffer;

  /**
   * Create a new ReadableContent instance.
   * @param content - String content, Buffer, or another ReadableContent instance
   */
  constructor(content: string | Buffer | ReadableContent) {
    if (typeof content === 'string') {
      this.buffer = Buffer.from(content);
    } else if (content instanceof ReadableContent) {
      this.buffer = content.buffer;
    } else if (Buffer.isBuffer(content)) {
      this.buffer = content;
    } else {
      throw new Error('Invalid content type; must be string, Buffer, or ReadableContent, got ' + typeof content);
    }
  }

  /**
   * Create an empty ReadableContent instance.
   */
  static empty(): ReadableContent {
    return new ReadableContent(Buffer.alloc(0));
  }

  /**
   * Check if the content is empty.
   */
  isEmpty(): boolean {
    return this.buffer.length === 0;
  }

  /**
   * Get the size of the content in bytes.
   */
  getSize(): number {
    return this.buffer.length;
  }

  /**
   * FIXME: This method is inefficient and should be avoided in performance-critical paths.
   * @deprecated Use `toStream()` instead.
   * Convert the content to a UTF-8 string.
   */
  toString() {
    return this.buffer.toString('utf-8');
  }

  /**
 * Check if content starts with the specified value.
 */
  startsWith(searchValue: string | ReadableContent, position = 0): boolean {
    const searchBuffer = searchValue instanceof ReadableContent
      ? searchValue.buffer
      : Buffer.from(searchValue);

    if (searchBuffer.length > this.buffer.length) {
      return false;
    }

    // Ensure the end index is position + searchBuffer.length (end exclusive)
    return this.buffer.subarray(position, position + searchBuffer.length).equals(searchBuffer);
  }

  equals(other: string | ReadableContent): boolean {
    const otherBuffer = other instanceof ReadableContent
      ? other.buffer
      : Buffer.from(other);

    if (this.buffer.length !== otherBuffer.length) {
      return false;
    }

    return this.buffer.equals(otherBuffer);
  }

  /**
   * Test if content matches a regular expression.
   * @param regex - Regular expression to test
   * @returns True if the regex matches the content
   */
  test(regex: RegExp): boolean {
    if (this.isEmpty()) {
      return false;
    }
    // FIXME: This method is inefficient due to string conversion - avoid in performance-critical paths
    return regex.test(this.toString());
  }

  /**
   * Match content against a regular expression.
   * @param regex - Regular expression to match
   * @returns Match results or null if no match
   */
  match(regex: RegExp): RegExpMatchArray | null {
    if (this.isEmpty()) {
      return null;
    }
    // FIXME: This method is inefficient due to string conversion - avoid in performance-critical paths
    return this.toString().match(regex);
  }

  /**
   * Execute a regular expression against the content.
   * @param regex - Regular expression to execute
   * @returns Execution result or null if no match
   */
  execRegExp(regex: RegExp): RegExpExecArray | null {
    if (this.isEmpty()) {
      return null;
    }

    // FIXME: This method is inefficient due to string conversion - avoid in performance-critical paths
    const content = this.toString();

    // Avoid running regex on very large inputs.
    if (content.length > ReadableContent.REGEX_SAFE_MAX_BYTES) {
      throw new Error(`execRegExp called on content larger than ${ReadableContent.REGEX_SAFE_MAX_BYTES} bytes; operation aborted to avoid performance issues.`);
    }
    return regex.exec(content);
  }

  /**
   * Replace occurrences of a value with another value.
   * @param searchValue - Value to search for (string, ReadableContent, or RegExp)
   * @param replaceValue - Value to replace with (string or ReadableContent)
   * @return New ReadableContent instance with replacements made
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  replace(searchValue: string | ReadableContent | RegExp, replaceValue: string | ReadableContent | ((substring: string, ...args: any[]) => string)): ReadableContent {
    if (this.isEmpty()) {
      return this;
    }

    const search = searchValue instanceof ReadableContent ? searchValue.toString() : searchValue;

    if (typeof replaceValue === 'function') {
      return new ReadableContent(this.toString().replace(search, replaceValue));
    }

    return new ReadableContent(this.toString().replace(
      search,
      replaceValue instanceof ReadableContent ? replaceValue.toString() : replaceValue
    ));
  }

  /**
   * Find the position of the first occurrence of a value.
   */
  search(searchValue: string | ReadableContent | number, offset = 0): number {
    if (typeof searchValue === 'number') {
      return this.buffer.indexOf(searchValue, offset);
    }
    const searchBuffer = searchValue instanceof ReadableContent
      ? searchValue.buffer
      : Buffer.from(searchValue);

    return this.buffer.indexOf(searchBuffer, offset);
  }

  searchLast(searchValue: string | ReadableContent | number, offset?: number): number {
    if (typeof searchValue === 'number') {
      return this.buffer.lastIndexOf(searchValue, offset);
    }
    const searchBuffer = searchValue instanceof ReadableContent
      ? searchValue.buffer
      : Buffer.from(searchValue);

    return this.buffer.lastIndexOf(searchBuffer, offset);
  }

  /**
   * Check if content includes the specified value.
   */
  includes(searchValue: string | ReadableContent): boolean {
    return this.search(searchValue) !== -1;
  }

  includesAt(searchValue: number | string, position: number): boolean {
    if (position < 0 || position >= this.buffer.length) {
      return false;
    }

    if (typeof searchValue === 'number') {
      if (!Number.isInteger(searchValue) || searchValue < 0 || searchValue > 0xFF) {
        return false;
      }
      return this.buffer[position] === searchValue;
    }

    if (searchValue.length === 0) {
      return false;
    }

    const byte = Buffer.from(searchValue)[0];
    return this.buffer[position] === byte;
  }

  /**
   * Check whether the byte at `position` equals the provided search character.
   * - `position` is zero-based.
   * - `searchValue` can be a number (byte value 0-255) or a string; for strings the
   *   comparison is performed against the first byte of Buffer.from(char).
   */

  /**
   * Append content to this ReadableContent instance.
   * Accepts strings, Buffers, or other ReadableContent instances.
   * 
   * @param contents - Content to append
   * @returns This instance for chaining
   */
  append(...contents: (string | ReadableContent)[]): ReadableContent {
    if (!contents || contents.length === 0) {
      return new ReadableContent(this.buffer);
    }

    // Convert all inputs to buffers and calculate total length
    const buffers: Buffer[] = [this.buffer];
    let total = this.buffer.length;

    for (const content of contents) {
      let buffer: Buffer;
      if (typeof content === 'string') {
        buffer = Buffer.from(content);
      } else if (content instanceof ReadableContent) {
        buffer = content.buffer;
      } else if (Buffer.isBuffer(content)) {
        buffer = content;
      } else {
        throw new Error('Invalid content type for append; must be string, Buffer, or ReadableContent');
      }

      buffers.push(buffer);
      total += buffer.length;
    }

    if (buffers.length === 1) {
      return new ReadableContent(this.buffer);
    }

    // Single allocation concatenation
    const out = Buffer.allocUnsafe(total);
    let offset = 0;

    for (const buffer of buffers) {
      if (buffer.length === 0) {
        continue;
      }
      buffer.copy(out, offset);
      offset += buffer.length;
    }

    return new ReadableContent(out);
  }

  /**
   * Trim whitespace from the beginning and end of the content.
   * Whitespace characters considered: space, tab, newline, carriage return.
   * @return New ReadableContent instance with trimmed content
   */
  trim(): ReadableContent {
    if (this.isEmpty()) {
      return this;
    }

    let start = 0;
    let end = this.buffer.length - 1;
    while (start <= end && this.isWhitespace(this.buffer[start])) {
      start++;
    }

    while (end >= start && this.isWhitespace(this.buffer[end])) {
      end--;
    }

    if (end < start) {
      return ReadableContent.empty();
    }

    // Buffer.subarray end parameter is exclusive, so use end + 1 to include
    // the last non-whitespace byte.
    return new ReadableContent(this.buffer.subarray(start, end + 1));
  }

  trimStart(): ReadableContent {
    if (this.isEmpty()) {
      return this;
    }

    let start = 0;


    while (start < this.buffer.length && this.isWhitespace(this.buffer[start])) {
      start++;
    }

    if (start >= this.buffer.length) {
      return ReadableContent.empty();
    }

    return new ReadableContent(this.buffer.subarray(start));
  }

  private isWhitespace(byte: number): boolean {
    return byte === ReadableContent.SPACE_CHAR_CODE // space
      || byte === ReadableContent.TAB_CHAR_CODE // tab
      || byte === ReadableContent.NEW_LINE_CHAR_CODE // line feed
      || byte === ReadableContent.CARRIAGE_RETURN_CHAR_CODE; // carriage return
  }

  toUpperCase(): ReadableContent {
    if (this.isEmpty()) {
      return this;
    }
    const upperStr = this.toString().toUpperCase();
    return new ReadableContent(upperStr);
  }

  /**
   * Escape special characters in the content by prefixing them with an escape character.
   * @param search - Characters to escape (string or array of strings)
   * @param escapeChar - Character to use for escaping (default: backslash)
   * @return New ReadableContent instance with escaped content
   */
  escape(search: string | string[], escapeChar = '\\'): ReadableContent {
    if (this.isEmpty()) {
      return ReadableContent.empty();
    }
    if (!search || search.length === 0) {
      return this;
    }

    if (Array.isArray(search)) {
      let result: ReadableContent = new ReadableContent(this);
      for (const s of search) {
        result = result.escape(s, escapeChar);
      }
      return result;
    }

    const searchBuf = Buffer.from(search);
    // Build replacement buffer: prefix each character with backslash
    const replaceStr = search.split('').map((c) => escapeChar + c).join('');
    const replaceBuf = Buffer.from(replaceStr);

    let result = ReadableContent.empty();

    let idx = 0;

    let found = this.buffer.indexOf(searchBuf, idx);
    while (found !== -1) {
      if (found > idx) {
        result = result.append(new ReadableContent(this.buffer.subarray(idx, found)));
      }
      result = result.append(new ReadableContent(replaceBuf));
      idx = found + searchBuf.length;
      found = this.buffer.indexOf(searchBuf, idx);
    }
    if (idx < this.buffer.length) {
      result = result.append(new ReadableContent(this.buffer.subarray(idx)));
    }

    return result;
  }

  padEnd(width: number, char: string): ReadableContent {
    if (width <= 0) {
      return new ReadableContent(this);
    }
    return new ReadableContent(this).append(char.repeat(width));
  }

  htmlEscape(): ReadableContent {
    let result = ReadableContent.empty();
    if (this.isEmpty()) {
      return result;
    }

    let last = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      const part = this.buffer[i];
      if (part === 0x26 || part === 0x3C || part === 0x3E) {
        if (i > last) {
          result = result.append(this.slice(last, i));
        }
        if (part === 0x26) {
          result = result.append('&amp;');
        } else if (part === 0x3C) {
          result = result.append('&lt;');
        } else {
          result = result.append('&gt;');
        }
        last = i + 1;
      }
    }

    if (last < this.buffer.length) {
      result = result.append(this.slice(last));
    }

    return result;
  }

  /**
   * Get a portion of the content.
   */
  slice(start?: number, end?: number): ReadableContent {
    if (this.isEmpty()) {
      return ReadableContent.empty();
    }

    const str = this.toString();
    const codepoints = Array.from(str);
    const length = codepoints.length;

    const normalizeIndex = (index: number | undefined, defaultValue: number): number => {
      if (index === undefined) {
        return defaultValue;
      }

      if (index < 0) {
        return Math.max(length + index, 0);
      }

      if (index > length) {
        return length;
      }

      return index;
    };

    const startIndex = normalizeIndex(start, 0);
    const endIndex = normalizeIndex(end, length);

    if (endIndex <= startIndex) {
      return ReadableContent.empty();
    }

    // Build prefix byte offsets so we can slice the underlying buffer without
    // breaking multi-byte characters (e.g., emojis).
    const byteOffsets: number[] = new Array(length + 1);
    byteOffsets[0] = 0;

    for (let i = 0; i < length; i++) {
      const byteLength = Buffer.byteLength(codepoints[i], 'utf8');
      byteOffsets[i + 1] = byteOffsets[i] + byteLength;
    }

    const startByte = byteOffsets[startIndex];
    const endByte = byteOffsets[endIndex];

    return new ReadableContent(this.buffer.subarray(startByte, endByte));
  }

  isMultiLine(): boolean {
    if (this.isEmpty()) {
      return false;
    }

    for (let i = 0; i < this.buffer.length; i++) {
      if (this.buffer[i] === ReadableContent.NEW_LINE_CHAR_CODE) {
        return true;
      }
    }
    return false;
  }

  /**
   * Split the content into lines based on newline characters.
   * Handles both LF (`\n`) and CRLF (`\r\n`) line endings.
   * 
   * @returns Array of ReadableContent instances, each representing a line
   */
  splitLines(): ReadableContent[] {
    if (this.isEmpty()) {
      return [
        ReadableContent.empty()
      ];
    }

    const lines: ReadableContent[] = [];
    let lineStart = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      if (this.buffer[i] === ReadableContent.NEW_LINE_CHAR_CODE) {
        let line = this.buffer.subarray(lineStart, i);
        if (line.length > 0 && line[line.length - 1] === ReadableContent.CARRIAGE_RETURN_CHAR_CODE) {
          // Remove trailing CR from a CRLF sequence. Operate on the `line`
          // slice we already created (not on the full buffer) to avoid
          // returning the wrong portion of the underlying buffer.
          line = line.subarray(0, line.length - 1);
        }
        lines.push(new ReadableContent(line));
        lineStart = i + 1;
      }
    }
    if (lineStart <= this.buffer.length - 1) {
      let line = this.buffer.subarray(lineStart, this.buffer.length);
      if (line.length > 0 && line[line.length - 1] === ReadableContent.CARRIAGE_RETURN_CHAR_CODE) {
        line = line.subarray(0, line.length - 1);
      }
      lines.push(new ReadableContent(line));
    } else if (lineStart === this.buffer.length) {
      lines.push(ReadableContent.empty());
    }
    return lines;
  }
}