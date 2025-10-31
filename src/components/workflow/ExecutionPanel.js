'use client';

import { X, CheckCircle, Loader2, AlertCircle, Copy, Check, RotateCcw, PlayCircle, Clock, ChevronDown, ChevronRight, Trash2, Image as ImageIcon, Mic } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import MarkdownResult from './MarkdownResult';

export default function ExecutionPanel({ results, onClose, isRunning, onRetryNode, onRunFromNode, onClearResults }) {
  const [copiedNode, setCopiedNode] = useState(null);
  const [collapsedNodes, setCollapsedNodes] = useState({});

  const formatSize = (bytes) => {
    if (typeof bytes !== 'number' || Number.isNaN(bytes)) {
      return 'Unknown size';
    }
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const hasError = useMemo(
    () => Object.values(results || {}).some(entry => entry?.status === 'error'),
    [results]
  );

  const completedCount = useMemo(
    () => Object.values(results || {}).filter(entry => entry?.status === 'completed').length,
    [results]
  );

  const copyToClipboard = async (text, nodeName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedNode(nodeName);
      setTimeout(() => setCopiedNode(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const toggleCollapse = (nodeName) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [nodeName]: !prev?.[nodeName]
    }));
  };

  useEffect(() => {
    setCollapsedNodes((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((name) => {
        if (!results || !(name in results)) {
          delete next[name];
        }
      });
      return next;
    });
  }, [results]);

  return (
    <div className="w-96 max-w-full bg-white border-l-2 border-slate-200 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-6 mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Execution Results</h3>
          <p className="text-xs text-slate-500 mt-1">
            {isRunning ? 'Running workflow...' : hasError ? 'Workflow stopped due to an error' : 'Workflow completed'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {!isRunning && Object.keys(results || {}).length > 0 && (
        <div className="px-6 mb-4">
          <button
            onClick={onClearResults}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Clear Results
          </button>
        </div>
      )}

      {isRunning && (
        <div className="mx-6 mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
          <div>
            <p className="text-sm font-semibold text-indigo-900">Processing...</p>
            <p className="text-xs text-indigo-600">Executing workflow nodes</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 min-h-0">
        {Object.entries(results || {}).map(([nodeName, result]) => {
          const status = result?.status;
          const isCompleted = status === 'completed';
          const isError = status === 'error';
          const isQueued = status === 'queued';
          const isActive = status === 'running' || status === 'streaming';
          const isCollapsed = collapsedNodes?.[nodeName] === true;
          const resultText = typeof result?.result === 'string'
            ? result.result
            : result?.result?.text;
          const attachments = Array.isArray(result?.result?.attachments)
            ? result.result.attachments.filter(Boolean)
            : [];

          return (
            <div
              key={nodeName}
              className="border-2 border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="bg-slate-100 px-4 py-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : isError ? (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  ) : isQueued ? (
                    <Clock className="w-4 h-4 text-slate-500" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  )}
                  <span className="text-sm font-bold text-slate-900">{nodeName}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isQueued && (
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Queued
                    </span>
                  )}

                  {isActive && !isError && !isCompleted && !isQueued && (
                    <span className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wide">
                      {status === 'streaming' ? 'Streaming' : 'Running'}
                    </span>
                  )}

                  {isCompleted && resultText && (
                    <button
                      onClick={() => copyToClipboard(resultText, nodeName)}
                      className="p-1 hover:bg-slate-200 rounded transition-colors"
                      title="Copy result"
                    >
                      {copiedNode === nodeName ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => onRetryNode?.(nodeName)}
                    disabled={isRunning || isActive || isQueued}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                    title="Re-run node"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onRunFromNode?.(nodeName)}
                    disabled={isRunning || isActive || isQueued}
                    className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                    title="Run from this node"
                  >
                    <PlayCircle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => toggleCollapse(nodeName)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                    title={isCollapsed ? 'Expand result' : 'Collapse result'}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {!isCollapsed && isError && (
                <div className="p-4 bg-white">
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-rose-700 mb-1">Execution error</p>
                    <p className="text-xs text-rose-900 whitespace-pre-wrap font-mono">
                      {result?.error || 'The node failed to execute.'}
                    </p>
                  </div>
                </div>
              )}

              {!isCollapsed && (resultText || attachments.length > 0) && (
                <div className="p-4 bg-white">
                  {resultText && (
                    <div className="text-xs text-slate-700">
                      <MarkdownResult content={resultText} />
                    </div>
                  )}

                  {attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Attachments</p>
                      {attachments.map((item, index) => (
                        <div
                          key={`${item.name}-${index}`}
                          className="border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between text-xs text-slate-600"
                        >
                          <div className="flex items-center gap-2">
                            {item.kind === 'audio' ? (
                              <Mic className="w-4 h-4 text-amber-500" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-sky-500" />
                            )}
                            <div>
                              <p className="font-semibold truncate max-w-[140px]" title={item.name || 'Attachment'}>
                                {item.name || 'Attachment'}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {item.mimeType || item.kind} • {formatSize(item.size)}
                              </p>
                            </div>
                          </div>
                          {item.sourceNode && (
                            <span className="text-[11px] text-slate-400">from {item.sourceNode}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isRunning && Object.keys(results || {}).length === 0 && (
        <div className="text-center py-12 px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-700 mb-2">No results yet</h3>
          <p className="text-xs text-slate-500">Run the workflow to see results</p>
        </div>
      )}

      {!isRunning && Object.keys(results || {}).length > 0 && hasError && (
        <div className="px-6 pb-6 pt-4 border-t border-slate-200">
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-rose-800 mb-1">Workflow stopped early</p>
            <p className="text-xs text-rose-700">
              {completedCount} nodes completed before the failure. Retry the failed node once it is fixed.
            </p>
          </div>
        </div>
      )}

      {!isRunning && Object.keys(results || {}).length > 0 && !hasError && (
        <div className="px-6 pb-6 pt-4 border-t border-slate-200">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-emerald-900 mb-1">Workflow completed!</p>
            <p className="text-xs text-emerald-700">
              {completedCount} nodes executed successfully
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
