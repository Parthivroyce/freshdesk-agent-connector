import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MessageSquare, 
  Sparkles, 
  Code, 
  RefreshCw, 
  AlertCircle,
  Tag,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Ticket, Conversation, TicketSummary } from '../types.js';
import { api } from '../services/api.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { JsonViewer } from '../components/JsonViewer.js';

interface TicketDetailsViewProps {
  ticketId: number;
  onBack: () => void;
  onRunTool: (toolName: string, payload: any) => void;
}

export const TicketDetailsView: React.FC<TicketDetailsViewProps> = ({
  ticketId,
  onBack,
  onRunTool,
}) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'conversations' | 'summary' | 'raw'>('conversations');
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [ticketData, convData] = await Promise.all([
          api.getTicket(ticketId),
          api.getTicketConversations(ticketId),
        ]);
        if (isMounted) {
          setTicket(ticketData);
          setConversations(convData.data);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load ticket details');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [ticketId]);

  const handleFetchSummary = async () => {
    if (summary) return;
    setIsGeneratingSummary(true);
    try {
      const summaryData = await api.getTicketSummary(ticketId);
      setSummary(summaryData);
    } catch (err: any) {
      console.error('Failed to get ticket summary:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-400 mb-2" />
        Retrieving ticket #{ticketId} from connector...
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-6 rounded-xl border border-rose-900/60 bg-rose-950/20 text-rose-300 text-xs space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span className="font-semibold text-sm">Error Loading Ticket #{ticketId}</span>
        </div>
        <p>{error || 'Ticket not found.'}</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-700 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to ticket list
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tickets
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onRunTool('get_ticket_summary', { ticket_id: ticketId })}
            className="flex items-center gap-1.5 bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Invoke get_ticket_summary Tool</span>
          </button>
        </div>
      </div>

      {/* Ticket Header & Metadata Card */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-sm font-semibold text-slate-400">#{ticket.id}</span>
              <StatusBadge type="status" value={ticket.status} />
              <StatusBadge type="priority" value={ticket.priority} />
              {ticket.source && (
                <span className="bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-mono px-2 py-0.5 rounded">
                  {ticket.source}
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-100">{ticket.subject}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Created: {ticket.created_at.slice(0, 10)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Updated: {ticket.updated_at.slice(0, 10)}</span>
            </div>
          </div>
        </div>

        {/* Requester Profile Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-mono">Requester / Merchant</div>
              <div className="text-slate-200 font-medium">{ticket.requester.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-mono">Email Address</div>
              <div className="text-slate-200 font-mono text-[11px] truncate">{ticket.requester.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-mono">Tags</div>
              <div className="flex gap-1 flex-wrap mt-0.5">
                {ticket.tags.map(t => (
                  <span key={t} className="bg-slate-900 text-slate-400 px-1 rounded text-[10px] font-mono">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Description */}
        <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
          <div className="text-[11px] font-mono uppercase text-slate-500 font-semibold mb-1">
            Initial Issue Description
          </div>
          {ticket.description_text}
        </div>
      </div>

      {/* Tabs: Conversations, Deterministic Summary, Raw JSON */}
      <div className="border-b border-slate-800 flex items-center gap-4">
        <button
          onClick={() => setActiveTab('conversations')}
          className={`flex items-center gap-2 pb-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'conversations'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Conversation History ({conversations.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('summary');
            handleFetchSummary();
          }}
          className={`flex items-center gap-2 pb-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'summary'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Agent Deterministic Summary</span>
        </button>

        <button
          onClick={() => setActiveTab('raw')}
          className={`flex items-center gap-2 pb-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'raw'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Normalized Raw JSON</span>
        </button>
      </div>

      {/* Tab 1: Conversation History */}
      {activeTab === 'conversations' && (
        <div className="space-y-3">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No replies recorded on this ticket yet.
            </div>
          ) : (
            conversations.map((msg, index) => {
              const isMerchant = msg.incoming;
              return (
                <div
                  key={msg.id}
                  className={`p-4 rounded-xl border text-xs leading-relaxed transition-all ${
                    isMerchant
                      ? 'bg-slate-900/60 border-slate-800'
                      : 'bg-blue-950/20 border-blue-900/40 ml-4 md:ml-8'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{msg.author_name}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase ${
                          isMerchant
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                            : 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                        }`}
                      >
                        {isMerchant ? 'Merchant Query' : 'Razorpay Support'}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-300 font-sans whitespace-pre-wrap">{msg.body_text}</div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Deterministic Summary */}
      {activeTab === 'summary' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
          {isGeneratingSummary ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-400 mb-2" />
              Generating deterministic ticket summary...
            </div>
          ) : summary ? (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-1 flex items-center justify-between">
                  <span>Executive Overview</span>
                  <span className="text-[11px] font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/50">
                    Deterministic Engine (Zero LLM Dependency)
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                  {summary.summary}
                </p>
              </div>

              {/* Key Points */}
              <div>
                <div className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-2">
                  Key Identified Points & Entities
                </div>
                <ul className="space-y-1.5">
                  {summary.key_points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Steps */}
              {summary.suggested_next_steps && summary.suggested_next_steps.length > 0 && (
                <div>
                  <div className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-2">
                    Suggested Next Actions for Agent / Engineer
                  </div>
                  <div className="space-y-1.5">
                    {summary.suggested_next_steps.map((step, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-md bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-300 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">
              Click to generate summary.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Normalized Raw JSON */}
      {activeTab === 'raw' && (
        <div className="space-y-3">
          <JsonViewer title={`Normalized Ticket #${ticket.id} Payload`} data={ticket} maxHeight="max-h-96" />
          <JsonViewer title={`Conversations (${conversations.length}) Payload`} data={conversations} maxHeight="max-h-96" />
        </div>
      )}
    </div>
  );
};
