## 2025-05-18 - Streaming Markdown Parser Token Thrashing

**Learning:** In `StreamingMarkdownParser`, `shouldReprocess()` checked the pending buffer slice for inline tags (`**`, `` ` ``, `[`) or paragraph breaks (`\n\n`). When an opening tag or break was streamed without a closing tag, `getProcessableContent()` truncated the content back and left `processedLength` unchanged. This caused `shouldReprocess()` to evaluate to `true` on over 90% of subsequent token chunks, triggering full O(N) buffer re-parsing and thrashing on every chunk during streaming.

**Action:** Track `lastUnprocessableLength` when `processableContent === lastProcessedContent` yields no new processable blocks. On subsequent chunks, skip full buffer re-parsing until structural boundary characters (`\n`, ```` ``` ````, `**`, `` ` ``, `]`) arrive in newly appended text or pending buffer size exceeds 150 characters.

## 2025-05-18 - Case-Insensitive String Search Micro-optimization

**Learning:** Replacing `if '<think' not in content.lower():` with explicit case variations (`'<think' not in content and '<THINK' not in content...`) ran 36% slower in Python 3.12 because CPython's `lower()` C implementation (`fastsearch.h`) is highly optimized, whereas making multiple Python string `in` lookups adds interpreter overhead that outweighs allocation costs for short/medium strings.

**Action:** Don't replace built-in `str.lower()` checks with multiple `in` checks without micro-benchmarking first.
