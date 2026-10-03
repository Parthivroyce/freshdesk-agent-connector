import {
  Ticket,
  Conversation,
  TicketSummary,
  PaginatedResult,
  McpTool,
  SafeAppConfig,
  LogEntry,
} from '../types.js';

const BASE_URL = '/api';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init?.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data?.error?.message || response.statusText || 'API request failed';
    const err = new Error(errorMsg) as any;
    err.code = data?.error?.code;
    err.status = response.status;
    err.details = data?.error?.details;
    err.retryAfter = data?.error?.retry_after_seconds;
    throw err;
  }

  return data as T;
}

export const api = {
  async getConfig(): Promise<SafeAppConfig> {
    return fetchJson<SafeAppConfig>(`${BASE_URL}/config`);
  },

  async getHealth(): Promise<any> {
    return fetchJson<any>(`${BASE_URL}/health`);
  },

  async getTools(): Promise<{ tools: McpTool[] }> {
    return fetchJson<{ tools: McpTool[] }>(`${BASE_URL}/tools`);
  },

  async executeTool(toolName: string, payload: any): Promise<{
    toolName: string;
    duration_ms: number;
    result: any;
  }> {
    return fetchJson<{
      toolName: string;
      duration_ms: number;
      result: any;
    }>(`${BASE_URL}/tools/${encodeURIComponent(toolName)}/execute`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async listTickets(params: {
    page?: number;
    per_page?: number;
    status?: string;
    priority?: string;
  } = {}): Promise<PaginatedResult<Ticket>> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.per_page) query.set('per_page', String(params.per_page));
    if (params.status) query.set('status', params.status);
    if (params.priority) query.set('priority', params.priority);

    return fetchJson<PaginatedResult<Ticket>>(`${BASE_URL}/tickets?${query.toString()}`);
  },

  async searchTickets(query: string, page = 1, perPage = 20): Promise<PaginatedResult<Ticket>> {
    const q = new URLSearchParams({
      q: query,
      page: String(page),
      per_page: String(perPage),
    });
    return fetchJson<PaginatedResult<Ticket>>(`${BASE_URL}/tickets/search?${q.toString()}`);
  },

  async getTicket(id: number): Promise<Ticket> {
    return fetchJson<Ticket>(`${BASE_URL}/tickets/${id}`);
  },

  async getTicketConversations(id: number, page = 1, perPage = 50): Promise<PaginatedResult<Conversation>> {
    return fetchJson<PaginatedResult<Conversation>>(`${BASE_URL}/tickets/${id}/conversations?page=${page}&per_page=${perPage}`);
  },

  async getTicketSummary(id: number): Promise<TicketSummary> {
    return fetchJson<TicketSummary>(`${BASE_URL}/tickets/${id}/summary`);
  },

  async getLogs(): Promise<{ logs: LogEntry[] }> {
    return fetchJson<{ logs: LogEntry[] }>(`${BASE_URL}/logs`);
  },
};
