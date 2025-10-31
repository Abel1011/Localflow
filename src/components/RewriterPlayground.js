'use client';

import { useState, useEffect } from 'react';
import { marked } from 'marked';
import Link from 'next/link';
import { 
  RefreshCw, 
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

const EXAMPLE_TEXTS = [
  {
    name: 'Casual Email',
    text: 'Hey! Just wanted to let you know that the meeting got moved to tomorrow at 3pm. Hope that works for you! Let me know if you have any questions.',
    context: 'Make it more professional and formal.',
    sharedContext: 'Business email communications.'
  },
  {
    name: 'Product Review',
    text: 'This product is amazing! I love how easy it is to use and the battery lasts forever. The design is sleek and modern. Highly recommend to anyone looking for quality headphones.',
    context: 'Make it more concise and professional.',
    sharedContext: 'Product reviews for an e-commerce platform.'
  },
  {
    name: 'Technical Doc',
    text: 'To configure the application, navigate to the settings panel, click on the advanced options menu, and then modify the parameters according to your requirements.',
    context: 'Simplify for non-technical users.',
    sharedContext: 'User documentation for software.'
  },
  {
    name: 'Social Post',
    text: 'We are excited to announce our new feature that will help you track your daily activities and improve productivity!',
    context: 'Make it more engaging and casual for social media.',
    sharedContext: 'Social media announcements.'
  }
];

export default function RewriterPlayground() {
  const [isSupported, setIsSupported] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [rewriter, setRewriter] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [tone, setTone] = useState('as-is');
  const [format, setFormat] = useState('as-is');
  const [length, setLength] = useState('as-is');
  const [sharedContext, setSharedContext] = useState('');
  
  const [inputText, setInputText] = useState('');
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
      if ('ai' in self && 'rewriter' in self.ai) {
        const capabilities = await self.ai.rewriter.capabilities();
        const availabilityStatus = capabilities?.available || 'unavailable';
        setIsSupported(true);
        setAvailability(availabilityStatus);
        return;
      }
      
      if ('Rewriter' in self) {
        const availabilityStatus = await self.Rewriter.availability();
        setIsSupported(true);
        setAvailability(availabilityStatus);
        return;
      }
      
      setIsSupported(false);
      setAvailability('unavailable');
    } catch (error) {
      console.error('Error checking Rewriter API support:', error);
      setIsSupported(false);
      setAvailability('unavailable');
    }
  };

  const createRewriter = async () => {
    if (!isSupported || availability !== 'available') return;
    
    setIsLoading(true);
    
    try {
      const options = {
        tone,
        format,
        length,
        ...(sharedContext && { sharedContext }),
      };

      let rewriterInstance;
      if ('ai' in self && 'rewriter' in self.ai) {
        rewriterInstance = await self.ai.rewriter.create(options);
      } else if ('Rewriter' in self) {
        rewriterInstance = await self.Rewriter.create(options);
      }
      
      setRewriter(rewriterInstance);
    } catch (error) {
      console.error('Error creating rewriter:', error);
      alert('Error creating rewriter: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRewrite = async (streaming = false) => {
    if (!rewriter || !inputText.trim()) return;
    
    if (streaming) {
      setIsGeneratingStreaming(true);
    } else {
      setIsGeneratingStandard(true);
    }
    setCurrentStreamingText('');
    
    const timestamp = new Date().toLocaleTimeString();
    const resultData = {
      id: Date.now(),
      inputText: inputText,
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
        const stream = rewriter.rewriteStreaming(inputText, contextOptions);
        let fullText = '';
        
        for await (const chunk of stream) {
          fullText += chunk;
          setCurrentStreamingText(fullText);
        }
        
        resultData.text = fullText;
      } else {
        const output = await rewriter.rewrite(inputText, contextOptions);
        resultData.text = output;
      }
      
      setResults((prev) => [resultData, ...prev]);
    } catch (error) {
      console.error('Error rewriting:', error);
      alert('Error generating rewritten text: ' + error.message);
    } finally {
      setIsGeneratingStandard(false);
      setIsGeneratingStreaming(false);
      setCurrentStreamingText('');
    }
  };

  const loadExample = (example) => {
    setInputText(example.text);
    setContext(example.context);
    setSharedContext(example.sharedContext);
  };

  const destroyRewriter = () => {
    if (rewriter) {
      rewriter.destroy();
      setRewriter(null);
      setResults([]);
    }
  };

  if (isSupported === null) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
          <p className="font-medium">Checking model availability...</p>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <Alert type="error" icon={AlertCircle} title="API not supported">
        <p className="mb-2">Your browser does not support the Rewriter API.</p>
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
            The Rewriter API model is <strong>{availability || 'not available'}</strong>.
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
              <span>Find the Rewriter API card in the Model Management section</span>
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
    { value: 'more-formal', label: 'More formal' },
    { value: 'as-is', label: 'As is' },
    { value: 'more-casual', label: 'More casual' }
  ];

  const formatOptions = [
    { value: 'as-is', label: 'As is' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'plain-text', label: 'Plain text' }
  ];

  const lengthOptions = [
    { value: 'shorter', label: 'Shorter' },
    { value: 'as-is', label: 'As is' },
    { value: 'longer', label: 'Longer' }
  ];

  return (
    <div className="w-full space-y-6">
      <Card gradient>
        <SectionHeader 
          icon={RefreshCw} 
          title="Rewriter API" 
          subtitle="Configure your rewriter settings"
        />

        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Tone"
              icon={MessageSquare}
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              options={toneOptions}
              disabled={rewriter}
            />
            
            <Select
              label="Format"
              icon={FileText}
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              options={formatOptions}
              disabled={rewriter}
            />
            
            <Select
              label="Length"
              icon={Settings}
              value={length}
              onChange={(e) => setLength(e.target.value)}
              options={lengthOptions}
              disabled={rewriter}
            />
          </div>

          <Textarea
            label="Shared context (optional)"
            icon={Info}
            value={sharedContext}
            onChange={(e) => setSharedContext(e.target.value)}
            placeholder="Define the general context for all rewrites..."
            disabled={rewriter}
            rows={3}
          />

          <div className="flex gap-3 pt-2">
            {!rewriter ? (
              <Button
                onClick={createRewriter}
                disabled={availability === 'unavailable'}
                variant="primary"
                icon={RefreshCw}
                isLoading={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Rewriter'}
              </Button>
            ) : (
              <Button
                onClick={destroyRewriter}
                variant="danger"
                icon={Trash2}
              >
                Destroy Rewriter
              </Button>
            )}
          </div>
        </div>
      </Card>

      {rewriter && (
        <Card gradient>
          <SectionHeader 
            icon={Zap} 
            title="Rewrite content" 
            subtitle="Enter your text and rewrite it"
            iconBg="amber"
          />

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-slate-700">Try an example:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_TEXTS.map((example, index) => (
                <button
                  key={index}
                  onClick={() => loadExample(example)}
                  className="px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:border-teal-400 hover:bg-teal-50 transition-all"
                >
                  {example.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <Textarea
              label="Original text"
              icon={FileText}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter the text you want to rewrite..."
              rows={6}
            />

            <Textarea
              label="Additional context (optional)"
              icon={Info}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Specific additional information for this rewrite..."
              rows={3}
            />

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => handleRewrite(false)}
                disabled={isGeneratingStandard || isGeneratingStreaming || !inputText.trim()}
                variant="primary"
                icon={Play}
                isLoading={isGeneratingStandard}
              >
                {isGeneratingStandard ? 'Rewriting...' : 'Rewrite'}
              </Button>
              <Button
                onClick={() => handleRewrite(true)}
                disabled={isGeneratingStandard || isGeneratingStreaming || !inputText.trim()}
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
                <h3 className="text-lg font-bold text-slate-800">Streaming rewrite...</h3>
                <p className="text-sm text-slate-600">Receiving response in real-time</p>
              </div>
            </div>
            <div 
              className="border-2 rounded-2xl p-6 min-h-32 text-sm text-slate-900 leading-relaxed shadow-inner prose prose-sm max-w-none"
              style={{
                background: 'linear-gradient(135deg, #f0fdfa 0%, #99f6e4 50%, #fef3c7 100%)',
                borderColor: 'rgba(20, 184, 166, 0.3)',
                boxShadow: 'inset 0 2px 8px 0 rgba(20, 184, 166, 0.1)'
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
            variant="teal"
          />
          {results.map((result) => (
            <Card key={result.id} gradient>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-xl" style={{background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)'}}>
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">
                          {result.streaming ? 'Streaming' : 'Standard'} Rewrite
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
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Original Text</label>
                    <p className="mt-1 text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-200">
                      {result.inputText}
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
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Rewritten Result</label>
                    <div 
                      className="mt-1 border-2 rounded-2xl p-6 min-h-32 text-sm text-slate-900 leading-relaxed shadow-inner prose prose-sm max-w-none"
                      style={{
                        background: 'linear-gradient(135deg, #f0fdfa 0%, #99f6e4 50%, #fef3c7 100%)',
                        borderColor: 'rgba(20, 184, 166, 0.3)',
                        boxShadow: 'inset 0 2px 8px 0 rgba(20, 184, 166, 0.1)'
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
