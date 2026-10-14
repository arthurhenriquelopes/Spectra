# Bolt's Journal

## 2026-10-14 - Fast-path character guards and single-line regex optimization for Markdown parsing
**Learning:** In streaming markdown processors that process text incrementally and line-by-line, calling regular expressions on every single line creates significant overhead. In addition, regexes with global (`/g`) flags used in `String.prototype.test()` store state in `lastIndex`, causing false negatives on repeated tests of short lines.
**Action:** Always strip global (`g`) flags from line-level regexes in parser loops and add fast-path initial character guards (`trimmedLine[0]`) or `String.prototype.includes()` token checks before invoking regex matching or replacement.
