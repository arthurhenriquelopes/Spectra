## 2025-02-28 - Fast-path check for streaming regex filtering
**Learning:** During real-time response streaming, string sanitization functions like `filterThinkingContent` are called multiple times per incoming chunk across the whole buffer and pending text segments. Evaluating multi-line case-insensitive regexes on every chunk when `<think>` tags are absent incurs unnecessary overhead.
**Action:** Always add a fast substring check (`!content.includes('<think') && !content.includes('<THINK')`) before executing multi-line regex replacements in streaming text pipelines.
