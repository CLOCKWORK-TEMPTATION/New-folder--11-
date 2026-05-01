"use client";

import { useState } from 'react';
import { Bot, FileCode2, ShieldAlert, Sparkles, Settings, ChevronDown } from 'lucide-react';
import PromptStudio from '@/components/PromptStudio';
import SystemAuditor from '@/components/SystemAuditor';
import CodeScanner from '@/components/CodeScanner';

const MODELS = [
  { id: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro', color: 'text-blue-400' },
  { id: 'gpt-5.5', label: 'GPT-5.5', color: 'text-green-400' },
  { id: 'opus-4.7', label: 'Opus 4.7', color: 'text-purple-400' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('user');
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-pro');
  const [showModelMenu, setShowModelMenu] = useState(false);

  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-neutral-800">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">PromptOptima</h1>
        </div>
        
        {/* Model Selector */}
        <div className="px-4 pt-4 pb-2">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-3">Model</div>
          <div className="relative">
            <button 
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50 hover:border-neutral-600 transition-colors"
            >
              <span className={`text-sm font-medium ${currentModel.color}`}>{currentModel.label}</span>
              <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${showModelMenu ? 'rotate-180' : ''}`} />
            </button>
            {showModelMenu && (
              <div className="absolute z-50 mt-1 w-full bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl overflow-hidden">
                {MODELS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedModel(m.id); setShowModelMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-700/50 transition-colors ${selectedModel === m.id ? `${m.color} bg-neutral-700/30` : 'text-neutral-300'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4 px-3">Engines</div>
          
          <button 
            onClick={() => setActiveTab('user')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === 'user' ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-neutral-800/50 text-neutral-400 hover:text-neutral-200'}`}
          >
            <Bot className="w-4 h-4" />
            <span className="text-sm font-medium">User Prompt</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === 'system' ? 'bg-purple-600/10 text-purple-400' : 'hover:bg-neutral-800/50 text-neutral-400 hover:text-neutral-200'}`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="text-sm font-medium">System Auditor</span>
          </button>

          <button 
            onClick={() => setActiveTab('code')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === 'code' ? 'bg-emerald-600/10 text-emerald-400' : 'hover:bg-neutral-800/50 text-neutral-400 hover:text-neutral-200'}`}
          >
            <FileCode2 className="w-4 h-4" />
            <span className="text-sm font-medium">Code Scanner</span>
          </button>
        </nav>
        
        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 px-3 py-2 text-neutral-400 hover:text-neutral-200 cursor-pointer rounded-lg hover:bg-neutral-800/50">
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-neutral-950 to-neutral-950 -z-10"></div>
        
        {activeTab === 'user' && <PromptStudio model={selectedModel} />}
        {activeTab === 'system' && <SystemAuditor model={selectedModel} />}
        {activeTab === 'code' && <CodeScanner model={selectedModel} />}
      </main>
    </div>
  );
}
