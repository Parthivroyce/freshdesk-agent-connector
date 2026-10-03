import React from 'react';
import { 
  ShieldCheck, 
  Key, 
  Clock, 
  Server, 
  Lock, 
  AlertOctagon, 
  CheckCircle2, 
  XCircle,
  FileCode
} from 'lucide-react';
import { SafeAppConfig } from '../types.js';

interface ConfigSecurityViewProps {
  config: SafeAppConfig | null;
}

export const ConfigSecurityView: React.FC<ConfigSecurityViewProps> = ({ config }) => {
  const isDemo = config?.demo_mode ?? true;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Security Architecture & Guardrails Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Forward-Deployed Engineer specifications for production merchant agent connectors.
          </p>
        </div>
        <span className="bg-blue-950 text-blue-300 border border-blue-800/60 text-xs font-mono px-2 py-1 rounded">
          Status: {isDemo ? 'Demo Mode Active' : 'Live Freshdesk Active'}
        </span>
      </div>

      {/* Permissions Matrix: CAN vs CANNOT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* What Agent CAN Do */}
        <div className="p-5 rounded-xl border border-emerald-900/50 bg-emerald-950/10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            What the Agent CAN Do (Approved Read Primitives)
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-mono">✓</span>
              <span><strong>list_tickets:</strong> Paginate and filter merchant support tickets by status and priority.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-mono">✓</span>
              <span><strong>get_ticket:</strong> Retrieve normalized ticket metadata, tags, and custom fields.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-mono">✓</span>
              <span><strong>search_tickets:</strong> Query tickets by subject, keyword, or requester details.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-mono">✓</span>
              <span><strong>list_ticket_conversations:</strong> Inspect chronologically ordered discussion threads.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-mono">✓</span>
              <span><strong>get_ticket_summary:</strong> Generate deterministic executive briefings and next steps.</span>
            </li>
          </ul>
        </div>

        {/* What Agent CANNOT Do */}
        <div className="p-5 rounded-xl border border-rose-900/50 bg-rose-950/10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-rose-400 font-semibold">
            <XCircle className="w-4 h-4 text-rose-400" />
            What the Agent CANNOT Do (Enforced Guardrails)
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-mono">✗</span>
              <span><strong>Cannot create tickets:</strong> No POST /api/v2/tickets mutation exists in the interface.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-mono">✗</span>
              <span><strong>Cannot modify or resolve tickets:</strong> Status mutations are strictly prohibited.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-mono">✗</span>
              <span><strong>Cannot post replies or notes:</strong> Outbound customer communications cannot be sent.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-mono">✗</span>
              <span><strong>Cannot delete tickets or customer data:</strong> Irreversible operations are nonexistent.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-mono">✗</span>
              <span><strong>Cannot execute arbitrary endpoints:</strong> Tool execution is whitelisted through a closed enum.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Rate Limit Strategy */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-slate-200">Rate Limiting & Transient Resilience Architecture</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          Freshdesk API v2 enforces account-level rate limits and returns <code>HTTP 429 Too Many Requests</code> with an optional <code>Retry-After</code> header. The connector implements a bounded exponential backoff policy:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="font-mono text-[11px] text-purple-400 uppercase font-semibold">Attempt 1</div>
            <div className="text-slate-300 mt-1">If 429 received, extract <code>Retry-After</code> header (or default to 2s backoff).</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="font-mono text-[11px] text-purple-400 uppercase font-semibold">Attempt 2</div>
            <div className="text-slate-300 mt-1">Exponential backoff with jitter: <code>min(2^attempt * 1000, 10000)ms</code>.</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="font-mono text-[11px] text-purple-400 uppercase font-semibold">Attempt 3 (Final)</div>
            <div className="text-slate-300 mt-1">Final retry. If still 429, throws normalized <code>RATE_LIMITED</code> AppError.</div>
          </div>
        </div>
      </div>

      {/* Environment Configuration Guide */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-200">Environment Variables Reference (.env.example)</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Zero credentials in git / frontend</span>
        </div>

        <div className="bg-slate-950 rounded-lg p-3.5 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
          <pre>{`# When FRESHDESK_API_KEY is omitted, connector boots in DEMO_MODE=true
DEMO_MODE=true

# Freshdesk REST API Credentials (NEVER commit actual values)
FRESHDESK_DOMAIN=yourcompany.freshdesk.com
FRESHDESK_API_KEY=your_freshdesk_api_key_here

# Network Resilience
REQUEST_TIMEOUT_MS=10000
MAX_RETRIES=3

# Optional LLM Summarization (disabled by default; uses deterministic engine when unset)
ENABLE_LLM_SUMMARY=false`}</pre>
        </div>
      </div>
    </div>
  );
};
