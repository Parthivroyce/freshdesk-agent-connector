# Engineering Note: Freshdesk Agent Connector
**Candidate Role**: Forward-Deployed Engineer (Razorpay Merchant Support Integration)  
**Date**: October 2026  
**Document Status**: Final Discovery & Implementation Architecture Note  

---

### 1. Problem Interpretation
Razorpay merchants process millions of transactions across UPI, Cards, Netbanking, Subscriptions, and Settlements. When issues arise (mandate failures, duplicate charges, webhook dropouts, settlement reconciliation discrepancies), merchant support operations are inundated with inquiries.

AI Agent Studio agents offer an opportunity to accelerate triage, but connecting an autonomous agent directly to an enterprise ticketing tool like Freshdesk introduces severe operational risks:
- Unbounded API keys could be abused or leaked.
- An agent might perform unintended writes (e.g. prematurely resolving tickets or making unauthorized customer commitments).
- High-volume agent querying can exhaust Freshdesk rate limits and block human agents.
- Freshdesk's internal data structures (integer status enums, raw HTML bodies, nested requester IDs) create cognitive noise for LLMs and lead to hallucinations.

**Objective**: Deliver a secure, read-only Model Context Protocol (MCP) connector that acts as a protected intermediary between the AI Agent Studio and Freshdesk.

---

### 2. Architecture Decisions
We selected a layered, pluggable architecture:

1. **Agent Protocol Layer (`/server/tools`)**: Implements strict MCP tool contracts with machine-readable JSON schemas and runtime Zod validation.
2. **Provider Abstraction (`TicketProvider`)**: Establishes a clean TypeScript interface (`listTickets`, `getTicket`, `searchTickets`, `listConversations`) decoupled from HTTP transport.
3. **Pluggable Implementations**:
   - `DemoProvider`: Provides 10 rich, multi-turn fictional Razorpay merchant scenarios for offline development and CI/CD testing.
   - `FreshdeskProvider`: Connects to the official Freshdesk REST API v2 using resilient HTTP transport.
4. **Resilient HTTP Engine (`FreshdeskClient`)**: Manages Basic Auth, request timeouts, bounded retries, and exponential backoff.
5. **Observability Ring Buffer (`/server/utils/logger.ts`)**: Captures non-sensitive telemetry (`requestId`, execution time, status code) for live monitoring.

---

### 3. Authentication Choice
Freshdesk API v2 supports two authentication paradigms:
1. **API Key Basic Authentication** (`Authorization: Basic base64(apiKey:X)`): The industry-standard pattern for private service-to-service backend integrations.
2. **OAuth 2.0**: Intended primarily for public multi-tenant apps listed on the Freshworks Marketplace.

For this private, internal merchant support connector, **API-key authentication was selected**:
- It ensures zero client-side credential exposure (keys reside strictly on the server).
- Credentials are ingested through validated environment variables (`FRESHDESK_API_KEY`, `FRESHDESK_DOMAIN`).
- If credentials are not supplied, the connector defaults gracefully to `DEMO_MODE=true` rather than failing to boot.
- The authentication layer is decoupled so an OAuth token exchange middleware can be dropped in without changing the tool interface.

---

### 4. Tool Design & Contract Normalization
Five discrete read-only primitives were designed to map directly to common merchant support triage workflows:
1. `list_tickets`: For queue inspection and backlog analysis.
2. `get_ticket`: For deep investigation of a specific ticket.
3. `search_tickets`: For finding historical incidents by merchant, error code, or keyword.
4. `list_ticket_conversations`: For analyzing the dialogue between merchant and agent.
5. `get_ticket_summary`: For rapid executive briefings.

**Response Normalization**:
- Freshdesk statuses (`2`, `3`, `4`, `5`) are mapped to human-readable strings (`"open"`, `"pending"`, `"resolved"`, `"closed"`).
- Priorities (`1`, `2`, `3`, `4`) are mapped to `"low"`, `"medium"`, `"high"`, `"urgent"`.
- HTML tags in conversation bodies are sanitized to clean text.
- PII-heavy raw Freshdesk envelopes are filtered into stable, minimal schemas.

---

### 5. Rate-Limit Strategy
Freshdesk returns `HTTP 429 Too Many Requests` when account-level call volume exceeds subscription thresholds.

**Our Mitigation Strategy**:
1. Inspect the `Retry-After` response header to calculate required wait time.
2. Apply exponential backoff with jitter (`Math.min(2^attempt * 1000, 10000)` ms).
3. Cap retries at a bounded threshold (`MAX_RETRIES=3`) to prevent agent hanging.
4. If saturation persists, raise a structured, non-fatal `RATE_LIMITED` AppError with `retryable: true` and `retry_after_seconds` metadata.
5. Fast-fail on non-retryable 4xx client errors (401, 403, 404).

---

### 6. Security Guardrails
- **Strict Read-Only Enforcement**: Mutation methods (`create`, `update`, `delete`, `reply`) do not exist in the tool registry.
- **Closed Tool Dispatcher**: The tool runner endpoint accepts only explicitly registered tools; arbitrary paths are rejected.
- **Zod Input Schema Validation**: All tool parameters are validated against strict types with pagination caps (`1 <= per_page <= 100`).
- **Credential Redaction**: The logger automatically sanitizes keys, tokens, and authorization headers from logs.
- **Network Isolation**: The frontend has no direct access to Freshdesk; all operations route through the backend proxy.

---

### 7. Evaluation & Testing Strategy
A dual-layer verification approach was implemented:
1. **Unit & Integration Suite (`vitest`)**:
   - 30 automated tests across `tools.test.ts`, `freshdeskClient.test.ts`, and `guardrails.test.ts`.
   - Validates input schemas, pagination boundaries, error normalization, 429 backoff recovery, and logger sanitization.
2. **End-to-End Demo Script (`scripts/demo.ts`)**:
   - Executes all 5 tools in sequence against realistic merchant data.
   - Tests input validation failures and unauthorized tool rejections.
   - Simulates upstream HTTP 429 responses with recovery.

---

### 8. What the Agent CAN and CANNOT Do

| Allowed Operations | Forbidden Operations |
| :--- | :--- |
| Query ticket queues with pagination | Create or delete tickets |
| Filter by open/pending/resolved/closed | Modify ticket priority, status, or tags |
| Search tickets by keyword or payment ID | Post public replies or private notes |
| Retrieve conversation threads | Alter merchant contact or billing details |
| Generate deterministic summaries | Call arbitrary Freshdesk REST endpoints |

---

### 9. Production Limitations
1. **In-Memory Ring Buffer**: Observability logs are stored in memory and reset upon server restart.
2. **Single-Node Rate Limiter**: The current exponential backoff operates per node; a distributed deployment requires centralized rate limiting.
3. **Deterministic Summarization**: The summarizer is fast and free of external LLM costs, but lacks natural-language nuances for ambiguous edge cases.

---

### 10. Long-Term Production Improvements
1. **Distributed Token Bucket**: Deploy a Redis-backed rate limiter to enforce cluster-wide quotas across all connector instances.
2. **Read-Through Caching**: Cache static ticket metadata and closed conversations with Redis to reduce Freshdesk API load.
3. **Enterprise Secrets Management**: Integrate with AWS Secrets Manager or HashiCorp Vault for automated API key rotation.
4. **Audit Log Streaming**: Export structured security logs to Datadog or ELK stack via OpenTelemetry.
5. **Human-in-the-Loop Write Workflows**: Introduce an approval queue before any future write operations (e.g. posting internal merchant notes) are executed.
