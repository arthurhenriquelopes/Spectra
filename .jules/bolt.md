## 2025-03-02 - Fast-Path Symbol Check in JS Markdown Parser
**Learning:** Executing multiple global regex replacements (`replace()`) on plain text strings in JavaScript incurs ~13.5x CPU overhead compared to a single fast symbol check (`!/[*_`~[!<]/.test(text)`).
**Action:** Always check for character presence with a single fast regex before executing multiple formatting regexes on text blocks.
