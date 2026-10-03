import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { Navigation, TabKey } from './components/Navigation.js';
import { DashboardView } from './pages/DashboardView.js';
import { TicketsView } from './pages/TicketsView.js';
import { TicketDetailsView } from './pages/TicketDetailsView.js';
import { ToolExplorerView } from './pages/ToolExplorerView.js';
import { LogsView } from './pages/LogsView.js';
import { ConfigSecurityView } from './pages/ConfigSecurityView.js';
import { DocsView } from './pages/DocsView.js';
import { api } from './services/api.js';
import { SafeAppConfig, Ticket, McpTool, LogEntry } from './types.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  // Initial tool runner parameters when jumping from another view
  const [explorerToolName, setExplorerToolName] = useState<string>('list_tickets');
  const [explorerPayload, setExplorerPayload] = useState<any>(null);

  // Global state
  const [config, setConfig] = useState<SafeAppConfig | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tools, setTools] = useState<McpTool[]>([]);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);

  const refreshAll = async () => {
    setIsRefreshing(true);
    try {
      const [configData, toolsData, ticketsData, logsData] = await Promise.allSettled([
        api.getConfig(),
        api.getTools(),
        api.listTickets({ page: 1, per_page: 50 }),
        api.getLogs(),
      ]);

      if (configData.status === 'fulfilled') setConfig(configData.value);
      if (toolsData.status === 'fulfilled') setTools(toolsData.value.tools);
      if (ticketsData.status === 'fulfilled') setTickets(ticketsData.value.data);
      if (logsData.status === 'fulfilled') setRecentLogs(logsData.value.logs);
    } catch (err) {
      console.error('Error refreshing state:', err);
    } finally {
      setIsRefreshing(false);
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    refreshAll();
    // Poll logs every 10 seconds for real-time observability
    const interval = setInterval(async () => {
      try {
        const logsRes = await api.getLogs();
        setRecentLogs(logsRes.logs);
      } catch {
        // Silently ignore background polling errors
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectTicket = (id: number) => {
    setSelectedTicketId(id);
    setActiveTab('tickets');
  };

  const handleNavigateToTool = (toolName: string, payload?: any) => {
    setExplorerToolName(toolName);
    setExplorerPayload(payload || null);
    setActiveTab('explorer');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600/30">
      {/* Top Header */}
      <Navbar
        config={config}
        onRefresh={refreshAll}
        isRefreshing={isRefreshing}
      />

      {/* Tabs Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={tab => {
          setActiveTab(tab);
          if (tab !== 'tickets') {
            setSelectedTicketId(null);
          }
        }}
        ticketCount={tickets.length}
        toolsCount={tools.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            config={config}
            tickets={tickets}
            tools={tools}
            recentLogs={recentLogs}
            onNavigateToTool={handleNavigateToTool}
            onSelectTicket={handleSelectTicket}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'tickets' && (
          selectedTicketId ? (
            <TicketDetailsView
              ticketId={selectedTicketId}
              onBack={() => setSelectedTicketId(null)}
              onRunTool={handleNavigateToTool}
            />
          ) : (
            <TicketsView
              tickets={tickets}
              isLoading={isLoadingTickets}
              onSelectTicket={handleSelectTicket}
              onFilterChange={() => {}}
            />
          )
        )}

        {activeTab === 'explorer' && (
          <ToolExplorerView
            tools={tools}
            initialToolName={explorerToolName}
            initialPayload={explorerPayload}
          />
        )}

        {activeTab === 'logs' && (
          <LogsView
            logs={recentLogs}
            onRefresh={refreshAll}
            isRefreshing={isRefreshing}
          />
        )}

        {activeTab === 'config' && (
          <ConfigSecurityView config={config} />
        )}

        {activeTab === 'docs' && (
          <DocsView tools={tools} />
        )}
      </main>

      {/* Operational Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Freshdesk Agent Connector (Model Context Protocol Compliant)</span>
          <span>Forward-Deployed Engineer Assignment — Razorpay Merchant Integration</span>
        </div>
      </footer>
    </div>
  );
}
