'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Languages, 
  Zap, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Download,
  Loader2,
  Play,
  Radio,
  FileText,
  Info,
  Lightbulb,
  Home,
  ArrowRight
} from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import Select from './ui/Select';
import Textarea from './ui/Textarea';
import Alert from './ui/Alert';
import SectionHeader from './ui/SectionHeader';
import ProgressBar from './ui/ProgressBar';
import StatusBadge from './ui/StatusBadge';

const EXAMPLE_TEXTS = [
  {
    name: 'Greeting',
    text: 'Hello, how are you today?',
    sourceLanguage: 'en',
    targetLanguage: 'es'
  },
  {
    name: 'Business',
    text: 'We are pleased to inform you that your request has been approved.',
    sourceLanguage: 'en',
    targetLanguage: 'fr'
  },
  {
    name: 'Technical',
    text: 'Please configure the system settings according to the documentation.',
    sourceLanguage: 'en',
    targetLanguage: 'de'
  },
  {
    name: 'Travel',
    text: 'Where is the nearest train station?',
    sourceLanguage: 'en',
    targetLanguage: 'ja'
  }
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ru', label: 'Russian' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'nl', label: 'Dutch' },
  { value: 'pl', label: 'Polish' },
  { value: 'tr', label: 'Turkish' }
];

