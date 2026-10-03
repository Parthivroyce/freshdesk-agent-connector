import React from 'react';
import { BookOpen, Terminal, Code, HelpCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { McpTool } from '../types.js';
import { JsonViewer } from '../components/JsonViewer.js';

interface DocsViewProps {
  tools: McpTool[];
}

export const DocsView: React.FC<DocsViewProps> = ({ tools }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          Freshdesk Agent Connector Documentation
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Model Context Protocol (MCP) compliant tool interface specifications for AI Agent Studio.
        </p>
      </div>

      {/* Available Tools Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Registered Tool Specifications</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Tool Name</th>
                <th className="py-2.5 px-3">Purpose</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Required Inputs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              <tr>
                <td className="py-3 px-3 text-blue-400 font-semibold">list_tickets</td>
                <td className="py-3 px-3 text-slate-300 font-sans">
                  Retrieve paginated Freshdesk tickets with status/priority filters.
                </td>
                <td className="py-3 px-3"><span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded text-[10px]">Read-Only</span></td>
                <td className="py-3 px-3 text-slate-400">None (defaults: page 1, per_page 20)</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-blue-400 font-semibold">get_ticket</td>
                <td className="py-3 px-3 text-slate-300 font-sans">
                  Fetch single ticket metadata, requester, tags, and custom fields.
                </td>
                <td className="py-3 px-3"><span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded text-[10px]">Read-Only</span></td>
                <td className="py-3 px-3 text-amber-300">ticket_id (integer)</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-blue-400 font-semibold">search_tickets</td>
                <td className="py-3 px-3 text-slate-300 font-sans">
                  Query tickets by issue keywords, error codes, or customer name.
                </td>
                <td className="py-3 px-3"><span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded text-[10px]">Read-Only</span></td>
                <td className="py-3 px-3 text-amber-300">query (string)</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-blue-400 font-semibold">list_ticket_conversations</td>
                <td className="py-3 px-3 text-slate-300 font-sans">
                  Retrieve chronological thread of replies and merchant messages.
                </td>
                <td className="py-3 px-3"><span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded text-[10px]">Read-Only</span></td>
                <td className="py-3 px-3 text-amber-300">ticket_id (integer)</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-blue-400 font-semibold">get_ticket_summary</td>
                <td className="py-3 px-3 text-slate-300 font-sans">
                  Generate structured briefing: root cause, sentiments, next steps.
                </td>
                <td className="py-3 px-3"><span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded text-[10px]">Read-Only</span></td>
                <td className="py-3 px-3 text-amber-300">ticket_id (integer)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent Usage Mapping Examples */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Natural Language Agent Prompt Mapping</h3>
        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="text-slate-400 font-mono text-[11px]">User Prompt:</div>
              <div className="text-slate-100 font-medium mt-0.5">"Show me the latest open support tickets."</div>
            </div>
            <div className="text-blue-300 font-mono bg-slate-900 p-2 rounded border border-slate-800 text-[11px]">
              list_tickets({`{ status: "open", page: 1, per_page: 20 }`})
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="text-slate-400 font-mono text-[11px]">User Prompt:</div>
              <div className="text-slate-100 font-medium mt-0.5">"Find tickets related to failed payments or UPI double charges."</div>
            </div>
            <div className="text-blue-300 font-mono bg-slate-900 p-2 rounded border border-slate-800 text-[11px]">
              search_tickets({`{ query: "payment failed", page: 1 }`})
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="text-slate-400 font-mono text-[11px]">User Prompt:</div>
              <div className="text-slate-100 font-medium mt-0.5">"What did the customer and support agent discuss in ticket 1001?"</div>
            </div>
            <div className="text-blue-300 font-mono bg-slate-900 p-2 rounded border border-slate-800 text-[11px]">
              list_ticket_conversations({`{ ticket_id: 1001 }`})
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="text-slate-400 font-mono text-[11px]">User Prompt:</div>
              <div className="text-slate-100 font-medium mt-0.5">"Summarize ticket 1001 and recommend next steps."</div>
            </div>
            <div className="text-blue-300 font-mono bg-slate-900 p-2 rounded border border-slate-800 text-[11px]">
              get_ticket_summary({`{ ticket_id: 1001 }`})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
