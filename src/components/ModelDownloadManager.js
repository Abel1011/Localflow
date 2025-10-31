'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, CheckCircle2, AlertCircle, Loader2, ArrowRight, Wand2, RefreshCw, CheckCircle, MessageSquare, Zap, Languages, List } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import ProgressBar from './ui/ProgressBar';
import StatusBadge from './ui/StatusBadge';
import Alert from './ui/Alert';

const MODELS = [
  {
    id: 'writer',
    name: 'Writer API',
    description: 'Generate creative content from scratch with customizable tone, format, and length options.',
    icon: Wand2,
    color: '#FF6B6B',
    href: '/writer',
    features: ['Text generation', 'Multiple tones', 'Streaming support'],
    checkAvailability: async () => {
      if (typeof window === 'undefined') return null;
      
      // Try new API first
      if ('ai' in self && 'writer' in self.ai) {
        const capabilities = await self.ai.writer.capabilities();
        return capabilities?.available || 'unavailable';
      }
      
      // Fallback to old API
      if ('Writer' in self) {
        return await self.Writer.availability();
      }
      
      return null;
    },
    create: async (monitor) => {
      if ('ai' in self && 'writer' in self.ai) {
        return await self.ai.writer.create({ monitor });
      }
      return await self.Writer.create({ monitor });
    }
  },
  {
    id: 'rewriter',
    name: 'Rewriter API',
    description: 'Rewrite and refine existing text with different styles, formats, and lengths.',
    icon: RefreshCw,
    color: '#14b8a6',
    href: '/rewriter',
    features: ['Text rewriting', 'Tone adjustment', 'Length control'],
    checkAvailability: async () => {
      if (typeof window === 'undefined') return null;
      
      // Try new API first
      if ('ai' in self && 'rewriter' in self.ai) {
        const capabilities = await self.ai.rewriter.capabilities();
        return capabilities?.available || 'unavailable';
      }
      
      // Fallback to old API
      if ('Rewriter' in self) {
        return await self.Rewriter.availability();
      }
      
      return null;
    },
    create: async (monitor) => {
      if ('ai' in self && 'rewriter' in self.ai) {
        return await self.ai.rewriter.create({ monitor });
      }
      return await self.Rewriter.create({ monitor });
    }
  },
  {
    id: 'proofreader',
    name: 'Proofreader API',
    description: 'Check grammar, spelling, and writing quality with detailed corrections and explanations.',
    icon: CheckCircle,
    color: '#8b5cf6',
    href: '/proofreader',
    features: ['Grammar checking', 'Error explanations', 'Correction types'],
    checkAvailability: async () => {
      if (typeof window === 'undefined') return null;
      
      // Try new API first
      if ('ai' in self && 'proofreader' in self.ai) {
        const capabilities = await self.ai.proofreader.capabilities();
        return capabilities?.available || 'unavailable';
      }
      
      // Fallback to old API
      if ('Proofreader' in self) {
        return await self.Proofreader.availability();
      }
      
      return null;
    },
    create: async (monitor) => {
      if ('ai' in self && 'proofreader' in self.ai) {
        return await self.ai.proofreader.create({ monitor });
      }
      return await self.Proofreader.create({ monitor });
    }
  },
  {
    id: 'prompt',
    name: 'Prompt API',
    description: 'Chat with Gemini Nano AI with support for text, images, and audio multimodal inputs.',
    icon: MessageSquare,
    color: '#f59e0b',
    href: '/prompt',
    features: ['Chat interface', 'Multimodal input', 'Streaming responses'],
    checkAvailability: async () => {
      if (typeof window === 'undefined' || !('LanguageModel' in self)) {
        return null;
      }
      return await self.LanguageModel.availability();
    },
    create: async (monitor) => {
      return await self.LanguageModel.create({ monitor });
    }
  },
  {
    id: 'translator',
    name: 'Translator API',
    description: 'Translate text between multiple languages with high-quality AI-powered translations.',
    icon: Languages,
    color: '#3b82f6',
    href: '/translator',
    features: ['Multi-language support', 'Real-time translation', 'Streaming mode'],
    checkAvailability: async () => {
      if (typeof window === 'undefined') return null;
      
      // Try new API first
      if ('ai' in self && 'translator' in self.ai) {
        const capabilities = await self.ai.translator.availability({
          sourceLanguage: 'en',
          targetLanguage: 'es'
        });
        return capabilities?.available || 'unavailable';
      }
      
      // Fallback to old API
      if ('Translator' in self) {
        return await self.Translator.availability({
          sourceLanguage: 'en',
          targetLanguage: 'es'
        });
      }
      
      return null;
    },
    create: async (monitor) => {
      if ('ai' in self && 'translator' in self.ai) {
        return await self.ai.translator.create({
          sourceLanguage: 'en',
          targetLanguage: 'es',
          monitor
        });
      }
      return await self.Translator.create({
        sourceLanguage: 'en',
        targetLanguage: 'es',
        monitor
      });
    }
  },
  {
    id: 'summarizer',
    name: 'Summarizer API',
    description: 'Generate concise summaries of long texts with customizable types, formats, and lengths.',
    icon: List,
    color: '#10b981',
    href: '/summarizer',
    features: ['Text summarization', 'Multiple summary types', 'Streaming support'],
    checkAvailability: async () => {
      if (typeof window === 'undefined') return null;
      
      // Try new API first
      if ('ai' in self && 'summarizer' in self.ai) {
        const capabilities = await self.ai.summarizer.capabilities();
        return capabilities?.available || 'unavailable';
      }
      
      // Fallback to old API
      if ('Summarizer' in self) {
        return await self.Summarizer.availability();
      }
      
      return null;
    },
    create: async (monitor) => {
      if ('ai' in self && 'summarizer' in self.ai) {
        return await self.ai.summarizer.create({ monitor });
      }
      return await self.Summarizer.create({ monitor });
    }
  }
];

