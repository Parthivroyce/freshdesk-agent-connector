import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface JsonViewerProps {
  data: any;
  title?: string;
  maxHeight?: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data, title, maxHeight = 'max-h-96' }) => {
  const [copied, setCopied] = useState(false);

  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-lg border border-slate-800 bg-slate-900/90 overflow-hidden font-mono text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-400">
        <span className="font-semibold text-slate-300">{title || 'Payload / Schema JSON'}</span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-slate-300 transition-colors text-xs"
          title="Copy JSON to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className={`overflow-auto p-3 text-slate-200 ${maxHeight}`}>
        <pre className="whitespace-pre">{jsonString}</pre>
      </div>
    </div>
  );
};
