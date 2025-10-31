'use client';

import { useState, useEffect } from 'react';
import { marked } from 'marked';
import Link from 'next/link';
import { 
  FileText, 
  Zap, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Download,
  Loader2,
  Play,
  Radio,
  Settings,
  MessageSquare,
  Info,
  Lightbulb,
  Home,
  List
} from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import Select from './ui/Select';
import Textarea from './ui/Textarea';
import Alert from './ui/Alert';
import SectionHeader from './ui/SectionHeader';

const EXAMPLE_TEXTS = [
  {
    name: 'News Article',
    text: 'Artificial intelligence is rapidly transforming the technology landscape. Companies worldwide are investing billions in AI research and development. From healthcare to transportation, AI applications are becoming increasingly sophisticated. Machine learning algorithms can now diagnose diseases, drive cars, and even create art. However, experts warn about the ethical implications and the need for responsible AI development. Governments are beginning to establish regulations to ensure AI systems are transparent, fair, and accountable. The future of AI remains both exciting and uncertain.',
    context: 'This is a technology news article for general audience.',
    sharedContext: 'Technology news articles.',
    type: 'tldr'
  },
  {
    name: 'Research Paper',
    text: 'The study examined the effects of climate change on coastal ecosystems over a 20-year period. Researchers collected data from 50 different sites across three continents. Results showed a significant decline in biodiversity, with a 35% reduction in species count. Temperature increases of 2°C correlated with habitat loss. The research team utilized advanced satellite imagery and AI-powered analysis tools. Recommendations include immediate conservation efforts, policy changes, and continued monitoring of vulnerable areas. Future studies should focus on mitigation strategies and ecosystem restoration techniques.',
    context: 'Scientific research summary for academics.',
    sharedContext: 'Academic research papers.',
    type: 'key-points'
  },
  {
    name: 'Product Review',
    text: 'The new wireless headphones deliver exceptional sound quality with deep bass and crystal-clear highs. Battery life exceeds 30 hours on a single charge, making them perfect for long trips. The active noise cancellation effectively blocks out ambient sound, creating an immersive listening experience. Comfort is outstanding, even during extended wear sessions. The build quality feels premium with metal accents and soft ear cushions. Touch controls are responsive and intuitive. The companion app offers extensive customization options. At this price point, these headphones offer tremendous value and outperform many competitors.',
    context: 'Consumer product review.',
    sharedContext: 'Product reviews for electronics.',
    type: 'teaser'
  },
  {
    name: 'Business Report',
    text: 'Q4 revenue reached $45 million, representing a 23% increase year-over-year. Customer acquisition costs decreased by 15% while retention rates improved to 92%. The company launched three new products, exceeding initial sales projections by 40%. International expansion into Asian markets contributed 18% of total revenue. Operating expenses remained stable despite the growth. Employee headcount increased by 50 positions across engineering and sales. Strategic partnerships with major retailers drove significant brand awareness. Looking ahead, the company plans to invest heavily in R&D and expand its product portfolio.',
    context: 'Business performance summary for stakeholders.',
    sharedContext: 'Quarterly business reports.',
    type: 'headline'
  }
];

