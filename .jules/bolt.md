# Bolt's Journal

## 2025-02-18 - Fast-path check for streaming text filters
**Learning:** Text chunk processing during real-time streaming (such as filtering `<think>` tags) executes on every incoming token. Executing full regular expressions on chunks without fast-path string presence checks introduces significant CPU overhead on the main event loop.
**Action:** Always include a fast `String.prototype.includes()` fast path before running regex substitutions in hot streaming callbacks.
