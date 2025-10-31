'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Image as ImageIcon, RotateCcw, PlayCircle, Loader2, AlertCircle, Trash2, UploadCloud } from 'lucide-react';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function ImageInputNode({ id, data, selected }) {
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const file = data?.file || null;

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
    return undefined;
  }, [file]);

  const emitAction = useCallback((action) => {
    if (!data?.name || typeof window === 'undefined') {
      return;
    }
    window.dispatchEvent(
  new CustomEvent('flow-node-action', {
        detail: { nodeName: data.name, action }
      })
    );
  }, [data?.name]);

  const handleFileSelected = useCallback((event) => {
    const selectedFile = event.target.files?.[0] || null;
    event.target.value = '';

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith('image/')) {
      setError('Only image files are supported.');
      return;
    }

    if (selectedFile.size > MAX_IMAGE_BYTES) {
      setError('Image must not exceed 2 MB.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      data.onChange?.(id, 'file', selectedFile);
      data.onChange?.(id, 'attachment', {
        kind: 'image',
        name: selectedFile.name,
        size: selectedFile.size,
        mimeType: selectedFile.type,
        file: selectedFile,
      });
      data.onChange?.(id, 'text', '');
    } catch (processingError) {
      console.error('Image processing failed:', processingError);
      setError('Unable to load the selected image.');
    } finally {
      setIsProcessing(false);
    }
  }, [data, id]);

  const handleRemove = useCallback(() => {
    data.onChange?.(id, 'file', null);
    data.onChange?.(id, 'attachment', null);
    data.onChange?.(id, 'text', '');
    setError(null);
  }, [data, id]);

  const formattedSize = useMemo(() => (file ? formatSize(file.size) : null), [file]);

  return (
    <div
      className={`relative bg-white rounded-xl border-2 shadow-lg w-[320px] transition-all ${
        selected ? 'border-sky-500 ring-4 ring-sky-200' : 'border-sky-300'
      }`}
    >
      <div
        className="px-4 py-2 rounded-t-xl flex items-center justify-between text-white"
        style={{ backgroundColor: '#0ea5e9' }}
      >
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          <span className="text-sm font-bold">{data?.name || 'Image Input'}</span>
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

      <div className="p-4 space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelected}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className={`w-full border-2 border-dashed rounded-xl px-4 py-6 flex flex-col items-center justify-center gap-2 transition-all ${
            isProcessing
              ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-wait'
              : 'border-sky-200 text-sky-600 hover:border-sky-400 hover:bg-sky-50'
          }`}
        >
          <UploadCloud className="w-6 h-6" />
          <span className="text-sm font-semibold">Select image</span>
          <span className="text-[11px] text-slate-500">PNG, JPG, or WebP up to 2 MB</span>
        </button>

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-sky-600 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing image...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {file && (
          <div className="space-y-3">
            {previewUrl && (
              <div className="relative w-full h-40 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white rounded-md border border-slate-200 transition"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            )}
            <div className="text-xs text-slate-600">
              <p className="font-semibold truncate" title={file.name}>{file.name}</p>
              <p className="text-[11px] text-slate-500">{file.type || 'image'} • {formattedSize}</p>
            </div>
          </div>
        )}

        {!file && (
          <p className="text-[11px] text-slate-500">
            Once selected, the image will be available to Prompt nodes as an attachment.
          </p>
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
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-sky-700 mb-1">Output:</p>
            <p className="text-xs text-sky-900 whitespace-pre-wrap max-h-32 overflow-y-auto">
              {data.executionResult}
            </p>
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#0ea5e9',
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
