import { listTicketsTool, getTicketTool } from './tickets.js';
import { searchTicketsTool } from './search.js';
import { listTicketConversationsTool } from './conversations.js';
import { getTicketSummaryTool } from './summary.js';
import { TicketProvider } from '../providers/TicketProvider.js';
import { AppError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface McpToolDefinition {
  name: string;
  description: string;
  readOnly: boolean;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  validate: (input: unknown) => any;
  execute: (provider: TicketProvider, input: any) => Promise<any>;
}

// Registry of supported tools - STRICTLY READ-ONLY
export const TOOLS_REGISTRY: Record<string, McpToolDefinition> = {
  list_tickets: listTicketsTool,
  get_ticket: getTicketTool,
  search_tickets: searchTicketsTool,
  list_ticket_conversations: listTicketConversationsTool,
  get_ticket_summary: getTicketSummaryTool,
};

export function getMcpToolDefinitions(): Array<Omit<McpToolDefinition, 'validate' | 'execute'>> {
  return Object.values(TOOLS_REGISTRY).map(tool => ({
    name: tool.name,
    description: tool.description,
    readOnly: tool.readOnly,
    inputSchema: tool.inputSchema,
    outputSchema: tool.outputSchema,
  }));
}

export async function executeTool(
  toolName: string,
  rawInput: unknown,
  provider: TicketProvider,
  requestId = `req-${Date.now()}`
): Promise<{ toolName: string; duration_ms: number; result: any }> {
  const tool = TOOLS_REGISTRY[toolName];
  if (!tool) {
    const error = new AppError({
      code: 'METHOD_NOT_ALLOWED',
      message: `Tool '${toolName}' is not recognized or not allowed. Only registered read-only tools can be executed.`,
      statusCode: 404,
      retryable: false,
    });
    logger.toolCall({
      requestId,
      toolName,
      durationMs: 0,
      success: false,
      errorCode: error.code,
      message: error.message,
    });
    throw error;
  }

  const startTime = Date.now();
  let validatedInput: any;

  try {
    validatedInput = tool.validate(rawInput ?? {});
  } catch (err: any) {
    const duration = Date.now() - startTime;
    const validationError = new ValidationError(`Input validation failed for tool '${toolName}': ${err.message}`, err.errors || err);
    logger.toolCall({
      requestId,
      toolName,
      durationMs: duration,
      success: false,
      errorCode: validationError.code,
      message: validationError.message,
      params: typeof rawInput === 'object' && rawInput !== null ? (rawInput as Record<string, any>) : undefined,
    });
    throw validationError;
  }

  try {
    const result = await tool.execute(provider, validatedInput);
    const duration = Date.now() - startTime;

    logger.toolCall({
      requestId,
      toolName,
      durationMs: duration,
      success: true,
      params: validatedInput,
      message: `Tool '${toolName}' executed successfully on ${provider.name}`,
    });

    return {
      toolName,
      duration_ms: duration,
      result,
    };
  } catch (err: any) {
    const duration = Date.now() - startTime;
    const errorCode = err instanceof AppError ? err.code : 'TOOL_EXECUTION_ERROR';

    logger.toolCall({
      requestId,
      toolName,
      durationMs: duration,
      success: false,
      errorCode,
      message: err.message || 'Execution failure',
      params: validatedInput,
    });

    throw err;
  }
}
