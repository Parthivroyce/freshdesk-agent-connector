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

// In-memory ring buffer to hold the last 150 safe logs for dashboard observability
const MAX_LOGS = 150;
const recentLogs: LogEntry[] = [];

// Sensitive keys to always sanitize
const SENSITIVE_KEY_REGEX = /(key|token|auth|secret|password|bearer|cookie|authorization)/i;

export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export const logger = {
  info(message: string, meta: Record<string, any> = {}) {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      requestId: meta.requestId || 'system',
      action: meta.action || 'system_event',
      toolName: meta.toolName,
      timestamp: new Date().toISOString(),
      durationMs: meta.durationMs,
      status: 'INFO',
      message,
      params: meta.params ? sanitizeObject(meta.params) : undefined,
    };
    this.record(entry);
  },

  toolCall(data: {
    requestId: string;
    toolName: string;
    durationMs: number;
    success: boolean;
    errorCode?: string;
    params?: Record<string, any>;
    message?: string;
  }) {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      requestId: data.requestId,
      action: 'tool_execution',
      toolName: data.toolName,
      timestamp: new Date().toISOString(),
      durationMs: data.durationMs,
      status: data.success ? 'SUCCESS' : 'ERROR',
      errorCode: data.errorCode,
      message: data.message,
      params: data.params ? sanitizeObject(data.params) : undefined,
    };
    this.record(entry);
  },

  error(message: string, meta: Record<string, any> = {}) {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      requestId: meta.requestId || 'system',
      action: meta.action || 'error_event',
      toolName: meta.toolName,
      timestamp: new Date().toISOString(),
      durationMs: meta.durationMs,
      status: 'ERROR',
      errorCode: meta.errorCode || 'UNKNOWN_ERROR',
      message,
      params: meta.params ? sanitizeObject(meta.params) : undefined,
    };
    this.record(entry);
  },

  record(entry: LogEntry) {
    recentLogs.unshift(entry);
    if (recentLogs.length > MAX_LOGS) {
      recentLogs.pop();
    }
    // Safe console output
    const tag = `[${entry.status}] [${entry.requestId}]`;
    const tool = entry.toolName ? ` [${entry.toolName}]` : '';
    const dur = entry.durationMs !== undefined ? ` (${entry.durationMs}ms)` : '';
    console.log(`${entry.timestamp} ${tag}${tool} ${entry.message || entry.action}${dur}`);
  },

  getRecentLogs(): LogEntry[] {
    return [...recentLogs];
  },

  clearLogs(): void {
    recentLogs.length = 0;
  }
};
