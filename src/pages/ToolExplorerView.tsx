import React, { useState } from 'react';
import { 
  Play, 
  Terminal, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Code, 
  FileText, 
  RotateCcw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { McpTool } from '../types.js';
import { api } from '../services/api.js';
import { JsonViewer } from '../components/JsonViewer.js';

interface ToolExplorerViewProps {
  tools: McpTool[];
  initialToolName?: string;
  initialPayload?: any;
}

const TOOL_EXAMPLES: Record<string, {
  presets: Array<{ label: string; payload: any }>;
  defaultPayload: any;
}> = {
  list_tickets: {
    defaultPayload: { page: 1, per_page: 5, status: 'open' },
    presets: [
      { label: 'All Open Tickets', payload: { page: 1, per_page: 10, status: 'open' } },
      { label: 'Urgent Priority', payload: { page: 1, per_page: 5, priority: 'urgent' } },
      { label: 'Pending Tickets', payload: { page: 1, per_page: 5, status: 'pending' } },
      { label: 'Invalid Page Bound (Guardrail Test)', payload: { page: 0, per_page: 20 } },
    ],
  },
  get_ticket: {
    defaultPayload: { ticket_id: 1001 },
    presets: [
      { label: 'Ticket #1001 (Autopay)', payload: { ticket_id: 1001 } },
      { label: 'Ticket #1002 (Refund Delay)', payload: { ticket_id: 1002 } },
      { label: 'Ticket #1003 (Webhook LMS)', payload: { ticket_id: 1003 } },
      { label: 'Ticket #1008 (Settlement)', payload: { ticket_id: 1008 } },
      { label: 'Non-existent ID (404 Test)', payload: { ticket_id: 99999 } },
      { label: 'Invalid String ID (Validation Test)', payload: { ticket_id: 'not_an_id' } },
    ],
  },
  search_tickets: {
    defaultPayload: { query: 'payment failed', page: 1, per_page: 5 },
    presets: [
      { label: 'Query: "payment"', payload: { query: 'payment', page: 1, per_page: 5 } },
      { label: 'Query: "refund"', payload: { query: 'refund', page: 1, per_page: 5 } },
      { label: 'Query: "mandate"', payload: { query: 'mandate', page: 1, per_page: 5 } },
      { label: 'Query: "settlement"', payload: { query: 'settlement', page: 1, per_page: 5 } },
      { label: 'Empty Query (Validation Test)', payload: { query: '' } },
    ],
  },
  list_ticket_conversations: {
    defaultPayload: { ticket_id: 1001, page: 1, per_page: 10 },
    presets: [
      { label: 'Ticket #1001 Thread', payload: { ticket_id: 1001, page: 1, per_page: 10 } },
      { label: 'Ticket #1002 Thread', payload: { ticket_id: 1002, page: 1, per_page: 10 } },
      { label: 'Ticket #1003 Thread', payload: { ticket_id: 1003, page: 1, per_page: 10 } },
      { label: 'Ticket #1008 Thread', payload: { ticket_id: 1008, page: 1, per_page: 10 } },
    ],
  },
  get_ticket_summary: {
    defaultPayload: { ticket_id: 1001 },
    presets: [
      { label: 'Summarize #1001 (Autopay)', payload: { ticket_id: 1001 } },
      { label: 'Summarize #1002 (Refund Delay)', payload: { ticket_id: 1002 } },
      { label: 'Summarize #1003 (Webhook LMS)', payload: { ticket_id: 1003 } },
      { label: 'Summarize #1008 (Settlement)', payload: { ticket_id: 1008 } },
    ],
  },
};

export const ToolExplorerView: React.FC<ToolExplorerViewProps> = ({
  tools,
  initialToolName,
  initialPayload,
}) => {
  const [selectedToolName, setSelectedToolName] = useState<string>(
    initialToolName || tools[0]?.name || 'list_tickets'
  );

  const selectedTool = tools.find(t => t.name === selectedToolName) || tools[0];

  const [inputJsonString, setInputJsonString] = useState<string>(() => {
    if (initialPayload) return JSON.stringify(initialPayload, null, 2);
    const ex = TOOL_EXAMPLES[selectedToolName]?.defaultPayload || {};
    return JSON.stringify(ex, null, 2);
  });

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any | null>(null);
  const [executionDuration, setExecutionDuration] = useState<number | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const handleSelectTool = (toolName: string) => {
    setSelectedToolName(toolName);
    const ex = TOOL_EXAMPLES[toolName]?.defaultPayload || {};
    setInputJsonString(JSON.stringify(ex, null, 2));
    setExecutionResult(null);
    setExecutionError(null);
    setExecutionDuration(null);
  };

  const handleApplyPreset = (payload: any) => {
    setInputJsonString(JSON.stringify(payload, null, 2));
  };

  const handleRunTool = async () => {
    setIsExecuting(true);
    setExecutionError(null);
    setExecutionResult(null);
    setExecutionDuration(null);

    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(inputJsonString);
    } catch (err: any) {
      setExecutionError(`Invalid JSON in tool input: ${err.message}`);
      setIsExecuting(false);
      return;
    }

    try {
      const response = await api.executeTool(selectedToolName, parsedPayload);
      setExecutionDuration(response.duration_ms);
      setExecutionResult(response.result);
    } catch (err: any) {
      setExecutionError(err.message || 'Tool execution encountered an error');
      setExecutionResult(err.details || null);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tool Selector Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              Select Agent Tool Primitive
            </h3>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded">
            <ShieldCheck className="w-3.5 h-3.5" />
            Strict Read-Only
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {tools.map(tool => {
            const isSelected = tool.name === selectedToolName;
            return (
              <button
                key={tool.name}
                onClick={() => handleSelectTool(tool.name)}
                className={`px-3 py-2 rounded-lg text-left transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500/60 text-blue-300 shadow-sm shadow-blue-500/10'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="font-mono text-xs font-semibold truncate">{tool.name}</div>
                <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  {tool.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tool Runner Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Builder & Presets */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Tool Description
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                MCP protocol compatible
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {selectedTool?.description}
            </p>

            {/* Presets */}
            {TOOL_EXAMPLES[selectedToolName]?.presets && (
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[10px] font-mono uppercase text-slate-400 mb-1.5">
                  Quick Scenario Presets:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TOOL_EXAMPLES[selectedToolName].presets.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleApplyPreset(preset.payload)}
                      className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* JSON Input Editor */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-blue-400" />
                Input Arguments (JSON)
              </span>
              <button
                onClick={() => {
                  const def = TOOL_EXAMPLES[selectedToolName]?.defaultPayload || {};
                  setInputJsonString(JSON.stringify(def, null, 2));
                }}
                className="text-[11px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            <textarea
              value={inputJsonString}
              onChange={e => setInputJsonString(e.target.value)}
              rows={8}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-blue-300 focus:outline-none focus:border-blue-500 shadow-inner"
              placeholder="{}"
            />

            {/* Run Action Button */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 font-mono">
                Validated with Zod runtime schema
              </span>
              <button
                onClick={handleRunTool}
                disabled={isExecuting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Play className={`w-3.5 h-3.5 fill-current ${isExecuting ? 'animate-pulse' : ''}`} />
                <span>{isExecuting ? 'Executing...' : `Execute ${selectedToolName}`}</span>
              </button>
            </div>
          </div>

          {/* Input Schema Inspector */}
          {selectedTool?.inputSchema && (
            <JsonViewer
              title="MCP Tool inputSchema Definition"
              data={selectedTool.inputSchema}
              maxHeight="max-h-56"
            />
          )}
        </div>

        {/* Right Column: Execution Output & Telemetry */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                Execution Result
              </span>

              {executionDuration !== null && (
                <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>Duration: {executionDuration}ms</span>
                </span>
              )}
            </div>

            {/* Error banner if execution failed */}
            {executionError && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Tool Execution Failure</div>
                  <div className="font-mono text-[11px] mt-0.5">{executionError}</div>
                </div>
              </div>
            )}

            {/* Success indicator */}
            {!executionError && executionResult && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Tool returned 200 OK normalized response:</span>
              </div>
            )}

            {/* Output Display */}
            {executionResult ? (
              <JsonViewer
                title={`Output: ${selectedToolName}`}
                data={executionResult}
                maxHeight="max-h-[480px]"
              />
            ) : !executionError ? (
              <div className="py-24 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
                Click "Execute {selectedToolName}" to invoke the tool and inspect normalized output.
              </div>
            ) : null}
          </div>

          {/* Expected Output Schema */}
          {selectedTool?.outputSchema && (
            <JsonViewer
              title="MCP Tool outputSchema Specification"
              data={selectedTool.outputSchema}
              maxHeight="max-h-56"
            />
          )}
        </div>
      </div>
    </div>
  );
};
