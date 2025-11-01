'use client';

import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Plus, 
  Play, 
  Save, 
  Trash2,
  FileText,
  Wand2,
  RefreshCw,
  CheckCircle,
  MessageSquare,
  Languages,
  List,
  Files,
  Image as ImageIcon,
  Mic,
  PlayCircle
} from 'lucide-react';
import Button from './ui/Button';
import Toast from './ui/Toast';
import InputNode from './workflow/InputNode';
import WriterNode from './workflow/WriterNode';
import RewriterNode from './workflow/RewriterNode';
import SummarizerNode from './workflow/SummarizerNode';
import PromptNode from './workflow/PromptNode';
import ProofreaderNode from './workflow/ProofreaderNode';
import TranslatorNode from './workflow/TranslatorNode';
import PdfInputNode from './workflow/PdfInputNode';
import ImageInputNode from './workflow/ImageInputNode';
import AudioInputNode from './workflow/AudioInputNode';
import NodeConfigPanel from './workflow/NodeConfigPanel';
import ExecutionPanel from './workflow/ExecutionPanel';
import { executeWorkflow, validateWorkflow, getExecutionOrder } from '@/lib/workflowEngine';

const nodeTypes = {
  inputNode: InputNode,
  writer: WriterNode,
  rewriter: RewriterNode,
  summarizer: SummarizerNode,
  prompt: PromptNode,
  proofreader: ProofreaderNode,
  translator: TranslatorNode,
  pdfInput: PdfInputNode,
  imageInput: ImageInputNode,
  audioInput: AudioInputNode,
};

const createInitialInputNode = (onChange) => ({
  id: '1',
  type: 'inputNode',
  data: { label: 'Input', text: '', name: 'Input', onChange },
  position: { x: 250, y: 100 },
});

const nodeTemplates = [
  { type: 'inputNode', label: 'Input', icon: FileText, color: '#64748b' },
  { type: 'pdfInput', label: 'PDF Input', icon: Files, color: '#f43f5e' },
  { type: 'imageInput', label: 'Image Input', icon: ImageIcon, color: '#0ea5e9' },
  { type: 'audioInput', label: 'Audio Input', icon: Mic, color: '#f59e0b' },
  { type: 'writer', label: 'Writer', icon: Wand2, color: '#FF6B6B' },
  { type: 'rewriter', label: 'Rewriter', icon: RefreshCw, color: '#14b8a6' },
  { type: 'summarizer', label: 'Summarizer', icon: List, color: '#10b981' },
  { type: 'prompt', label: 'Prompt API', icon: MessageSquare, color: '#f59e0b' },
  { type: 'proofreader', label: 'Proofreader', icon: CheckCircle, color: '#8b5cf6' },
  { type: 'translator', label: 'Translator', icon: Languages, color: '#3b82f6' },
];

const DEFAULT_ATTACHMENT_LIMIT = 1;

const arraysEqual = (first, second) => {
  if (first.length !== second.length) {
    return false;
  }
  return first.every((value, index) => value === second[index]);
};

const normalizeAttachmentLimit = (value) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed;
  }
  return DEFAULT_ATTACHMENT_LIMIT;
};

