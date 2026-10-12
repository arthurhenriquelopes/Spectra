## 2026-10-12 - In-Memory Search Optimization
**Learning:** Pre-computing lowercased strings (`nameLower`) and string lengths (`nameLength`) when loading large JSON datasets in Node.js server memory eliminates redundant string transformations during search queries, cutting search time by ~50%.
**Action:** Always pre-normalize searchable attributes upon dataset initialization or mutation when handling frequent in-memory lookup endpoints.
