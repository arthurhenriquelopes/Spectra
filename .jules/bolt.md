## 2025-05-18 - Fast-path check on real-time streaming buffers and string HTML escaping
**Learning:** In real-time LLM response streaming, processing routines run dozens of times per second over growing string buffers. Avoid DOM element allocations (`document.createElement`) in text helper utilities, and use fast-path checks (`/<think/i.test(str)`) to bypass full regex operations when tags are absent.
**Action:** Always check string presence before executing global regex search-and-replace operations in high-frequency streaming handlers.
