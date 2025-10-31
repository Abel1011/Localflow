const normalizeResultPayload = (value) => {
  if (!value) {
    return { text: '', attachments: [] };
  }
  if (typeof value === 'string') {
    return { text: value, attachments: [] };
  }
  const text = typeof value.text === 'string' ? value.text : '';
  const attachments = Array.isArray(value.attachments) ? value.attachments.filter(Boolean) : [];
  return { text, attachments };
};

const getResultText = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value.text === 'string') return value.text;
  return '';
};

export const executeWorkflow = async (nodes, edges, onProgress, onComplete, onError, options = {}) => {
  try {
    const { startNodeId = null, stopAfterNodeId = null, initialResults = {} } = options || {};
    const results = { ...(initialResults || {}) };
    Object.keys(results).forEach((key) => {
      results[key] = normalizeResultPayload(results[key]);
    });
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const executionOrder = getExecutionOrder(nodes, edges);
    const startIndex = startNodeId ? executionOrder.indexOf(startNodeId) : 0;

    if (startNodeId && startIndex === -1) {
      throw new Error('Start node not found in workflow');
    }

    const remainingOrder = executionOrder.slice(Math.max(startIndex, 0));
    const stopIndex = stopAfterNodeId ? remainingOrder.indexOf(stopAfterNodeId) : -1;

    if (stopAfterNodeId && stopIndex === -1) {
      throw new Error('Stop node not found in workflow');
    }

    const nodesToExecute = stopIndex >= 0 ? remainingOrder.slice(0, stopIndex + 1) : remainingOrder;

    if (nodesToExecute.length === 0) {
      onComplete?.(results);
      return results;
    }

    nodesToExecute.forEach(nodeId => {
      const targetNode = nodeMap.get(nodeId);
      if (targetNode) {
        delete results[targetNode.data.name];
      }
    });
    
    for (const nodeId of nodesToExecute) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;

      onProgress?.({
        nodeId,
        nodeName: node.data.name,
        status: 'running'
      });

      try {
        const inputText = await resolveVariables(node, results);

        const result = await executeNode(node, inputText, (streamResult) => {
          const payload = typeof streamResult === 'string'
            ? streamResult
            : normalizeResultPayload(streamResult);
          onProgress?.({
            nodeId,
            nodeName: node.data.name,
            status: 'streaming',
            result: payload
          });
        }, { results });

        const normalizedResult = normalizeResultPayload(result);
        results[node.data.name] = normalizedResult;

        onProgress?.({
          nodeId,
          nodeName: node.data.name,
          status: 'completed',
          result: normalizedResult
        });

        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (nodeError) {
        const errorMessage = nodeError?.message || 'Unknown execution error';

        onProgress?.({
          nodeId,
          nodeName: node.data.name,
          status: 'error',
          error: errorMessage
        });

        const enrichedError = new Error(`Failed to execute node "${node.data.name}": ${errorMessage}`);
        enrichedError.cause = nodeError;
        enrichedError.nodeId = nodeId;
        enrichedError.nodeName = node.data.name;
        throw enrichedError;
      }
    }

    onComplete?.(results);
    return results;
  } catch (error) {
    onError?.(error);
    throw error;
  }
};

