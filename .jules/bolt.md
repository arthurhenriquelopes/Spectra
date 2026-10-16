## 2026-10-16 - Avoid DOM Allocations for Escaping & Stateful Global Regexes in Line Loops
**Learning:** `document.createElement('div')` inside high-frequency functions like `escapeHtml` creates heavy DOM/GC overhead during streaming rendering. Furthermore, using global `/g` regexes with `.test()` during line-by-line parsing mutates `lastIndex`, causing stateless parsing logic to fail on alternating lines.
**Action:** Use string replacements (`.replace()`) for HTML escaping and remove `/g` flags from single-line regex patterns tested repeatedly in loops.
