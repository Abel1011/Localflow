'use client';

import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { List, RotateCcw, PlayCircle, Copy, Check } from 'lucide-react';
import VariableAutocomplete from './VariableAutocomplete';
import MarkdownResult from './MarkdownResult';

export default function SummarizerNode({ id, data, selected }) {
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
    <div className={`bg-white rounded-xl border-2 shadow-lg w-[320px] transition-all ${
      selected ? 'border-emerald-500 ring-4 ring-emerald-200' : 'border-emerald-300'
    }`}>
      <Handle 
        type="target" 
        position={Position.Left}
        style={{
          background: '#10b981',
          width: '12px',
          height: '12px',
          border: '2px solid white',
          left: '-6px'
        }}
      />
      <div
        className="px-4 py-2 rounded-t-xl flex items-center justify-between text-white"
        style={{ backgroundColor: '#10b981' }}
      >
        <div className="flex items-center gap-2">
          <List className="w-4 h-4" />
          <span className="text-sm font-bold">{data?.name || 'Summarizer'}</span>
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
        <VariableAutocomplete
          value={data.context || ''}
          onChange={(value) => data.onChange?.(id, 'context', value)}
          placeholder="Additional context for summary..."
          rows={9}
          availableVariables={data.availableVariables || []}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
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
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-emerald-700">Result:</p>
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-emerald-100 rounded transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-emerald-600" />
                )}
              </button>
            </div>
            <div className="text-xs text-emerald-900 max-h-48 overflow-y-auto">
              <MarkdownResult content={data.executionResult} />
            </div>
          </div>
        </div>
      )}
      <Handle 
        type="source" 
        position={Position.Right}
        style={{
          background: '#10b981',
          width: '12px',
          height: '12px',
          border: '2px solid white',
          right: '-6px'
        }}
      />
    </div>
  );
}
