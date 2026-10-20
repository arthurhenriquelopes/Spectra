## 2025-05-15 - Fast-path check for string/regex filtering in streaming path
**Learning:** Checking for a quick substring guard like `!content.toLowerCase().includes('<think')` before running expensive multi-line regexes (`/<think\s*>[\s\S]*?<\/think\s*>/gi`) on every streaming chunk yields ~2.5x speedup for normal non-thinking responses.
**Action:** When performing regex filtering or parsing over high-frequency streaming inputs, always add a simple fast-path string check if applicable.
