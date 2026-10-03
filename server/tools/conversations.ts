import { TicketProvider } from '../providers/TicketProvider.js';
import {
  ListTicketConversationsInput,
  ListTicketConversationsInputSchema,
  ListTicketConversationsJsonSchema,
} from '../schemas/tools.js';
import { NormalizedConversation, NormalizedPaginatedResponse } from '../schemas/ticket.js';

export const listTicketConversationsTool = {
  name: 'list_ticket_conversations',
  description: 'Retrieve the chronologically ordered conversation thread and replies exchanged between merchant/customer and support agents for a specific Freshdesk ticket.',
  readOnly: true,
  inputSchema: ListTicketConversationsJsonSchema,
  outputSchema: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            ticket_id: { type: 'integer' },
            body_text: { type: 'string' },
            author_name: { type: 'string' },
            author_email: { type: 'string' },
            incoming: { type: 'boolean' },
            private: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            attachments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  content_url: { type: 'string' },
                },
              },
            },
          },
          required: ['id', 'ticket_id', 'body_text', 'author_name', 'incoming', 'created_at'],
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
  validate(input: unknown): ListTicketConversationsInput {
    return ListTicketConversationsInputSchema.parse(input);
  },
  async execute(provider: TicketProvider, input: ListTicketConversationsInput): Promise<NormalizedPaginatedResponse<NormalizedConversation>> {
    return provider.listConversations(input.ticket_id, {
      page: input.page,
      per_page: input.per_page,
    });
  },
};
