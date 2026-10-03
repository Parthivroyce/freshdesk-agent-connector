import { TicketProvider } from './TicketProvider.js';
import { FreshdeskClient } from '../services/freshdeskClient.js';
import {
  NormalizedTicket,
  NormalizedConversation,
  NormalizedPaginatedResponse,
} from '../schemas/ticket.js';
import {
  ListTicketsInput,
  SearchTicketsInput,
} from '../schemas/tools.js';

export class FreshdeskProvider implements TicketProvider {
  public readonly name = 'FreshdeskLiveProvider (Official REST API v2)';
  public readonly isDemo = false;
  private readonly client: FreshdeskClient;

  constructor(client?: FreshdeskClient) {
    this.client = client || new FreshdeskClient();
  }

  async listTickets(params: ListTicketsInput): Promise<NormalizedPaginatedResponse<NormalizedTicket>> {
    return this.client.getTickets(params);
  }

  async getTicket(ticketId: number): Promise<NormalizedTicket> {
    return this.client.getTicket(ticketId);
  }

  async searchTickets(params: SearchTicketsInput): Promise<NormalizedPaginatedResponse<NormalizedTicket>> {
    return this.client.searchTickets(params);
  }

  async listConversations(
    ticketId: number,
    params?: { page?: number; per_page?: number }
  ): Promise<NormalizedPaginatedResponse<NormalizedConversation>> {
    return this.client.getTicketConversations(ticketId, params);
  }
}
