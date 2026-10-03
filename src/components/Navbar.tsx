import React from 'react';
import { Activity, ShieldCheck, Database, Server, RefreshCw } from 'lucide-react';
import { SafeAppConfig } from '../types.js';

interface NavbarProps {
  config: SafeAppConfig | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ config, onRefresh, isRefreshing }) => {
  const isDemo = config?.demo_mode ?? true;

  return (
    <header className="border-b border-slate-800 bg-slate-950/95 sticky top-0 z-40 backdrop-blur">
      {/* Prominent Demo Mode Banner if in Demo Mode */}
      {isDemo && (
        <div className="bg-amber-950/60 border-b border-amber-800/50 px-4 py-1.5 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold tracking-wide">
              Demo Mode — using fictional Freshdesk data
            </span>
            <span className="hidden sm:inline text-amber-300/70 text-xs">
              (Live Freshdesk credentials are not configured in environment)
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-amber-300/80">
            <span className="bg-amber-900/60 px-2 py-0.5 rounded text-[11px] font-mono border border-amber-700/50">
              Provider: DemoProvider
            </span>
            <span className="font-mono text-[11px]">Strict Read-Only</span>
          </div>
        </div>
      )}

      {/* Main Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-lg">
            R
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 tracking-tight">
                Freshdesk Agent Connector
              </h1>
              <span className="bg-blue-950 text-blue-400 border border-blue-800/60 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-semibold">
                MCP Protocol
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Razorpay Merchant Support Integration Interface
            </p>
          </div>
        </div>

        {/* Right Status Group */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-300 font-mono">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Port: 3000</span>
            <span className="text-slate-600">|</span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Guardrails Active</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-md px-3 py-1.5 text-xs transition-colors cursor-pointer"
            title="Refresh state"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>
    </header>
  );
};
