'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { marked } from 'marked';
import { Play, Trash2, RefreshCw, UploadCloud, Loader2, FileDown, FileUp, X, Pencil, Info, AlertCircle, Copy, Check, Eye } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Toast from '@/components/ui/Toast';
import { executeWorkflow, getExecutionOrder } from '@/lib/workflowEngine';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.mjs',
  import.meta.url
).toString();

const statusLabels = {
  idle: 'Idle',
  queued: 'Queued',
  running: 'Running',
  streaming: 'Streaming',
  completed: 'Completed',
  error: 'Error'
};

const statusClasses = {
  idle: 'bg-slate-100 text-slate-600',
  queued: 'bg-slate-100 text-slate-600',
  running: 'bg-amber-100 text-amber-700',
  streaming: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  error: 'bg-rose-100 text-rose-700'
};

const DEFAULT_ATTACHMENT_LIMIT = 1;

const arraysEqual = (first, second) => {
  if (first.length !== second.length) {
    return false;
  }
  return first.every((value, index) => value === second[index]);
};

const isAttachmentNode = (node) => node?.type === 'imageInput' || node?.type === 'audioInput';

const toAttachmentDescriptor = (node) => ({
  nodeName: node.data?.name || node.id,
  type: node.type === 'imageInput' ? 'image' : 'audio'
});

const normalizeAttachmentLimit = (value) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed;
  }
  return DEFAULT_ATTACHMENT_LIMIT;
};

const ensurePromptAttachmentSelection = (node, attachments, currentSelected) => {
  const imageLimit = normalizeAttachmentLimit(node.data?.imageAttachmentLimit);
  const audioLimit = normalizeAttachmentLimit(node.data?.audioAttachmentLimit);

  const counts = { image: 0, audio: 0 };
  const applyLimit = (type, action) => {
    const limit = type === 'image' ? imageLimit : audioLimit;
    if (limit > 0 && counts[type] >= limit) {
      return false;
    }
    action();
    if (limit > 0) {
      counts[type] += 1;
    }
    return true;
  };

  const next = [];

  currentSelected.forEach((name) => {
    const attachment = attachments.find((item) => item.nodeName === name);
    if (!attachment) {
      return;
    }
    applyLimit(attachment.type, () => {
      next.push(name);
    });
  });

  attachments.forEach((attachment) => {
    if (next.includes(attachment.nodeName)) {
      return;
    }
    applyLimit(attachment.type, () => {
      next.push(attachment.nodeName);
    });
  });

  return next;
};

const syncPromptAttachmentSelections = (nodes, edges) => {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  let updatedNodes = nodes;

  nodes.forEach((node, index) => {
    if (node.type !== 'prompt') {
      return;
    }
    const attachments = edges
      .filter((edge) => edge.target === node.id)
      .map((edge) => byId.get(edge.source))
      .filter(isAttachmentNode)
      .map(toAttachmentDescriptor);

    const currentSelected = Array.isArray(node.data?.selectedAttachments)
      ? node.data.selectedAttachments.filter((name) => attachments.some((item) => item.nodeName === name))
      : [];
    const nextSelected = ensurePromptAttachmentSelection(node, attachments, currentSelected);

    if (arraysEqual(nextSelected, currentSelected)) {
      return;
    }

    if (updatedNodes === nodes) {
      updatedNodes = [...nodes];
    }

    updatedNodes[index] = {
      ...node,
      data: {
        ...(node.data || {}),
        selectedAttachments: nextSelected
      }
    };
  });

  return updatedNodes;
};

const INPUT_NODE_TYPES = new Set(['inputNode', 'pdfInput', 'imageInput', 'audioInput']);
const TEXT_INPUT_TYPES = new Set(['inputNode']);
const FILE_INPUT_TYPES = new Set(['imageInput', 'audioInput', 'pdfInput']);
const INPUT_TYPE_LABELS = {
  inputNode: 'Text',
  imageInput: 'Image',
  audioInput: 'Audio',
  pdfInput: 'PDF'
};
const SORT_OPTIONS = [
  { value: 'nameAsc', label: 'Name A-Z' },
  { value: 'nameDesc', label: 'Name Z-A' },
  { value: 'dateNew', label: 'Newest first' },
  { value: 'dateOld', label: 'Oldest first' }
];
const MAX_PDF_FILES = 1;
const MAX_PDF_BYTES = 2 * 1024 * 1024;
const MAX_BULK_ROWS = 100;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
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

  const pageCount = pdfDocument.numPages;
  pdfDocument.cleanup();
  await task.destroy();

  return {
    text: pageTexts.join('\n\n'),
    pageCount
  };
};

const combinePdfEntries = (entries) => entries
  .map((item) => `--- ${item.name} (${item.pageCount} pages) ---\n${item.text}`)
  .join('\n\n');

const sortFiles = (files, sortOption) => {
  const copy = [...files];
  switch (sortOption) {
    case 'nameDesc':
      return copy.sort((a, b) => b.name.localeCompare(a.name));
    case 'dateNew':
      return copy.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
    case 'dateOld':
      return copy.sort((a, b) => (a.lastModified || 0) - (b.lastModified || 0));
    case 'nameAsc':
    default:
      return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
};

const isImageFile = (file) => {
  if (!file) {
    return false;
  }
  const name = file.name || '';
  return (file.type || '').startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|tiff?)$/i.test(name);
};

const isAudioFile = (file) => {
  if (!file) {
    return false;
  }
  const name = file.name || '';
  return (file.type || '').startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(name);
};

const isPdfFile = (file) => {
  if (!file) {
    return false;
  }
  const name = file.name || '';
  return (file.type || '').toLowerCase() === 'application/pdf' || /\.pdf$/i.test(name);
};

const getAcceptForNodeType = (type) => {
  switch (type) {
    case 'imageInput':
      return 'image/*';
    case 'audioInput':
      return 'audio/*';
    case 'pdfInput':
      return 'application/pdf';
    default:
      return undefined;
  }
};

const createEmptyOverride = (node) => {
  switch (node.type) {
    case 'inputNode':
      return { text: '' };
    case 'imageInput':
      return { text: '', file: null, attachment: null, error: null, isProcessing: false };
    case 'audioInput':
      return { text: '', file: null, attachment: null, error: null, isProcessing: false };
    case 'pdfInput':
      return { text: '', files: [], error: null, isProcessing: false };
    default:
      return {};
  }
};

function getStatusLabel(status) {
  return statusLabels[status] || status;
}