export default function TranslatorPlayground() {
  const [isSupported, setIsSupported] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [translator, setTranslator] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState([]);
  const [isTranslatingStandard, setIsTranslatingStandard] = useState(false);
  const [isTranslatingStreaming, setIsTranslatingStreaming] = useState(false);
  const [currentStreamingText, setCurrentStreamingText] = useState('');

  useEffect(() => {
    checkSupport();
  }, []);

  useEffect(() => {
    if (sourceLanguage && targetLanguage) {
      checkLanguagePairAvailability();
    }
  }, [sourceLanguage, targetLanguage]);

  const checkSupport = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      if ('ai' in self && 'translator' in self.ai) {
        setIsSupported(true);
        return;
      }
      
      if ('Translator' in self) {
        setIsSupported(true);
        return;
      }
      
      setIsSupported(false);
    } catch (error) {
      console.error('Error checking Translator API support:', error);
      setIsSupported(false);
    }
  };

  const checkLanguagePairAvailability = async () => {
    if (!isSupported) return;
    
    try {
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
        // Old API returns string directly
        availabilityStatus = typeof result === 'string' ? result : result?.available || 'unavailable';
      }
      
      console.log('Translator availability:', availabilityStatus, 'for', sourceLanguage, '→', targetLanguage);
      setAvailability(availabilityStatus);
    } catch (error) {
      console.error('Error checking language pair availability:', error);
      setAvailability('unavailable');
    }
  };

  const createTranslator = async () => {
    if (!isSupported) return;
    
    setIsLoading(true);
    setDownloadProgress(0);
    
    try {
      const options = {
        sourceLanguage,
        targetLanguage
      };

      // Add monitor for download progress if not available
      if (availability !== 'available') {
        options.monitor = (m) => {
          m.addEventListener('downloadprogress', (e) => {
            const progress = Math.round(e.loaded * 100);
            setDownloadProgress(progress);
            console.log(`Downloaded ${progress}%`);
          });
        };
      }

      let translatorInstance;
      if ('ai' in self && 'translator' in self.ai) {
        translatorInstance = await self.ai.translator.create(options);
      } else if ('Translator' in self) {
        translatorInstance = await self.Translator.create(options);
      }
      
      setTranslator(translatorInstance);
      // Re-check availability after creation
      await checkLanguagePairAvailability();
    } catch (error) {
      console.error('Error creating translator:', error);
      alert('Error creating translator: ' + error.message);
    } finally {
      setIsLoading(false);
      setDownloadProgress(0);
    }
  };

  const handleTranslate = async (streaming = false) => {
    if (!translator || !inputText.trim()) return;
    
    if (streaming) {
      setIsTranslatingStreaming(true);
    } else {
      setIsTranslatingStandard(true);
    }
    setCurrentStreamingText('');
    
    const timestamp = new Date().toLocaleTimeString();
    const resultData = {
      id: Date.now(),
      inputText: inputText,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      timestamp: timestamp,
      streaming: streaming,
      translation: ''
    };
    
    try {
      if (streaming) {
        const stream = translator.translateStreaming(inputText);
        let fullText = '';
        
        for await (const chunk of stream) {
          fullText += chunk;
          setCurrentStreamingText(fullText);
        }
        
        resultData.translation = fullText;
      } else {
        const output = await translator.translate(inputText);
        resultData.translation = output;
      }
      
      setResults((prev) => [resultData, ...prev]);
    } catch (error) {
      console.error('Error translating:', error);
      alert('Error translating text: ' + error.message);
    } finally {
      setIsTranslatingStandard(false);
      setIsTranslatingStreaming(false);
      setCurrentStreamingText('');
    }
  };

  const loadExample = (example) => {
    setInputText(example.text);
    setSourceLanguage(example.sourceLanguage);
    setTargetLanguage(example.targetLanguage);
  };

  const destroyTranslator = () => {
    if (translator) {
      translator.destroy();
      setTranslator(null);
      setResults([]);
    }
  };

  const swapLanguages = () => {
    if (!translator) {
      const temp = sourceLanguage;
      setSourceLanguage(targetLanguage);
      setTargetLanguage(temp);
    }
  };

  if (isSupported === null) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <p className="font-medium">Checking model availability...</p>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <Alert type="error" icon={AlertCircle} title="API not supported">
        <p className="mb-2">Your browser does not support the Translator API.</p>
        <p className="text-sm mb-4">Make sure you are using Chrome 131+ with the flags enabled.</p>
        <Link href="/">
          <Button variant="primary" icon={Home}>
            Go to Home
          </Button>
        </Link>
      </Alert>
    );
  }

  if (availability === 'unavailable') {
    return (
      <div className="space-y-6">
        <Alert type="error" icon={AlertCircle} title="Language pair not supported">
          <p className="mb-2">
            The translation model for <strong>{sourceLanguage} → {targetLanguage}</strong> is not supported.
          </p>
          <p className="text-sm mb-4">
            This language pair may not be available in the Translator API. Try selecting different languages.
          </p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Card gradient>
        <SectionHeader 
          icon={Languages} 
          title="Translator API" 
          subtitle="Configure your translator settings"
        />

        {availability && (
          <div className="mt-6">
            <StatusBadge 
              status={availability === 'available' ? 'available' : availability === 'downloadable' ? 'downloadable' : 'default'}
              icon={availability === 'available' ? CheckCircle2 : availability === 'downloadable' ? Download : Loader2}
              text={`${sourceLanguage} → ${targetLanguage}: ${availability === 'available' ? 'Ready' : availability === 'downloadable' ? 'Ready to download' : availability}`}
            />
          </div>
        )}

        {downloadProgress > 0 && (
          <div className="mt-6">
            <ProgressBar 
              progress={downloadProgress} 
              label="Downloading language pack..." 
            />
          </div>
        )}

        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Source language"
              icon={FileText}
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              options={LANGUAGES}
              disabled={translator}
            />
            
            <div className="relative">
              <Select
                label="Target language"
                icon={FileText}
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                options={LANGUAGES}
                disabled={translator}
              />
              {!translator && (
                <button
                  onClick={swapLanguages}
                  className="absolute right-0 top-0 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                  title="Swap languages"
                >
                  <ArrowRight className="w-5 h-5 rotate-90" />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {!translator ? (
              <Button
                onClick={createTranslator}
                variant="primary"
                icon={Languages}
                isLoading={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Translator'}
              </Button>
            ) : (
              <Button
                onClick={destroyTranslator}
                variant="danger"
                icon={Trash2}
              >
                Destroy Translator
              </Button>
            )}
          </div>
        </div>
      </Card>

      {translator && (
        <Card gradient>
          <SectionHeader 
            icon={Zap} 
            title="Translate text" 
            subtitle="Enter text to translate"
            iconBg="blue"
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
                  className="px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  {example.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <Textarea
              label="Text to translate"
              icon={FileText}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter the text you want to translate..."
              rows={6}
            />

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => handleTranslate(false)}
                disabled={isTranslatingStandard || isTranslatingStreaming || !inputText.trim()}
                variant="primary"
                icon={Play}
                isLoading={isTranslatingStandard}
              >
                {isTranslatingStandard ? 'Translating...' : 'Translate'}
              </Button>
              <Button
                onClick={() => handleTranslate(true)}
                disabled={isTranslatingStandard || isTranslatingStreaming || !inputText.trim()}
                variant="secondary"
                icon={Radio}
                isLoading={isTranslatingStreaming}
              >
                {isTranslatingStreaming ? 'Streaming...' : 'Streaming'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {isTranslatingStreaming && currentStreamingText && (
        <Card gradient>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'}}>
                <Radio className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Streaming translation...</h3>
                <p className="text-sm text-slate-600">Receiving translation in real-time</p>
              </div>
            </div>
            <div 
              className="border-2 rounded-2xl p-6 min-h-32 text-sm text-slate-900 leading-relaxed shadow-inner"
              style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #fef3c7 100%)',
                borderColor: 'rgba(59, 130, 246, 0.3)',
                boxShadow: 'inset 0 2px 8px 0 rgba(59, 130, 246, 0.1)'
              }}
            >
              {currentStreamingText}
            </div>
          </div>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <SectionHeader 
            icon={FileText} 
            title="Translation History" 
            variant="blue"
          />
          {results.map((result) => (
            <Card key={result.id} gradient>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-xl" style={{background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'}}>
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">
                          {result.streaming ? 'Streaming' : 'Standard'} Translation
                        </h3>
                        <p className="text-sm text-slate-600">{result.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                        {result.sourceLanguage} → {result.targetLanguage}
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
                    <p className="mt-1 text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-200">
                      {result.inputText}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Translation</label>
                    <div 
                      className="mt-1 border-2 rounded-2xl p-6 min-h-32 text-sm text-slate-900 leading-relaxed shadow-inner"
                      style={{
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #fef3c7 100%)',
                        borderColor: 'rgba(59, 130, 246, 0.3)',
                        boxShadow: 'inset 0 2px 8px 0 rgba(59, 130, 246, 0.1)'
                      }}
                    >
                      {result.translation}
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
