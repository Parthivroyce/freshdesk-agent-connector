# Freshdesk Agent Connector — Demonstration Guide

This guide walks through running the complete connector, exercising all 5 agent tools, verifying security guardrails, and demonstrating rate-limit resilience.

---

## Quick Start (Zero Credentials Required)

The connector ships with a pre-configured **DemoProvider** containing 10 realistic Razorpay merchant support scenarios (mandate failures, duplicate charges, webhook dropouts, settlement reconciliation, etc.).

### 1. Run the Automated Demo Script

```bash
npm run demo
```

This script will sequentially execute:
1. `list_tickets` (Filtered by `status: open`)
2. `search_tickets` (Keyword search for `"payment"`)
3. `get_ticket` (Full normalized ticket retrieval for ID `1001`)
4. `list_ticket_conversations` (Thread inspection for ID `1001`)
5. `get_ticket_summary` (Deterministic summarization of root cause & next steps)
6. **Guardrail Check**: Input validation rejection on invalid ticket ID
7. **Security Check**: Rejection of unsupported or write operations (`delete_ticket`)
8. **Rate Limit Resilience**: Mocked HTTP 429 response sequence with `Retry-After: 1` header, validating exponential backoff and recovery.

---

## 2. Running the Full-Stack Developer Dashboard

Start the dev server (Express backend + React frontend):

```bash
npm run dev
```

Open your browser at:
`http://localhost:3000`

### Interactive Dashboard Features:
- **Mode Indicator**: High-visibility banner showing `"Demo Mode — using fictional Freshdesk data"`.
- **Ticket Explorer**: Real-time table of merchant tickets with instant status/priority filtering and pagination.
- **Ticket Details View**: View requester metadata, full conversation history, and the generated ticket summary with action points.
- **MCP Tool Explorer**: Interactive runner allowing you to inspect JSON Schemas, pre-fill sample arguments, and execute any of the 5 tools with measured latency.
- **Real-time Observability**: Inspect the audit log stream (`X-Request-ID`, tool name, execution time in ms, status code, sanitized payloads).

---

## 3. Testing via cURL / REST Endpoints

You can also interact directly with the backend API from your terminal:

### Health Check
```bash
curl -s http://localhost:3000/api/health | jq .
```

### Discover Available MCP Tools
```bash
curl -s http://localhost:3000/api/tools | jq .
```

### Execute a Tool via Agent Dispatcher (`POST /api/tools/:toolName/execute`)
```bash
# List open tickets
curl -s -X POST http://localhost:3000/api/tools/list_tickets/execute \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "per_page": 5, "status": "open"}' | jq .

# Search for UPI duplicate charges
curl -s -X POST http://localhost:3000/api/tools/search_tickets/execute \
  -H "Content-Type: application/json" \
  -d '{"query": "duplicate charge"}' | jq .

# Summarize ticket 1001
curl -s -X POST http://localhost:3000/api/tools/get_ticket_summary/execute \
  -H "Content-Type: application/json" \
  -d '{"ticket_id": 1001}' | jq .
```

### Test Security Guardrails
Attempting to invoke an unauthorized or write action:
```bash
curl -s -X POST http://localhost:3000/api/tools/create_ticket/execute \
  -H "Content-Type: application/json" \
  -d '{"subject": "Hack attempt"}' | jq .
```
Response:
```json
{
  "error": {
    "code": "METHOD_NOT_ALLOWED",
    "message": "Tool 'create_ticket' is not recognized or not allowed. Only registered read-only tools can be executed.",
    "retryable": false
  }
}
```

---

## 4. Running Automated Tests

Run the Vitest test suite:

```bash
npm test
```

For coverage:
```bash
npm run test:coverage
```