export default function ModelDownloadManager() {
  const [modelStates, setModelStates] = useState({});
  const [downloadProgress, setDownloadProgress] = useState({});
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAllModels();
  }, []);

  const checkAllModels = async () => {
    setIsChecking(true);
    const states = {};

    for (const model of MODELS) {
      try {
        const result = await model.checkAvailability();
        
        if (result === null) {
          states[model.id] = {
            availability: 'unavailable',
            supported: false
          };
        } else {
          // Result is a string: 'available', 'downloadable', 'downloading', or 'unavailable'
          states[model.id] = {
            availability: result,
            supported: true
          };
        }
      } catch (error) {
        states[model.id] = {
          availability: 'unavailable',
          supported: false,
          error: error.message
        };
      }
    }

    setModelStates(states);
    setIsChecking(false);
  };

  const downloadModel = async (modelId) => {
    const model = MODELS.find(m => m.id === modelId);
    if (!model) return;

    setDownloadProgress(prev => ({ ...prev, [modelId]: 0 }));
    setModelStates(prev => ({
      ...prev,
      [modelId]: { ...prev[modelId], availability: 'downloading' }
    }));

    try {
      await model.create((m) => {
        m.addEventListener('downloadprogress', (e) => {
          const progress = Math.round(e.loaded * 100);
          setDownloadProgress(prev => ({ ...prev, [modelId]: progress }));
        });
      });

      setModelStates(prev => ({
        ...prev,
        [modelId]: { ...prev[modelId], availability: 'available' }
      }));
      setDownloadProgress(prev => ({ ...prev, [modelId]: 100 }));
    } catch (error) {
      console.error(`Error downloading ${modelId}:`, error);
      setModelStates(prev => ({
        ...prev,
        [modelId]: { ...prev[modelId], error: error.message }
      }));
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[modelId];
        return newProgress;
      });
    }
  };

  const getStatusInfo = (availability) => {
    switch (availability) {
      case 'available':
        return { status: 'available', icon: CheckCircle2, label: 'Ready' };
      case 'downloadable':
        return { status: 'downloadable', icon: Download, label: 'Download Required' };
      case 'downloading':
        return { status: 'downloading', icon: Loader2, label: 'Downloading' };
      case 'unavailable':
      default:
        return { status: 'unavailable', icon: AlertCircle, label: 'Unavailable' };
    }
  };

  if (isChecking) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="ml-3 text-lg text-slate-600">Checking model availability...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Alert type="info" icon={Download} title="AI Models Management">
        <p className="text-sm">
          Download and manage the AI models required for each API. Models are downloaded once and cached for future use.
        </p>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {MODELS.map((model) => {
          const state = modelStates[model.id] || {};
          const statusInfo = getStatusInfo(state.availability);
          const isDownloading = state.availability === 'downloading';
          const progress = downloadProgress[model.id] || 0;
          const Icon = model.icon;

          return (
            <Card key={model.id} gradient>
              <div className="space-y-4">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="p-4 rounded-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${model.color} 0%, ${model.color}dd 100%)`,
                      boxShadow: `0 10px 25px -5px ${model.color}66`
                    }}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <StatusBadge 
                    status={statusInfo.status}
                    icon={statusInfo.icon}
                    text={statusInfo.label}
                  />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{model.name}</h3>
                  <p className="text-slate-600 mb-4 leading-relaxed">{model.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    {model.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-slate-500">
                        <Zap className="w-4 h-4" style={{ color: model.color }} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {state.error && (
                  <Alert type="error" icon={AlertCircle}>
                    <p className="text-xs">{state.error}</p>
                  </Alert>
                )}

                {!state.supported && (
                  <Alert type="warning" icon={AlertCircle}>
                    <p className="text-xs">This API is not supported in your browser.</p>
                  </Alert>
                )}

                {isDownloading && (
                  <div className="space-y-2">
                    <ProgressBar progress={progress} />
                    <p className="text-xs text-slate-600 text-center">{progress}% downloaded</p>
                  </div>
                )}

                {state.availability === 'available' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-teal-700 bg-teal-50 rounded-lg p-3 border border-teal-200">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Model ready to use</span>
                    </div>
                    <Link href={model.href} className="block">
                      <Button
                        variant="primary"
                        icon={ArrowRight}
                        className="w-full"
                      >
                        Go to {model.name}
                      </Button>
                    </Link>
                  </div>
                )}

                {state.availability === 'downloadable' && !isDownloading && (
                  <Button
                    onClick={() => downloadModel(model.id)}
                    variant="primary"
                    icon={Download}
                    className="w-full"
                  >
                    Download Model
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
