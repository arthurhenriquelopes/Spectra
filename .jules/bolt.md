## 2026-10-13 - Avoid Stateful Global RegExps on Line-By-Line Parser Patterns

**Learning:** Declaring shared RegExp instances with `/g` or `/gm` flags for single-line line-by-line pattern matching (such as `horizontalRule` or `tableSeparator`) mutates `lastIndex` on match. When called sequentially over line arrays, subsequent lines can silently fail to match due to offset shift (e.g., `lastIndex > 0`), causing subtle parsing corruption and disabling JS engine fast paths. Additionally, replacing inline placeholder tags one by one via `forEach` loops causes $O(N \cdot L)$ string re-allocations compared to $O(L)$ for a single regex replacer pass.

**Action:** Ensure line-by-line block RegExps do not include `/g` or `/m` flags, and combine indexed placeholder restorations into single-pass regex replacements.
