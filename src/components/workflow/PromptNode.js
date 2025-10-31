'use client';

import { useMemo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { MessageSquare, RotateCcw, PlayCircle, Copy, Check } from 'lucide-react';
import VariableAutocomplete from './VariableAutocomplete';
import MarkdownResult from './MarkdownResult';

const DEFAULT_ATTACHMENT_LIMIT = 1;

export default function PromptNode({ id, data, selected }) {
  const [copied, setCopied] = useState(false);
  const availableAttachments = data?.availableAttachments || [];
  const selectedAttachments = data?.selectedAttachments || [];
  const imageAttachmentLimit = data?.imageAttachmentLimit ?? DEFAULT_ATTACHMENT_LIMIT;
  const audioAttachmentLimit = data?.audioAttachmentLimit ?? DEFAULT_ATTACHMENT_LIMIT;

  const attachmentMap = useMemo(() => {
    const map = {};
    availableAttachments.forEach((item) => {
      if (item?.nodeName) {
        map[item.nodeName] = item;
      }
    });
    return map;
  }, [availableAttachments]);

  const imageAttachments = availableAttachments.filter((item) => item.type === 'image');
  const audioAttachments = availableAttachments.filter((item) => item.type === 'audio');
  const activeImageSelections = selectedAttachments.filter((name) => attachmentMap[name]?.type === 'image');
  const activeAudioSelections = selectedAttachments.filter((name) => attachmentMap[name]?.type === 'audio');

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

  const handleToggleAttachment = (nodeName) => {
    if (!nodeName) {
      return;
    }
    const current = Array.isArray(selectedAttachments) ? [...selectedAttachments] : [];
    const attachment = attachmentMap[nodeName];
    if (!attachment) {
      return;
    }
    const existingIndex = current.indexOf(nodeName);
    let next = current;
    if (existingIndex >= 0) {
      next.splice(existingIndex, 1);
    } else {
      const limit = attachment.type === 'image' ? imageAttachmentLimit : audioAttachmentLimit;
      if (limit > 0) {
        const sameTypeSelected = next.filter((name) => attachmentMap[name]?.type === attachment.type);
        if (sameTypeSelected.length >= limit) {
          const [firstSelection] = sameTypeSelected;
          next = next.filter((name) => name !== firstSelection);
        }
      }
      next = [...next, nodeName];
    }
    data.onChange?.(id, 'selectedAttachments', next);
  };

  const renderAttachmentSection = (items, typeLabel, limit, activeSelections) => {
    if (items.length === 0) {
      return null;
    }

    const limitLabel = limit > 0
      ? `Select up to ${limit}`
      : null;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-amber-700">{typeLabel} attachments</p>
          {limitLabel && (
            <span className="text-[11px] text-amber-600">{limitLabel}</span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2">
          {items.map((item) => {
            const isActive = selectedAttachments.includes(item.nodeName);
            const statusLabel = item.hasAttachment ? `${typeLabel} source` : 'Waiting for file';
            const statusTone = item.hasAttachment ? 'text-slate-500' : 'text-amber-600';
            return (
              <button
                key={item.nodeName}
                type="button"
                onClick={() => handleToggleAttachment(item.nodeName)}
                className={`w-full px-3 py-2 text-left border-2 rounded-lg transition-all ${
                  isActive
                    ? 'border-amber-400 bg-amber-50 text-amber-800'
                    : 'border-slate-200 hover:border-amber-200 text-slate-600'
                }`}
              >
                <p className="text-xs font-semibold truncate">{item.label}</p>
                <p className={`text-[11px] ${statusTone}`}>{statusLabel}</p>
              </button>
            );
          })}
        </div>
        {activeSelections.length > 0 && (
          <div className="text-[11px] text-amber-700">
            Sending: {activeSelections.map((name) => attachmentMap[name]?.label || name).join(', ')}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl border-2 shadow-lg w-[320px] transition-all ${
      selected ? 'border-amber-500 ring-4 ring-amber-200' : 'border-amber-300'
    }`}>
      <Handle 
        type="target" 
        position={Position.Left}
        style={{
          background: '#f59e0b',
          width: '12px',
          height: '12px',
          border: '2px solid white',
          left: '-6px'
        }}
      />
      <div 
        className="px-4 py-2 rounded-t-xl flex items-center justify-between text-white"
        style={{ backgroundColor: '#f59e0b' }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm font-bold">{data?.name || 'Prompt API'}</span>
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
          value={data.prompt || ''}
          onChange={(value) => data.onChange?.(id, 'prompt', value)}
          placeholder="User prompt..."
          rows={3}
          availableVariables={data.availableVariables || []}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
        />

        {availableAttachments.length > 0 && (
          <div className="mt-4 space-y-4">
            {renderAttachmentSection(imageAttachments, 'Image', imageAttachmentLimit, activeImageSelections)}
            {renderAttachmentSection(audioAttachments, 'Audio', audioAttachmentLimit, activeAudioSelections)}
          </div>
        )}
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
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-amber-700">Result:</p>
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-amber-100 rounded transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-amber-600" />
                )}
              </button>
            </div>
            <div className="text-xs text-amber-900 max-h-48 overflow-y-auto">
              <MarkdownResult content={data.executionResult} />
            </div>
          </div>
        </div>
      )}
      <Handle 
        type="source" 
        position={Position.Right}
        style={{
          background: '#f59e0b',
          width: '12px',
          height: '12px',
          border: '2px solid white',
          right: '-6px'
        }}
      />
    </div>
  );
}