export default function SummarizerPlayground() {
  const [isSupported, setIsSupported] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [summarizer, setSummarizer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [type, setType] = useState('key-points');
  const [format, setFormat] = useState('markdown');
  const [length, setLength] = useState('medium');
  const [sharedContext, setSharedContext] = useState('');
  
  const [inputText, setInputText] = useState('');
  const [context, setContext] = useState('');
  const [results, setResults] = useState([]);
  const [isSummarizingStandard, setIsSummarizingStandard] = useState(false);
  const [isSummarizingStreaming, setIsSummarizingStreaming] = useState(false);
  const [currentStreamingText, setCurrentStreamingText] = useState('');

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      if ('ai' in self && 'summarizer' in self.ai) {
        const capabilities = await self.ai.summarizer.capabilities();
        const availabilityStatus = capabilities?.available || 'unavailable';
        setIsSupported(true);
        setAvailability(availabilityStatus);
        return;
      }
      
      if ('Summarizer' in self) {
        const availabilityStatus = await self.Summarizer.availability();
        setIsSupported(true);
        setAvailability(availabilityStatus);
        return;
      }
      
      setIsSupported(false);
      setAvailability('unavailable');
    } catch (error) {
      console.error('Error checking Summarizer API support:', error);
      setIsSupported(false);
      setAvailability('unavailable');
    }
  };

  const createSummarizer = async () => {
    if (!isSupported || availability !== 'available') return;
    
    setIsLoading(true);
    
    try {
      const options = {
        type,
        format,
        length,
        ...(sharedContext && { sharedContext }),
      };

      let summarizerInstance;
      if ('ai' in self && 'summarizer' in self.ai) {
        summarizerInstance = await self.ai.summarizer.create(options);
      } else if ('Summarizer' in self) {
        summarizerInstance = await self.Summarizer.create(options);
      }
      
      setSummarizer(summarizerInstance);
    } catch (error) {
      console.error('Error creating summarizer:', error);
      alert('Error creating summarizer: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarize = async (streaming = false) => {
    if (!summarizer || !inputText.trim()) return;
    
    if (streaming) {
      setIsSummarizingStreaming(true);
    } else {
      setIsSummarizingStandard(true);
    }
    setCurrentStreamingText('');
    
    const timestamp = new Date().toLocaleTimeString();
    const resultData = {
      id: Date.now(),
      inputText: inputText,
      context: context,
      type: type,
      format: format,
      length: length,
      timestamp: timestamp,
      streaming: streaming,
      summary: ''
    };
    
    try {
      const contextOptions = context ? { context } : undefined;
      
      if (streaming) {
        const stream = summarizer.summarizeStreaming(inputText, contextOptions);
        let fullText = '';
        
        for await (const chunk of stream) {
          fullText += chunk;
          setCurrentStreamingText(fullText);
        }
        
        resultData.summary = fullText;
      } else {
        const output = await summarizer.summarize(inputText, contextOptions);
        resultData.summary = output;
      }
      
      setResults((prev) => [resultData, ...prev]);
    } catch (error) {
      console.error('Error summarizing:', error);
      alert('Error generating summary: ' + error.message);
    } finally {
      setIsSummarizingStandard(false);
      setIsSummarizingStreaming(false);
      setCurrentStreamingText('');
    }
  };

  const loadExample = (example) => {
    setInputText(example.text);
    setContext(example.context);
    setSharedContext(example.sharedContext);
    setType(example.type);
  };

  const destroySummarizer = () => {
    if (summarizer) {
      summarizer.destroy();
      setSummarizer(null);
      setResults([]);
    }
  };

  if (isSupported === null) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
          <p className="font-medium">Checking model availability...</p>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <Alert type="error" icon={AlertCircle} title="API not supported">
        <p className="mb-2">Your browser does not support the Summarizer API.</p>
        <p className="text-sm mb-4">Make sure you are using Chrome 138+ with the flags enabled.</p>
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
            The Summarizer API model is <strong>{availability || 'not available'}</strong>.
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
              <span>Find the Summarizer API card in the Model Management section</span>
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

  const typeOptions = [
    { value: 'key-points', label: 'Key Points' },
    { value: 'tldr', label: 'TL;DR' },
    { value: 'teaser', label: 'Teaser' },
    { value: 'headline', label: 'Headline' }
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
          icon={List} 
          title="Summarizer API" 
          subtitle="Configure your summarizer settings"
        />

        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Type"
              icon={FileText}
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={typeOptions}
              disabled={summarizer}
            />
            
            <Select
              label="Format"
              icon={MessageSquare}
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              options={formatOptions}
              disabled={summarizer}
            />
            
            <Select
              label="Length"
              icon={Settings}
              value={length}
              onChange={(e) => setLength(e.target.value)}
              options={lengthOptions}
              disabled={summarizer}
            />
          </div>

          <Textarea
            label="Shared context (optional)"
            icon={Info}
            value={sharedContext}
            onChange={(e) => setSharedContext(e.target.value)}
            placeholder="Define the general context for all summaries..."
            disabled={summarizer}
            rows={3}
          />

          <div className="flex gap-3 pt-2">
            {!summarizer ? (
              <Button
                onClick={createSummarizer}
                variant="primary"
                icon={List}
                isLoading={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Summarizer'}
              </Button>
            ) : (
              <Button
                onClick={destroySummarizer}
                variant="danger"
                icon={Trash2}
              >
                Destroy Summarizer
              </Button>
            )}
          </div>
        </div>
      </Card>

      {summarizer && (
        <Card gradient>
          <SectionHeader 
            icon={Zap} 
            title="Generate summary" 
            subtitle="Enter text to summarize"
            iconBg="purple"
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
                  className="px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:border-purple-400 hover:bg-purple-50 transition-all"
                >
                  {example.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <Textarea
              label="Text to summarize"
              icon={FileText}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste or write the text you want to summarize..."
              rows={8}
            />

            <Textarea
              label="Additional context (optional)"
              icon={Info}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Specific additional information for this summary..."
              rows={3}
            />

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => handleSummarize(false)}
                disabled={isSummarizingStandard || isSummarizingStreaming || !inputText.trim()}
                variant="primary"
                icon={Play}
                isLoading={isSummarizingStandard}
              >
                {isSummarizingStandard ? 'Summarizing...' : 'Summarize'}
              </Button>
              <Button
                onClick={() => handleSummarize(true)}
                disabled={isSummarizingStandard || isSummarizingStreaming || !inputText.trim()}
                variant="secondary"
                icon={Radio}
                isLoading={isSummarizingStreaming}
              >
                {isSummarizingStreaming ? 'Streaming...' : 'Streaming'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {isSummarizingStreaming && currentStreamingText && (
        <Card gradient>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}>
                <Radio className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Streaming summary...</h3>
                <p className="text-sm text-slate-600">Receiving summary in real-time</p>
              </div>
            </div>
            <div 
              className="border-2 rounded-2xl p-6 min-h-32 text-sm text-slate-900 leading-relaxed shadow-inner prose prose-sm max-w-none"
              style={{
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #fef3c7 100%)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
                boxShadow: 'inset 0 2px 8px 0 rgba(16, 185, 129, 0.1)'
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
            title="Summary History" 
            variant="purple"
          />
          {results.map((result) => (
            <Card key={result.id} gradient>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-xl" style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}>
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">
                          {result.streaming ? 'Streaming' : 'Standard'} Summary
                        </h3>
                        <p className="text-sm text-slate-600">{result.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-200">
                        Type: {result.type}
                      </span>
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-200">
                        Format: {result.format}
                      </span>
                      <span className="px-3 py-1 bg-violet-50 text-violet-700 text-xs font-semibold rounded-full border border-violet-200">
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
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Original text</label>
                    <p className="mt-1 text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-200 max-h-40 overflow-y-auto">
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
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Summary</label>
                    <div 
                      className="mt-1 border-2 rounded-2xl p-6 min-h-32 text-sm text-slate-900 leading-relaxed shadow-inner prose prose-sm max-w-none"
                      style={{
                        background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #fef3c7 100%)',
                        borderColor: 'rgba(16, 185, 129, 0.3)',
                        boxShadow: 'inset 0 2px 8px 0 rgba(16, 185, 129, 0.1)'
                      }}
                      dangerouslySetInnerHTML={{ __html: marked(result.summary) }}
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
