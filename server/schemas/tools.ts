import { z } from 'zod';

// ==========================================
// 1. list_tickets
// ==========================================
export const ListTicketsInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(20),
  status: z.enum(['open', 'pending', 'resolved', 'closed', 'all']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

export type ListTicketsInput = z.infer<typeof ListTicketsInputSchema>;

export const ListTicketsJsonSchema = {
  type: 'object',
  properties: {
    page: {
      type: 'integer',
      minimum: 1,
      default: 1,
      description: 'Page number for pagination (starts at 1).',
    },
    per_page: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 20,
      description: 'Number of tickets per page (max 100).',
    },
    status: {
      type: 'string',
      enum: ['open', 'pending', 'resolved', 'closed', 'all'],
      description: 'Filter by ticket status.',
    },
    priority: {
      type: 'string',
      enum: ['low', 'medium', 'high', 'urgent'],
      description: 'Filter by ticket priority.',
    },
  },
  required: [],
};

// ==========================================
// 2. get_ticket
// ==========================================
export const GetTicketInputSchema = z.object({
  ticket_id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]),
});

export type GetTicketInput = z.infer<typeof GetTicketInputSchema>;

export const GetTicketJsonSchema = {
  type: 'object',
  properties: {
    ticket_id: {
      type: 'integer',
      description: 'The unique numeric ID of the Freshdesk ticket.',
    },
  },
  required: ['ticket_id'],
};

// ==========================================
// 3. search_tickets
// ==========================================
export const SearchTicketsInputSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty').max(200, 'Search query exceeds max length'),
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(20),
});

export type SearchTicketsInput = z.infer<typeof SearchTicketsInputSchema>;

export const SearchTicketsJsonSchema = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      description: 'Search keyword, phrase, or Freshdesk query string (e.g., "payment failed", "refund", "status:2").',
    },
    page: {
      type: 'integer',
      minimum: 1,
      default: 1,
      description: 'Page number for search results.',
    },
    per_page: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 20,
      description: 'Number of tickets per page (max 100).',
    },
  },
  required: ['query'],
};

// ==========================================
// 4. list_ticket_conversations
// ==========================================
export const ListTicketConversationsInputSchema = z.object({
  ticket_id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]),
  page: z.number().int().min(1).default(1).optional(),
  per_page: z.number().int().min(1).max(100).default(50).optional(),
});

export type ListTicketConversationsInput = z.infer<typeof ListTicketConversationsInputSchema>;

export const ListTicketConversationsJsonSchema = {
  type: 'object',
  properties: {
    ticket_id: {
      type: 'integer',
      description: 'The unique numeric ID of the ticket whose conversation thread should be retrieved.',
    },
    page: {
      type: 'integer',
      minimum: 1,
      default: 1,
      description: 'Page number for conversation messages.',
    },
    per_page: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 50,
      description: 'Number of messages per page.',
    },
  },
  required: ['ticket_id'],
};

// ==========================================
// 5. get_ticket_summary
// ==========================================
export const GetTicketSummaryInputSchema = z.object({
  ticket_id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]),
});

export type GetTicketSummaryInput = z.infer<typeof GetTicketSummaryInputSchema>;

export const GetTicketSummaryJsonSchema = {
  type: 'object',
  properties: {
    ticket_id: {
      type: 'integer',
      description: 'The unique numeric ID of the ticket to summarize.',
    },
  },
  required: ['ticket_id'],
};