export const getExecutionOrder = (nodes, edges) => {
  const adjacencyList = new Map();
  const inDegree = new Map();
  
  nodes.forEach(node => {
    adjacencyList.set(node.id, []);
    inDegree.set(node.id, 0);
  });
  
  edges.forEach(edge => {
    adjacencyList.get(edge.source).push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });
  
  const queue = [];
  nodes.forEach(node => {
    if (inDegree.get(node.id) === 0) {
      queue.push(node.id);
    }
  });
  
  const order = [];
  while (queue.length > 0) {
    const nodeId = queue.shift();
    order.push(nodeId);
    
    adjacencyList.get(nodeId).forEach(neighbor => {
      inDegree.set(neighbor, inDegree.get(neighbor) - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    });
  }
  
  if (order.length !== nodes.length) {
    throw new Error('Circular dependency detected in workflow');
  }
  
  return order;
};

const resolveVariables = async (node, results) => {
  let text = '';
  
  switch (node.type) {
    case 'inputNode':
    case 'pdfInput':
    case 'imageInput':
    case 'audioInput':
      text = node.data.text || '';
      break;
    case 'writer':
      text = node.data.context || '';
      break;
    case 'rewriter':
    case 'summarizer':
    case 'proofreader':
    case 'translator':
      text = node.data.text || node.data.instructions || node.data.context || '';
      break;
    case 'prompt':
      text = node.data.prompt || '';
      break;
    default:
      text = '';
  }
  
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const replacedText = text.replace(variableRegex, (match, nodeName) => {
    const trimmedName = nodeName.trim();
    const value = results[trimmedName];
    if (typeof value === 'string') {
      return value;
    }
    if (value && typeof value === 'object') {
      const textValue = typeof value.text === 'string' ? value.text : '';
      const attachments = Array.isArray(value.attachments) ? value.attachments : [];
      if (textValue && textValue.length > 0) {
        return textValue;
      }
      if (attachments.length > 0) {
        return match;
      }
      return '';
    }
    return match;
  });
  
  return replacedText;
};

const executeNode = async (node, inputText, onStream, context = {}) => {
  switch (node.type) {
    case 'inputNode':
      return inputText;

    case 'pdfInput':
      return {
        text: typeof inputText === 'string' ? inputText : '',
        attachments: []
      };

    case 'imageInput': {
      const attachment = node.data?.attachment ? { ...node.data.attachment } : null;
      return {
        text: typeof inputText === 'string' ? inputText : '',
        attachments: attachment ? [attachment] : []
      };
    }

    case 'audioInput': {
      const attachment = node.data?.attachment ? { ...node.data.attachment } : null;
      return {
        text: typeof inputText === 'string' ? inputText : '',
        attachments: attachment ? [attachment] : []
      };
    }
      
    case 'writer':
  return await executeWriter(node, inputText, onStream);
      
    case 'rewriter':
  return await executeRewriter(node, inputText, onStream);
      
    case 'summarizer':
  return await executeSummarizer(node, inputText, onStream);
      
    case 'prompt':
  return await executePrompt(node, inputText, onStream, context);
      
    case 'proofreader':
  return await executeProofreader(node, inputText, onStream);
      
    case 'translator':
  return await executeTranslator(node, inputText, onStream);
      
    default:
      return inputText;
  }
};

const executeWriter = async (node, context, onStream) => {
  try {
    let capabilities;
    if ('ai' in self && 'writer' in self.ai) {
      capabilities = await self.ai.writer.capabilities();
    } else if ('Writer' in self) {
      const availabilityStatus = await self.Writer.availability();
      capabilities = { available: availabilityStatus };
    } else {
      throw new Error('Writer API is not available in this browser');
    }
    
    const availabilityStatus = capabilities?.available || 'unavailable';
    if (availabilityStatus !== 'available') {
      throw new Error(`Writer API is not available (status: ${availabilityStatus})`);
    }

    const options = {
      tone: node.data.tone || 'neutral',
      format: node.data.format || 'plain-text',
      length: node.data.length || 'medium'
    };

    if (node.data.sharedContext) {
      options.sharedContext = node.data.sharedContext;
    }

    let writer;
    if ('ai' in self && 'writer' in self.ai) {
      writer = await self.ai.writer.create(options);
    } else if ('Writer' in self) {
      writer = await self.Writer.create(options);
    }

    let result = '';
    const stream = writer.writeStreaming(context);

    for await (const chunk of stream) {
      result += chunk;
      onStream?.(result);
    }

    writer.destroy();
    return result;
  } catch (error) {
    console.error('Writer API error:', error);
    throw new Error(`Writer failed: ${error.message}`);
  }
};

const executeRewriter = async (node, text, onStream) => {
  try {
    let capabilities;
    if ('ai' in self && 'rewriter' in self.ai) {
      capabilities = await self.ai.rewriter.capabilities();
    } else if ('Rewriter' in self) {
      const availabilityStatus = await self.Rewriter.availability();
      capabilities = { available: availabilityStatus };
    } else {
      throw new Error('Rewriter API is not available in this browser');
    }
    
    const availabilityStatus = capabilities?.available || 'unavailable';
    if (availabilityStatus !== 'available') {
      throw new Error(`Rewriter API is not available (status: ${availabilityStatus})`);
    }

    const options = {
      tone: node.data.tone || 'as-is',
      length: node.data.length || 'as-is'
    };

    if (node.data.sharedContext) {
      options.sharedContext = node.data.sharedContext;
    }

    let rewriter;
    if ('ai' in self && 'rewriter' in self.ai) {
      rewriter = await self.ai.rewriter.create(options);
    } else if ('Rewriter' in self) {
      rewriter = await self.Rewriter.create(options);
    }

    let result = '';
    const stream = rewriter.rewriteStreaming(text);

    for await (const chunk of stream) {
      result += chunk;
      onStream?.(result);
    }

    rewriter.destroy();
    return result;
  } catch (error) {
    console.error('Rewriter API error:', error);
    throw new Error(`Rewriter failed: ${error.message}`);
  }
};

const normalizeSummarizerType = (type) => {
  if (!type) return 'tldr';
  const cleaned = String(type).toLowerCase().replace(/[^a-z]/g, '');
  switch (cleaned) {
    case 'keypoints':
      return 'key-points';
    case 'teaser':
      return 'teaser';
    case 'headline':
      return 'headline';
    case 'tldr':
    case 'tld':
      return 'tldr';
    default:
      return 'tldr';
  }
};

const normalizeSummarizerFormat = (format) => {
  if (!format) return 'markdown';
  const value = String(format).toLowerCase();
  return value === 'plain-text' || value === 'plaintext' ? 'plain-text' : 'markdown';
};

const normalizeSummarizerLength = (length) => {
  if (!length) return 'short';
  const value = String(length).toLowerCase();
  if (value === 'medium') return 'medium';
  if (value === 'long') return 'long';
  return 'short';
};

const executeSummarizer = async (node, text, onStream) => {
  try {
    let capabilities;
    if ('ai' in self && 'summarizer' in self.ai) {
      capabilities = await self.ai.summarizer.capabilities();
    } else if ('Summarizer' in self) {
      const availabilityStatus = await self.Summarizer.availability();
      capabilities = { available: availabilityStatus };
    } else {
      throw new Error('Summarizer API is not available in this browser');
    }
    
    const availabilityStatus = capabilities?.available || 'unavailable';
    if (availabilityStatus !== 'available') {
      throw new Error(`Summarizer API is not available (status: ${availabilityStatus})`);
    }

    const options = {
      type: normalizeSummarizerType(node.data.type),
      format: normalizeSummarizerFormat(node.data.format),
      length: normalizeSummarizerLength(node.data.length)
    };

    if (node.data.sharedContext) {
      options.sharedContext = node.data.sharedContext;
    }

    let summarizer;
    if ('ai' in self && 'summarizer' in self.ai) {
      summarizer = await self.ai.summarizer.create(options);
    } else if ('Summarizer' in self) {
      summarizer = await self.Summarizer.create(options);
    }

    const contextOptions = {};
    if (node.data.instructions) {
      contextOptions.context = node.data.instructions;
    } else if (node.data.contextHint) {
      contextOptions.context = node.data.contextHint;
    }

    let result = '';
    const stream = Object.keys(contextOptions).length > 0
      ? summarizer.summarizeStreaming(text, contextOptions)
      : summarizer.summarizeStreaming(text);

    for await (const chunk of stream) {
      result += chunk;
      onStream?.(result);
    }

    summarizer.destroy();
    return result;
  } catch (error) {
    console.error('Summarizer API error:', error);
    throw new Error(`Summarizer failed: ${error.message}`);
  }
};

const collectSelectedAttachments = (node, results) => {
  const selections = Array.isArray(node.data?.selectedAttachments)
    ? node.data.selectedAttachments
    : [];

  const attachments = [];

  selections.forEach((selection) => {
    const nodeName = typeof selection === 'string'
      ? selection
      : selection?.nodeName;
    if (!nodeName) {
      return;
    }
    const payload = results?.[nodeName];
    if (!payload || !Array.isArray(payload.attachments)) {
      return;
    }
    payload.attachments.forEach((item) => {
      if (item && item.file instanceof Blob) {
        attachments.push({ ...item, sourceNode: nodeName });
      }
    });
  });

  return attachments;
};

const executePrompt = async (node, prompt, onStream, context = {}) => {
  try {
    if (!('LanguageModel' in self)) {
      throw new Error('Prompt API is not available in this browser');
    }

    const attachments = collectSelectedAttachments(node, context.results);

    const expectedInputs = [];
    if (attachments.some(att => att?.kind === 'image')) {
      expectedInputs.push({ type: 'image' });
    }
    if (attachments.some(att => att?.kind === 'audio')) {
      expectedInputs.push({ type: 'audio' });
    }

    const availabilityOptions = {};
    if (expectedInputs.length > 0) {
      availabilityOptions.expectedInputs = [
        { type: 'text', languages: ['en'] },
        ...expectedInputs
      ];
    }

    const availability = await self.LanguageModel.availability(availabilityOptions);
    
    if (availability !== 'available') {
      throw new Error('Prompt API is not available');
    }

    const options = {
      temperature: node.data.temperature || 1,
      topK: node.data.topK || 3
    };

    if (availabilityOptions.expectedInputs) {
      options.expectedInputs = availabilityOptions.expectedInputs;
    }

    if (node.data.systemPrompt && node.data.systemPrompt.trim()) {
      options.initialPrompts = [
        { role: 'system', content: node.data.systemPrompt }
      ];
    }

    const session = await self.LanguageModel.create(options);

    const userMessageContent = attachments.length > 0
      ? [
          { type: 'text', value: prompt }
        ].concat(
          attachments.map((item) => ({ type: item.kind, value: item.file }))
        )
      : null;

    const requestPayload = attachments.length > 0
      ? [
          {
            role: 'user',
            content: userMessageContent
          }
        ]
      : prompt;

    let result = '';
    const stream = session.promptStreaming(requestPayload);

    for await (const chunk of stream) {
      result += chunk;
      onStream?.(result);
    }

    session.destroy();
    return result;
  } catch (error) {
    console.error('Prompt API error:', error);
    throw new Error(`Prompt API failed: ${error.message}`);
  }
};

const executeProofreader = async (node, text, onStream) => {
  try {
    if (!('LanguageModel' in self)) {
      throw new Error('Proofreader API is not available in this browser');
    }

    const availability = await self.LanguageModel.availability();
    
    if (availability !== 'available') {
      throw new Error('Proofreader API is not available');
    }

    const session = await self.LanguageModel.create({
      temperature: 0.5,
      topK: 3,
      initialPrompts: [
        { 
          role: 'system', 
          content: 'You are a professional proofreader. Fix grammar, spelling, and punctuation errors. Return only the corrected text without explanations.' 
        }
      ]
    });
    
    const result = await session.prompt(`Proofread and correct this text:\n\n${text}`);

    onStream?.(result);
    session.destroy();
    return result;
  } catch (error) {
    console.error('Proofreader API error:', error);
    throw new Error(`Proofreader failed: ${error.message}`);
  }
};

const executeTranslator = async (node, text, onStream) => {
  try {
    const sourceLanguage = node.data.sourceLanguage || 'en';
    const targetLanguage = node.data.targetLanguage || 'es';

    let availabilityStatus;
    if ('ai' in self && 'translator' in self.ai) {
      const capabilities = await self.ai.translator.availability({
        sourceLanguage,
        targetLanguage
      });
      availabilityStatus = capabilities?.available || 'unavailable';
    } else if ('Translator' in self) {
      const result = await self.Translator.availability({
        sourceLanguage,
        targetLanguage
      });
      availabilityStatus = typeof result === 'string' ? result : result?.available || 'unavailable';
    } else {
      throw new Error('Translator API is not available in this browser');
    }

    const normalizedAvailability = String(availabilityStatus).toLowerCase();
    const readyStates = new Set(['available', 'ready', 'readily']);
    const downloadableStates = new Set(['downloadable', 'pending', 'needsdownload', 'downloading']);

    if (!readyStates.has(normalizedAvailability) && !downloadableStates.has(normalizedAvailability)) {
      throw new Error(`Translation for ${sourceLanguage} → ${targetLanguage} is not available (status: ${availabilityStatus})`);
    }

    let translator;
    const creationOptions = {
      sourceLanguage,
      targetLanguage
    };

    if (downloadableStates.has(normalizedAvailability)) {
      creationOptions.monitor = (monitor) => {
        const handleProgress = (event) => {
          const loadedValue = typeof event.loaded === 'number' ? event.loaded : (event.progress ?? 0);
          const percentage = Number.isFinite(loadedValue)
            ? Math.min(100, Math.max(0, Math.round(loadedValue <= 1 ? loadedValue * 100 : loadedValue)))
            : 0;
          onStream?.(`Downloading translation model... ${percentage}%`);
        };

        const handleStateChange = (event) => {
          const state = String(event?.state || '').toLowerCase();
          if (state === 'downloaded' || state === 'ready') {
            onStream?.('Model ready. Starting translation...');
          }
        };

        monitor.addEventListener('downloadprogress', handleProgress);
        monitor.addEventListener('downloadstatechange', handleStateChange);
      };
    }

    if ('ai' in self && 'translator' in self.ai) {
      translator = await self.ai.translator.create(creationOptions);
    } else if ('Translator' in self) {
      translator = await self.Translator.create(creationOptions);
    }

    const result = await translator.translate(text);
    
    onStream?.(result);
    translator.destroy();
    return result;
  } catch (error) {
    console.error('Translator API error:', error);
    throw new Error(`Translator failed: ${error.message}`);
  }
};

export const validateWorkflow = (nodes, edges) => {
  const errors = [];
  
  if (nodes.length === 0) {
    errors.push('Workflow is empty. Add at least one node to get started.');
    return { valid: false, errors };
  }
  
  const nodeNames = nodes.map(n => n.data.name);
  const duplicates = nodeNames.filter((name, index) => nodeNames.indexOf(name) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate node names detected: ${[...new Set(duplicates)].join(', ')}. Each node must have a unique name.`);
  }
  
  const inputLikeTypes = ['inputNode', 'pdfInput', 'imageInput', 'audioInput'];
  const inputNodes = nodes.filter(n => inputLikeTypes.includes(n.type));
  if (inputNodes.length === 0) {
    errors.push('No Input or PDF Input node found. Add at least one input node to start your workflow.');
  }
  
  const disconnectedNodes = nodes.filter(node => {
    const hasIncoming = edges.some(e => e.target === node.id);
    const hasOutgoing = edges.some(e => e.source === node.id);
    return !hasIncoming && !hasOutgoing && node.type !== 'inputNode';
  });
  
  if (disconnectedNodes.length > 0) {
    const names = disconnectedNodes.map(n => n.data.name).join(', ');
    errors.push(`Disconnected nodes found: ${names}. Connect them to the workflow or remove them.`);
  }
  
  try {
    const order = getExecutionOrder(nodes, edges);
    
    if (order.length !== nodes.length) {
      errors.push('Circular dependency detected. Your workflow contains a loop that prevents execution.');
    }
  } catch (error) {
    if (error.message.includes('Circular')) {
      errors.push('Circular dependency detected. Remove loops from your workflow to enable execution.');
    } else {
      errors.push(error.message);
    }
  }
  
  nodes.forEach(node => {
    if (node.type === 'inputNode' && (!node.data.text || node.data.text.trim() === '')) {
      errors.push(`Input node "${node.data.name}" is empty. Provide some text to process.`);
    }
    if (node.type === 'pdfInput') {
      if (!Array.isArray(node.data.files) || node.data.files.length === 0) {
        errors.push(`PDF Input node "${node.data.name}" has no files selected.`);
      }
      if (!node.data.text || node.data.text.trim() === '') {
        errors.push(`PDF Input node "${node.data.name}" has no extracted text.`);
      }
    }
    if (node.type === 'imageInput') {
      if (!node.data.attachment || !(node.data.attachment.file instanceof Blob)) {
        errors.push(`Image Input node "${node.data.name}" has no image selected.`);
      }
    }
    if (node.type === 'audioInput') {
      if (!node.data.attachment || !(node.data.attachment.file instanceof Blob)) {
        errors.push(`Audio Input node "${node.data.name}" has no audio selected.`);
      }
    }
  });
  
  return { valid: errors.length === 0, errors };
};
