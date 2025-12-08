import React, { useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_GRAPH } from './constants';
import { Graph, Node, Edge, AlgorithmPhase, AlgorithmState, ToolType, AIProvider, SelectionState } from './types';
import { initializeAlgorithm, stepAlgorithm } from './services/maxFlowAlgorithm';
import { generateGraphScenario, explainStep } from './services/geminiService';
import { GraphCanvas } from './components/GraphCanvas';
import { ControlPanel } from './components/ControlPanel';
import { AIAssistant } from './components/AIAssistant';

const App: React.FC = () => {
  // --- State ---
  const [graph, setGraph] = useState<Graph>(INITIAL_GRAPH);
  const [algoState, setAlgoState] = useState<AlgorithmState>(initializeAlgorithm());
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('SELECT');
  const [selection, setSelection] = useState<SelectionState | null>(null);

  // --- Helpers ---
  const resetAlgo = useCallback(() => {
    setAlgoState(initializeAlgorithm());
    // Clear flows and labels
    setGraph(prev => ({
        nodes: prev.nodes.map(n => ({ ...n, label: undefined })),
        edges: prev.edges.map(e => ({ ...e, flow: 0 }))
    }));
  }, []);

  // Handle Keyboard Delete
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.key === 'Delete' || e.key === 'Backspace') && selection) {
              if (selection.type === 'node') deleteNode(selection.id);
              if (selection.type === 'edge') deleteEdge(selection.id);
              setSelection(null);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection]);


  // --- Graph Editing Handlers ---
  const addNode = (x: number, y: number) => {
    // Find next available v-number
    let nextIdx = 1;
    while (graph.nodes.some(n => n.id === `v${nextIdx}`) || graph.nodes.some(n => n.id === 's' && `v${nextIdx}` === 's') || graph.nodes.some(n => n.id === 't' && `v${nextIdx}` === 't')) {
        nextIdx++;
    }
    const id = `v${nextIdx}`;

    setGraph(prev => ({
      ...prev,
      nodes: [...prev.nodes, { id, x, y }]
    }));
    if (algoState.phase !== AlgorithmPhase.IDLE) resetAlgo();
  };

  const addEdge = (sourceId: string, targetId: string) => {
    // Check if edge exists
    const exists = graph.edges.some(e => e.source === sourceId && e.target === targetId);
    if (exists) return;

    // Random capacity between 1 and 20
    const capacity = Math.floor(Math.random() * 20) + 1;

    setGraph(prev => ({
      ...prev,
      edges: [...prev.edges, { 
        id: `e${Date.now()}`, 
        source: sourceId, 
        target: targetId, 
        capacity, 
        flow: 0 
      }]
    }));
    if (algoState.phase !== AlgorithmPhase.IDLE) resetAlgo();
  };

  const deleteNode = (id: string) => {
    setGraph(prev => {
        return {
            nodes: prev.nodes.filter(n => n.id !== id),
            edges: prev.edges.filter(e => e.source !== id && e.target !== id)
        };
    });
    setSelection(null);
    resetAlgo();
  };

  const deleteEdge = (id: string) => {
      setGraph(prev => ({
          ...prev,
          edges: prev.edges.filter(e => e.id !== id)
      }));
      setSelection(null);
      if (algoState.phase !== AlgorithmPhase.IDLE) resetAlgo();
  };

  const setSource = (id: string) => {
      setGraph(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => ({
              ...n,
              isSource: n.id === id,
              isSink: n.id === id ? false : n.isSink // Can't be both
          }))
      }));
      resetAlgo();
  };

  const setSink = (id: string) => {
    setGraph(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => ({
            ...n,
            isSink: n.id === id,
            isSource: n.id === id ? false : n.isSource
        }))
    }));
    resetAlgo();
  };

  const moveNode = (id: string, x: number, y: number) => {
      setGraph(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => n.id === id ? { ...n, x, y } : n)
      }));
  };

  const handleSelect = (id: string | null, type: 'node' | 'edge' | null) => {
      if (id && type) {
          setSelection({ id, type });
      } else {
          setSelection(null);
      }
  };

  // --- Algorithm Handlers ---
  const handleStep = useCallback(() => {
    const result = stepAlgorithm(graph, algoState);
    setGraph(result.graph);
    setAlgoState(result.state);
  }, [graph, algoState]);

  const handleReset = () => {
    setIsAutoPlaying(false);
    resetAlgo();
    setAiMessage(null);
    setSelection(null);
  };

  const handleClear = () => {
    setIsAutoPlaying(false);
    setGraph({
        nodes: [],
        edges: []
    });
    setAlgoState(initializeAlgorithm());
    setSelection(null);
  };

  // --- Auto Play Effect ---
  useEffect(() => {
    let interval: any;
    if (isAutoPlaying && algoState.phase !== AlgorithmPhase.FINISHED) {
      interval = setInterval(() => {
        handleStep();
      }, 800);
    } else if (algoState.phase === AlgorithmPhase.FINISHED) {
      setIsAutoPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, algoState.phase, handleStep]);

  // --- AI Handlers ---
  const handleAIGenerate = async (topic: string, provider: AIProvider, key?: string) => {
    setAiLoading(true);
    setAiMessage(null);
    try {
      const result = await generateGraphScenario(topic, provider, key);
      handleReset(); 
      setGraph(result.graph);
      setAiMessage(`已生成场景: ${result.description}`);
    } catch (error: any) {
      setAiMessage(`生成失败: ${error.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIExplain = async (provider: AIProvider, key?: string) => {
    setAiLoading(true);
    try {
      const explanation = await explainStep(graph, algoState.logs, algoState.phase, provider, key);
      setAiMessage(explanation);
    } catch (error) {
      setAiMessage("无法生成解释。");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6 gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">最大流算法演示</h1>
          <p className="text-slate-500 text-sm">双标号法 (Ford-Fulkerson Algorithm)</p>
        </div>
        <div className="flex gap-4">
             <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
                 <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">当前最大流</span>
                 <p className="text-2xl font-bold text-emerald-600 leading-none mt-1">{algoState.maxFlow}</p>
             </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Canvas Area */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="relative flex-1 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden min-h-[500px]">
            <GraphCanvas 
                graph={graph}
                pathFound={algoState.pathFound}
                activeTool={activeTool}
                selection={selection}
                onSelect={handleSelect}
                onNodeAdd={addNode}
                onEdgeAdd={addEdge}
                onNodeDelete={deleteNode}
                onEdgeDelete={deleteEdge}
                onSetSource={setSource}
                onSetSink={setSink}
                onNodeMove={moveNode}
                readOnly={isAutoPlaying}
            />
            {/* Phase Badge */}
            <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur border border-slate-200 rounded-full text-xs font-bold shadow-sm text-slate-600 uppercase tracking-widest pointer-events-none">
                阶段: <span className="text-blue-600">
                    {algoState.phase === 'IDLE' && '就绪'}
                    {algoState.phase === 'LABELING' && '标号搜索中'}
                    {algoState.phase === 'AUGMENTING' && '增广流量'}
                    {algoState.phase === 'FINISHED' && '完成'}
                </span>
            </div>
          </div>
          
          {/* Algorithm Log */}
          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl shadow-lg h-48 overflow-y-auto font-mono text-xs">
            {algoState.logs.length === 0 ? (
                <span className="text-slate-500">// 日志将显示在这里...</span>
            ) : (
                algoState.logs.map((log, i) => (
                    <div key={i} className="mb-1 border-l-2 border-slate-700 pl-2">
                        <span className="text-slate-500 select-none">{(i+1).toString().padStart(2, '0')} </span>
                        {log}
                    </div>
                ))
            )}
            <div ref={useRef<HTMLDivElement>(el => el?.scrollIntoView({ behavior: 'smooth' }))} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          <ControlPanel 
            phase={algoState.phase}
            activeTool={activeTool}
            selection={selection}
            onToolChange={setActiveTool}
            onStep={() => handleStep()}
            onReset={handleReset}
            onClear={handleClear}
            onDeleteSelected={() => {
                if(selection?.type === 'node') deleteNode(selection.id);
                if(selection?.type === 'edge') deleteEdge(selection.id);
            }}
            onAutoPlay={() => setIsAutoPlaying(!isAutoPlaying)}
            isAutoPlaying={isAutoPlaying}
          />
          
          <AIAssistant 
            onGenerate={handleAIGenerate}
            onExplain={handleAIExplain}
            aiLoading={aiLoading}
            aiMessage={aiMessage}
          />

          {/* Legend */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-sm">
             <h4 className="font-bold text-slate-700 mb-3">图例</h4>
             <div className="space-y-2">
                 <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                     <span className="text-slate-600">源点 (s)</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-red-500"></div>
                     <span className="text-slate-600">汇点 (t)</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                     <span className="text-slate-600">已标号节点</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <div className="w-8 h-1 bg-amber-500 rounded"></div>
                     <span className="text-slate-600">增广路径</span>
                 </div>
                 <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                     标号格式: (前驱节点, 方向±, 可改进量)
                 </div>
             </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;