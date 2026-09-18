# Bolt's Performance Journal

## 2025-02-18 - Fast-path check for `<think>` tag filtering in streaming responses
**Learning:** Performing global regex replacements with multi-line callbacks (`/<think\s*>[\s\S]*?<\/think\s*>/gi`) on every streaming chunk pass in JavaScript creates significant overhead during AI response streaming. Adding a fast-path substring check (`!content.includes('<think') && !content.includes('<THINK') && !content.includes('</think') && !content.includes('</THINK')`) yields a ~7x speedup for normal text chunks without `<think>` or `</think>` tags. Furthermore, avoiding `.toLowerCase()` prevents temporary string memory allocations, making direct substring checks ~5x faster than `.toLowerCase().includes()`.
**Action:** Always use direct substring checks without `.toLowerCase()` allocation for fast-path guards on high-frequency streaming inputs, and ensure both opening and closing tag forms are handled.

## 2025-02-18 - RegEx `.test()` before simple string `.replace()` anti-pattern
**Learning:** Pre-testing string content with a regex (e.g., `/[&<"]/.test(text)`) before calling simple `.replace()` chains in JavaScript (like `escapeHtml`) can actually degrade performance (~0.18x speedup) because V8 heavily optimizes string replacement chains internally, whereas adding a pre-test adds regex execution overhead on every call.
**Action:** Profile and benchmark string operations in the target engine before adding regex guards to simple string replacements.
