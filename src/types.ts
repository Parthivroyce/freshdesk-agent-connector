export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Requester {
  id?: number;
  name: string;
  email: string;
  phone?: string;
}

export interface Ticket {
  id: number;
  subject: string;
  description_text: string;
  status: TicketStatus;
  status_code: number;
  priority: TicketPriority;
  priority_code: number;
  requester: Requester;
  tags: string[];
  created_at: string;
  updated_at: string;
  due_by?: string;
  type?: string;
  custom_fields?: Record<string, any>;
  source?: string;
}

export interface Conversation {
  id: number;
  ticket_id: number;
  body_text: string;
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
  }>;
}

export interface TicketSummary {
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

export interface Pagination {
  page: number;
  per_page: number;
  has_more: boolean;
  total_count?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: Pagination;
}

export interface McpTool {
  name: string;
  description: string;
  readOnly: boolean;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
}

export interface SafeAppConfig {
  demo_mode: boolean;
  provider: string;
  has_credentials: boolean;
  domain_configured: boolean;
  environment: string;
  read_only: boolean;
  max_retries: number;
  timeout_ms: number;
  active_provider_name: string;
  active_provider_is_demo: boolean;
  available_tools_count: number;
}

export interface LogEntry {
  id: string;
  requestId: string;
  toolName?: string;
  action: string;
  timestamp: string;
  durationMs?: number;
  status: 'SUCCESS' | 'ERROR' | 'INFO';
  errorCode?: string;
  message?: string;
  params?: Record<string, any>;
}
