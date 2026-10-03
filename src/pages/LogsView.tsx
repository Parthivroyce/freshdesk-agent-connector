import React, { useState } from 'react';
import { ScrollText, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Filter } from 'lucide-react';
import { LogEntry } from '../types.js';
import { JsonViewer } from '../components/JsonViewer.js';

interface LogsViewProps {
  logs: LogEntry[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const LogsView: React.FC<LogsViewProps> = ({ logs, onRefresh, isRefreshing }) => {
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'ERROR'>('ALL');

  const filteredLogs = logs.filter(l => {
    if (statusFilter === 'ALL') return true;
    return l.status === statusFilter;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner & Filters */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-purple-400" />
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold">
              Connector Observability & Telemetry Stream
            </h2>
            <p className="text-[11px] text-slate-400">
              Safe in-memory audit log ring buffer (last 150 events). Sensitive credentials strictly redacted.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Events ({logs.length})</option>
            <option value="SUCCESS">Success Only</option>
            <option value="ERROR">Errors / Guardrails</option>
          </select>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-md px-2.5 py-1 text-xs text-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Log Table + Log Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No audit logs recorded for the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px] z-10">
                  <tr>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Request ID</th>
                    <th className="py-2.5 px-3">Tool Name / Action</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredLogs.map(log => {
                    const isSelected = selectedLog?.id === log.id;
                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-950/40 border-l-2 border-l-blue-400'
                            : 'hover:bg-slate-900/60'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap text-[11px]">
                          {log.timestamp.slice(11, 19)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 font-semibold text-[11px]">
                          {log.requestId}
                        </td>
                        <td className="py-2.5 px-3 text-blue-400">
                          {log.toolName || log.action}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {log.durationMs !== undefined ? `${log.durationMs}ms` : '-'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Log Inspector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
            <div className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center justify-between">
              <span>Log Entry Inspector</span>
              {selectedLog && (
                <span className="text-[10px] font-mono text-slate-500">
                  {selectedLog.requestId}
                </span>
              )}
            </div>

            {selectedLog ? (
              <div className="space-y-3">
                <div className="text-xs space-y-1.5 font-mono p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tool:</span>
                    <span className="text-blue-300">{selectedLog.toolName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <span className="text-slate-300">{selectedLog.durationMs} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className={selectedLog.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}>
                      {selectedLog.status}
                    </span>
                  </div>
                  {selectedLog.errorCode && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Error Code:</span>
                      <span className="text-rose-400 font-semibold">{selectedLog.errorCode}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Timestamp:</span>
                    <span className="text-slate-400 text-[10px]">{selectedLog.timestamp}</span>
                  </div>
                </div>

                {selectedLog.message && (
                  <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-xs text-slate-300">
                    <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">Message / Detail</div>
                    <div className="whitespace-pre-wrap">{selectedLog.message}</div>
                  </div>
                )}

                {selectedLog.params && (
                  <JsonViewer
                    title="Sanitized Input Parameters"
                    data={selectedLog.params}
                    maxHeight="max-h-56"
                  />
                )}
              </div>
            ) : (
              <div className="py-20 text-center text-slate-500 text-xs">
                Select a log row from the table to inspect details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
