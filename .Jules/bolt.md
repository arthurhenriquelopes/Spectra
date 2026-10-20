## 2025-09-07 - Non-global line-level regexes and fast string escaping in frontend Markdown parsing

**Learning:** Reusing stateful global regexes (`/g` or `/gm`) in single-line tests causes `lastIndex` state leakage across loop iterations, missing valid patterns (e.g., alternating matches on repeated lines). Additionally, using `document.createElement('div')` for HTML escaping incurs heavy DOM allocation overhead on streaming chunks.

**Action:** Ensure line-by-line regex tests use non-global patterns without `/g`, and replace DOM node allocation in helper functions with direct string escaping.
