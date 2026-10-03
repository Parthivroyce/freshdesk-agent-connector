import { describe, it, expect, beforeEach } from 'vitest';
import { DemoProvider } from '../server/providers/DemoProvider.js';
import { executeTool, TOOLS_REGISTRY } from '../server/tools/index.js';
import { AppError, ValidationError } from '../server/utils/errors.js';

describe('MCP Agent Tools & DemoProvider Suite', () => {
  let provider: DemoProvider;

  beforeEach(() => {
    provider = new DemoProvider();
  });

  describe('Registry & Guardrails', () => {
    it('should register exactly the 5 approved read-only tools', () => {
      const toolNames = Object.keys(TOOLS_REGISTRY);
      expect(toolNames).toHaveLength(5);
      expect(toolNames).toContain('list_tickets');
      expect(toolNames).toContain('get_ticket');
      expect(toolNames).toContain('search_tickets');
      expect(toolNames).toContain('list_ticket_conversations');
      expect(toolNames).toContain('get_ticket_summary');
    });

    it('should reject unsupported tool execution (e.g. write action "create_ticket")', async () => {
      await expect(
        executeTool('create_ticket', { subject: 'test' }, provider)
      ).rejects.toThrowError(/not recognized or not allowed/);
    });

    it('should reject destructive tool execution ("delete_ticket")', async () => {
      await expect(
        executeTool('delete_ticket', { ticket_id: 1001 }, provider)
      ).rejects.toThrow(AppError);
    });
  });

  describe('Tool: list_tickets', () => {
    it('should list tickets with default pagination', async () => {
      const res = await executeTool('list_tickets', {}, provider);
      expect(res.toolName).toBe('list_tickets');
      expect(res.result.data.length).toBeGreaterThanOrEqual(10);
      expect(res.result.pagination.page).toBe(1);
      expect(res.result.pagination.per_page).toBe(20);
    });

    it('should support pagination (page and per_page bounds)', async () => {
      const res = await executeTool('list_tickets', { page: 1, per_page: 3 }, provider);
      expect(res.result.data).toHaveLength(3);
      expect(res.result.pagination.has_more).toBe(true);
    });

    it('should filter by ticket status', async () => {
      const res = await executeTool('list_tickets', { status: 'open' }, provider);
      expect(res.result.data.length).toBeGreaterThan(0);
      for (const ticket of res.result.data) {
        expect(ticket.status).toBe('open');
      }
    });

    it('should filter by ticket priority', async () => {
      const res = await executeTool('list_tickets', { priority: 'urgent' }, provider);
      expect(res.result.data.length).toBeGreaterThan(0);
      for (const ticket of res.result.data) {
        expect(ticket.priority).toBe('urgent');
      }
    });

    it('should reject invalid page or per_page values via Zod', async () => {
      await expect(
        executeTool('list_tickets', { page: 0 }, provider)
      ).rejects.toThrow(ValidationError);

      await expect(
        executeTool('list_tickets', { per_page: 200 }, provider)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Tool: get_ticket', () => {
    it('should retrieve a specific normalized ticket by ID', async () => {
      const res = await executeTool('get_ticket', { ticket_id: 1001 }, provider);
      const ticket = res.result;
      expect(ticket.id).toBe(1001);
      expect(ticket.subject).toContain('Failed autopay payment');
      expect(ticket.requester.name).toContain('Aditi Sharma');
      expect(ticket.status).toBe('open');
      expect(ticket.priority).toBe('high');
      expect(ticket.tags).toContain('autopay');
    });

    it('should accept string ticket_id and coerce to integer safely', async () => {
      const res = await executeTool('get_ticket', { ticket_id: '1002' }, provider);
      expect(res.result.id).toBe(1002);
    });

    it('should throw NOT_FOUND for non-existent ticket', async () => {
      await expect(
        executeTool('get_ticket', { ticket_id: 99999 }, provider)
      ).rejects.toThrowError(/not found/i);
    });

    it('should reject non-numeric ticket_id with ValidationError', async () => {
      await expect(
        executeTool('get_ticket', { ticket_id: 'abc' }, provider)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Tool: search_tickets', () => {
    it('should search tickets by keyword matching subject or description', async () => {
      const res = await executeTool('search_tickets', { query: 'refund' }, provider);
      expect(res.result.data.length).toBeGreaterThan(0);
      const hasRefundInResults = res.result.data.some((t: any) =>
        t.subject.toLowerCase().includes('refund') || t.tags.includes('refunds')
      );
      expect(hasRefundInResults).toBe(true);
    });

    it('should search tickets by requester name', async () => {
      const res = await executeTool('search_tickets', { query: 'Aditi' }, provider);
      expect(res.result.data.length).toBeGreaterThan(0);
      expect(res.result.data[0].requester.name).toContain('Aditi');
    });

    it('should reject empty query string', async () => {
      await expect(
        executeTool('search_tickets', { query: '' }, provider)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Tool: list_ticket_conversations', () => {
    it('should return conversation thread for ticket 1001', async () => {
      const res = await executeTool('list_ticket_conversations', { ticket_id: 1001 }, provider);
      expect(res.result.data.length).toBeGreaterThanOrEqual(4);
      expect(res.result.data[0].body_text).toContain('mandate sub_K38d9x88172');
      expect(res.result.data[1].incoming).toBe(false);
      expect(res.result.data[1].author_name).toContain('Razorpay');
    });

    it('should handle ticket with fallback conversation generated from description', async () => {
      const res = await executeTool('list_ticket_conversations', { ticket_id: 1005 }, provider);
      expect(res.result.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should throw NOT_FOUND for non-existent ticket conversations', async () => {
      await expect(
        executeTool('list_ticket_conversations', { ticket_id: 88888 }, provider)
      ).rejects.toThrowError(/not found/i);
    });
  });

  describe('Tool: get_ticket_summary', () => {
    it('should generate deterministic summary with entities and next steps', async () => {
      const res = await executeTool('get_ticket_summary', { ticket_id: 1001 }, provider);
      const summary = res.result;
      expect(summary.ticket_id).toBe(1001);
      expect(summary.subject).toContain('Failed autopay payment');
      expect(summary.customer.name).toContain('Aditi');
      expect(summary.summary).toBeDefined();
      expect(summary.key_points).toBeInstanceOf(Array);
      expect(summary.key_points.length).toBeGreaterThan(0);
      expect(summary.suggested_next_steps).toBeInstanceOf(Array);
      expect(summary.conversation_count).toBeGreaterThanOrEqual(4);
    });
  });
});
