import React from 'react';
import { TicketPriority, TicketStatus } from '../types.js';

interface StatusBadgeProps {
  type: 'status' | 'priority';
  value: TicketStatus | TicketPriority | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, size = 'sm' }) => {
  const val = String(value).toLowerCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  if (type === 'status') {
    switch (val) {
      case 'open':
        colorClasses = 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60';
        break;
      case 'pending':
        colorClasses = 'bg-amber-950/80 text-amber-300 border-amber-700/60';
        break;
      case 'resolved':
        colorClasses = 'bg-blue-950/80 text-blue-300 border-blue-700/60';
        break;
      case 'closed':
        colorClasses = 'bg-slate-900 text-slate-400 border-slate-700';
        break;
    }
  } else {
    switch (val) {
      case 'urgent':
        colorClasses = 'bg-rose-950/80 text-rose-300 border-rose-700/70 font-semibold';
        break;
      case 'high':
        colorClasses = 'bg-orange-950/80 text-orange-300 border-orange-700/60';
        break;
      case 'medium':
        colorClasses = 'bg-amber-950/60 text-amber-300 border-amber-800/40';
        break;
      case 'low':
        colorClasses = 'bg-slate-900 text-slate-300 border-slate-700';
        break;
    }
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-mono uppercase tracking-wider ${padding} ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {value}
    </span>
  );
};
