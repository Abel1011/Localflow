'use client';

import MainLayout from '@/components/MainLayout';
import ModelDownloadManager from '@/components/ModelDownloadManager';
import { Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <MainLayout>
      <div className="p-8 lg:p-12 max-w-7xl mx-auto">
        <header className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div 
              className="flex items-center justify-center w-16 h-16 rounded-2xl text-white shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.4)'
              }}
            >
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <div 
                className="inline-flex items-center gap-2 px-4 py-1.5 text-white rounded-full text-xs font-semibold mb-1"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  boxShadow: '0 4px 15px -3px rgba(139, 92, 246, 0.4)'
                }}
              >
                AI-Powered Workflows
              </div>
              <h1 className="text-4xl font-bold text-slate-900">Local Flow</h1>
            </div>
          </div>
          <p className="text-xl lg:text-2xl text-slate-600 max-w-3xl font-light leading-relaxed">
            Build powerful AI workflows with local Chrome APIs. No external servers, no API keys, complete privacy.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
          <div 
            className="relative overflow-hidden rounded-3xl p-8 border-2 shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fecaca 100%)',
              borderColor: 'rgba(239, 68, 68, 0.3)'
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform rotate-12 translate-x-8 -translate-y-8">
              <div className="w-full h-full rounded-full bg-rose-500"></div>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center mb-4 shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-rose-900 mb-3">100% Local</h3>
              <p className="text-sm text-rose-700 leading-relaxed">
                All AI processing happens directly in your browser. Your data never leaves your device, ensuring complete privacy and security.
              </p>
            </div>
          </div>

          <div 
            className="relative overflow-hidden rounded-3xl p-8 border-2 shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 50%, #99f6e4 100%)',
              borderColor: 'rgba(20, 184, 166, 0.3)'
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform rotate-12 translate-x-8 -translate-y-8">
              <div className="w-full h-full rounded-full bg-teal-500"></div>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center mb-4 shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-teal-900 mb-3">Visual Workflows</h3>
              <p className="text-sm text-teal-700 leading-relaxed">
                Design complex AI pipelines with a drag-and-drop interface. Chain multiple operations together and execute them locally.
              </p>
            </div>
          </div>

          <div 
            className="relative overflow-hidden rounded-3xl p-8 border-2 shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)',
              borderColor: 'rgba(59, 130, 246, 0.3)'
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform rotate-12 translate-x-8 -translate-y-8">
              <div className="w-full h-full rounded-full bg-blue-500"></div>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center mb-4 shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">No API Keys</h3>
              <p className="text-sm text-blue-700 leading-relaxed">
                Powered by Chrome's built-in AI capabilities. No subscriptions, no rate limits, no authentication required.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Available APIs & Model Management</h2>
          <ModelDownloadManager />
        </div>

        <div 
          className="border-2 rounded-2xl p-8 mb-16"
          style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)',
            borderColor: 'rgba(245, 158, 11, 0.7)',
            boxShadow: '0 8px 20px -5px rgba(245, 158, 11, 0.3)'
          }}
        >
          <h4 className="font-bold text-amber-900 mb-4 text-lg">Getting Started</h4>
          <ul className="space-y-3 text-sm text-amber-800">
            <li className="flex items-start gap-3">
              <span className="font-bold mt-0.5">1.</span>
              <span>Ensure you're using <strong>Chrome 131+</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold mt-0.5">2.</span>
              <span>Enable the flag at <code className="px-2 py-1 bg-amber-100 rounded font-mono text-xs">chrome://flags/#prompt-api-for-gemini-nano-multimodal-input</code></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold mt-0.5">3.</span>
              <span>Verify model status at <code className="px-2 py-1 bg-amber-100 rounded font-mono text-xs">chrome://on-device-internals</code></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold mt-0.5">4.</span>
              <span>Download required models using the Model Management section above</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold mt-0.5">5.</span>
              <span>Model downloads require user interaction and may take several minutes depending on your connection</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold mt-0.5">6.</span>
              <span>Once downloaded, models are cached locally and don't need to be downloaded again</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold mt-0.5">7.</span>
              <span>Select an API from the cards below to start experimenting!</span>
            </li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}
