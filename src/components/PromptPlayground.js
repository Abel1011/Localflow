'use client';

import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import Link from 'next/link';
import { 
  MessageSquare, 
  Zap, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Loader2,
  Send,
  Settings,
  User,
  Bot,
  Copy,
  Check,
  Info,
  RotateCcw,
  StopCircle,
  Image as ImageIcon,
  Mic,
  X,
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
    name: 'Creative Writing',
    system: 'You are a creative writing assistant who helps craft engaging stories.',
    prompt: 'Write a short story about a time traveler who visits ancient Rome.'
  },
  {
    name: 'Code Helper',
    system: 'You are a helpful programming assistant.',
    prompt: 'Explain how async/await works in JavaScript.'
  },
  {
    name: 'Language Tutor',
    system: 'You are a friendly language tutor specializing in Spanish.',
    prompt: 'Teach me 5 common Spanish phrases for ordering food.'
  },
  {
    name: 'Recipe Assistant',
    system: 'You are a knowledgeable cooking assistant.',
    prompt: 'Suggest a quick and healthy dinner recipe with chicken.'
  }
];

export default function PromptPlayground() {
  const [isSupported, setIsSupported] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modelParams, setModelParams] = useState(null);

  const [temperature, setTemperature] = useState(1);
  const [topK, setTopK] = useState(3);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful and friendly assistant.');
  const [enableImageInput, setEnableImageInput] = useState(false);
  const [enableAudioInput, setEnableAudioInput] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(true);
  const [currentStreamingText, setCurrentStreamingText] = useState('');
  const [abortController, setAbortController] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [attachedImage, setAttachedImage] = useState(null);
  const [attachedAudio, setAttachedAudio] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    checkSupport();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamingText]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkSupport = async () => {
    if (typeof window === 'undefined') return;
    
    const supported = 'LanguageModel' in self;
    setIsSupported(supported);
    
    if (supported) {
      try {
        const available = await self.LanguageModel.availability();
        setAvailability(available);
        
        const params = await self.LanguageModel.params();
        setModelParams(params);
        setTemperature(params.defaultTemperature);
        setTopK(params.defaultTopK);
      } catch (error) {
        console.error('Error checking availability:', error);
      }
    }
  };

  const createSession = async () => {
    if (!isSupported) return;
    
    setIsLoading(true);
    
    try {
      const options = {
        temperature: temperature,
        topK: topK,
      };

      if (systemPrompt.trim()) {
        options.initialPrompts = [
          { role: 'system', content: systemPrompt }
        ];
      }

      const expectedInputs = [];
      const inputLanguages = ['en'];
      
      if (enableImageInput || enableAudioInput) {
        if (enableImageInput) {
          expectedInputs.push({ type: 'image' });
        }
        if (enableAudioInput) {
          expectedInputs.push({ type: 'audio' });
        }
        expectedInputs.push({ type: 'text', languages: inputLanguages });
      }

      if (expectedInputs.length > 0) {
        options.expectedInputs = expectedInputs;
        options.expectedOutputs = [{ type: 'text', languages: ['en'] }];
      }

      const sessionInstance = await self.LanguageModel.create(options);
      setSession(sessionInstance);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Error creating session: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!session || (!inputMessage.trim() && !attachedImage && !attachedAudio) || isGenerating) return;
    
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      image: attachedImage,
      audio: attachedAudio,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setAttachedImage(null);
    setAttachedAudio(null);
    setIsGenerating(true);
    setCurrentStreamingText('');
    
    const controller = new AbortController();
    setAbortController(controller);
    
    try {
      let promptContent = userMessage.content;
      
      if (userMessage.image || userMessage.audio) {
        promptContent = [{
          role: "user",
          content: []
        }];
        
        if (userMessage.content) {
          promptContent[0].content.push({
            type: 'text',
            value: userMessage.content
          });
        }
        
        if (userMessage.image) {
          promptContent[0].content.push({
            type: 'image',
            value: userMessage.image.file
          });
        }
        
        if (userMessage.audio) {
          promptContent[0].content.push({
            type: 'audio',
            value: userMessage.audio.file
          });
        }
      }
      
      if (isStreaming) {
        const stream = session.promptStreaming(promptContent, {
          signal: controller.signal
        });
        
        let fullText = '';
        
        for await (const chunk of stream) {
          fullText += chunk;
          setCurrentStreamingText(fullText);
        }
        
        const assistantMessage = {
          id: Date.now(),
          role: 'assistant',
          content: fullText,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setCurrentStreamingText('');
      } else {
        const result = await session.prompt(promptContent, {
          signal: controller.signal
        });
        
        const assistantMessage = {
          id: Date.now(),
          role: 'assistant',
          content: result,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
      
      if (session.inputUsage && session.inputQuota) {
        console.log(`Token usage: ${session.inputUsage}/${session.inputQuota}`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Generation stopped by user');
      } else {
        console.error('Error generating response:', error);
        alert('Error generating response: ' + error.message);
      }
    } finally {
      setIsGenerating(false);
      setCurrentStreamingText('');
      setAbortController(null);
    }
  };

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  const loadExample = (example) => {
    setSystemPrompt(example.system);
    setInputMessage(example.prompt);
  };

  const destroySession = () => {
    if (session) {
      session.destroy();
      setSession(null);
      setMessages([]);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentStreamingText('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedImage({
          file: file,
          preview: event.target.result,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      setAttachedAudio({
        file: file,
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB'
      });
    }
  };

  const removeAttachedImage = () => {
    setAttachedImage(null);
  };

  const removeAttachedAudio = () => {
    setAttachedAudio(null);
  };

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
        <p className="mb-2">Your browser does not support the Prompt API.</p>
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
            The Prompt API model is <strong>{availability || 'not available'}</strong>.
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
              <span>Find the Prompt API card in the Model Management section</span>
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

  return (
    <div className="w-full space-y-6">
      <Card gradient>
        <SectionHeader 
          icon={MessageSquare} 
          title="Prompt API (Gemini Nano)" 
          subtitle="Configure your chat settings"
        />

        {modelParams && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Default Top-K</p>
              <p className="text-2xl font-bold text-indigo-900 mt-1">{modelParams.defaultTopK}</p>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-4 border border-teal-200">
              <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide">Max Top-K</p>
              <p className="text-2xl font-bold text-teal-900 mt-1">{modelParams.maxTopK}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Default Temp</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">{modelParams.defaultTemperature}</p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-200">
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Max Temp</p>
              <p className="text-2xl font-bold text-rose-900 mt-1">{modelParams.maxTemperature}</p>
            </div>
          </div>
        )}

        <div className="space-y-6 mt-6">
          <Textarea
            label="System prompt"
            icon={Settings}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Define the assistant's behavior and personality..."
            disabled={session}
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Zap className="w-4 h-4 text-amber-600" />
                Temperature: {temperature.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max={modelParams?.maxTemperature || 2}
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                disabled={session}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${(temperature / (modelParams?.maxTemperature || 2)) * 100}%, #e2e8f0 ${(temperature / (modelParams?.maxTemperature || 2)) * 100}%, #e2e8f0 100%)`
                }}
              />
              <p className="text-xs text-slate-500 mt-1">Controls randomness in responses</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                Top-K: {topK}
              </label>
              <input
                type="range"
                min="1"
                max={modelParams?.maxTopK || 128}
                step="1"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                disabled={session}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(topK / (modelParams?.maxTopK || 128)) * 100}%, #e2e8f0 ${(topK / (modelParams?.maxTopK || 128)) * 100}%, #e2e8f0 100%)`
                }}
              />
              <p className="text-xs text-slate-500 mt-1">Limits vocabulary selection</p>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={isStreaming}
              onChange={(e) => setIsStreaming(e.target.checked)}
              disabled={session}
              className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex-1">
              <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                Enable streaming responses
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Show responses as they are generated in real-time
              </p>
            </div>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={enableImageInput}
                onChange={(e) => setEnableImageInput(e.target.checked)}
                disabled={session}
                className="w-5 h-5 text-teal-600 border-slate-300 rounded focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className="text-sm font-semibold text-slate-700 group-hover:text-teal-600 transition-colors flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Enable image input
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Allow uploading images for analysis
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={enableAudioInput}
                onChange={(e) => setEnableAudioInput(e.target.checked)}
                disabled={session}
                className="w-5 h-5 text-purple-600 border-slate-300 rounded focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className="text-sm font-semibold text-slate-700 group-hover:text-purple-600 transition-colors flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Enable audio input
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Allow uploading audio for transcription
                </p>
              </div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {!session ? (
              <Button
                onClick={createSession}
                disabled={availability === 'unavailable'}
                variant="primary"
                icon={MessageSquare}
                isLoading={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Session'}
              </Button>
            ) : (
              <>
                <Button
                  onClick={destroySession}
                  variant="danger"
                  icon={Trash2}
                >
                  Destroy Session
                </Button>
                <Button
                  onClick={clearChat}
                  variant="secondary"
                  icon={RotateCcw}
                  disabled={messages.length === 0}
                >
                  Clear Chat
                </Button>
              </>
            )}
          </div>

          {session && session.inputUsage && session.inputQuota && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-indigo-700">Token Usage</span>
                <span className="text-sm font-bold text-indigo-900">
                  {session.inputUsage} / {session.inputQuota}
                </span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(session.inputUsage / session.inputQuota) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {session && (
        <>
          <Card gradient>
            <SectionHeader 
              icon={Zap} 
              title="Try an example" 
              subtitle="Load a pre-configured prompt"
              iconBg="amber"
            />
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
          </Card>

          <div className="space-y-4">
            <Card gradient>
              <div 
                className="space-y-4 max-h-[600px] overflow-y-auto pr-2"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 #f1f5f9'
                }}
              >
                {messages.length === 0 && !currentStreamingText && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-4">
                      <MessageSquare className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Start a conversation</h3>
                    <p className="text-sm text-slate-500">Send a message to begin chatting with the AI assistant</p>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    
                    <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                            : 'bg-white border-2 border-slate-200 text-slate-800'
                        }`}
                      >
                        {message.image && (
                          <div className="mb-2">
                            <img 
                              src={message.image.preview} 
                              alt={message.image.name}
                              className="max-w-xs rounded-lg"
                            />
                          </div>
                        )}
                        {message.audio && (
                          <div className="mb-2 flex items-center gap-2 bg-white/20 rounded-lg p-2">
                            <Mic className="w-4 h-4" />
                            <span className="text-xs">{message.audio.name}</span>
                          </div>
                        )}
                        {message.content && (
                          <div 
                            className={`text-sm leading-relaxed prose prose-sm max-w-none ${
                              message.role === 'user' 
                                ? 'prose-invert prose-headings:text-white prose-p:text-white prose-strong:text-white prose-code:text-white prose-pre:bg-white/10' 
                                : ''
                            }`}
                            dangerouslySetInnerHTML={{ __html: marked(message.content) }}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 px-2">
                        <span className="text-xs text-slate-500">{message.timestamp}</span>
                        {message.role === 'assistant' && (
                          <button
                            onClick={() => copyToClipboard(message.content, message.id)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Copy to clipboard"
                          >
                            {copiedId === message.id ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {message.role === 'user' && (
                      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {currentStreamingText && (
                  <div className="flex gap-3 justify-start">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col items-start max-w-[80%]">
                      <div className="rounded-2xl px-4 py-3 bg-white border-2 border-indigo-300 text-slate-800 max-w-full">
                        <div 
                          className="text-sm leading-relaxed prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: marked(currentStreamingText) }}
                        />
                        <div className="flex items-center gap-1 mt-2">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-75" />
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-150" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isGenerating && !currentStreamingText && (
                  <div className="flex gap-3 justify-start">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col items-start max-w-[80%]">
                      <div className="rounded-2xl px-4 py-3 bg-white border-2 border-slate-200 text-slate-800 max-w-full">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </Card>

            <Card>
              <form onSubmit={handleSendMessage} className="space-y-3">
                {(attachedImage || attachedAudio) && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {attachedImage && (
                      <div className="relative inline-block">
                        <img 
                          src={attachedImage.preview} 
                          alt={attachedImage.name}
                          className="h-20 w-20 object-cover rounded-lg border-2 border-teal-300"
                        />
                        <button
                          type="button"
                          onClick={removeAttachedImage}
                          className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <p className="text-xs text-slate-600 mt-1 max-w-20 truncate">{attachedImage.name}</p>
                      </div>
                    )}
                    {attachedAudio && (
                      <div className="relative inline-block bg-purple-50 border-2 border-purple-300 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Mic className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="text-xs font-semibold text-purple-700 max-w-[150px] truncate">{attachedAudio.name}</p>
                            <p className="text-xs text-purple-600">{attachedAudio.size}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeAttachedAudio}
                          className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                    rows={3}
                    className="w-full px-4 py-3 pr-12 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    disabled={isGenerating}
                  />
                </div>
                <div className="flex gap-3">
                  {session && enableImageInput && !attachedImage && (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isGenerating}
                      />
                      <div className="px-4 py-2 bg-teal-50 border-2 border-teal-200 text-teal-700 rounded-xl text-sm font-medium hover:bg-teal-100 hover:border-teal-300 transition-all flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Add Image
                      </div>
                    </label>
                  )}
                  {session && enableAudioInput && !attachedAudio && (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        className="hidden"
                        disabled={isGenerating}
                      />
                      <div className="px-4 py-2 bg-purple-50 border-2 border-purple-200 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-100 hover:border-purple-300 transition-all flex items-center gap-2">
                        <Mic className="w-4 h-4" />
                        Add Audio
                      </div>
                    </label>
                  )}
                  {!isGenerating ? (
                    <Button
                      type="submit"
                      disabled={!inputMessage.trim() && !attachedImage && !attachedAudio}
                      variant="primary"
                      icon={Send}
                      className="flex-1"
                    >
                      Send Message
                    </Button>
                  ) : (
                    <Button
                      onClick={stopGeneration}
                      variant="danger"
                      icon={StopCircle}
                      className="flex-1"
                    >
                      Stop Generating
                    </Button>
                  )}
                </div>
              </form>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
