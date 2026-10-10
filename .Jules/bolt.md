## 2026-10-10 - Avoid Global /g Flag on Line-by-Line Test RegExp Patterns
**Learning:** Using global (`/g`) regular expressions with `.test()` inside line-by-line loops mutates `lastIndex` statefully across iterations, causing skipped matches on consecutive identical lines (e.g. consecutive horizontal rules or table separators) and unnecessary regex state reset overhead.
**Action:** Always omit the `/g` flag for regexes used in `.test()` checks against single lines or substrings.