const ensurePromptAttachmentSelection = (node, attachments, currentSelected) => {
  if (node.type !== 'prompt') {
    return currentSelected;
  }

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

export default function FlowBuilder({
  initialWorkflow = null,
  onSave = null,
  isSaving = false,
  saveButtonLabel = 'Save',
  metadata = null,
  onMetadataChange = null,
  onRunBulk = null
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeId, setNodeId] = useState(2);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [executionResults, setExecutionResults] = useState({});
  const [nodeOutputs, setNodeOutputs] = useState({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [toast, setToast] = useState(null);
  const initialLoadRef = useRef(false);

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type });
  }, []);

  const handleNodeFieldChange = useCallback((nodeId, field, value) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, [field]: value } };
        }
        return node;
      })
    );
  }, [setNodes]);

  const initializeWorkflow = useCallback((workflow) => {
    const rawNodes = Array.isArray(workflow?.nodes) ? workflow.nodes : [];
    if (rawNodes.length > 0) {
      const hydratedNodes = rawNodes.map((node) => ({
        ...node,
        data: {
          ...(node.data || {}),
          onChange: handleNodeFieldChange
        }
      }));
      setNodes(hydratedNodes);
      const maxId = hydratedNodes.reduce((acc, node) => {
        const numericId = Number(node.id);
        if (Number.isFinite(numericId)) {
          return Math.max(acc, numericId);
        }
        return acc;
      }, 1);
      setNodeId(maxId + 1);
    } else {
      setNodes([createInitialInputNode(handleNodeFieldChange)]);
      setNodeId(2);
    }
    setEdges(Array.isArray(workflow?.edges) ? workflow.edges : []);
    setExecutionResults({});
    setNodeOutputs({});
    setSelectedNodeId(null);
  }, [handleNodeFieldChange, setEdges, setNodes]);

  useEffect(() => {
    if (initialLoadRef.current) {
      return;
    }
    initialLoadRef.current = true;
    initializeWorkflow(initialWorkflow);
  }, [initialWorkflow, initializeWorkflow]);

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const getAvailableVariables = useCallback((nodeId, currentNodes, currentEdges) => {
    const incomingEdges = currentEdges.filter(edge => edge.target === nodeId);
    const sourceNodeIds = incomingEdges.map(edge => edge.source);
    
    const variables = [];
    sourceNodeIds.forEach(sourceId => {
      const sourceNode = currentNodes.find(n => n.id === sourceId);
      if (sourceNode && sourceNode.data.name && sourceNode.type !== 'imageInput' && sourceNode.type !== 'audioInput') {
        variables.push(sourceNode.data.name);
      }
    });
    
    return variables;
  }, []);

  const getAvailableAttachments = useCallback((nodeId, currentNodes, currentEdges) => {
    const incomingEdges = currentEdges.filter(edge => edge.target === nodeId);
    const sourceNodeIds = incomingEdges.map(edge => edge.source);

    const attachments = [];
    sourceNodeIds.forEach(sourceId => {
      const sourceNode = currentNodes.find(n => n.id === sourceId);
      if (!sourceNode) {
        return;
      }
      if (sourceNode.type === 'imageInput' || sourceNode.type === 'audioInput') {
        const nodeName = sourceNode.data?.name || sourceNode.id;
        const attachment = sourceNode.data?.attachment || null;
        const fileName = attachment?.name || null;
        const type = sourceNode.type === 'imageInput' ? 'image' : 'audio';
        attachments.push({
          nodeName,
          type,
          fileName,
          hasAttachment: Boolean(attachment),
          label: fileName ? `${nodeName} • ${fileName}` : `${nodeName} • No file yet`
        });
      }
    });

    return attachments;
  }, []);

  useEffect(() => {
    setNodes((nds) => {
      let changed = false;
      const updated = nds.map((node) => {
        const vars = getAvailableVariables(node.id, nds, edges);
        const attachments = getAvailableAttachments(node.id, nds, edges);

        const currentVars = node.data.availableVariables || [];
        const currentAttachments = node.data.availableAttachments || [];

        const varsChanged = vars.length !== currentVars.length || vars.some((value, index) => value !== currentVars[index]);
        const attachmentsChanged = attachments.length !== currentAttachments.length || attachments.some((value, index) => {
          const existing = currentAttachments[index];
          if (!existing) return true;
          return existing.nodeName !== value.nodeName || existing.type !== value.type || existing.fileName !== value.fileName;
        });

        const selected = Array.isArray(node.data.selectedAttachments)
          ? node.data.selectedAttachments
          : [];
        const filteredSelected = selected.filter((name) => attachments.some((item) => item.nodeName === name));
        const filteredChanged = filteredSelected.length !== selected.length;
        const autoSelected = ensurePromptAttachmentSelection(node, attachments, filteredSelected);
        const autoChanged = !arraysEqual(autoSelected, filteredSelected);

        if (!varsChanged && !attachmentsChanged && !filteredChanged && !autoChanged) {
          return node;
        }

        changed = true;

        return {
          ...node,
          data: {
            ...node.data,
            availableVariables: vars,
            availableAttachments: attachments,
            ...((filteredChanged || autoChanged) ? { selectedAttachments: autoSelected } : {})
          }
        };
      });

      return changed ? updated : nds;
    });
  }, [edges, nodes, getAvailableVariables, getAvailableAttachments, setNodes]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: newData };
        }
        return node;
      })
    );
  }, [setNodes]);

  const onNodesDelete = useCallback((deleted) => {
    console.log('Nodes deleted:', deleted);
  }, []);

  const onEdgesDelete = useCallback((deleted) => {
    console.log('Edges deleted:', deleted);
  }, []);

  const addNode = (type) => {
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
    
    const baseName = typeNames[type] || 'Node';
    let name = baseName;
    let counter = 1;
    
    while (nodes.some(n => n.data.name === name)) {
      counter++;
      name = `${baseName} ${counter}`;
    }
    
    const newNode = {
      id: `${nodeId}`,
      type,
      data: { 
        label: type.charAt(0).toUpperCase() + type.slice(1),
        name: name,
        onChange: handleNodeFieldChange
      },
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
    };

    if (type === 'prompt') {
      newNode.data.imageAttachmentLimit = 1;
      newNode.data.audioAttachmentLimit = 1;
    }
    setNodes((nds) => [...nds, newNode]);
    setNodeId((id) => id + 1);
  };

  const clearFlow = () => {
    setNodes([createInitialInputNode(handleNodeFieldChange)]);
    setEdges([]);
    setNodeId(2);
    setSelectedNodeId(null);
    setExecutionResults({});
    setNodeOutputs({});
    setShowResults(false);
  };

  const clearResults = useCallback(() => {
    setExecutionResults({});
    setNodeOutputs({});
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          executionResult: null,
          executionAttachments: null,
          executionError: null
        }
      }))
    );
    setShowResults(false);
  }, [setNodes]);

  const runFlow = useCallback(async ({ startNodeId = null, stopNodeId = null } = {}) => {
    const validation = validateWorkflow(nodes, edges);
    
    if (!validation.valid) {
      showToast(validation.errors[0], 'error');
      return;
    }

    let executionOrder = [];

    try {
      executionOrder = getExecutionOrder(nodes, edges);
    } catch (orderError) {
      showToast(orderError.message, 'error');
      return;
    }

    let startIndex = 0;

    if (startNodeId) {
      startIndex = executionOrder.indexOf(startNodeId);
      if (startIndex === -1) {
        showToast('Unable to locate the selected start node.', 'error');
        return;
      }
    }

    let stopIndex = -1;

    if (stopNodeId) {
      stopIndex = executionOrder.indexOf(stopNodeId);
      if (stopIndex === -1) {
        showToast('Unable to locate the selected stop node.', 'error');
        return;
      }
      if (stopIndex < startIndex) {
        showToast('Stop node must be after the start node.', 'error');
        return;
      }
    }

    const nodesToRunOrder = stopIndex >= startIndex && stopIndex !== -1
      ? executionOrder.slice(startIndex, stopIndex + 1)
      : executionOrder.slice(startIndex);

    if (nodesToRunOrder.length === 0) {
      showToast('No nodes available to execute from the requested position.', 'error');
      return;
    }

    const nodesToRunDetails = nodesToRunOrder
      .map(nodeIdValue => nodes.find(n => n.id === nodeIdValue))
      .filter(Boolean);

    if (nodesToRunDetails.length === 0) {
      showToast('Unable to find matching nodes for execution.', 'error');
      return;
    }

    const nodesToRunNameSet = new Set(nodesToRunDetails.map(node => node.data.name));

    let initialResults = {};

    if (startNodeId) {
      initialResults = executionOrder.slice(0, startIndex).reduce((acc, nodeIdValue) => {
        const sourceNode = nodes.find(n => n.id === nodeIdValue);
        if (sourceNode) {
          const output = nodeOutputs[sourceNode.data.name];
          if (output) {
            acc[sourceNode.data.name] = output;
          }
        }
        return acc;
      }, {});

      setExecutionResults(prev => {
        const updated = { ...prev };
        nodesToRunDetails.forEach(nodeItem => {
          updated[nodeItem.data.name] = {
            status: 'queued',
            result: null,
            error: null
          };
        });
        return updated;
      });
    } else {
      const initialState = nodesToRunDetails.reduce((acc, nodeItem) => {
        acc[nodeItem.data.name] = {
          status: 'queued',
          result: null,
          error: null
        };
        return acc;
      }, {});

      setExecutionResults(initialState);
      setNodeOutputs({});
    }

    setNodes((nds) =>
      nds.map((node) => {
        if (nodesToRunNameSet.has(node.data.name)) {
          return {
            ...node,
            data: {
              ...node.data,
              executionResult: null,
              executionError: null
            }
          };
        }
        return node;
      })
    );

    setIsExecuting(true);
    setShowResults(true);

    try {
      await executeWorkflow(
        nodes,
        edges,
        (progress) => {
          setExecutionResults(prev => {
            const previous = prev[progress.nodeName] || {};
            return {
              ...prev,
              [progress.nodeName]: {
                status: progress.status,
                result: progress.status === 'running'
                  ? null
                  : progress.result ?? previous.result ?? null,
                error: progress.status === 'error'
                  ? progress.error || previous.error || null
                  : null
              }
            };
          });

          setNodes((nds) =>
            nds.map((node) => {
              if (node.data.name !== progress.nodeName) {
                return node;
              }

              if (progress.status === 'running') {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    executionResult: null,
                    executionAttachments: null,
                    executionError: null
                  }
                };
              }

              if (progress.status === 'streaming' || progress.status === 'completed') {
                const resultText = typeof progress.result === 'string'
                  ? progress.result
                  : (progress.result?.text ?? '');
                const resultAttachments = typeof progress.result === 'object' && progress.result !== null
                  ? (progress.result.attachments ?? null)
                  : null;
                return {
                  ...node,
                  data: {
                    ...node.data,
                    executionResult: resultText,
                    executionAttachments: resultAttachments,
                    executionError: null
                  }
                };
              }

              if (progress.status === 'error') {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    executionResult: null,
                    executionAttachments: null,
                    executionError: progress.error || 'Execution failed'
                  }
                };
              }

              return node;
            })
          );

          if (progress.status === 'completed') {
            setNodeOutputs(prev => ({
              ...prev,
              [progress.nodeName]: progress.result
            }));
          }
        },
        (results) => {
          console.log('Flow execution completed:', results);
          setIsExecuting(false);
          showToast('Flow executed successfully!', 'success');
        },
        (error) => {
          console.error('Flow execution error:', error);
          showToast(`Execution error: ${error.message}`, 'error');
          setIsExecuting(false);
        },
        { startNodeId, stopAfterNodeId: stopNodeId, initialResults }
      );
    } catch (error) {
      console.error('Flow execution failed:', error);
      if (!error?.nodeName) {
        showToast(`Failed to execute flow: ${error.message}`, 'error');
      }
      setIsExecuting(false);
    }
  }, [edges, nodeOutputs, nodes, showToast]);

  const saveWorkflow = useCallback(async () => {
    if (typeof onSave !== 'function') {
      showToast('Save handler is not configured.', 'error');
      return;
    }

    const sanitizedNodes = nodes.map((node) => {
      const { data, ...restNode } = node;
      const {
        onChange: _onChange,
        availableVariables: _availableVariables,
        availableAttachments: _availableAttachments,
        executionResult: _executionResult,
        executionAttachments: _executionAttachments,
        executionError: _executionError,
        ...dataRest
      } = data || {};

      return {
        ...restNode,
        data: {
          ...dataRest
        }
      };
    });

    const payload = {
      nodes: sanitizedNodes,
      edges
    };

    try {
      await onSave(payload);
      showToast('Flow saved successfully.', 'success');
    } catch (error) {
      console.error('Flow save failed:', error);
      showToast(error?.message || 'Failed to save flow.', 'error');
    }
  }, [edges, nodes, onSave, showToast]);

  const handleRetryNode = useCallback((nodeName) => {
    if (isExecuting) {
      return;
    }

    const targetNode = nodes.find(node => node.data.name === nodeName);

    if (!targetNode) {
      showToast('Unable to locate the selected node.', 'error');
      return;
    }

    runFlow({ startNodeId: targetNode.id, stopNodeId: targetNode.id });
  }, [isExecuting, nodes, runFlow, showToast]);

  const handleRunFromNode = useCallback((nodeName) => {
    if (isExecuting) {
      return;
    }

    const targetNode = nodes.find(node => node.data.name === nodeName);

    if (!targetNode) {
      showToast('Unable to locate the selected node.', 'error');
      return;
    }

    runFlow({ startNodeId: targetNode.id });
  }, [isExecuting, nodes, runFlow, showToast]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handleNodeAction = (event) => {
      const { nodeName, action } = event.detail || {};
      if (!nodeName || !action) {
        return;
      }

      if (action === 'rerun') {
        handleRetryNode(nodeName);
      } else if (action === 'runFromHere') {
        handleRunFromNode(nodeName);
      }
    };

    window.addEventListener('flow-node-action', handleNodeAction);
    return () => {
      window.removeEventListener('flow-node-action', handleNodeAction);
    };
  }, [handleRetryNode, handleRunFromNode]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  return (
    <div className="min-h-screen w-full flex flex-col bg-linear-to-br from-white via-slate-50 to-white">
      <div className="bg-linear-to-r from-white via-white to-teal-50/30 border-b-2 border-slate-200 px-4 sm:px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div 
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl text-white"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
            }}
          >
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Flow Builder</h1>
            <p className="text-xs sm:text-sm text-slate-500">Design your local AI flow</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
          <Button 
            onClick={() => runFlow()} 
            variant="primary" 
            icon={Play}
            disabled={isExecuting}
            isLoading={isExecuting}
            className="w-full sm:w-auto justify-center"
          >
            {isExecuting ? 'Running...' : 'Run'}
          </Button>
          {typeof onSave === 'function' && (
            <Button
              onClick={saveWorkflow}
              variant="secondary"
              icon={Save}
              isLoading={isSaving}
              className="w-full sm:w-auto justify-center"
            >
              {saveButtonLabel}
            </Button>
          )}
          {typeof onRunBulk === 'function' && (
            <Button
              onClick={onRunBulk}
              variant="secondary"
              icon={PlayCircle}
              disabled={isSaving || isExecuting}
              className="w-full sm:w-auto justify-center"
            >
              Bulk run
            </Button>
          )}
          <Button
            onClick={clearFlow}
            variant="danger"
            icon={Trash2}
            className="w-full sm:w-auto justify-center"
          >
            Clear Flow
          </Button>
        </div>
      </div>

      {typeof onMetadataChange === 'function' && (
        <div className="bg-linear-to-r from-white via-slate-50 to-white border-b-2 border-slate-200 px-6 py-4 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Flow Name</label>
            <input
              value={metadata?.name ?? ''}
              onChange={(event) => onMetadataChange('name', event.target.value)}
              placeholder="Name your flow"
              className="border-2 border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-400/20 transition-all h-14"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Description</label>
            <textarea
              value={metadata?.description ?? ''}
              onChange={(event) => onMetadataChange('description', event.target.value)}
              placeholder="Add a short description"
              rows={2}
              className="border-2 border-slate-200 rounded-2xl px-4 py-3 font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-400/20 transition-all resize-none h-14"
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="w-full lg:w-64 bg-linear-to-b from-white via-slate-50 to-white border-b-2 lg:border-b-0 lg:border-r-2 border-slate-200 p-4 overflow-y-auto">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">
            Available Nodes
          </h3>
          <div className="space-y-2">
            {nodeTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <button
                  key={template.type}
                  onClick={() => addNode(template.type)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:shadow-md transition-all bg-white group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: template.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                    {template.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
            <p className="text-xs text-indigo-700 font-medium mb-2">Quick Tips</p>
            <ul className="text-xs text-indigo-600 space-y-1">
              <li>• Drag nodes to position</li>
              <li>• Connect handles to link</li>
              <li>• Click nodes to configure</li>
              <li>• Press Delete to remove</li>
            </ul>
          </div>
    </div>
    <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onNodesDelete={onNodesDelete}
            onEdgesDelete={onEdgesDelete}
            nodeTypes={nodeTypes}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            deleteKeyCode="Delete"
            fitView
          >
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                const template = nodeTemplates.find(t => t.type === node.type);
                return template?.color || '#64748b';
              }}
              style={{
                backgroundColor: '#f8fafc',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
              }}
            />
            <Background variant="dots" gap={12} size={1} color="#cbd5e1" />
          </ReactFlow>
        </div>

        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            allNodes={nodes}
            onClose={() => setSelectedNodeId(null)}
            onUpdate={updateNodeData}
          />
        )}

        {showResults && !selectedNode && (
          <ExecutionPanel
            results={executionResults}
            isRunning={isExecuting}
            onClose={() => setShowResults(false)}
            onRetryNode={handleRetryNode}
            onRunFromNode={handleRunFromNode}
            onClearResults={clearResults}
          />
        )}
      </div>

      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
}
