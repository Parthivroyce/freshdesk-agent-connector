import { Router, Request, Response, NextFunction } from 'express';
import { env, getSafePublicConfig } from '../config/env.js';
import { TicketProvider } from '../providers/TicketProvider.js';
import { DemoProvider } from '../providers/DemoProvider.js';
import { FreshdeskProvider } from '../providers/FreshdeskProvider.js';
import { executeTool, getMcpToolDefinitions, TOOLS_REGISTRY } from '../tools/index.js';
import { logger } from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export function createApiRouter(): Router {
  const router = Router();

  // Initialize providers
  const demoProvider: TicketProvider = new DemoProvider();
  let freshdeskProvider: TicketProvider | null = null;

  try {
    if (env.FRESHDESK_API_KEY && env.FRESHDESK_DOMAIN) {
      freshdeskProvider = new FreshdeskProvider();
    }
  } catch (err) {
    console.warn('[API Router] FreshdeskProvider init deferred:', err);
  }

  // Active provider resolution: defaults to DemoProvider if DEMO_MODE=true or no credentials
  function getActiveProvider(req?: Request): TicketProvider {
    // If request header asks for live and live provider exists
    const forceLive = req?.headers['x-force-live-provider'] === 'true';
    if (forceLive && freshdeskProvider) {
      return freshdeskProvider;
    }

    if (!env.DEMO_MODE && freshdeskProvider) {
      return freshdeskProvider;
    }
    return demoProvider;
  }

  // GET /api/health
  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime_seconds: process.uptime(),
      version: '1.0.0',
      active_provider: getActiveProvider().name,
      demo_mode: getActiveProvider().isDemo,
      read_only_enforced: true,
    });
  });

  // GET /api/config
  router.get('/config', (_req: Request, res: Response) => {
    const active = getActiveProvider();
    res.json({
      ...getSafePublicConfig(),
      active_provider_name: active.name,
      active_provider_is_demo: active.isDemo,
      available_tools_count: Object.keys(TOOLS_REGISTRY).length,
    });
  });

  // GET /api/tools - Machine-readable tool schemas (MCP compliant)
  router.get('/tools', (_req: Request, res: Response) => {
    res.json({
      tools: getMcpToolDefinitions(),
    });
  });

  // POST /api/tools/:toolName/execute - Unified tool execution with Zod validation & logging
  router.post('/tools/:toolName/execute', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { toolName } = req.params;
      const provider = getActiveProvider(req);
      const executionResult = await executeTool(toolName, req.body, provider, req.id);
      res.json(executionResult);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/tickets - Direct REST endpoint delegating to list_tickets
  router.get('/tickets', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const perPage = req.query.per_page ? parseInt(String(req.query.per_page), 10) : 20;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const priority = typeof req.query.priority === 'string' ? req.query.priority : undefined;

      const provider = getActiveProvider(req);
      const result = await executeTool(
        'list_tickets',
        { page, per_page: perPage, status, priority },
        provider,
        req.id
      );
      res.json(result.result);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/tickets/search?q=
  router.get('/tickets/search', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = String(req.query.q || req.query.query || '').trim();
      if (!query) {
        throw new ValidationError('Query parameter "q" is required for search.');
      }
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const perPage = req.query.per_page ? parseInt(String(req.query.per_page), 10) : 20;

      const provider = getActiveProvider(req);
      const result = await executeTool(
        'search_tickets',
        { query, page, per_page: perPage },
        provider,
        req.id
      );
      res.json(result.result);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/tickets/:id
  router.get('/tickets/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ticketId = parseInt(req.params.id, 10);
      if (isNaN(ticketId) || ticketId <= 0) {
        throw new ValidationError('Invalid ticket ID format. Expected positive integer.');
      }
      const provider = getActiveProvider(req);
      const result = await executeTool('get_ticket', { ticket_id: ticketId }, provider, req.id);
      res.json(result.result);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/tickets/:id/conversations
  router.get('/tickets/:id/conversations', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ticketId = parseInt(req.params.id, 10);
      if (isNaN(ticketId) || ticketId <= 0) {
        throw new ValidationError('Invalid ticket ID format. Expected positive integer.');
      }
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const perPage = req.query.per_page ? parseInt(String(req.query.per_page), 10) : 50;

      const provider = getActiveProvider(req);
      const result = await executeTool(
        'list_ticket_conversations',
        { ticket_id: ticketId, page, per_page: perPage },
        provider,
        req.id
      );
      res.json(result.result);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/tickets/:id/summary
  router.get('/tickets/:id/summary', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ticketId = parseInt(req.params.id, 10);
      if (isNaN(ticketId) || ticketId <= 0) {
        throw new ValidationError('Invalid ticket ID format. Expected positive integer.');
      }
      const provider = getActiveProvider(req);
      const result = await executeTool(
        'get_ticket_summary',
        { ticket_id: ticketId },
        provider,
        req.id
      );
      res.json(result.result);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/logs - Real-time safe audit logs for the dashboard
  router.get('/logs', (_req: Request, res: Response) => {
    res.json({
      logs: logger.getRecentLogs(),
    });
  });

  return router;
}
