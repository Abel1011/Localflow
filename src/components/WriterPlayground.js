'use client';

import { useState, useEffect } from 'react';
import { marked } from 'marked';
import Link from 'next/link';
import { 
  Wand2, 
  Zap, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Loader2,
  Play,
  Radio,
  Settings,
  FileText,
  MessageSquare,
  Info,
  Lightbulb,
  Home
} from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import Select from './ui/Select';
import Textarea from './ui/Textarea';
import Alert from './ui/Alert';
import SectionHeader from './ui/SectionHeader';

const EXAMPLE_PROMPTS = [
  {
    name: 'Blog Post',
    prompt: 'Write a blog post about the benefits of using AI-powered writing assistants in daily work.',
    context: 'The audience is tech-savvy professionals who want to increase productivity.',
    sharedContext: 'This is for a technology blog focused on productivity tools.'
  },
  {
    name: 'Email',
    prompt: 'Write a professional email to invite colleagues to a team meeting next Friday at 2 PM.',
    context: 'The meeting will discuss Q4 goals and planning.',
    sharedContext: 'Internal company communications.'
  },
  {
    name: 'Product Description',
    prompt: 'Write a product description for wireless noise-cancelling headphones.',
    context: 'Highlight the comfort, battery life, and sound quality.',
    sharedContext: 'E-commerce product listings for electronics.'
  },
  {
    name: 'Social Media',
    prompt: 'Create an engaging social media post about launching a new feature in our app.',
    context: 'The feature helps users track their daily habits.',
    sharedContext: 'Social media content for a productivity app.'
  }
];

