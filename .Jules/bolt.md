## 2025-05-18 - Fast-path check for streaming text filters
**Learning:** Performing regex replacements on every streamed text chunk in frontend JS creates unnecessary overhead when target tags (like `<think>`) are absent in standard AI responses.
**Action:** Always add a fast-path substring check (`!content.toLowerCase().includes('<think')`) prior to executing complex regex operations on streaming text buffers.
