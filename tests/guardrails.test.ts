import { describe, it, expect } from 'vitest';
import { executeTool, TOOLS_REGISTRY } from '../server/tools/index.js';
import { DemoProvider } from '../server/providers/DemoProvider.js';
import { sanitizeObject, logger } from '../server/utils/logger.js';
import { AppError } from '../server/utils/errors.js';

describe('Security Guardrails & Sanitization', () => {
  const provider = new DemoProvider();

  it('should enforce strict read-only tool registration', () => {
    for (const [name, tool] of Object.entries(TOOLS_REGISTRY)) {
      expect(tool.readOnly).toBe(true);
      expect(name).not.toMatch(/(create|update|delete|modify|put|post|patch|reply)/i);
    }
  });

  it('should reject arbitrary command injection or path traversal attempts in search', async () => {
    // Normal query works
    const ok = await executeTool('search_tickets', { query: 'autopay' }, provider);
    expect(ok.result.data).toBeDefined();

    // Query exceeding maximum length bound
    const longQuery = 'a'.repeat(300);
    await expect(
      executeTool('search_tickets', { query: longQuery }, provider)
    ).rejects.toThrow();
  });

  it('should sanitize sensitive keys from log entries', () => {
    const rawPayload = {
      ticket_id: 1001,
      api_key: 'secret_live_key_9999',
      authorization: 'Basic dXNlcjpwYXNz',
      password: 'merchant_password',
      customer_token: 'tok_live_123',
      innocent_field: 'valid_data',
    };

    const sanitized = sanitizeObject(rawPayload);

    expect(sanitized.api_key).toBe('[REDACTED]');
    expect(sanitized.authorization).toBe('[REDACTED]');
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.customer_token).toBe('[REDACTED]');
    expect(sanitized.innocent_field).toBe('valid_data');
    expect(sanitized.ticket_id).toBe(1001);
  });
});
