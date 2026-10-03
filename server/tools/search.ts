import { TicketProvider } from '../providers/TicketProvider.js';
import {
  SearchTicketsInput,
  SearchTicketsInputSchema,
  SearchTicketsJsonSchema,
} from '../schemas/tools.js';
import { NormalizedTicket, NormalizedPaginatedResponse } from '../schemas/ticket.js';

export const searchTicketsTool = {
  name: 'search_tickets',
  description: 'Search Freshdesk support tickets by keyword, subject text, customer query, or tag (e.g., "payment failed", "refund", "upi"). Returns normalized matching tickets.',
  readOnly: true,
  inputSchema: SearchTicketsJsonSchema,
  outputSchema: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            subject: { type: 'string' },
            status: { type: 'string', enum: ['open', 'pending', 'resolved', 'closed'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            requester: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
            tags: { type: 'array', items: { type: 'string' } },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
      },
      pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          per_page: { type: 'integer' },
          has_more: { type: 'boolean' },
          total_count: { type: 'integer' },
        },
      },
    },
  },
  validate(input: unknown): SearchTicketsInput {
    return SearchTicketsInputSchema.parse(input);
  },
  async execute(provider: TicketProvider, input: SearchTicketsInput): Promise<NormalizedPaginatedResponse<NormalizedTicket>> {
    return provider.searchTickets(input);
  },
};
