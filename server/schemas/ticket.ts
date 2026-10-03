import { z } from 'zod';

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NormalizedRequester {
  id?: number;
  name: string;
  email: string;
  phone?: string;
}

export interface NormalizedTicket {
  id: number;
  subject: string;
  description_text: string;
  status: TicketStatus;
  status_code: number;
  priority: TicketPriority;
  priority_code: number;
  requester: NormalizedRequester;
  tags: string[];
  created_at: string;
  updated_at: string;
  due_by?: string;
  type?: string;
  custom_fields?: Record<string, any>;
  source?: string;
}

export interface NormalizedConversation {
  id: number;
  ticket_id: number;
  body_text: string;
  user_id?: number;
  author_name: string;
  author_email?: string;
  incoming: boolean;
  private: boolean;
  created_at: string;
  updated_at: string;
  attachments?: Array<{
    id: number;
    name: string;
    content_url?: string;
    size?: number;
    content_type?: string;
  }>;
}

export interface TicketSummaryResult {
  ticket_id: number;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  customer: {
    name: string;
    email: string;
  };
  summary: string;
  key_points: string[];
  conversation_count: number;
  last_updated: string;
  sentiment?: 'frustrated' | 'neutral' | 'satisfied';
  suggested_next_steps: string[];
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  has_more: boolean;
  total_count?: number;
}

export interface NormalizedPaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface NormalizedErrorPayload {
  error: {
    code: string;
    message: string;
    retryable: boolean;
    retry_after_seconds?: number;
    details?: any;
  };
}
