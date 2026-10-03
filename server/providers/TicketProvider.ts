import {
  NormalizedTicket,
  NormalizedConversation,
  NormalizedPaginatedResponse,
} from '../schemas/ticket.js';
import {
  ListTicketsInput,
  SearchTicketsInput,
} from '../schemas/tools.js';

export interface TicketProvider {
  readonly name: string;
  readonly isDemo: boolean;

  listTickets(params: ListTicketsInput): Promise<NormalizedPaginatedResponse<NormalizedTicket>>;
  getTicket(ticketId: number): Promise<NormalizedTicket>;
  searchTickets(params: SearchTicketsInput): Promise<NormalizedPaginatedResponse<NormalizedTicket>>;
  listConversations(
    ticketId: number,
    params?: { page?: number; per_page?: number }
  ): Promise<NormalizedPaginatedResponse<NormalizedConversation>>;
}
