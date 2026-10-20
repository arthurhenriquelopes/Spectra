## 2025-05-20 - Pre-initializing AsyncOpenAI Clients for Key Rotation
**Learning:** Instantiating `AsyncOpenAI` creates a new HTTP transport and `httpx.AsyncClient` connection pool. In multi-key rotation setups, instantiating `AsyncOpenAI` inside `_rotate_key` on every retry discarded existing HTTP connection pools and forced TCP/TLS reconnection latency.
**Action:** Pre-initialize and cache an `AsyncOpenAI` client for each API key during manager initialization so key rotation is an O(1) lookup that preserves HTTP connection pools across retries.
