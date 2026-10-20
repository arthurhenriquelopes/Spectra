# Bolt's Journal - Critical Learnings

## 2025-05-18 - Fast Path Optimization Pattern Parity
**Learning:** Python backend and JS frontend both handle filtering `<think>` tags in AI responses. Python had a fast-path string check (`if '<think' not in content.lower(): return content`), but JS ran full regex replacements on every single streaming token chunk (10-50x/sec). Matching fast-path patterns across full-stack boundaries prevents client-side performance bottlenecks during LLM streaming.
**Action:** When optimizing streaming text processing in the frontend, check if a fast-path string check short-circuits expensive regex operations before running global replacements.
