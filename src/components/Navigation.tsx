import React from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  Terminal, 
  ScrollText, 
  ShieldAlert, 
  BookOpen 
} from 'lucide-react';

export type TabKey = 'dashboard' | 'tickets' | 'explorer' | 'logs' | 'config' | 'docs';

interface NavigationProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  ticketCount?: number;
  toolsCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  ticketCount = 10,
  toolsCount = 5,
}) => {
  const tabs = [
    {
      key: 'dashboard' as TabKey,
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      key: 'tickets' as TabKey,
      label: 'Tickets',
      icon: Inbox,
      badge: ticketCount ? `${ticketCount}` : null,
    },
    {
      key: 'explorer' as TabKey,
      label: 'Tool Explorer (MCP)',
      icon: Terminal,
      badge: `${toolsCount} Tools`,
    },
    {
      key: 'logs' as TabKey,
      label: 'Observability & Logs',
      icon: ScrollText,
      badge: null,
    },
    {
      key: 'config' as TabKey,
      label: 'Security & Config',
      icon: ShieldAlert,
      badge: 'Read-Only',
    },
    {
      key: 'docs' as TabKey,
      label: 'Documentation',
      icon: BookOpen,
      badge: null,
    },
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-3 overflow-x-auto py-2 scrollbar-none">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onSelectTab(tab.key)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
