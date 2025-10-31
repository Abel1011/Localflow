'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CheckCircle, 
  Zap, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Loader2,
  Play,
  Settings,
  FileText,
  Info,
  Lightbulb,
  AlertTriangle,
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
    name: 'Grammar Error',
    text: 'I seen him yesterday at the store, and he bought two loafs of bread.',
    expectedLanguage: 'en'
  },
  {
    name: 'Punctuation',
    text: 'The meeting is scheduled for Friday however we might need to reschedule it',
    expectedLanguage: 'en'
  },
  {
    name: 'Spelling',
    text: 'We need to recieve the document before we can procede with the next step.',
    expectedLanguage: 'en'
  },
  {
    name: 'Mixed Errors',
    text: 'She dont understand why their so late to the meeting. Its very important that everyone arrives on time.',
    expectedLanguage: 'en'
  }
];

export default function ProofreaderPlayground() {
  const [isSupported, setIsSupported] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [proofreader, setProofreader] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [expectedLanguage, setExpectedLanguage] = useState('en');
  const [includeCorrectionTypes, setIncludeCorrectionTypes] = useState(true);
  const [includeCorrectionExplanations, setIncludeCorrectionExplanations] = useState(false);
  
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState([]);
  const [isProofreading, setIsProofreading] = useState(false);

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      if ('ai' in self && 'proofreader' in self.ai) {
        const capabilities = await self.ai.proofreader.capabilities();
        const availabilityStatus = capabilities?.available || 'unavailable';
        setIsSupported(true);
        setAvailability(availabilityStatus);
        return;
      }
      
      if ('Proofreader' in self) {
        const availabilityStatus = await self.Proofreader.availability();
        setIsSupported(true);
        setAvailability(availabilityStatus);
        return;
      }
      
      setIsSupported(false);
      setAvailability('unavailable');
    } catch (error) {
      console.error('Error checking Proofreader API support:', error);
      setIsSupported(false);
      setAvailability('unavailable');
    }
  };

  const createProofreader = async () => {
    if (!isSupported || availability !== 'available') return;
    
    setIsLoading(true);
    
    try {
      const options = {
        expectedInputLanguages: [expectedLanguage],
        includeCorrectionTypes: includeCorrectionTypes,
        includeCorrectionExplanations: includeCorrectionExplanations,
      };

      let proofreaderInstance;
      if ('ai' in self && 'proofreader' in self.ai) {
        proofreaderInstance = await self.ai.proofreader.create(options);
      } else if ('Proofreader' in self) {
        proofreaderInstance = await self.Proofreader.create(options);
      }
      
      setProofreader(proofreaderInstance);
    } catch (error) {
      console.error('Error creating proofreader:', error);
      alert('Error creating proofreader: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProofread = async () => {
    if (!proofreader || !inputText.trim()) return;
    
    setIsProofreading(true);
    
    const timestamp = new Date().toLocaleTimeString();
    const resultData = {
      id: Date.now(),
      inputText: inputText,
      expectedLanguage: expectedLanguage,
      timestamp: timestamp,
      corrected: '',
      corrections: []
    };
    
    try {
      const proofreadResult = await proofreader.proofread(inputText);
      
      resultData.corrected = proofreadResult.correctedInput || proofreadResult.corrected || inputText;
      resultData.corrections = proofreadResult.corrections || [];
      resultData.includeCorrectionTypes = proofreader.includeCorrectionTypes;
      resultData.includeCorrectionExplanations = proofreader.includeCorrectionExplanations;
      
      setResults((prev) => [resultData, ...prev]);
    } catch (error) {
      console.error('Error proofreading:', error);
      alert('Error proofreading text: ' + error.message);
    } finally {
      setIsProofreading(false);
    }
  };

  const loadExample = (example) => {
    setInputText(example.text);
    setExpectedLanguage(example.expectedLanguage);
  };

  const destroyProofreader = () => {
    if (proofreader) {
      proofreader.destroy();
      setProofreader(null);
      setResults([]);
    }
  };

  const renderHighlightedText = (text, corrections) => {
    if (!corrections || corrections.length === 0) {
      return <span>{text}</span>;
    }

    const elements = [];
    let currentIndex = 0;

    corrections.sort((a, b) => a.startIndex - b.startIndex);

    corrections.forEach((correction, idx) => {
      if (correction.startIndex > currentIndex) {
        elements.push(
          <span key={`text-${idx}`}>
            {text.substring(currentIndex, correction.startIndex)}
          </span>
        );
      }

      const tooltipText = correction.correction 
        ? `Correction: ${correction.correction}` 
        : 'Error detected';

      elements.push(
        <span
          key={`error-${idx}`}
          className="bg-rose-200 border-b-2 border-rose-500 px-1 rounded cursor-help"
          title={tooltipText}
        >
          {text.substring(correction.startIndex, correction.endIndex)}
        </span>
      );

      currentIndex = correction.endIndex;
    });

    if (currentIndex < text.length) {
      elements.push(
        <span key="text-end">{text.substring(currentIndex)}</span>
      );
    }

    return elements;
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
        <p className="mb-2">Your browser does not support the Proofreader API.</p>
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
            The Proofreader API model is <strong>{availability || 'not available'}</strong>.
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
              <span>Find the Proofreader API card in the Model Management section</span>
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

  const languageOptions = [
    { value: 'en', label: 'English' },
    /* { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' } */
  ];

  return (
    <div className="w-full space-y-6">
      <Card gradient>
        <SectionHeader 
          icon={CheckCircle} 
          title="Proofreader API" 
          subtitle="Configure your proofreader settings"
        />

        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Expected input language"
              icon={Settings}
              value={expectedLanguage}
              onChange={(e) => setExpectedLanguage(e.target.value)}
              options={languageOptions}
              disabled={proofreader}
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={includeCorrectionTypes}
                onChange={(e) => setIncludeCorrectionTypes(e.target.checked)}
                disabled={proofreader}
                className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                  Include correction types
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Label error types (spelling, grammar, punctuation, etc.)
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={includeCorrectionExplanations}
                onChange={(e) => setIncludeCorrectionExplanations(e.target.checked)}
                disabled={proofreader}
                className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                  Include correction explanations
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Provide plain language explanations for each correction
                </p>
              </div>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            {!proofreader ? (
              <Button
                onClick={createProofreader}
                disabled={availability === 'unavailable'}
                variant="primary"
                icon={CheckCircle}
                isLoading={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Proofreader'}
              </Button>
            ) : (
              <Button
                onClick={destroyProofreader}
                variant="danger"
                icon={Trash2}
              >
                Destroy Proofreader
              </Button>
            )}
          </div>
        </div>
      </Card>

      {proofreader && (
        <Card gradient>
          <SectionHeader 
            icon={Zap} 
            title="Proofread text" 
            subtitle="Check your text for errors and corrections"
            iconBg="teal"
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
                  className="px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:border-amber-400 hover:bg-amber-50 transition-all"
                >
                  {example.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <Textarea
              label="Text to proofread"
              icon={FileText}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter the text you want to check for errors..."
              rows={6}
            />

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleProofread}
                disabled={isProofreading || !inputText.trim()}
                variant="primary"
                icon={Play}
                isLoading={isProofreading}
              >
                {isProofreading ? 'Proofreading...' : 'Proofread'}
              </Button>
            </div>
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
                        <h3 className="text-lg font-bold text-slate-800">Proofreading Result</h3>
                        <p className="text-sm text-slate-600">{result.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full border border-teal-200">
                        Language: {result.expectedLanguage}
                      </span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                        result.corrections.length === 0
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {result.corrections.length} {result.corrections.length === 1 ? 'error' : 'errors'} found
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
                    <div className="mt-1 text-sm text-slate-700 bg-slate-50 rounded-lg p-4 border border-slate-200 leading-relaxed">
                      {renderHighlightedText(result.inputText, result.corrections)}
                    </div>
                  </div>

                  {result.corrections.length > 0 && (
                    <div>
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Corrections
                      </label>
                      <div className="mt-2 space-y-2">
                        {result.corrections.map((correction, idx) => (
                          <div
                            key={idx}
                            className="bg-white border border-slate-200 rounded-lg p-4 hover:border-amber-300 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="shrink-0 w-6 h-6 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center text-xs font-bold">
                                {idx + 1}
                              </div>
                              <div className="flex-1 space-y-2">
                                <div>
                                  <span className="text-xs font-semibold text-slate-500 uppercase">Error:</span>
                                  <p className="text-sm font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded inline-block ml-2">
                                    {result.inputText.substring(correction.startIndex, correction.endIndex)}
                                  </p>
                                </div>
                                {correction.correction && (
                                  <div>
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Correction:</span>
                                    <p className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block ml-2">
                                      {correction.correction}
                                    </p>
                                  </div>
                                )}
                                {result.includeCorrectionTypes && correction.type && (
                                  <div>
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Type:</span>
                                    <p className="text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block ml-2 capitalize">
                                      {correction.type.replace('-', ' ')}
                                    </p>
                                  </div>
                                )}
                                {result.includeCorrectionExplanations && correction.explanation && (
                                  <div>
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Explanation:</span>
                                    <p className="text-sm text-slate-700 bg-blue-50 px-3 py-2 rounded-lg mt-1 border border-blue-200">
                                      {correction.explanation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Corrected text</label>
                    <div 
                      className="mt-1 border-2 rounded-2xl p-6 min-h-32 text-sm text-slate-900 leading-relaxed shadow-inner"
                      style={{
                        background: 'linear-gradient(135deg, #faf5ff 0%, #e9d5ff 50%, #fef3c7 100%)',
                        borderColor: 'rgba(139, 92, 246, 0.3)',
                        boxShadow: 'inset 0 2px 8px 0 rgba(139, 92, 246, 0.1)'
                      }}
                    >
                      {result.corrected}
                    </div>
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
