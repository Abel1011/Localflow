'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button';

export default function NodeConfigPanel({ node, onClose, onUpdate, allNodes }) {
  const [localName, setLocalName] = useState('');

  useEffect(() => {
    setLocalName(node?.data?.name || '');
  }, [node?.id, node?.data?.name]);

  if (!node) return null;

  const handleUpdate = (key, value) => {
    onUpdate(node.id, { ...node.data, [key]: value });
  };

  const isNameUnique = (name) => {
    if (!name || name.trim() === '') return false;
    return !allNodes.some(n => n.id !== node.id && n.data.name === name.trim());
  };

  const handleNameChange = (e) => {
    setLocalName(e.target.value);
  };

  const handleNameBlur = () => {
    if (localName.trim() && isNameUnique(localName.trim())) {
      handleUpdate('name', localName.trim());
    } else {
      setLocalName(node.data.name || getDefaultName());
    }
  };

  const getDefaultName = () => {
    const typeNames = {
      inputNode: 'Input',
  pdfInput: 'PDF Input',
  imageInput: 'Image Input',
  audioInput: 'Audio Input',
      writer: 'Writer',
      rewriter: 'Rewriter',
      summarizer: 'Summarizer',
      prompt: 'Prompt API',
      proofreader: 'Proofreader',
      translator: 'Translator',
    };
    return typeNames[node.type] || 'Node';
  };

  const currentName = node.data.name || getDefaultName();
  const nameIsValid = isNameUnique(localName);

  const renderConfig = () => {
    switch (node.type) {
      case 'writer':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tone</label>
              <select 
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                value={node.data.tone || 'neutral'}
                onChange={(e) => handleUpdate('tone', e.target.value)}
              >
                <option value="formal">Formal</option>
                <option value="neutral">Neutral</option>
                <option value="casual">Casual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Format</label>
              <select 
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                value={node.data.format || 'plain-text'}
                onChange={(e) => handleUpdate('format', e.target.value)}
              >
                <option value="plain-text">Plain Text</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Length</label>
              <select 
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                value={node.data.length || 'medium'}
                onChange={(e) => handleUpdate('length', e.target.value)}
              >
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Shared Context</label>
              <textarea
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 resize-none nodrag nopan"
                placeholder="Additional context for writing..."
                rows={3}
                value={node.data.sharedContext || ''}
                onChange={(e) => handleUpdate('sharedContext', e.target.value)}
              />
            </div>
          </div>
        );

      case 'rewriter':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tone</label>
              <select 
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={node.data.tone || 'as-is'}
                onChange={(e) => handleUpdate('tone', e.target.value)}
              >
                <option value="as-is">As-is</option>
                <option value="more-formal">More formal</option>
                <option value="more-casual">More casual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Length</label>
              <select 
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={node.data.length || 'as-is'}
                onChange={(e) => handleUpdate('length', e.target.value)}
              >
                <option value="as-is">As-is</option>
                <option value="shorter">Shorter</option>
                <option value="longer">Longer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Shared Context</label>
              <textarea
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none nodrag nopan"
                placeholder="Additional context for rewriting..."
                rows={3}
                value={node.data.sharedContext || ''}
                onChange={(e) => handleUpdate('sharedContext', e.target.value)}
              />
            </div>
          </div>
        );

      case 'summarizer': {
        const typeValue = (() => {
          const rawType = node.data.type;
          if (!rawType) return 'tldr';
          const normalized = rawType.replace(/[^a-z]/gi, '').toLowerCase();
          if (normalized === 'tldr') return 'tldr';
          if (normalized === 'keypoints') return 'key-points';
          if (normalized === 'headline') return 'headline';
          if (normalized === 'teaser') return 'teaser';
          return 'tldr';
        })();

        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
              <select 
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                value={typeValue}
                onChange={(e) => handleUpdate('type', e.target.value)}
              >
                <option value="tldr">TL;DR</option>
                <option value="key-points">Key Points</option>
                <option value="teaser">Teaser</option>
                <option value="headline">Headline</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Length</label>
              <select 
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                value={node.data.length || 'short'}
                onChange={(e) => handleUpdate('length', e.target.value)}
              >
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Format</label>
              <select 
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                value={node.data.format || 'markdown'}
                onChange={(e) => handleUpdate('format', e.target.value)}
              >
                <option value="markdown">Markdown</option>
                <option value="plain-text">Plain Text</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Shared Context</label>
              <textarea
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none nodrag nopan"
                placeholder="Additional context for summary..."
                rows={3}
                value={node.data.sharedContext || ''}
                onChange={(e) => handleUpdate('sharedContext', e.target.value)}
              />
            </div>
          </div>
        );
      }

      case 'prompt':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">System Prompt</label>
              <textarea
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none nodrag nopan"
                placeholder="You are a helpful assistant..."
                rows={4}
                value={node.data.systemPrompt || ''}
                onChange={(e) => handleUpdate('systemPrompt', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Temperature: {node.data.temperature || 1}
              </label>
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.1" 
                value={node.data.temperature || 1}
                onChange={(e) => handleUpdate('temperature', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Top-K: {node.data.topK || 3}
              </label>
              <input 
                type="range" 
                min="1" 
                max="128" 
                step="1" 
                value={node.data.topK || 3}
                onChange={(e) => handleUpdate('topK', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-amber-700">Attachment limits</p>
              <div>
                <label className="block text-xs font-semibold text-amber-700 mb-1">Image attachments</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={Number.isFinite(node.data.imageAttachmentLimit) ? node.data.imageAttachmentLimit : 1}
                  onChange={(e) => {
                    const nextValue = Math.max(0, parseInt(e.target.value, 10) || 0);
                    handleUpdate('imageAttachmentLimit', nextValue);
                  }}
                  className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-amber-700 mb-1">Audio attachments</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={Number.isFinite(node.data.audioAttachmentLimit) ? node.data.audioAttachmentLimit : 1}
                  onChange={(e) => {
                    const nextValue = Math.max(0, parseInt(e.target.value, 10) || 0);
                    handleUpdate('audioAttachmentLimit', nextValue);
                  }}
                  className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <p className="text-[11px] text-amber-600">Set zero to allow unlimited selections for each modality.</p>
            </div>
          </div>
        );

      case 'translator':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Source Language</label>
              <select 
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={node.data.sourceLanguage || 'en'}
                onChange={(e) => handleUpdate('sourceLanguage', e.target.value)}
              >
                <option value="auto">Auto-detect</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Target Language</label>
              <select 
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={node.data.targetLanguage || 'es'}
                onChange={(e) => handleUpdate('targetLanguage', e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
              </select>
            </div>
          </div>
        );

      case 'proofreader':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-purple-900 mb-2">Automatic checks:</p>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Grammar errors</li>
                <li>• Spelling mistakes</li>
                <li>• Punctuation issues</li>
                <li>• Style improvements</li>
              </ul>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-xs text-purple-600">
                Proofreader runs automatically with no additional configuration needed. Streaming is enabled by default.
              </p>
            </div>
          </div>
        );

      case 'inputNode':
        return (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-600">
                Input nodes are the starting point of your flow. Enter your text directly in the node.
              </p>
            </div>
          </div>
        );

      case 'pdfInput':
        return (
          <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
              <p className="text-sm text-rose-700 font-semibold mb-1">Upload limitations</p>
              <p className="text-sm text-rose-600">Up to 3 PDF files with a combined size of 2 MB.</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
              <p className="text-xs text-rose-600">
                Extracted text is shared with downstream nodes through the <code className="px-1 py-0.5 bg-rose-100 rounded">{'{{Node Name}}'}</code> variable.
              </p>
            </div>
          </div>
        );

      case 'imageInput':
        return (
          <div className="space-y-4">
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
              <p className="text-sm text-sky-700 font-semibold mb-1">Image guidance</p>
              <p className="text-sm text-sky-600">Upload one image (PNG, JPG, or WebP) up to 2 MB.</p>
            </div>
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
              <p className="text-xs text-sky-600">This node forwards the raw image as an attachment for multimodal prompts.</p>
            </div>
          </div>
        );

      case 'audioInput':
        return (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-700 font-semibold mb-1">Audio guidance</p>
              <p className="text-sm text-amber-600">Upload one audio clip (MP3, WAV, or M4A) up to 5 MB or record directly from the microphone.</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-xs text-amber-600">The captured audio is attached to downstream Prompt nodes for multimodal interactions.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getNodeColor = () => {
    const colors = {
      inputNode: '#64748b',
  pdfInput: '#f43f5e',
      imageInput: '#0ea5e9',
      audioInput: '#f59e0b',
      writer: '#FF6B6B',
      rewriter: '#14b8a6',
      summarizer: '#10b981',
      prompt: '#f59e0b',
      proofreader: '#8b5cf6',
      translator: '#3b82f6',
    };
    return colors[node.type] || '#64748b';
  };

  return (
    <div className="w-80 bg-white border-l-2 border-slate-200 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Node Configuration</h3>
          <p className="text-xs text-slate-500 mt-1">
            {node.type === 'inputNode' ? 'Input' : node.type.charAt(0).toUpperCase() + node.type.slice(1)} settings
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <div 
        className="h-1 rounded-full mb-6"
        style={{ backgroundColor: getNodeColor() }}
      />

      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Node Name</label>
        <input
          type="text"
          className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
            nameIsValid 
              ? 'border-slate-200 focus:ring-indigo-400' 
              : 'border-red-300 focus:ring-red-400'
          }`}
          value={localName}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          placeholder="Enter unique name..."
        />
        {!nameIsValid && (
          <p className="text-xs text-red-600 mt-1">Name must be unique</p>
        )}
      </div>

      {node.type !== 'inputNode' && (
        <div className="mb-6 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-xs font-semibold text-indigo-900 mb-1">Using Variables</p>
          <p className="text-xs text-indigo-700">
            Reference other nodes using <code className="px-1 py-0.5 bg-indigo-100 rounded">{'{{Node Name}}'}</code>
          </p>
          <p className="text-xs text-indigo-600 mt-1">
            Example: <code className="px-1 py-0.5 bg-indigo-100 rounded">{'{{Input}}'}</code>
          </p>
        </div>
      )}

      {renderConfig()}
    </div>
  );
}
