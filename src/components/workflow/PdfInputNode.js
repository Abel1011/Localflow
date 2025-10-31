'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Files, RotateCcw, PlayCircle, Trash2, Loader2, AlertCircle, UploadCloud } from 'lucide-react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.mjs',
  import.meta.url
).toString();

const MAX_FILES = 1;
const MAX_TOTAL_BYTES = 2 * 1024 * 1024;

const toReadableSize = (bytes) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const extractTextFromPdf = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);
  const task = getDocument({ data: typedArray });
  const pdfDocument = await task.promise;
  const pageTexts = [];

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(' ');
    pageTexts.push(pageText.trim());
  }

  pdfDocument.cleanup();
  await task.destroy();

  return {
    text: pageTexts.join('\n\n'),
    pageCount: pdfDocument.numPages,
  };
};

export default function PdfInputNode({ id, data, selected }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const inputElementId = `pdf-upload-${id}`;

  const files = useMemo(() => data?.files || [], [data?.files]);
  const totalSize = useMemo(
    () => files.reduce((sum, item) => sum + (item.size || 0), 0),
    [files]
  );

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

  const handleFilesSelected = useCallback(async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';

    if (selectedFiles.length === 0) {
      return;
    }

    const currentCount = files.length;
    const currentSize = files.reduce((sum, item) => sum + (item.size || 0), 0);
    const newSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);

    if (currentCount + selectedFiles.length > MAX_FILES) {
      setError(`Maximum of ${MAX_FILES} files allowed.`);
      return;
    }

    if (currentSize + newSize > MAX_TOTAL_BYTES) {
      setError('Total file size must not exceed 2 MB.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const newEntries = [];

      for (const file of selectedFiles) {
        const { text, pageCount } = await extractTextFromPdf(file);
        newEntries.push({
          name: file.name,
          size: file.size,
          type: file.type,
          pageCount,
          text,
        });
      }

      const nextFiles = [...files, ...newEntries];
      const combinedText = nextFiles
        .map((item) => `--- ${item.name} (${item.pageCount} pages) ---\n${item.text}`)
        .join('\n\n');

      data.onChange?.(id, 'files', nextFiles);
      data.onChange?.(id, 'text', combinedText);
    } catch (processingError) {
      console.error('PDF processing failed:', processingError);
      setError('Unable to extract text from the selected file(s).');
    } finally {
      setIsProcessing(false);
    }
  }, [data, files, id]);

  const handleRemoveFile = useCallback((index) => {
    const nextFiles = files.filter((_, idx) => idx !== index);
    if (nextFiles.length === 0) {
      setError(null);
    }
    const combinedText = nextFiles
      .map((item) => `--- ${item.name} (${item.pageCount} pages) ---\n${item.text}`)
      .join('\n\n');

    if (nextFiles.length === 0) {
      data.onChange?.(id, 'files', []);
      data.onChange?.(id, 'text', '');
      return;
    }

    data.onChange?.(id, 'files', nextFiles);
    data.onChange?.(id, 'text', combinedText);
  }, [data, files, id]);

  return (
    <div
      className={`relative bg-white rounded-xl border-2 shadow-lg w-[320px] transition-all ${
        selected ? 'border-rose-500 ring-4 ring-rose-200' : 'border-rose-300'
      }`}
    >
      <div
        className="px-4 py-2 rounded-t-xl flex items-center justify-between text-white"
        style={{ backgroundColor: '#f43f5e' }}
      >
        <div className="flex items-center gap-2">
          <Files className="w-4 h-4" />
          <span className="text-sm font-bold">{data?.name || 'PDF Input'}</span>
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
          id={inputElementId}
          type="file"
          accept="application/pdf"
          multiple
          disabled={isProcessing || files.length >= MAX_FILES}
          onChange={handleFilesSelected}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing || files.length >= MAX_FILES}
          className={`w-full border-2 border-dashed rounded-xl px-4 py-6 flex flex-col items-center justify-center gap-2 transition-all ${
            isProcessing || files.length >= MAX_FILES
              ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
              : 'border-rose-200 text-rose-600 hover:border-rose-400 hover:bg-rose-50'
          }`}
        >
          <UploadCloud className="w-6 h-6" />
          <span className="text-sm font-semibold">Select PDF files</span>
          <span className="text-[11px] text-slate-500">Drag and drop is not supported yet</span>
        </button>

        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700">
          <p className="font-semibold mb-1">Restrictions</p>
          <p>Up to {MAX_FILES} files • Total size ≤ 2 MB</p>
        </div>

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Extracting text...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>{files.length} file(s) selected</span>
              <span>{toReadableSize(totalSize)}</span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {files.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="border border-slate-200 rounded-lg p-2 bg-slate-50 text-xs text-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-2">
                      <p className="font-semibold truncate" title={item.name}>{item.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.pageCount} pages • {toReadableSize(item.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="p-1 text-slate-500 hover:text-rose-500 hover:bg-white rounded transition"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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

      {data?.text && (
        <div className="px-4 pb-4">
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-rose-700 mb-1">Extracted text preview:</p>
            <p className="text-xs text-rose-900 whitespace-pre-wrap max-h-32 overflow-y-auto">
              {data.text}
            </p>
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#f43f5e',
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