export default function WriterPlayground() {
  const [isSupported, setIsSupported] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [writer, setWriter] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [tone, setTone] = useState('neutral');
  const [format, setFormat] = useState('markdown');
  const [length, setLength] = useState('medium');
  const [sharedContext, setSharedContext] = useState('');
  
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [results, setResults] = useState([]);
  const [isGeneratingStandard, setIsGeneratingStandard] = useState(false);
  const [isGeneratingStreaming, setIsGeneratingStreaming] = useState(false);
  const [currentStreamingText, setCurrentStreamingText] = useState('');

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      if ('ai' in self && 'writer' in self.ai) {
        const capabilities = await self.ai.writer.capabilities();
        const availabilityStatus = capabilities?.available || 'unavailable';
        setIsSupported(true);
        setAvailability(availabilityStatus);
        return;
      }
      
      if ('Writer' in self) {
        const availabilityStatus = await self.Writer.availability();
        setIsSupported(true);
        setAvailability(availabilityStatus);
        return;
      }
      
      setIsSupported(false);
      setAvailability('unavailable');
    } catch (error) {
      console.error('Error checking Writer API support:', error);
      setIsSupported(false);
      setAvailability('unavailable');
    }
  };

  const createWriter = async () => {
    if (!isSupported || availability !== 'available') return;
    
    setIsLoading(true);
    
    try {
      const options = {
        tone,
        format,
        length,
        ...(sharedContext && { sharedContext }),
      };

      let writerInstance;
      if ('ai' in self && 'writer' in self.ai) {
        writerInstance = await self.ai.writer.create(options);
      } else if ('Writer' in self) {
        writerInstance = await self.Writer.create(options);
      }
      
      setWriter(writerInstance);
    } catch (error) {
      console.error('Error creating writer:', error);
      alert('Error creating writer: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWrite = async (streaming = false) => {
    if (!writer || !prompt.trim()) return;
    
    if (streaming) {
      setIsGeneratingStreaming(true);
    } else {
      setIsGeneratingStandard(true);
    }
    setCurrentStreamingText('');
    
    const timestamp = new Date().toLocaleTimeString();
    const resultData = {
      id: Date.now(),
      prompt: prompt,
      context: context,
      tone: tone,
      format: format,
      length: length,
      timestamp: timestamp,
      streaming: streaming,
      text: ''
    };
    
    try {
      const contextOptions = context ? { context } : undefined;
      
      if (streaming) {
        const stream = writer.writeStreaming(prompt, contextOptions);
        let fullText = '';
        
        for await (const chunk of stream) {
          fullText += chunk;
          setCurrentStreamingText(fullText);
        }
        
        resultData.text = fullText;
      } else {
        const output = await writer.write(prompt, contextOptions);
        resultData.text = output;
      }
      
      setResults((prev) => [resultData, ...prev]);
    } catch (error) {
      console.error('Error writing:', error);
      alert('Error al generar texto: ' + error.message);
    } finally {
      setIsGeneratingStandard(false);
      setIsGeneratingStreaming(false);
      setCurrentStreamingText('');
    }
  };

  const loadExample = (example) => {
    setPrompt(example.prompt);
    setContext(example.context);
    setSharedContext(example.sharedContext);
  };

  const destroyWriter = () => {
    if (writer) {
      writer.destroy();
      setWriter(null);
      setResults([]);
    }
  };

  if (isSupported === null) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <p className="font-medium">Checking model availability...</p>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <Alert type="error" icon={AlertCircle} title="API not supported">
        <p className="mb-2">Your browser does not support the Writer API.</p>
        <p className="text-sm mb-4">Make sure you are using Chrome 131+ with the flags enabled.</p>
        <Link href="/">
          <Button variant="primary" icon={Home}>
            Go to Home
          </Button>
        </Link>
      </Alert>
    );
  }

  if (availability !== 'available') {
    return (
      <div className="space-y-6">
        <Alert type="warning" icon={Download} title="Model not ready">
          <p className="mb-2">
            The Writer API model is <strong>{availability || 'not available'}</strong>.
          </p>
          <p className="text-sm mb-4">
            Please visit the home page to download and manage AI models before using this feature.
          </p>
          <Link href="/">
            <Button variant="primary" icon={Home}>
              Go to Model Management
            </Button>
          </Link>
        </Alert>

        <Alert type="info" icon={Info} title="What you can do">
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5">1.</span>
              <span>Navigate to the home page using the button above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5">2.</span>
              <span>Find the Writer API card in the Model Management section</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5">3.</span>
              <span>Click "Download Model" to start the download process</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5">4.</span>
              <span>Return here once the model status shows "Ready"</span>
            </li>
          </ul>
        </Alert>
      </div>
    );
  }

  const toneOptions = [
    { value: 'formal', label: 'Formal' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'casual', label: 'Casual' }
  ];

  const formatOptions = [
    { value: 'markdown', label: 'Markdown' },
    { value: 'plain-text', label: 'Plain text' }
  ];

  const lengthOptions = [
    { value: 'short', label: 'Short' },
    { value: 'medium', label: 'Medium' },
    { value: 'long', label: 'Long' }
  ];

  return (
    <div className="w-full space-y-6">
      <Card gradient>
        <SectionHeader 
          icon={Wand2} 
          title="Writer API" 
          subtitle="Configure your writer settings"
        />

        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Tone"
              icon={MessageSquare}
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              options={toneOptions}
              disabled={writer}
            />
            
            <Select
              label="Format"
              icon={FileText}
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              options={formatOptions}
              disabled={writer}
            />
            
            <Select
              label="Length"
              icon={Settings}
              value={length}
              onChange={(e) => setLength(e.target.value)}
              options={lengthOptions}
              disabled={writer}
            />
          </div>

          <Textarea
            label="Shared context (optional)"
            icon={Info}
            value={sharedContext}
            onChange={(e) => setSharedContext(e.target.value)}
            placeholder="Define the general context for all generations..."
            disabled={writer}
            rows={3}
          />

          <div className="flex gap-3 pt-2">
            {!writer ? (
              <Button
                onClick={createWriter}
                variant="primary"
                icon={Wand2}
                isLoading={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Writer'}
              </Button>
            ) : (
              <Button
                onClick={destroyWriter}
                variant="danger"
                icon={Trash2}
              >
                Destroy Writer
              </Button>
            )}
          </div>
        </div>
      </Card>

      {writer && (
        <Card gradient>
          <SectionHeader 
            icon={Zap} 
            title="Generate content" 
            subtitle="Write your prompt and generate text"
            iconBg="teal"
          />

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-slate-700">Try an example:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((example, index) => (
                <button
                  key={index}
                  onClick={() => loadExample(example)}
                  className="px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:border-amber-400 hover:bg-amber-50 transition-all"
                >
                  {example.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <Textarea
              label="Prompt"
              icon={FileText}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want the AI to write..."
              rows={4}
            />

            <Textarea
              label="Additional context (optional)"
              icon={Info}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Specific additional information for this generation..."
              rows={3}
            />

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => handleWrite(false)}
                disabled={isGeneratingStandard || isGeneratingStreaming || !prompt.trim()}
                variant="primary"
                icon={Play}
                isLoading={isGeneratingStandard}
              >
                {isGeneratingStandard ? 'Generating...' : 'Generate'}
              </Button>
              <Button
                onClick={() => handleWrite(true)}
                disabled={isGeneratingStandard || isGeneratingStreaming || !prompt.trim()}
                variant="secondary"
                icon={Radio}
                isLoading={isGeneratingStreaming}
              >
                {isGeneratingStreaming ? 'Streaming...' : 'Streaming'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {isGeneratingStreaming && currentStreamingText && (
        <Card gradient>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)'}}>
                <Radio className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Streaming generation...</h3>
                <p className="text-sm text-slate-600">Receiving response in real-time</p>
              </div>
            </div>
            <div 
              className="border-2 rounded-2xl p-6 min-h-32 text-sm text-slate-900 leading-relaxed shadow-inner prose prose-sm max-w-none"
              style={{
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fef3c7 100%)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                boxShadow: 'inset 0 2px 8px 0 rgba(239, 68, 68, 0.1)'
              }}
              dangerouslySetInnerHTML={{ __html: marked(currentStreamingText) }}
            />
          </div>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <SectionHeader 
            icon={FileText} 
            title="Results History" 
            variant="coral"
          />
          {results.map((result) => (
            <Card key={result.id} gradient>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-xl" style={{background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)'}}>
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">
                          {result.streaming ? 'Streaming' : 'Standard'} Generation
                        </h3>
                        <p className="text-sm text-slate-600">{result.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-3 py-1 bg-coral-50 text-coral-700 text-xs font-semibold rounded-full border border-coral-200">
                        Tone: {result.tone}
                      </span>
                      <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full border border-teal-200">
                        Format: {result.format}
                      </span>
                      <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                        Length: {result.length}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setResults(prev => prev.filter(r => r.id !== result.id))}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Prompt</label>
                    <p className="mt-1 text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-200">
                      {result.prompt}
                    </p>
                  </div>

                  {result.context && (
                    <div>
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Context</label>
                      <p className="mt-1 text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-200">
                        {result.context}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Result</label>
                    <div 
                      className="mt-1 border-2 rounded-2xl p-6 min-h-32 text-sm text-slate-900 leading-relaxed shadow-inner prose prose-sm max-w-none"
                      style={{
                        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fef3c7 100%)',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        boxShadow: 'inset 0 2px 8px 0 rgba(239, 68, 68, 0.1)'
                      }}
                      dangerouslySetInnerHTML={{ __html: marked(result.text) }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
