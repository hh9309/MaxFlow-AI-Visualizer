import React, { useState } from 'react';
    import { Bot, Loader2, Sparkles, MessageSquare, Settings2, KeyRound } from 'lucide-react';
    import { AIProvider } from '../types';
    
    interface AIAssistantProps {
      onGenerate: (topic: string, provider: AIProvider, key?: string) => Promise<void>;
      onExplain: (provider: AIProvider, key?: string) => Promise<void>;
      aiLoading: boolean;
      aiMessage: string | null;
    }
    
    export const AIAssistant: React.FC<AIAssistantProps> = ({
      onGenerate,
      onExplain,
      aiLoading,
      aiMessage
    }) => {
      const [topic, setTopic] = useState('');
      const [provider, setProvider] = useState<AIProvider>('gemini');
      const [apiKey, setApiKey] = useState('');
      const [showSettings, setShowSettings] = useState(false);
    
      const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;
        onGenerate(topic, provider, apiKey);
      };
    
      const handleExplain = () => {
          onExplain(provider, apiKey);
      };
    
      return (
        <div className="flex flex-col gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200 h-full">
          <div className="flex justify-between items-center text-purple-600 mb-1">
            <div className="flex items-center gap-2">
                <Sparkles size={20} />
                <h3 className="font-bold text-lg">AI 助手</h3>
            </div>
            <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 hover:bg-purple-50 rounded text-slate-400 hover:text-purple-600"
                title="设置模型"
            >
                <Settings2 size={18} />
            </button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm mb-2 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-xs font-bold text-slate-500 mb-2">选择模型</label>
                  <select 
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as AIProvider)}
                    className="w-full mb-3 px-2 py-1.5 border rounded border-slate-300 focus:border-purple-500 outline-none bg-white"
                  >
                      <option value="gemini">Google Gemini 2.5 Flash</option>
                      <option value="deepseek">DeepSeek-V3</option>
                  </select>

                  {provider === 'deepseek' && (
                      <div className="space-y-1">
                          <label className="flex items-center gap-1 text-xs font-bold text-slate-500">
                              <KeyRound size={12} />
                              DeepSeek API Key
                          </label>
                          <input 
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-..."
                            className="w-full px-2 py-1.5 border rounded border-slate-300 focus:border-purple-500 outline-none text-xs"
                          />
                          <p className="text-[10px] text-slate-400">Key 仅用于本次会话请求，不会保存。</p>
                      </div>
                  )}
              </div>
          )}
    
          {/* Generation Form */}
          <form onSubmit={handleGenerate} className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-500">生成场景</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例如：城市交通、石油管道"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
              />
              <button
                type="submit"
                disabled={aiLoading || !topic}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {aiLoading ? <Loader2 className="animate-spin" size={18} /> : '生成'}
              </button>
            </div>
          </form>
    
          <div className="border-t border-slate-100 my-1"></div>
    
          {/* Explain Button */}
          <button
            onClick={handleExplain}
            disabled={aiLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors font-medium text-sm"
          >
            <Bot size={18} />
            解释当前步骤
          </button>
    
          {/* AI Output Area */}
          <div className="flex-1 min-h-[150px] bg-slate-50 rounded-lg p-3 text-sm text-slate-700 overflow-y-auto border border-slate-100">
            {aiLoading ? (
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="animate-spin" size={16} />
                思考中...
              </div>
            ) : aiMessage ? (
                <div className="flex gap-2">
                    <MessageSquare className="shrink-0 text-purple-500 mt-1" size={16} />
                    <p className="leading-relaxed whitespace-pre-wrap">{aiMessage}</p>
                </div>
            ) : (
              <span className="text-slate-400 italic">AI 的见解将显示在这里...</span>
            )}
          </div>
        </div>
      );
    };
