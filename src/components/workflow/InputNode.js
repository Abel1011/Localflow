'use client';

import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { FileText, RotateCcw, PlayCircle, Copy, Check } from 'lucide-react';

export default function InputNode({ id, data, selected }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.executionResult || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const emitAction = (action) => {
    if (!data?.name || typeof window === 'undefined') {
      return;
    }
    window.dispatchEvent(
  new CustomEvent('flow-node-action', {
        detail: { nodeName: data.name, action }
      })
    );
  };

  return (
    <div
      className={`relative bg-white rounded-xl border-2 shadow-lg w-[320px] transition-all ${
        selected ? 'border-slate-500 ring-4 ring-slate-200' : 'border-slate-300'
      }`}
    >
      <div
        className="px-4 py-2 rounded-t-xl flex items-center justify-between text-white"
        style={{ backgroundColor: '#64748b' }}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span className="text-sm font-bold">{data?.name || 'Input'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => emitAction('rerun')}
            className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Re-run node"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => emitAction('runFromHere')}
            className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Run from this node"
          >
            <PlayCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <textarea
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
          placeholder="Enter your input text..."
          rows={9}
          value={data?.text || ''}
          onChange={(e) => data.onChange?.(id, 'text', e.target.value)}
        />
      </div>

      {data?.executionError && (
        <div className="px-4 pb-4">
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-rose-700 mb-1">Error:</p>
            <p className="text-xs text-rose-900 whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">
              {data.executionError}
            </p>
          </div>
        </div>
      )}

      {data?.executionResult && (
        <div className="px-4 pb-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 relative">
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1.5 bg-white hover:bg-slate-50 rounded-md border border-slate-200 transition-colors shadow-sm"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-600" />
              )}
            </button>
            <p className="text-xs font-semibold text-slate-600 mb-1">Result:</p>
            <p className="text-xs text-slate-700 whitespace-pre-wrap max-h-32 overflow-y-auto pr-8">
              {data.executionResult}
            </p>
          </div>
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#64748b',
          width: 12,
          height: 12,
          borderRadius: '9999px',
          border: '2px solid #ffffff',
          right: -6,
        }}
      />
    </div>
  );
}
