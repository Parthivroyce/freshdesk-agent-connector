import { TicketProvider } from '../providers/TicketProvider.js';
import {
  ListTicketsInput,
  ListTicketsInputSchema,
  ListTicketsJsonSchema,
  GetTicketInput,
  GetTicketInputSchema,
  GetTicketJsonSchema,
} from '../schemas/tools.js';
import { NormalizedTicket, NormalizedPaginatedResponse } from '../schemas/ticket.js';

export const listTicketsTool = {
  name: 'list_tickets',
  description: 'Retrieve a paginated list of Freshdesk support tickets with optional filtering by status (open, pending, resolved, closed) and priority (low, medium, high, urgent).',
  readOnly: true,
  inputSchema: ListTicketsJsonSchema,
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
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            tags: { type: 'array', items: { type: 'string' } },
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
  validate(input: unknown): ListTicketsInput {
    return ListTicketsInputSchema.parse(input);
  },
  async execute(provider: TicketProvider, input: ListTicketsInput): Promise<NormalizedPaginatedResponse<NormalizedTicket>> {
    return provider.listTickets(input);
  },
};

export const getTicketTool = {
  name: 'get_ticket',
  description: 'Retrieve the comprehensive details and normalized fields of a specific Freshdesk support ticket by its numeric ID.',
  readOnly: true,
  inputSchema: GetTicketJsonSchema,
  outputSchema: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      subject: { type: 'string' },
      description_text: { type: 'string' },
      status: { type: 'string', enum: ['open', 'pending', 'resolved', 'closed'] },
      priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
      requester: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
        },
      },
      tags: { type: 'array', items: { type: 'string' } },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
      due_by: { type: 'string' },
      type: { type: 'string' },
      custom_fields: { type: 'object' },
      source: { type: 'string' },
    },
    required: ['id', 'subject', 'status', 'priority', 'requester', 'created_at', 'updated_at'],
  },
  validate(input: unknown): GetTicketInput {
    return GetTicketInputSchema.parse(input);
  },
  async execute(provider: TicketProvider, input: GetTicketInput): Promise<NormalizedTicket> {
    return provider.getTicket(input.ticket_id);
  },
};