function getStatusClasses(status) {
  return statusClasses[status] || statusClasses.idle;
}

function truncateText(text, limit = 160) {
  if (!text) {
    return '';
  }
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit)}...`;
}

const isResultExportable = (result) => {
  if (!result) {
    return false;
  }
  if (result.status === 'completed' || result.status === 'error') {
    return true;
  }
  if (result.text) {
    return true;
  }
  if (Array.isArray(result.attachments) && result.attachments.length > 0) {
    return true;
  }
  return Boolean(result.error);
};

export default function BulkFlowRunner({ flow }) {
  const [rows, setRows] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [toast, setToast] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [bulkModal, setBulkModal] = useState(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [copiedCells, setCopiedCells] = useState(new Set());
  const [previewModal, setPreviewModal] = useState(null);
  const rowIdRef = useRef(1);
  const csvInputRef = useRef(null);
  const bulkFileInputRef = useRef(null);
  const tableScrollRef = useRef(null);
  const dragStateRef = useRef({
    pointerId: null,
    isActive: false,
    hasStarted: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0
  });
  const [isDraggingTable, setIsDraggingTable] = useState(false);
  const router = useRouter();
  const flowId = typeof flow?.id === 'number' ? flow.id : null;

  const executionData = useMemo(() => {
    if (!flow?.nodes || flow.nodes.length === 0) {
      return { orderedNodes: [], orderError: null };
    }
    try {
      const order = getExecutionOrder(flow.nodes, flow.edges || []);
      const orderedNodes = order
        .map((nodeId) => flow.nodes.find((node) => node.id === nodeId))
        .filter(Boolean);
      return { orderedNodes, orderError: null };
    } catch (error) {
      return { orderedNodes: [], orderError: error?.message || 'Failed to compute execution order.' };
    }
  }, [flow]);

  const orderedNodes = executionData.orderedNodes;
  const orderError = executionData.orderError;

  const inputNodes = useMemo(
    () => orderedNodes.filter((node) => INPUT_NODE_TYPES.has(node.type)),
    [orderedNodes]
  );

  const inputNodeMap = useMemo(
    () => new Map(inputNodes.map((node) => [node.id, node])),
    [inputNodes]
  );

  const resultNodes = useMemo(
    () => orderedNodes.filter((node) => !INPUT_NODE_TYPES.has(node.type)),
    [orderedNodes]
  );

  const resultNodeNames = useMemo(
    () => resultNodes.map((node) => node.data?.name).filter(Boolean),
    [resultNodes]
  );

  const resultNodeNameSet = useMemo(
    () => new Set(resultNodeNames),
    [resultNodeNames]
  );

  const hasDownloadableResults = useMemo(
    () =>
      rows.some((row) =>
        resultNodes.some((node) => {
          const name = node.data?.name || node.id;
          const result = row.results?.[name];
          return isResultExportable(result);
        })
      ),
    [resultNodes, rows]
  );

  const handleEditFlow = useCallback(() => {
    if (flowId === null) {
      return;
    }
    router.push(`/flows/${flowId}/edit`);
  }, [flowId, router]);

  const handleCopyResult = useCallback(async (rowId, nodeName, text) => {
    if (!text) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      const cellKey = `${rowId}-${nodeName}`;
      setCopiedCells((prev) => new Set(prev).add(cellKey));
      setTimeout(() => {
        setCopiedCells((prev) => {
          const next = new Set(prev);
          next.delete(cellKey);
          return next;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setToast({ message: 'Failed to copy to clipboard.', type: 'error' });
    }
  }, []);

  const handleOpenPreview = useCallback((nodeName, text) => {
    if (!text) {
      return;
    }
    setPreviewModal({ nodeName, text });
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewModal(null);
  }, []);

  const handleTablePointerDown = useCallback((event) => {
    const container = tableScrollRef.current;
    if (!container) {
      return;
    }
    if (event.button !== 0 && event.pointerType !== 'touch') {
      return;
    }
    if (event.target.closest('textarea, input, button, select, a, label, [data-no-drag-scroll]')) {
      return;
    }
    dragStateRef.current = {
      pointerId: event.pointerId,
      isActive: true,
      hasStarted: false,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: container.scrollLeft
    };
  }, []);

  const handleTablePointerMove = useCallback((event) => {
    const container = tableScrollRef.current;
    const state = dragStateRef.current;
    if (!container || !state.isActive) {
      return;
    }
    const deltaX = event.clientX - state.startX;
    const deltaY = event.clientY - state.startY;
    if (!state.hasStarted) {
      if (Math.abs(deltaX) < 4 || Math.abs(deltaX) < Math.abs(deltaY)) {
        return;
      }
      state.hasStarted = true;
      setIsDraggingTable(true);
      if (typeof container.setPointerCapture === 'function') {
        try {
          container.setPointerCapture(state.pointerId);
        } catch (_error) {}
      }
    }
    container.scrollLeft = state.scrollLeft - deltaX;
    event.preventDefault();
  }, []);

  const handleTablePointerEnd = useCallback((event) => {
    const container = tableScrollRef.current;
    const state = dragStateRef.current;
    if (!state.isActive) {
      return;
    }
    if (state.hasStarted && container && typeof container.releasePointerCapture === 'function') {
      try {
        container.releasePointerCapture(state.pointerId);
      } catch (_error) {}
    }
    if (state.hasStarted && event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    dragStateRef.current = {
      pointerId: null,
      isActive: false,
      hasStarted: false,
      startX: 0,
      startY: 0,
      scrollLeft: container ? container.scrollLeft : 0
    };
    setIsDraggingTable(false);
  }, []);

  const textInputNodes = useMemo(
    () => inputNodes.filter((node) => TEXT_INPUT_TYPES.has(node.type)),
    [inputNodes]
  );

  const makeRow = useCallback(() => {
    const overrides = {};
    inputNodes.forEach((node) => {
      overrides[node.id] = createEmptyOverride(node);
    });
    return {
      id: rowIdRef.current++,
      overrides,
      results: {},
      status: 'idle',
      error: null
    };
  }, [inputNodes]);

  useEffect(() => {
    if (rows.length === 0) {
      setRows([makeRow()]);
    }
  }, [makeRow, rows.length]);

  useEffect(() => {
    setRows((prev) =>
      prev.map((row) => {
        const currentOverrides = { ...(row.overrides || {}) };
        let changed = false;

        Object.keys(currentOverrides).forEach((nodeId) => {
          if (!inputNodeMap.has(nodeId)) {
            delete currentOverrides[nodeId];
            changed = true;
          }
        });

        inputNodes.forEach((node) => {
          if (!currentOverrides[node.id]) {
            currentOverrides[node.id] = createEmptyOverride(node);
            changed = true;
          }
        });

        if (!changed) {
          return row;
        }

        return {
          ...row,
          overrides: currentOverrides
        };
      })
    );
  }, [inputNodeMap, inputNodes]);

  const adjustRowCount = useCallback((target) => {
    if (!Number.isFinite(target)) {
      return;
    }
    const safeTarget = Math.min(Math.max(1, Math.floor(target)), MAX_BULK_ROWS);
    setRows((prev) => {
      if (safeTarget === prev.length) {
        return prev;
      }
      if (safeTarget > prev.length) {
        const next = [...prev];
        while (next.length < safeTarget) {
          next.push(makeRow());
        }
        return next;
      }
      return prev.slice(0, safeTarget);
    });
  }, [makeRow]);

  const handleRowCountInput = (event) => {
    if (isRunning) {
      return;
    }
    const parsed = Number(event.target.value);
    if (Number.isNaN(parsed)) {
      return;
    }
    adjustRowCount(parsed);
  };

  const applyOverrideUpdate = useCallback((rowId, nodeId, updater) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) {
          return row;
        }
        const node = inputNodeMap.get(nodeId);
        if (!node) {
          return row;
        }
        const currentOverride = row.overrides?.[nodeId] ?? createEmptyOverride(node);
        const nextOverride = typeof updater === 'function'
          ? updater(currentOverride, node)
          : { ...currentOverride, ...updater };

        return {
          ...row,
          overrides: {
            ...(row.overrides || {}),
            [nodeId]: nextOverride
          }
        };
      })
    );
  }, [inputNodeMap]);

  const handleTextChange = (rowId, nodeId, value) => {
    if (isRunning) {
      return;
    }
    applyOverrideUpdate(rowId, nodeId, (current) => ({
      ...current,
      text: value
    }));
  };

  const handleImageSelected = (rowId, nodeId, file) => {
    if (isRunning) {
      return;
    }
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      applyOverrideUpdate(rowId, nodeId, (current) => ({
        ...current,
        error: 'Only image files are supported.'
      }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      applyOverrideUpdate(rowId, nodeId, (current) => ({
        ...current,
        error: 'Image must not exceed 2 MB.'
      }));
      return;
    }
    const attachment = {
      kind: 'image',
      name: file.name,
      size: file.size,
      mimeType: file.type,
      file
    };
    applyOverrideUpdate(rowId, nodeId, (current) => ({
      ...current,
      file,
      attachment,
      text: '',
      error: null,
      isProcessing: false
    }));
  };

  const handleAudioSelected = (rowId, nodeId, file) => {
    if (isRunning) {
      return;
    }
    if (!file) {
      return;
    }
    if (!file.type.startsWith('audio/')) {
      applyOverrideUpdate(rowId, nodeId, (current) => ({
        ...current,
        error: 'Only audio files are supported.'
      }));
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      applyOverrideUpdate(rowId, nodeId, (current) => ({
        ...current,
        error: 'Audio must not exceed 5 MB.'
      }));
      return;
    }
    const attachment = {
      kind: 'audio',
      name: file.name,
      size: file.size,
      mimeType: file.type,
      file
    };
    applyOverrideUpdate(rowId, nodeId, (current) => ({
      ...current,
      file,
      attachment,
      text: '',
      error: null,
      isProcessing: false
    }));
  };

  const handleMediaRemove = (rowId, nodeId) => {
    if (isRunning) {
      return;
    }
    applyOverrideUpdate(rowId, nodeId, (current) => ({
      ...current,
      file: null,
      attachment: null,
      text: '',
      error: null,
      isProcessing: false
    }));
  };

  const handlePdfSelected = async (rowId, nodeId, files) => {
    if (isRunning) {
      return;
    }
    if (!files || files.length === 0) {
      return;
    }
    if (files.length > MAX_PDF_FILES) {
      applyOverrideUpdate(rowId, nodeId, (current) => ({
        ...current,
        error: `Maximum of ${MAX_PDF_FILES} file${MAX_PDF_FILES > 1 ? 's' : ''} allowed.`
      }));
      return;
    }
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_PDF_BYTES) {
      applyOverrideUpdate(rowId, nodeId, (current) => ({
        ...current,
        error: 'Total file size must not exceed 2 MB.'
      }));
      return;
    }

    applyOverrideUpdate(rowId, nodeId, (current) => ({
      ...current,
      isProcessing: true,
      error: null
    }));

    try {
      const entries = [];
      for (const file of files) {
        const { text, pageCount } = await extractTextFromPdf(file);
        entries.push({
          name: file.name,
          size: file.size,
          type: file.type,
          pageCount,
          text
        });
      }
      const combinedText = combinePdfEntries(entries);
      applyOverrideUpdate(rowId, nodeId, (current) => ({
        ...current,
        files: entries,
        text: combinedText,
        error: null,
        isProcessing: false
      }));
    } catch (error) {
      console.error('PDF processing failed:', error);
      applyOverrideUpdate(rowId, nodeId, (current) => ({
        ...current,
        error: 'Unable to extract text from the selected file(s).',
        isProcessing: false
      }));
    }
  };

  const handlePdfClear = (rowId, nodeId) => {
    if (isRunning) {
      return;
    }
    applyOverrideUpdate(rowId, nodeId, (current) => ({
      ...current,
      files: [],
      text: '',
      error: null,
      isProcessing: false
    }));
  };

  const clearBulkFileInput = () => {
    if (bulkFileInputRef.current) {
      bulkFileInputRef.current.value = '';
    }
  };

  const handleOpenBulkModal = (node) => {
    if (!node || !FILE_INPUT_TYPES.has(node.type)) {
      return;
    }
    clearBulkFileInput();
    setBulkModal({
      nodeId: node.id,
      nodeType: node.type,
      nodeName: node.data?.name || node.id,
      sortOption: 'nameAsc',
      files: [],
      error: null
    });
  };

  const handleBulkModalClose = () => {
    if (bulkProcessing) {
      return;
    }
    clearBulkFileInput();
    setBulkModal(null);
  };

  const handleBulkFilePicker = () => {
    if (!bulkModal || bulkProcessing) {
      return;
    }
    bulkFileInputRef.current?.click();
  };

  const handleBulkFilesSelected = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) {
      return;
    }
    setBulkModal((current) => (current ? { ...current, files, error: null } : current));
  };

  const handleBulkSortChange = (event) => {
    const value = event.target.value;
    setBulkModal((current) => (current ? { ...current, sortOption: value } : current));
  };

  const handleBulkClearSelection = () => {
    clearBulkFileInput();
    setBulkModal((current) => (current ? { ...current, files: [], error: null } : current));
  };

  const applyBulkPayloads = useCallback((node, payloads) => {
    if (!node || payloads.length === 0) {
      return;
    }
    setRows((prev) => {
      let next = [...prev];
      const required = Math.min(payloads.length, MAX_BULK_ROWS);
      while (next.length < required) {
        next.push(makeRow());
      }
      next = next.map((row, index) => {
        if (index >= required) {
          return row;
        }
        const payload = payloads[index];
        const nextOverride = {
          ...(row.overrides?.[node.id] || createEmptyOverride(node)),
          ...payload
        };
        return {
          ...row,
          overrides: {
            ...(row.overrides || {}),
            [node.id]: nextOverride
          },
          results: {},
          status: 'idle',
          error: null
        };
      });
      return next;
    });
  }, [makeRow]);

  const handleBulkConfirm = async () => {
    if (!bulkModal) {
      return;
    }
    const node = inputNodeMap.get(bulkModal.nodeId);
    if (!node) {
      setToast({ message: 'Target node is no longer available.', type: 'error' });
      clearBulkFileInput();
      setBulkModal(null);
      return;
    }
    if (!Array.isArray(bulkModal.files) || bulkModal.files.length === 0) {
      setBulkModal((current) => (current ? { ...current, error: 'Select at least one file.' } : current));
      return;
    }

    setBulkProcessing(true);
    try {
      const sortedFiles = sortFiles(bulkModal.files, bulkModal.sortOption);
      const payloads = [];
      let skippedCount = 0;

      if (node.type === 'imageInput' || node.type === 'audioInput') {
        const validator = node.type === 'imageInput' ? isImageFile : isAudioFile;
        const maxBytes = node.type === 'imageInput' ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
        const kind = node.type === 'imageInput' ? 'image' : 'audio';

        sortedFiles.forEach((file) => {
          if (!validator(file)) {
            skippedCount += 1;
            return;
          }
          if (file.size > maxBytes) {
            skippedCount += 1;
            return;
          }
          payloads.push({
            file,
            attachment: {
              kind,
              name: file.name,
              size: file.size,
              mimeType: file.type,
              file
            },
            text: '',
            error: null,
            isProcessing: false
          });
        });
      } else if (node.type === 'pdfInput') {
        const validFiles = sortedFiles.filter((file) => {
          if (!isPdfFile(file)) {
            skippedCount += 1;
            return false;
          }
          if (file.size > MAX_PDF_BYTES) {
            skippedCount += 1;
            return false;
          }
          return true;
        });

        for (const file of validFiles) {
          try {
            const { text, pageCount } = await extractTextFromPdf(file);
            const entry = {
              name: file.name,
              size: file.size,
              type: file.type || 'application/pdf',
              pageCount,
              text
            };
            payloads.push({
              files: [entry],
              text: combinePdfEntries([entry]),
              error: null,
              isProcessing: false
            });
          } catch (error) {
            console.error('PDF bulk processing failed:', error);
            skippedCount += 1;
          }
        }
      }

      if (payloads.length === 0) {
        setBulkModal((current) => (current ? { ...current, error: 'No valid files to assign. Please review your selection.' } : current));
        return;
      }

      const limitedPayloads = payloads.slice(0, MAX_BULK_ROWS);
      applyBulkPayloads(node, limitedPayloads);
      clearBulkFileInput();
      setBulkModal(null);

      const appliedCount = limitedPayloads.length;
      let message = `Assigned ${appliedCount} file${appliedCount === 1 ? '' : 's'} to ${node.data?.name || node.id}.`;
      if (payloads.length > MAX_BULK_ROWS) {
        message += ` Only the first ${MAX_BULK_ROWS} were applied.`;
      }
      if (skippedCount > 0) {
        message += ` Skipped ${skippedCount} file${skippedCount === 1 ? '' : 's'} due to type, size, or parsing issues.`;
      }
      setToast({ message, type: 'success' });
    } catch (error) {
      console.error('Bulk media assignment failed:', error);
      setToast({ message: error?.message || 'Bulk upload failed.', type: 'error' });
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (textInputNodes.length === 0) {
      setToast({ message: 'This flow has no text inputs to export.', type: 'error' });
      return;
    }
    const headers = textInputNodes.map((node) => node.data?.name || node.id);
    const csv = Papa.unparse({
      fields: headers,
      data: [headers.map(() => '')]
    });
    const safeName = String(flow?.name || 'flow')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'flow';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName}-sample.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleDownloadResults = () => {
    if (isRunning) {
      return;
    }
    if (resultNodes.length === 0) {
      setToast({ message: 'This flow has no result nodes to export.', type: 'error' });
      return;
    }

    const header = ['Row'];
    const resolvedNames = resultNodes.map((node) => node.data?.name || node.id);
    resolvedNames.forEach((name) => {
      header.push(`${name} status`);
      header.push(`${name} text`);
      header.push(`${name} attachments`);
    });

    const dataRows = [];
    rows.forEach((row, rowIndex) => {
      const hasOutputs = resolvedNames.some((name) => {
        const result = row.results?.[name];
        return isResultExportable(result);
      });
      if (!hasOutputs) {
        return;
      }
      const rowData = [rowIndex + 1];
      resolvedNames.forEach((name) => {
        const result = row.results?.[name] || null;
        const status = result?.status || 'idle';
        const text = result?.text || '';
        const attachments = Array.isArray(result?.attachments) && result.attachments.length > 0
          ? result.attachments.map((item) => item?.name || item?.kind || 'Attachment').join('; ')
          : '';
        rowData.push(status);
        rowData.push(text);
        rowData.push(attachments);
      });
      dataRows.push(rowData);
    });

    if (dataRows.length === 0) {
      setToast({ message: 'No completed results are available to export yet.', type: 'error' });
      return;
    }

    const csv = Papa.unparse({ fields: header, data: dataRows });
    const safeName = String(flow?.name || 'flow')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'flow';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName}-results.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setToast({ message: 'Results CSV downloaded.', type: 'success' });
  };

  const handleUploadRequest = () => {
    if (isRunning) {
      return;
    }
    if (textInputNodes.length === 0) {
      setToast({ message: 'This flow has no text inputs to import.', type: 'error' });
      return;
    }
    csvInputRef.current?.click();
  };

  const handleCsvSelected = (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = '';
    if (!file || isRunning) {
      return;
    }

    if (textInputNodes.length === 0) {
      setToast({ message: 'This flow has no text inputs to import.', type: 'error' });
      return;
    }

    setIsImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsImporting(false);
        const fatalError = Array.isArray(results.errors)
          ? results.errors.find((item) => item?.fatal)
          : null;
        if (fatalError) {
          setToast({ message: `CSV error: ${fatalError.message}`, type: 'error' });
          return;
        }
        if (Array.isArray(results.errors) && results.errors.length > 0) {
          console.warn('CSV parsed with warnings:', results.errors);
        }
        const rawRows = Array.isArray(results.data) ? results.data : [];
        if (rawRows.length === 0) {
          setToast({ message: 'CSV file has no data rows.', type: 'error' });
          return;
        }

        const normalizedRows = [];
        rawRows.forEach((record) => {
          const rowData = {};
          let hasValue = false;
          textInputNodes.forEach((node) => {
            const columnKey = node.data?.name || node.id;
            if (!Object.prototype.hasOwnProperty.call(record, columnKey)) {
              return;
            }
            const rawValue = record[columnKey];
            if (rawValue === null || rawValue === undefined) {
              return;
            }
            const stringValue = typeof rawValue === 'string' ? rawValue : String(rawValue);
            if (stringValue.length === 0) {
              return;
            }
            rowData[node.id] = stringValue;
            hasValue = true;
          });
          if (hasValue) {
            normalizedRows.push(rowData);
          }
        });

        if (normalizedRows.length === 0) {
          setToast({ message: 'No valid rows were found in the CSV.', type: 'error' });
          return;
        }

        const limitedRows = normalizedRows.slice(0, MAX_BULK_ROWS);
        setRows((prev) => {
          const next = [...prev];
          const applyCount = limitedRows.length;
          for (let index = 0; index < applyCount; index += 1) {
            const rowValues = limitedRows[index];
            if (index < next.length) {
              const currentRow = next[index];
              const updatedOverrides = { ...(currentRow.overrides || {}) };
              textInputNodes.forEach((node) => {
                const nodeId = node.id;
                const existingOverride = updatedOverrides[nodeId] ?? createEmptyOverride(node);
                const hasText = Object.prototype.hasOwnProperty.call(rowValues, nodeId);
                updatedOverrides[nodeId] = {
                  ...existingOverride,
                  text: hasText ? rowValues[nodeId] : ''
                };
              });
              next[index] = {
                ...currentRow,
                overrides: updatedOverrides,
                results: {},
                status: 'idle',
                error: null
              };
            } else if (index < MAX_BULK_ROWS) {
              const overrides = {};
              inputNodes.forEach((node) => {
                overrides[node.id] = createEmptyOverride(node);
              });
              textInputNodes.forEach((node) => {
                if (Object.prototype.hasOwnProperty.call(rowValues, node.id)) {
                  overrides[node.id] = {
                    ...overrides[node.id],
                    text: rowValues[node.id]
                  };
                }
              });
              next.push({
                id: rowIdRef.current++,
                overrides,
                results: {},
                status: 'idle',
                error: null
              });
            }
          }

          if (applyCount < next.length) {
            for (let index = applyCount; index < next.length; index += 1) {
              const currentRow = next[index];
              const updatedOverrides = { ...(currentRow.overrides || {}) };
              textInputNodes.forEach((node) => {
                const nodeId = node.id;
                const existingOverride = updatedOverrides[nodeId] ?? createEmptyOverride(node);
                if (existingOverride.text !== '') {
                  updatedOverrides[nodeId] = {
                    ...existingOverride,
                    text: ''
                  };
                } else {
                  updatedOverrides[nodeId] = existingOverride;
                }
              });
              next[index] = {
                ...currentRow,
                overrides: updatedOverrides,
                results: {},
                status: 'idle',
                error: null
              };
            }
          }

          return next;
        });

        const appliedCount = limitedRows.length;
        if (normalizedRows.length > MAX_BULK_ROWS) {
          setToast({ message: `Imported ${appliedCount} rows (limited to ${MAX_BULK_ROWS}). Existing file inputs were preserved.`, type: 'success' });
        } else {
          setToast({ message: `Imported ${appliedCount} rows. Existing file inputs were preserved.`, type: 'success' });
        }
      },
      error: (parseError) => {
        setIsImporting(false);
        setToast({ message: `Failed to parse CSV: ${parseError?.message || 'Unknown error.'}`, type: 'error' });
      }
    });
  };

  const handleRemoveRow = (rowId) => {
    if (isRunning) {
      return;
    }
    setRows((prev) => {
      if (prev.length <= 1) {
        return [makeRow()];
      }
      return prev.filter((row) => row.id !== rowId);
    });
  };

  const handleClearResults = () => {
    if (isRunning) {
      return;
    }
    setRows((prev) =>
      prev.map((row) => ({ ...row, results: {}, status: 'idle', error: null }))
    );
  };

  const applyProgress = useCallback(
    (rowId, progress) => {
      if (!resultNodeNameSet.has(progress.nodeName)) {
        return;
      }
      setRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) {
            return row;
          }
          const current = row.results[progress.nodeName] || {
            status: 'queued',
            text: '',
            attachments: [],
            error: null
          };
          let nextText = current.text;
          let nextAttachments = current.attachments;
          if (progress.result) {
            if (typeof progress.result === 'string') {
              nextText = progress.result;
              nextAttachments = [];
            } else {
              const textValue = typeof progress.result.text === 'string' ? progress.result.text : nextText;
              const attachmentsValue = Array.isArray(progress.result.attachments)
                ? progress.result.attachments
                : nextAttachments;
              nextText = textValue;
              nextAttachments = attachmentsValue;
            }
          }
          return {
            ...row,
            results: {
              ...row.results,
              [progress.nodeName]: {
                status: progress.status,
                text: nextText,
                attachments: nextAttachments,
                error: progress.error || null
              }
            }
          };
        })
      );
    },
    [resultNodeNameSet]
  );

  const executeRow = useCallback(
    async (row) => {
      if (!flow?.nodes || flow.nodes.length === 0) {
        throw new Error('Flow is empty.');
      }
      if (orderError) {
        throw new Error(orderError);
      }
      const edges = Array.isArray(flow.edges) ? flow.edges : [];
      const nodesClone = flow.nodes.map((node) => ({
        ...node,
        data: { ...(node.data || {}) }
      }));

      inputNodes.forEach((inputNode) => {
        const targetIndex = nodesClone.findIndex((node) => node.id === inputNode.id);
        if (targetIndex === -1) {
          return;
        }
        const override = row.overrides?.[inputNode.id];
        if (!override) {
          return;
        }
        const currentData = nodesClone[targetIndex].data || {};
        let nextData = currentData;

        switch (inputNode.type) {
          case 'inputNode':
            nextData = {
              ...currentData,
              text: override.text || ''
            };
            break;
          case 'imageInput':
            nextData = {
              ...currentData,
              text: '',
              file: override.file || null,
              attachment: override.attachment || null
            };
            break;
          case 'audioInput':
            nextData = {
              ...currentData,
              text: '',
              file: override.file || null,
              attachment: override.attachment || null
            };
            break;
          case 'pdfInput':
            nextData = {
              ...currentData,
              text: override.text || '',
              files: Array.isArray(override.files) ? override.files : []
            };
            break;
          default:
            break;
        }

        nodesClone[targetIndex] = {
          ...nodesClone[targetIndex],
          data: nextData
        };
      });

      const preparedNodes = syncPromptAttachmentSelections(nodesClone, edges);

      const initialResults = resultNodeNames.reduce((acc, name) => {
        acc[name] = {
          status: 'queued',
          text: '',
          attachments: [],
          error: null
        };
        return acc;
      }, {});

      setRows((prev) =>
        prev.map((current) =>
          current.id === row.id
            ? { ...current, status: 'running', results: initialResults, error: null }
            : current
        )
      );

      try {
        await executeWorkflow(
          preparedNodes,
          edges,
          (progress) => {
            applyProgress(row.id, progress);
          },
          () => {
            setRows((prev) =>
              prev.map((current) =>
                current.id === row.id
                  ? { ...current, status: 'completed' }
                  : current
              )
            );
          },
          (error) => {
            setRows((prev) =>
              prev.map((current) =>
                current.id === row.id
                  ? { ...current, status: 'error', error: error?.message || 'Execution failed.' }
                  : current
              )
            );
          }
        );
      } catch (error) {
        setRows((prev) =>
          prev.map((current) =>
            current.id === row.id
              ? { ...current, status: 'error', error: error?.message || 'Execution failed.' }
              : current
          )
        );
        throw error;
      }
    },
    [applyProgress, flow, inputNodes, orderError, resultNodeNames]
  );

  const handleRunAll = useCallback(async () => {
    if (isRunning) {
      return;
    }
    if (rows.length === 0) {
      setToast({ message: 'Add at least one row before running.', type: 'error' });
      return;
    }
    setIsRunning(true);
    try {
      for (const row of [...rows]) {
        await executeRow(row);
      }
      setToast({ message: 'Bulk execution finished. Download your results before leaving; they are not stored automatically.', type: 'success' });
    } catch (error) {
      setToast({ message: error?.message || 'Bulk execution failed.', type: 'error' });
    } finally {
      setIsRunning(false);
    }
  }, [executeRow, isRunning, rows]);

  const handleRunRow = useCallback(
    async (rowId) => {
      if (isRunning) {
        return;
      }
      const target = rows.find((row) => row.id === rowId);
      if (!target) {
        return;
      }
      setIsRunning(true);
      try {
        await executeRow(target);
        setToast({ message: 'Row executed. Download your results before leaving; they are not stored automatically.', type: 'success' });
      } catch (error) {
        setToast({ message: error?.message || 'Failed to execute row.', type: 'error' });
      } finally {
        setIsRunning(false);
      }
    },
    [executeRow, isRunning, rows]
  );

  const closeToast = () => {
    setToast(null);
  };

  return (
    <div className="w-full space-y-8">
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleCsvSelected}
      />
      <input
        ref={bulkFileInputRef}
        type="file"
        className="hidden"
        accept={bulkModal ? getAcceptForNodeType(bulkModal.nodeType) : undefined}
        multiple
        onChange={handleBulkFilesSelected}
      />
      
      <Card gradient className="shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div 
            className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 50%, #0ea5e9 100%)',
            }}
          >
            <Play className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">
              {flow?.name || 'Untitled flow'}
            </h1>
            {flow?.description ? (
              <p className="text-sm text-slate-600 leading-relaxed">{flow.description}</p>
            ) : (
              <p className="text-sm text-slate-400">No description provided</p>
            )}
          </div>
        </div>

        {orderError && (
          <Alert type="error" icon={AlertCircle} title="Execution order error">
            <p className="text-sm">{orderError}</p>
          </Alert>
        )}

        {!orderError && (
          <>
            <div className="bg-linear-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Important</p>
                  <p className="text-sm text-amber-700 leading-relaxed">
                    Do not close or reload this page while bulk runs are active. Download your results as soon as processing finishes; they are not stored automatically.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-2 border-slate-200 rounded-2xl bg-slate-50 w-full sm:w-auto sm:min-w-[200px]">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase text-slate-500 tracking-wide">Rows</span>
                  <span className="text-[11px] text-slate-400">Max {MAX_BULK_ROWS}</span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={MAX_BULK_ROWS}
                  value={rows.length}
                  onChange={handleRowCountInput}
                  disabled={isRunning}
                  aria-label="Row count"
                  className="w-20 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 disabled:bg-slate-100"
                />
              </div>
              <Button
                onClick={handleDownloadTemplate}
                variant="ghost"
                icon={FileDown}
                disabled={isRunning || textInputNodes.length === 0}
                className="flex-1 sm:flex-none whitespace-nowrap"
              >
                Template
              </Button>
              <Button
                onClick={handleDownloadResults}
                variant="ghost"
                icon={FileDown}
                disabled={isRunning || !hasDownloadableResults}
                className="flex-1 sm:flex-none whitespace-nowrap"
              >
                Results
              </Button>
              <Button
                onClick={handleUploadRequest}
                variant="ghost"
                icon={FileUp}
                disabled={isRunning || textInputNodes.length === 0}
                isLoading={isImporting}
                className="flex-1 sm:flex-none whitespace-nowrap"
              >
                {isImporting ? 'Importing...' : 'Import'}
              </Button>
              <Button
                onClick={handleClearResults}
                variant="ghost"
                icon={RefreshCw}
                disabled={isRunning || rows.length === 0}
                className="flex-1 sm:flex-none whitespace-nowrap"
              >
                Clear
              </Button>
              <div className="w-full sm:flex-1 sm:min-w-[200px] flex gap-3">
                <Button
                  onClick={handleEditFlow}
                  variant="secondary"
                  icon={Pencil}
                  disabled={isRunning || flowId === null}
                  className="flex-1 justify-center whitespace-nowrap"
                >
                  Edit flow
                </Button>
                <Button
                  onClick={handleRunAll}
                  variant="primary"
                  icon={Play}
                  isLoading={isRunning}
                  disabled={isRunning || rows.length === 0 || Boolean(orderError)}
                  className="flex-1 justify-center whitespace-nowrap"
                >
                  {isRunning ? 'Running...' : 'Run all'}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div
          ref={tableScrollRef}
          className="overflow-x-auto"
          onPointerDown={handleTablePointerDown}
          onPointerMove={handleTablePointerMove}
          onPointerUp={handleTablePointerEnd}
          onPointerLeave={handleTablePointerEnd}
          onPointerCancel={handleTablePointerEnd}
          style={isDraggingTable ? { cursor: 'grabbing' } : undefined}
        >
        <table className="w-full text-left min-w-[960px]">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-3 pr-4">Row</th>
              {inputNodes.map((node) => {
                const nodeName = node.data?.name || node.id;
                const typeLabel = INPUT_TYPE_LABELS[node.type] || 'Input';
                return (
                  <th key={node.id} className="pb-3 pr-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-600">{nodeName}</span>
                        <span className="text-[11px] text-slate-400">{typeLabel}</span>
                      </div>
                      {FILE_INPUT_TYPES.has(node.type) && (
                        <button
                          type="button"
                          onClick={() => handleOpenBulkModal(node)}
                          disabled={isRunning || Boolean(bulkModal)}
                          className="flex items-center gap-1 px-2 py-1 rounded-xl border border-teal-100 bg-teal-50 text-[11px] font-semibold text-teal-700 hover:bg-teal-100 disabled:text-slate-400 disabled:border-slate-200 disabled:bg-slate-100"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Bulk</span>
                        </button>
                      )}
                    </div>
                  </th>
                );
              })}
              {resultNodes.map((node) => {
                const nodeName = node.data?.name || node.id;
                return (
                  <th key={nodeName} className="pb-3 pr-4">{nodeName}</th>
                );
              })}
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.id} className="border-t border-slate-200 align-top">
                <td className="py-3 pr-4 text-sm font-semibold text-slate-600">{rowIndex + 1}</td>
                {inputNodes.map((node) => {
                  const nodeId = node.id;
                  const nodeName = node.data?.name || node.id;
                  const override = row.overrides?.[nodeId] ?? createEmptyOverride(node);
                  const inputKey = `${row.id}-${nodeId}`;

                  if (node.type === 'inputNode') {
                    return (
                      <td key={nodeId} className="py-3 pr-4">
                        <textarea
                          value={override.text || ''}
                          onChange={(event) => handleTextChange(row.id, nodeId, event.target.value)}
                          disabled={isRunning}
                          rows={4}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 resize-none min-w-[150px]"
                          placeholder={`Enter text for ${nodeName}`}
                        />
                      </td>
                    );
                  }

                  if (node.type === 'imageInput' || node.type === 'audioInput') {
                    const accept = node.type === 'imageInput' ? 'image/*' : 'audio/*';
                    const handleSelect = node.type === 'imageInput' ? handleImageSelected : handleAudioSelected;
                    const file = override.file;
                    const error = override.error;
                    const label = node.type === 'imageInput' ? 'Select image' : 'Select audio';
                    const emptyHint = node.type === 'imageInput'
                      ? 'No image selected'
                      : 'No audio selected';

                    return (
                      <td key={nodeId} className="py-3 pr-4">
                        <div className="space-y-2">
                          <input
                            id={`upload-${inputKey}`}
                            type="file"
                            accept={accept}
                            className="hidden"
                            disabled={isRunning}
                            onChange={(event) => {
                              const selectedFile = event.target.files?.[0] || null;
                              event.target.value = '';
                              handleSelect(row.id, nodeId, selectedFile);
                            }}
                          />
                          <label
                            htmlFor={`upload-${inputKey}`}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer ${
                              isRunning
                                ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                                : 'border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-teal-50'
                            }`}
                          >
                            <UploadCloud className="w-4 h-4" />
                            {label}
                          </label>

                          {file ? (
                            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs text-slate-600">
                              <div className="flex items-center justify-between gap-2">
                                <div className="truncate">
                                  <p className="font-semibold truncate" title={file.name}>{file.name}</p>
                                  <p className="text-[11px] text-slate-500">{file.type || 'binary'} • {formatBytes(file.size)}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleMediaRemove(row.id, nodeId)}
                                  disabled={isRunning}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded transition disabled:opacity-40"
                                  title="Remove file"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400">{emptyHint}</p>
                          )}

                          {error && (
                            <p className="text-[11px] text-rose-600">{error}</p>
                          )}
                        </div>
                      </td>
                    );
                  }

                  if (node.type === 'pdfInput') {
                    const files = Array.isArray(override.files) ? override.files : [];
                    const error = override.error;
                    const isProcessing = Boolean(override.isProcessing);

                    return (
                      <td key={nodeId} className="py-3 pr-4">
                        <div className="space-y-2">
                          <input
                            id={`pdf-${inputKey}`}
                            type="file"
                            accept="application/pdf"
                            multiple
                            className="hidden"
                            disabled={isRunning || isProcessing}
                            onChange={async (event) => {
                              const selectedFiles = Array.from(event.target.files || []);
                              event.target.value = '';
                              await handlePdfSelected(row.id, nodeId, selectedFiles);
                            }}
                          />
                          <label
                            htmlFor={`pdf-${inputKey}`}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer ${
                              isRunning || isProcessing
                                ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                                : 'border-slate-200 text-slate-600 hover:border-rose-300 hover:bg-rose-50'
                            }`}
                          >
                            <UploadCloud className="w-4 h-4" />
                            Select PDF
                          </label>

                          {isProcessing && (
                            <div className="flex items-center gap-2 text-[11px] text-rose-600">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing PDF...
                            </div>
                          )}

                          {files.length > 0 ? (
                            <div className="space-y-2">
                              {files.map((item, index) => (
                                <div
                                  key={`${item.name}-${index}`}
                                  className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs text-slate-600"
                                >
                                  <p className="font-semibold truncate" title={item.name}>{item.name}</p>
                                  <p className="text-[11px] text-slate-500">
                                    {item.pageCount} pages • {formatBytes(item.size)}
                                  </p>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => handlePdfClear(row.id, nodeId)}
                                disabled={isRunning || isProcessing}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700"
                              >
                                Clear selection
                              </button>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400">No PDF selected</p>
                          )}

                          {error && (
                            <p className="text-[11px] text-rose-600">{error}</p>
                          )}
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={nodeId} className="py-3 pr-4 text-xs text-slate-400">
                      Unsupported input
                    </td>
                  );
                })}
                {resultNodes.map((node) => {
                  const nodeName = node.data?.name || node.id;
                  const result = row.results[nodeName];
                  const cellKey = `${row.id}-${nodeName}`;
                  const isCopied = copiedCells.has(cellKey);
                  return (
                    <td key={nodeName} className="py-3 pr-4 text-sm text-slate-600 min-x-[150px]">
                      {result ? (
                        <div className="space-y-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${getStatusClasses(result.status)}`}
                          >
                            {getStatusLabel(result.status)}
                          </span>
                          {result.error ? (
                            <p className="text-xs text-rose-600 leading-relaxed">{result.error}</p>
                          ) : result.text ? (
                            <div className="relative group">
                              <div
                                className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 whitespace-pre-wrap max-h-32 overflow-y-auto"
                                title={result.text}
                              >
                                {result.text}
                              </div>
                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => handleOpenPreview(nodeName, result.text)}
                                  className="p-1.5 rounded-lg bg-white/90 border border-slate-200 text-slate-600 hover:bg-white hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
                                  title="View full content"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyResult(row.id, nodeName, result.text)}
                                  className="p-1.5 rounded-lg bg-white/90 border border-slate-200 text-slate-600 hover:bg-white hover:text-teal-600 hover:border-teal-300 transition-all shadow-sm"
                                  title="Copy to clipboard"
                                >
                                  {isCopied ? (
                                    <Check className="w-3.5 h-3.5 text-teal-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">Waiting for output...</p>
                          )}
                          {result.attachments && result.attachments.length > 0 && (
                            <p className="text-[11px] text-slate-500">Attachments: {result.attachments.length}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Waiting for output...</span>
                      )}
                    </td>
                  );
                })}
                <td className="py-3 pr-4">
                  <div className="space-y-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusClasses(row.status)}`}
                    >
                      {getStatusLabel(row.status)}
                    </span>
                    {row.error && (
                      <p className="text-xs text-rose-600 leading-relaxed">{row.error}</p>
                    )}
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleRunRow(row.id)}
                      disabled={isRunning || Boolean(orderError)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-teal-200 text-xs font-semibold text-teal-600 hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="w-4 h-4" />
                      Run row
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(row.id)}
                      disabled={isRunning}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>

      {bulkModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-xl p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900">Bulk upload for {bulkModal.nodeName}</h2>
                <p className="text-sm text-slate-500">Files are distributed across rows in order after applying the selected sort.</p>
              </div>
              <button
                type="button"
                onClick={handleBulkModalClose}
                disabled={bulkProcessing}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition disabled:opacity-50"
                aria-label="Close bulk upload modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleBulkFilePicker}
                  icon={UploadCloud}
                  disabled={bulkProcessing}
                  className="min-w-36 justify-center"
                >
                  Choose files
                </Button>
                <Button
                  onClick={handleBulkClearSelection}
                  variant="ghost"
                  disabled={bulkProcessing || bulkModal.files.length === 0}
                >
                  Clear selection
                </Button>
                <span className="text-xs text-slate-500">
                  {bulkModal.files.length === 0
                    ? 'No files selected yet.'
                    : `${bulkModal.files.length} file${bulkModal.files.length === 1 ? '' : 's'} selected.`}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="bulk-sort">
                  Sort files
                </label>
                <select
                  id="bulk-sort"
                  value={bulkModal.sortOption}
                  onChange={handleBulkSortChange}
                  disabled={bulkProcessing}
                  className="w-full border border-slate-200 rounded-2xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 disabled:bg-slate-100"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border border-slate-200 rounded-3xl bg-slate-50 max-h-52 overflow-y-auto">
                {bulkModal.files.length === 0 ? (
                  <div className="px-6 py-12 text-center text-sm text-slate-500">
                    Choose files to preview them here.
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-200">
                    {sortFiles(bulkModal.files, bulkModal.sortOption).map((file, index) => (
                      <li key={`${file.name}-${file.size}-${index}`} className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-700 truncate" title={file.name}>{file.name}</p>
                        <p className="text-xs text-slate-500">{file.type || 'binary'} • {formatBytes(file.size)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="text-xs text-slate-400">Up to {MAX_BULK_ROWS} rows receive files. Extra uploads remain unused.</p>

              {bulkModal.error && (
                <p className="text-sm text-rose-600">{bulkModal.error}</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button onClick={handleBulkModalClose} variant="ghost" disabled={bulkProcessing}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkConfirm}
                variant="primary"
                isLoading={bulkProcessing}
                disabled={bulkProcessing}
                className="min-w-32 justify-center"
              >
                {bulkProcessing ? 'Applying...' : 'Apply files'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {previewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between gap-4 p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div 
                  className="flex items-center justify-center w-10 h-10 rounded-xl shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  }}
                >
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{previewModal.nodeName}</h2>
                  <p className="text-sm text-slate-500">Full content preview</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClosePreview}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div 
                className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-teal-600 prose-strong:text-slate-900 prose-code:text-slate-800 prose-pre:bg-slate-900 prose-pre:text-slate-100"
                dangerouslySetInnerHTML={{ __html: marked(previewModal.text) }}
              />
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
              <Button
                onClick={() => handleCopyResult(null, previewModal.nodeName, previewModal.text)}
                variant="secondary"
                icon={Copy}
              >
                Copy to clipboard
              </Button>
              <Button
                onClick={handleClosePreview}
                variant="primary"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-6 right-6 z-50">
          <Toast message={toast.message} type={toast.type} onClose={closeToast} />
        </div>
      )}
    </div>
  );
}
