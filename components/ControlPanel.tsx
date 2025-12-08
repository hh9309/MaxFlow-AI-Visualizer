import React from 'react';
import { Play, SkipForward, RotateCcw, Trash2, MousePointer2, PlusCircle, ArrowRightCircle, MapPin, Flag, XCircle } from 'lucide-react';
import { AlgorithmPhase, ToolType, SelectionState } from '../types';

interface ControlPanelProps {
  phase: AlgorithmPhase;
  activeTool: ToolType;
  selection: SelectionState | null;
  onToolChange: (tool: ToolType) => void;
  onStep: () => void;
  onReset: () => void;
  onClear: () => void;
  onDeleteSelected: () => void;
  onAutoPlay: () => void;
  isAutoPlaying: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  phase,
  activeTool,
  selection,
  onToolChange,
  onStep,
  onReset,
  onClear,
  onDeleteSelected,
  onAutoPlay,
  isAutoPlaying
}) => {

  const tools = [
    { id: 'SELECT', icon: MousePointer2, label: '选择/移动' },
    { id: 'ADD_NODE', icon: PlusCircle, label: '添加节点' },
    { id: 'ADD_EDGE', icon: ArrowRightCircle, label: '添加连线' },
    { id: 'SET_SOURCE', icon: MapPin, label: '设为起点' },
    { id: 'SET_SINK', icon: Flag, label: '设为终点' },
    { id: 'DELETE', icon: XCircle, label: '橡皮擦' },
  ] as const;

  return (
    <div className="flex flex-col gap-6 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
      
      {/* Toolbox */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">工具箱</h3>
        <div className="grid grid-cols-3 gap-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id as ToolType)}
              disabled={isAutoPlaying}
              className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs transition-all ${
                activeTool === tool.id 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent'
              } ${isAutoPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={tool.label}
            >
              <tool.icon size={20} className="mb-1" />
              <span className="scale-90">{tool.label}</span>
            </button>
          ))}
        </div>
        
        {/* Selection Actions */}
        {selection && (
             <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-1">
                 <span className="text-xs text-red-600 font-medium">
                     已选择: {selection.type === 'node' ? '节点' : '连线'} {selection.id}
                 </span>
                 <button 
                    onClick={onDeleteSelected}
                    className="p-1 hover:bg-red-200 rounded text-red-600 transition-colors"
                    title="删除选中项"
                 >
                     <Trash2 size={16} />
                 </button>
             </div>
        )}
      </div>

      <div className="border-t border-slate-100"></div>

      {/* Playback Controls */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">运行控制</h3>
        <div className="flex gap-2 mb-3">
            <button
            onClick={onStep}
            disabled={isAutoPlaying || phase === AlgorithmPhase.FINISHED}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
            <SkipForward size={18} />
            单步
            </button>

            <button
            onClick={onAutoPlay}
            disabled={phase === AlgorithmPhase.FINISHED}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white transition-colors font-medium text-sm ${
                isAutoPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
            <Play size={18} />
            {isAutoPlaying ? '暂停' : '自动'}
            </button>
        </div>

        <div className="flex gap-2">
            <button
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-xs font-medium"
            >
            <RotateCcw size={14} />
            重置流量
            </button>
            <button
            onClick={onClear}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-xs font-medium"
            >
            <Trash2 size={14} />
            清空图表
            </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-xs text-slate-400 mt-auto bg-slate-50 p-2 rounded">
        {activeTool === 'SELECT' && '点击选中节点或连线 (Delete键删除)。拖动可调整布局。'}
        {activeTool === 'ADD_NODE' && '点击空白处添加新节点。'}
        {activeTool === 'ADD_EDGE' && '拖动连接两个节点以添加边 (随机容量)。'}
        {activeTool === 'SET_SOURCE' && '点击节点将其设为源点 (s)。'}
        {activeTool === 'SET_SINK' && '点击节点将其设为汇点 (t)。'}
        {activeTool === 'DELETE' && '点击节点或连线直接删除。'}
      </div>
    </div>
  );
};