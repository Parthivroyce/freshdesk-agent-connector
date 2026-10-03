import React from 'react';
import { 
  Server, 
  ShieldCheck, 
  Terminal, 
  Inbox, 
  Activity, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Cpu,
  Layers,
  CheckCircle2,
  Database
} from 'lucide-react';
import { SafeAppConfig, Ticket, McpTool, LogEntry } from '../types.js';
import { StatusBadge } from '../components/StatusBadge.js';

interface DashboardViewProps {
  config: SafeAppConfig | null;
  tickets: Ticket[];
  tools: McpTool[];
  recentLogs: LogEntry[];
  onNavigateToTool: (toolName: string) => void;
  onSelectTicket: (ticketId: number) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  config,
  tickets,
  tools,
  recentLogs,
  onNavigateToTool,
  onSelectTicket,
  onNavigateTab,
}) => {
  const isDemo = config?.demo_mode ?? true;
  const openCount = tickets.filter(t => t.status === 'open').length;
  const pendingCount = tickets.filter(t => t.status === 'pending').length;
  const urgentCount = tickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length;

  const successfulCalls = recentLogs.filter(l => l.status === 'SUCCESS').length;
  const totalCalls = recentLogs.filter(l => l.action === 'tool_execution').length;
  const successRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Hero / System Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Connector Mode Card */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Connector Mode</span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${
              isDemo 
                ? 'bg-amber-950/70 text-amber-300 border-amber-800/60' 
                : 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isDemo ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              {isDemo ? 'DEMO MODE' : 'LIVE FRESHDESK'}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-sm font-semibold text-slate-100 truncate">
              {config?.active_provider_name || 'DemoProvider'}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isDemo ? '10 fictional Razorpay merchant tickets loaded' : 'Connected to Freshdesk REST API v2'}
            </p>
          </div>
        </div>

        {/* Security & Guardrails Card */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Agent Guardrails</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-100">Strict Read-Only</span>
              <span className="bg-emerald-950 text-emerald-400 text-[10px] font-mono px-1.5 py-0.5 rounded border border-emerald-800/50 font-semibold">
                ENFORCED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Zero mutation / delete / reply permissions for agent
            </p>
          </div>
        </div>

        {/* Available MCP Tools Card */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">MCP Tools</span>
            <Terminal className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">{tools.length || 5}</span>
              <span className="text-xs text-slate-400 font-mono">Tools Registered</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              JSON Schema & Zod validated primitives
            </p>
          </div>
        </div>

        {/* Rate Limiting Resilience Card */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Rate Limit Policy</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-slate-100">HTTP 429 Backoff</span>
              <span className="text-xs text-purple-400 font-mono">Max {config?.max_retries || 3} Retries</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Bounded exponential backoff with Retry-After parser
            </p>
          </div>
        </div>
      </div>

      {/* Architecture Topology View */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-200">Connector Architecture Topology</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Pluggable Provider Pattern</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center text-xs">
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/70 flex flex-col justify-center items-center">
            <Cpu className="w-5 h-5 text-indigo-400 mb-1" />
            <span className="font-semibold text-slate-200">AI Agent Studio</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Natural language query</span>
          </div>

          <div className="flex items-center justify-center text-slate-600 font-mono">
            <span>──[ MCP Tools ]──►</span>
          </div>

          <div className="p-3 rounded-lg border border-blue-900/60 bg-blue-950/20 flex flex-col justify-center items-center">
            <ShieldCheck className="w-5 h-5 text-blue-400 mb-1" />
            <span className="font-semibold text-blue-300">Tool Layer & Guardrails</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Zod validation + Read-only</span>
          </div>

          <div className="flex items-center justify-center text-slate-600 font-mono">
            <span>──[ Dispatch ]──►</span>
          </div>

          <div className="p-3 rounded-lg border border-emerald-900/60 bg-emerald-950/20 flex flex-col justify-center items-center">
            <Database className="w-5 h-5 text-emerald-400 mb-1" />
            <span className="font-semibold text-emerald-300">
              {isDemo ? 'DemoProvider' : 'Freshdesk REST API'}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              {isDemo ? 'Fictional Razorpay Data' : 'Official Freshdesk API v2'}
            </span>
          </div>
        </div>
      </div>

      {/* Available Tools Quick Grid & Recent Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Agent Tools */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-200">Exposed MCP Agent Tools</h3>
            </div>
            <button
              onClick={() => onNavigateTab('explorer')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              Open Tool Explorer <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {tools.map(tool => (
              <div
                key={tool.name}
                onClick={() => onNavigateToTool(tool.name)}
                className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60 transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-blue-300">{tool.name}</span>
                    <span className="bg-slate-800 text-slate-400 text-[10px] font-mono px-1 rounded">read-only</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{tool.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0 ml-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Priority Merchant Tickets */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-200">Active Support Tickets</h3>
            </div>
            <button
              onClick={() => onNavigateTab('tickets')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              View All ({tickets.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {tickets.slice(0, 5).map(ticket => (
              <div
                key={ticket.id}
                onClick={() => onSelectTicket(ticket.id)}
                className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">#{ticket.id}</span>
                    <span className="text-xs font-medium text-slate-200 truncate">{ticket.subject}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span>{ticket.requester.name}</span>
                    <span>•</span>
                    <span className="font-mono text-[10px]">{ticket.created_at.slice(0, 10)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <StatusBadge type="status" value={ticket.status} />
                  <StatusBadge type="priority" value={ticket.priority} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tool Invocations Stream */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-200">Recent Safe Observability Logs</h3>
          </div>
          <button
            onClick={() => onNavigateTab('logs')}
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
          >
            All Logs <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No tool calls recorded yet. Execute a tool from the Tool Explorer to view live telemetry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <tr>
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Request ID</th>
                  <th className="pb-2">Tool Name</th>
                  <th className="pb-2">Duration</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {recentLogs.slice(0, 6).map(log => (
                  <tr key={log.id} className="hover:bg-slate-900/40">
                    <td className="py-2 text-slate-400 text-[11px] whitespace-nowrap">
                      {log.timestamp.slice(11, 19)}
                    </td>
                    <td className="py-2 text-slate-300 font-semibold text-[11px]">{log.requestId}</td>
                    <td className="py-2 text-blue-400">{log.toolName || log.action}</td>
                    <td className="py-2 text-slate-400">
                      {log.durationMs !== undefined ? `${log.durationMs}ms` : '-'}
                    </td>
                    <td className="py-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                            : log.status === 'ERROR'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2 text-slate-400 max-w-xs truncate font-sans text-xs">
                      {log.message || log.errorCode || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
