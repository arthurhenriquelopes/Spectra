## 2025-10-06 - Avoid DOM Element Allocation in Hot Loops (escapeHtml)
**Learning:** Creating DOM nodes (`document.createElement('div')`) inside hot string utilities like `escapeHtml` during streaming markdown parsing creates massive GC overhead and slows down rendering by ~2x-10x compared to in-memory string replacement.
**Action:** Always prefer single-pass regex replacement (`/[&<>"']/g`) for HTML escaping in performance-critical text/markdown processing pipelines.
