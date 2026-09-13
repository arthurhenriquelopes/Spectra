## 2025-03-01 - Fast-Path String Checking for Streaming Text Filters
**Learning:** In real-time streaming architectures where text chunks arrive rapidly (e.g. WebSocket LLM stream), running multiline regex pattern matches over accumulated string buffers on every chunk creates significant CPU overhead if the targeted pattern (such as `<think>` tags) is absent in 99%+ of responses.
**Action:** Always add a fast-path string check (`if (!content.toLowerCase().includes('<tag')) return content;`) prior to running regex operations in streaming text parsers.
