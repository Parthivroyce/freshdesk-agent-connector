import { describe, it, expect } from 'vitest';
import { FreshdeskClient } from '../server/services/freshdeskClient.js';
import { RateLimitError, AuthenticationError, NotFoundError } from '../server/utils/errors.js';

describe('FreshdeskClient Resilience, Auth & Normalization', () => {
  it('should authenticate with Basic Auth encoded API key', async () => {
    let capturedAuthHeader = '';

    const mockFetch = async (_url: string, init?: RequestInit) => {
      capturedAuthHeader = (init?.headers as Record<string, string>)?.Authorization || '';
      return new Response(JSON.stringify([{ id: 1, subject: 'Test' }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const client = new FreshdeskClient({
      domain: 'test-org.freshdesk.com',
      apiKey: 'test_key_123',
      fetchFn: mockFetch as any,
    });

    await client.getTickets({ page: 1 });
    const expectedToken = Buffer.from('test_key_123:X').toString('base64');
    expect(capturedAuthHeader).toBe(`Basic ${expectedToken}`);
  });

  it('should throw AuthenticationError on missing API key', async () => {
    const client = new FreshdeskClient({
      domain: 'test.freshdesk.com',
      apiKey: '',
    });

    await expect(client.getTickets({ page: 1 })).rejects.toThrow(AuthenticationError);
  });

  it('should handle HTTP 401 response and normalize error code', async () => {
    const mockFetch = async () => {
      return new Response(JSON.stringify({ message: 'Invalid Credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const client = new FreshdeskClient({
      domain: 'test.freshdesk.com',
      apiKey: 'bad_key',
      fetchFn: mockFetch as any,
    });

    await expect(client.getTicket(100)).rejects.toThrow(AuthenticationError);
  });

  it('should handle HTTP 404 response and normalize to NotFoundError', async () => {
    const mockFetch = async () => {
      return new Response(JSON.stringify({ message: 'Ticket not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const client = new FreshdeskClient({
      domain: 'test.freshdesk.com',
      apiKey: 'valid_key',
      fetchFn: mockFetch as any,
    });

    await expect(client.getTicket(999999)).rejects.toThrow(NotFoundError);
  });

  it('should handle HTTP 429, respect Retry-After, and recover on subsequent attempt', async () => {
    let callCount = 0;

    const mockFetch = async () => {
      callCount++;
      if (callCount === 1) {
        return new Response(JSON.stringify({ message: 'Rate limited' }), {
          status: 429,
          headers: { 'Retry-After': '0', 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ id: 55, subject: 'Success after retry', status: 2 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const client = new FreshdeskClient({
      domain: 'test.freshdesk.com',
      apiKey: 'valid_key',
      maxRetries: 3,
      fetchFn: mockFetch as any,
    });

    const ticket = await client.getTicket(55);
    expect(ticket.id).toBe(55);
    expect(callCount).toBe(2);
  });

  it('should throw RateLimitError if 429 persists beyond maxRetries', async () => {
    let callCount = 0;

    const mockFetch = async () => {
      callCount++;
      return new Response(JSON.stringify({ message: 'Permanent rate limit' }), {
        status: 429,
        headers: { 'Retry-After': '0', 'Content-Type': 'application/json' },
      });
    };

    const client = new FreshdeskClient({
      domain: 'test.freshdesk.com',
      apiKey: 'valid_key',
      maxRetries: 2,
      fetchFn: mockFetch as any,
    });

    await expect(client.getTicket(55)).rejects.toThrow(RateLimitError);
    expect(callCount).toBe(2);
  });

  it('should normalize Freshdesk numeric status and priorities accurately', () => {
    const client = new FreshdeskClient({ domain: 'dummy.freshdesk.com', apiKey: 'xyz' });

    expect(client.normalizeStatus(2)).toBe('open');
    expect(client.normalizeStatus(3)).toBe('pending');
    expect(client.normalizeStatus(4)).toBe('resolved');
    expect(client.normalizeStatus(5)).toBe('closed');

    expect(client.normalizePriority(1)).toBe('low');
    expect(client.normalizePriority(2)).toBe('medium');
    expect(client.normalizePriority(3)).toBe('high');
    expect(client.normalizePriority(4)).toBe('urgent');
  });

  it('should sanitize HTML in conversations and format normalized output', () => {
    const client = new FreshdeskClient({ domain: 'dummy.freshdesk.com', apiKey: 'xyz' });

    const rawConv = {
      id: 991,
      ticket_id: 101,
      body: '<p>Hello <b>Merchant</b>,<br/>Please check <a href="#">link</a>.</p>',
      incoming: false,
      author_name: 'Agent Smith',
    };

    const normalized = client.normalizeConversation(rawConv);
    expect(normalized.body_text).not.toContain('<p>');
    expect(normalized.body_text).not.toContain('<b>');
    expect(normalized.body_text).toContain('Hello Merchant');
    expect(normalized.incoming).toBe(false);
  });
});
