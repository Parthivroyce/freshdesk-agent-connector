import { env } from '../config/env.js';
import { 
  NormalizedTicket, 
  NormalizedConversation, 
  NormalizedPaginatedResponse,
  TicketStatus,
  TicketPriority 
} from '../schemas/ticket.js';
import { 
  AppError, 
  RateLimitError, 
  AuthenticationError, 
  NotFoundError, 
  normalizeHttpStatusError 
} from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface FreshdeskClientOptions {
  domain?: string;
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  fetchFn?: typeof fetch;
}

export class FreshdeskClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: FreshdeskClientOptions = {}) {
    this.apiKey = options.apiKey || env.FRESHDESK_API_KEY;
    const domain = options.domain || env.FRESHDESK_DOMAIN;
    this.baseUrl = options.baseUrl || env.FRESHDESK_API_BASE_URL || (domain ? `https://${domain}` : '');
    this.timeoutMs = options.timeoutMs ?? env.REQUEST_TIMEOUT_MS;
    this.maxRetries = options.maxRetries ?? env.MAX_RETRIES;
    this.fetchImpl = options.fetchFn || globalThis.fetch;
  }

  private getAuthHeader(): string {
    if (!this.apiKey) {
      throw new AuthenticationError('Freshdesk API key is missing in environment variables.');
    }
    // Freshdesk uses HTTP Basic Auth with the API key as the username and 'X' as the dummy password
    const token = Buffer.from(`${this.apiKey}:X`).toString('base64');
    return `Basic ${token}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Secure, bounded HTTP request executor with exponential backoff & 429 Retry-After handling.
   */
  async request<T>(path: string, queryParams: Record<string, string | number | undefined> = {}): Promise<{ data: T; headers: Headers }> {
    if (!this.baseUrl) {
      throw new AuthenticationError('Freshdesk Domain is not configured.');
    }

    // Build URL safely without path traversal
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(cleanPath, this.baseUrl);

    for (const [key, val] of Object.entries(queryParams)) {
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.set(key, String(val));
      }
    }

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < this.maxRetries) {
      attempt++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await this.fetchImpl(url.toString(), {
          method: 'GET',
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Razorpay-Freshdesk-Agent-Connector/1.0',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check for Rate Limit (HTTP 429)
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get('Retry-After');
          const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : Math.pow(2, attempt);
          const waitTimeMs = Math.min(retryAfterSeconds * 1000, 10000); // Bounded to 10s max backoff in connector

          logger.info(`Freshdesk rate limit (429) hit on attempt ${attempt}/${this.maxRetries}. Backing off ${waitTimeMs}ms.`, {
            action: 'rate_limit_backoff',
          });

          if (attempt >= this.maxRetries) {
            throw new RateLimitError(`Freshdesk rate limit reached after ${this.maxRetries} attempts.`, retryAfterSeconds);
          }

          await this.sleep(waitTimeMs);
          continue;
        }

        // Check for 5xx Server Errors (Transient)
        if (response.status >= 500 && response.status <= 504) {
          if (attempt < this.maxRetries) {
            const backoffMs = Math.pow(2, attempt) * 300 + Math.random() * 200;
            logger.info(`Freshdesk server error (${response.status}) on attempt ${attempt}. Retrying in ${Math.round(backoffMs)}ms...`);
            await this.sleep(backoffMs);
            continue;
          }
          throw normalizeHttpStatusError(response.status, `Freshdesk upstream error: ${response.statusText}`);
        }

        // Check for 4xx Non-retryable Client Errors
        if (!response.ok) {
          let errorText = '';
          try {
            const errorJson = await response.json();
            errorText = errorJson.message || JSON.stringify(errorJson.errors || errorJson);
          } catch {
            errorText = response.statusText;
          }
          throw normalizeHttpStatusError(response.status, errorText);
        }

        const data = (await response.json()) as T;
        return { data, headers: response.headers };
      } catch (err: any) {
        clearTimeout(timeoutId);

        if (err.name === 'AbortError') {
          lastError = normalizeHttpStatusError(408, `Freshdesk request timed out after ${this.timeoutMs}ms`);
        } else if (err instanceof AppError) {
          lastError = err;
          // If non-retryable (e.g., 401, 403, 404), fail immediately
          if (!err.retryable) {
            throw err;
          }
        } else {
          lastError = new AppError({
            code: 'INTERNAL_ERROR',
            message: err.message || 'Unknown network error during Freshdesk request',
            statusCode: 500,
            retryable: true,
          });
        }

        if (attempt >= this.maxRetries) {
          throw lastError;
        }

        // Exponential backoff for retryable errors
        const backoffMs = Math.pow(2, attempt) * 250;
        await this.sleep(backoffMs);
      }
    }

    throw lastError || new AppError({
      code: 'INTERNAL_ERROR',
      message: 'Freshdesk request failed after retries.',
      statusCode: 500,
    });
  }

  // ==========================================
  // NORMALIZATION HELPERS
  // ==========================================

  public normalizeStatus(rawStatus?: number): TicketStatus {
    switch (rawStatus) {
      case 2:
        return 'open';
      case 3:
        return 'pending';
      case 4:
        return 'resolved';
      case 5:
        return 'closed';
      default:
        return 'open';
    }
  }

  public normalizePriority(rawPriority?: number): TicketPriority {
    switch (rawPriority) {
      case 1:
        return 'low';
      case 2:
        return 'medium';
      case 3:
        return 'high';
      case 4:
        return 'urgent';
      default:
        return 'medium';
    }
  }

  public mapStatusToFreshdesk(status?: string): number | undefined {
    switch (status?.toLowerCase()) {
      case 'open':
        return 2;
      case 'pending':
        return 3;
      case 'resolved':
        return 4;
      case 'closed':
        return 5;
      default:
        return undefined;
    }
  }

  public normalizeTicket(raw: any): NormalizedTicket {
    const status = this.normalizeStatus(raw.status);
    const priority = this.normalizePriority(raw.priority);

    return {
      id: Number(raw.id),
      subject: String(raw.subject || 'No Subject'),
      description_text: String(raw.description_text || raw.description || ''),
      status,
      status_code: raw.status ?? 2,
      priority,
      priority_code: raw.priority ?? 2,
      requester: {
        id: raw.requester_id,
        name: raw.requester?.name || raw.custom_fields?.merchant_name || `Merchant Contact #${raw.requester_id || raw.id}`,
        email: raw.requester?.email || raw.custom_fields?.merchant_email || 'merchant@example.com',
        phone: raw.requester?.phone,
      },
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at || new Date().toISOString(),
      due_by: raw.due_by,
      type: raw.type,
      custom_fields: raw.custom_fields,
      source: raw.source ? `Freshdesk (source_code: ${raw.source})` : 'Freshdesk API',
    };
  }

  public normalizeConversation(raw: any): NormalizedConversation {
    return {
      id: Number(raw.id),
      ticket_id: Number(raw.ticket_id),
      body_text: String(raw.body_text || raw.body || '').replace(/<[^>]*>/g, '').trim(),
      user_id: raw.user_id,
      author_name: raw.author_name || (raw.incoming ? 'Merchant / Customer' : 'Support Agent'),
      author_email: raw.from_email || raw.to_emails?.[0],
      incoming: Boolean(raw.incoming),
      private: Boolean(raw.private),
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at || new Date().toISOString(),
      attachments: Array.isArray(raw.attachments)
        ? raw.attachments.map((a: any) => ({
            id: Number(a.id),
            name: String(a.name || 'attachment'),
            content_url: a.attachment_url,
            size: a.size,
            content_type: a.content_type,
          }))
        : undefined,
    };
  }

  // ==========================================
  // FRESHDESK ENDPOINTS
  // ==========================================

  /**
   * GET /api/v2/tickets
   */
  async getTickets(params: {
    page?: number;
    per_page?: number;
    status?: string;
    priority?: string;
  }): Promise<NormalizedPaginatedResponse<NormalizedTicket>> {
    const page = params.page || 1;
    const perPage = params.per_page || 20;

    const query: Record<string, any> = {
      page,
      per_page: perPage,
      include: 'requester',
    };

    if (params.status && params.status !== 'all') {
      const statusCode = this.mapStatusToFreshdesk(params.status);
      if (statusCode) query.filter = `status:${statusCode}`;
    }

    const { data } = await this.request<any[]>('/api/v2/tickets', query);
    const tickets = Array.isArray(data) ? data.map(t => this.normalizeTicket(t)) : [];

    return {
      data: tickets,
      pagination: {
        page,
        per_page: perPage,
        has_more: tickets.length === perPage,
      },
    };
  }

  /**
   * GET /api/v2/tickets/{id}
   */
  async getTicket(ticketId: number): Promise<NormalizedTicket> {
    const { data } = await this.request<any>(`/api/v2/tickets/${ticketId}`, {
      include: 'requester',
    });
    return this.normalizeTicket(data);
  }

  /**
   * GET /api/v2/tickets/{id}/conversations
   */
  async getTicketConversations(
    ticketId: number,
    params: { page?: number; per_page?: number } = {}
  ): Promise<NormalizedPaginatedResponse<NormalizedConversation>> {
    const page = params.page || 1;
    const perPage = params.per_page || 50;

    const { data } = await this.request<any[]>(`/api/v2/tickets/${ticketId}/conversations`, {
      page,
      per_page: perPage,
    });

    const conversations = Array.isArray(data) ? data.map(c => this.normalizeConversation(c)) : [];

    return {
      data: conversations,
      pagination: {
        page,
        per_page: perPage,
        has_more: conversations.length === perPage,
      },
    };
  }

  /**
   * GET /api/v2/search/tickets?query="..."
   */
  async searchTickets(params: {
    query: string;
    page?: number;
    per_page?: number;
  }): Promise<NormalizedPaginatedResponse<NormalizedTicket>> {
    const page = params.page || 1;
    const perPage = params.per_page || 20;

    // Freshdesk search format: query="subject:'...' OR tag:'...'" or keyword search
    // We sanitize and enclose search term in quotes
    const sanitizedQuery = encodeURIComponent(`"${params.query.replace(/"/g, '')}"`);

    const { data } = await this.request<{ results: any[]; total?: number }>('/api/v2/search/tickets', {
      query: sanitizedQuery,
      page,
    });

    const rawResults = data?.results || (Array.isArray(data) ? data : []);
    const tickets = rawResults.map(t => this.normalizeTicket(t));

    return {
      data: tickets,
      pagination: {
        page,
        per_page: perPage,
        has_more: tickets.length === perPage,
        total_count: data?.total,
      },
    };
  }
}
