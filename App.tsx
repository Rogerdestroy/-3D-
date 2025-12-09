import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { BlockData, BlockType, BlockRotation, Tool, DrillAxis, LightSettings } from './types';

// Icons
const CubeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
);
const TriangleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18L12 4z"/></svg>
);
const TrashIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);
const RotateIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
);
const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);
const UnlockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
);
const AdvancedIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2 2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
);
const DrillIcon = () => (
   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M2 12h4"/><path d="M18 12h4"/></svg>
);
const CircleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
);
const RectIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
);
const TriPolyIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3L3 21H21L12 3Z" /></svg>
);
const PaintIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.375 2.625a3.875 3.875 0 0 0-5.5 0l-9 9a3.875 3.875 0 0 0 0 5.5l1.5 1.5a3.875 3.875 0 0 0 5.5 0l9-9a3.875 3.875 0 0 0 0-5.5l-1.5-1.5z"/><path d="M14 8l-2 2"/><path d="M16 10l-2 2"/></svg>
);
const ClearIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18"/><path d="M18 6l-1.5-1.5"/></svg>
);
const FillIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
);
const HollowIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
);
const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);
const SunIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
);
const ExportIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);
const ImportIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
);
const CameraIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
);
const CubeFileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M12 18l-4-2.5 4-2.5 4 2.5z"></path><path d="M12 13v5"></path></svg>
);
const SelectIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path><path d="M13 13l6 6"></path></svg>
);

const COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
  '#52525b', // Gray
  '#18181b', // Black
];

export default function App() {
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  // History Stack: Array of block configurations
  const [history, setHistory] = useState<BlockData[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);

  const [currentColor, setCurrentColor] = useState<string>(COLORS[5]); // Default Blue
  const [currentType, setCurrentType] = useState<BlockType>('cube');
  const [currentRotation, setCurrentRotation] = useState<BlockRotation>(0);
  const [currentTool, setCurrentTool] = useState<Tool>('build');
  const [isCameraLocked, setIsCameraLocked] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [isFilled, setIsFilled] = useState<boolean>(true);
  const [drillAxis, setDrillAxis] = useState<DrillAxis>('x');
  const [resetCameraTrigger, setResetCameraTrigger] = useState(0);
  const [screenshotTrigger, setScreenshotTrigger] = useState(0);
  const [stlTrigger, setStlTrigger] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [lightSettings, setLightSettings] = useState<LightSettings>({
      enabled: true,
      intensity: 1,
      position: [10, 20, 10]
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Undo/Redo Handlers
  const handleUndo = useCallback(() => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      setBlocks(history[prevStep]);
      setHistoryStep(prevStep);
    }
  }, [history, historyStep]);

  const handleRedo = useCallback(() => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      setBlocks(history[nextStep]);
      setHistoryStep(nextStep);
    }
  }, [history, historyStep]);

  // Wrapper for setBlocks to update history
  const updateBlocksWithHistory = useCallback((action: React.SetStateAction<BlockData[]>) => {
    let newBlocks: BlockData[];
    
    // Safely determine new blocks value
    if (typeof action === 'function') {
      newBlocks = (action as (prev: BlockData[]) => BlockData[])(blocks);
    } else {
      newBlocks = action;
    }

    // If strictly equal, do nothing
    if (newBlocks === blocks) return;

    // Update History
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newBlocks);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);

    // Update Blocks
    setBlocks(newBlocks);
  }, [blocks, history, historyStep]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }

      // Select All
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
         e.preventDefault();
         if (blocks.length > 0) {
            setSelectedIds(blocks.map(b => b.id));
         }
      }

      // Move Selection Up/Down
      if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
          e.preventDefault();
          if (selectedIds.length > 0) {
              const dy = e.key === 'ArrowUp' ? 1 : -1;
              const newBlocks = blocks.map(b => {
                  if (selectedIds.includes(b.id)) {
                      return { ...b, position: [b.position[0], b.position[1] + dy, b.position[2]] as [number, number, number] };
                  }
                  return b;
              });
              // Ensure we don't move blocks below ground (y < 0) - although prompt didn't strictly forbid, it's good practice. 
              // However, user said "move up/down", let's allow free movement for now, scene handles rendering.
              // Logic check: if any block goes below 0.5, maybe block move? 
              // Let's allow negative for now if user insists, but typically y=0 is ground.
              const anyBelowGround = newBlocks.some(b => b.position[1] < 0);
              if (!anyBelowGround) {
                  updateBlocksWithHistory(newBlocks);
              }
          }
      }

      if (e.key === 'Escape') {
        if (selectedIds.length > 0) {
            setSelectedIds([]);
        } else {
            setCurrentTool('build');
            setShowAdvanced(false);
            setShowSettings(false);
        }
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsCameraLocked(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, blocks, selectedIds, updateBlocksWithHistory]);

  const rotate = () => {
    setCurrentRotation((prev) => ((prev + 1) % 4) as BlockRotation);
  };

  const clearAll = () => {
    // If already empty, do nothing
    if (blocks.length === 0) return;

    // Directly manage history update for Clear All to ensure reliability
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push([]); // Add empty state
    
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
    setBlocks([]);
    setSelectedIds([]);
  };

  const toggleCameraLock = () => {
    setIsCameraLocked(prev => !prev);
  };

  const selectTool = (tool: Tool) => {
    setCurrentTool(tool);
    if (tool !== 'select') {
        // Optional: clear selection when changing tools? 
        // Prompt says "When NOT selecting any other function... (1) click to select".
        // It implies selection mode is a state.
        // We'll keep selection active even if tool changes, but interactions depend on tool.
    }
  };
  
  const handleExport = () => {
      const data = JSON.stringify(blocks);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'voxel-model.json';
      link.click();
      URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              if (Array.isArray(json)) {
                  // Basic validation: check if items look like blocks
                  const valid = json.every(b => b.id && b.position && b.type);
                  if (valid) {
                      updateBlocksWithHistory(json);
                  } else {
                      alert('Invalid file format: Missing block data');
                  }
              } else {
                  alert('Invalid file format: Expected an array');
              }
          } catch (err) {
              console.error(err);
              alert('Failed to parse file');
          }
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset
  };

  return (
    <div className="relative w-full h-full bg-[#1a1a1a] text-white overflow-hidden select-none font-sans">
      
      {/* 3D Canvas */}
      <Canvas shadows camera={{ position: [8, 8, 8], fov: 45 }} gl={{ preserveDrawingBuffer: true }}>
        <Scene 
          blocks={blocks}
          setBlocks={updateBlocksWithHistory}
          currentColor={currentColor}
          currentType={currentType}
          currentRotation={currentRotation}
          currentTool={currentTool}
          isCameraLocked={isCameraLocked}
          isFilled={isFilled}
          drillAxis={drillAxis}
          resetCameraTrigger={resetCameraTrigger}
          lightSettings={lightSettings}
          screenshotTrigger={screenshotTrigger}
          stlTrigger={stlTrigger}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
        />
      </Canvas>

      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 flex gap-2 z-10 items-start">
        {/* Settings Panel Toggle */}
        <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
                <button
                    onClick={() => setScreenshotTrigger(t => t + 1)}
                    className="p-3 rounded-full border border-white/10 text-white transition-all bg-black/60 backdrop-blur-md hover:bg-white/20"
                    title="Download Screenshot"
                >
                    <CameraIcon />
                </button>
                <button
                    onClick={() => setStlTrigger(t => t + 1)}
                    className="p-3 rounded-full border border-white/10 text-white transition-all bg-black/60 backdrop-blur-md hover:bg-white/20"
                    title="Export STL"
                >
                    <CubeFileIcon />
                </button>
                 <div className="w-px h-auto bg-white/20 mx-1"></div>
                <button
                    onClick={handleExport}
                    className="p-3 rounded-full border border-white/10 text-white transition-all bg-black/60 backdrop-blur-md hover:bg-white/20"
                    title="Save Project (JSON)"
                >
                    <ExportIcon />
                </button>
                <button
                    onClick={handleImportClick}
                    className="p-3 rounded-full border border-white/10 text-white transition-all bg-black/60 backdrop-blur-md hover:bg-white/20"
                    title="Load Project (JSON)"
                >
                    <ImportIcon />
                </button>
                 <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-3 rounded-full border border-white/10 text-white transition-all ${showSettings ? 'bg-white/20' : 'bg-black/60 backdrop-blur-md hover:bg-white/20'}`}
                  title="Light Settings"
                >
                  <SunIcon />
                </button>
                <button
                  onClick={() => setResetCameraTrigger(prev => prev + 1)}
                  className="p-3 rounded-full border border-white/10 text-white transition-all bg-black/60 backdrop-blur-md hover:bg-white/20"
                  title="Reset Camera View (Home)"
                >
                  <HomeIcon />
                </button>
                <button 
                  onClick={toggleCameraLock}
                  className={`p-3 rounded-full border border-white/10 text-white transition-all ${isCameraLocked ? 'bg-red-500/80 hover:bg-red-600/80' : 'bg-black/60 backdrop-blur-md hover:bg-white/20'}`}
                  title={isCameraLocked ? "Unlock Camera View" : "Lock Camera View"}
                >
                  {isCameraLocked ? <LockIcon /> : <UnlockIcon />}
                </button>
            </div>
            
            {/* Settings Dropdown */}
            {showSettings && (
                <div className="bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10 w-64 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-white/90">Light Settings</h3>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={lightSettings.enabled}
                                onChange={(e) => setLightSettings(prev => ({...prev, enabled: e.target.checked}))}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    
                    <div className="space-y-3">
                        <div className={lightSettings.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}>
                            <label className="text-xs text-white/60 block mb-1">Intensity: {lightSettings.intensity}</label>
                            <input 
                                type="range" 
                                min="0" max="2" step="0.1"
                                value={lightSettings.intensity}
                                onChange={(e) => setLightSettings(prev => ({...prev, intensity: parseFloat(e.target.value)}))}
                                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        <div className={`space-y-2 ${lightSettings.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                             <label className="text-xs text-white/60 block">Position (X, Y, Z)</label>
                             {(['0', '1', '2'] as const).map((idx, i) => (
                                 <div key={i} className="flex items-center gap-2">
                                     <span className="text-xs font-mono w-4 text-white/40">{['X','Y','Z'][i]}</span>
                                     <input 
                                        type="range" 
                                        min="-50" max="50" step="1"
                                        value={lightSettings.position[i]}
                                        onChange={(e) => {
                                            const newPos = [...lightSettings.position] as [number, number, number];
                                            newPos[i] = parseFloat(e.target.value);
                                            setLightSettings(prev => ({...prev, position: newPos}));
                                        }}
                                        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                                     />
                                     <span className="text-xs font-mono w-6 text-right text-white/60">{lightSettings.position[i]}</span>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden" 
        accept=".json"
      />

      {/* Floating UI Toolbar */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col gap-4 items-center w-max max-w-full px-4">
        
        {/* Advanced Toolbar (Shows only when active) */}
        {showAdvanced && (
            <div className="flex flex-col gap-2 p-2 bg-black/80 backdrop-blur-md rounded-2xl border border-white/20 animate-in slide-in-from-bottom-5 items-center">
                 
                 {/* Fill Toggle - Only for specific tools */}
                 {(currentTool === 'rectangle' || currentTool === 'circle') && (
                    <div className="flex bg-white/10 p-1 rounded-xl mb-1 w-full justify-center">
                          <button 
                            onClick={() => setIsFilled(true)}
                            className={`flex-1 flex justify-center py-1 rounded-lg ${isFilled ? 'bg-white/20' : 'hover:bg-white/5'}`}
                            title="Filled Shape"
                          >
                              <FillIcon />
                          </button>
                          <button 
                            onClick={() => setIsFilled(false)}
                            className={`flex-1 flex justify-center py-1 rounded-lg ${!isFilled ? 'bg-white/20' : 'hover:bg-white/5'}`}
                            title="Hollow / Wireframe"
                          >
                              <HollowIcon />
                          </button>
                    </div>
                 )}

                 {/* Drill Axis Toggle - Only for drill tool */}
                 {currentTool === 'drill' && (
                     <div className="flex bg-white/10 p-1 rounded-xl mb-1 w-full justify-center gap-1">
                        {(['x', 'y', 'z'] as const).map(axis => (
                            <button
                                key={axis}
                                onClick={() => setDrillAxis(axis)}
                                className={`px-3 py-1 text-xs uppercase rounded-lg font-bold ${drillAxis === axis ? 'bg-blue-600' : 'hover:bg-white/10 text-white/70'}`}
                                title={`Drill ${axis.toUpperCase()} Axis`}
                            >
                                {axis}
                            </button>
                        ))}
                     </div>
                 )}

                 <div className="flex gap-2">
                    <button
                        onClick={() => selectTool('rectangle')}
                        className={`p-2 rounded-xl transition-all flex flex-col items-center gap-1 ${currentTool === 'rectangle' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/70 hover:bg-white/10'}`}
                        title="Rectangle (Drag to create box)"
                    >
                        <RectIcon />
                        <span className="text-[10px]">Rect</span>
                    </button>
                    <button
                        onClick={() => selectTool('circle')}
                        className={`p-2 rounded-xl transition-all flex flex-col items-center gap-1 ${currentTool === 'circle' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/70 hover:bg-white/10'}`}
                        title="Circle (Center to Radius)"
                    >
                        <CircleIcon />
                        <span className="text-[10px]">Circle</span>
                    </button>
                     <button
                        onClick={() => selectTool('triangle_poly')}
                        className={`p-2 rounded-xl transition-all flex flex-col items-center gap-1 ${currentTool === 'triangle_poly' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/70 hover:bg-white/10'}`}
                        title="Triangle (Click 3 points)"
                    >
                        <TriPolyIcon />
                        <span className="text-[10px]">Tri</span>
                    </button>
                    <button
                        onClick={() => selectTool('drill')}
                        className={`p-2 rounded-xl transition-all flex flex-col items-center gap-1 ${currentTool === 'drill' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/70 hover:bg-white/10'}`}
                        title="Hole Digger (Click face to toggle hole)"
                    >
                        <DrillIcon />
                        <span className="text-[10px]">Hole</span>
                    </button>
                    <button
                        onClick={() => selectTool('paint')}
                        className={`p-2 rounded-xl transition-all flex flex-col items-center gap-1 ${currentTool === 'paint' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/70 hover:bg-white/10'}`}
                        title="Paint Block"
                    >
                        <PaintIcon />
                        <span className="text-[10px]">Paint</span>
                    </button>
                    <div className="w-px h-auto bg-white/20 mx-1"></div>
                    <button
                        onClick={clearAll}
                        className="p-2 rounded-xl hover:bg-red-500/20 text-red-400 transition-all flex flex-col items-center gap-1"
                        title="Clear All Blocks"
                    >
                        <ClearIcon />
                        <span className="text-[10px] w-max px-1">Clear All</span>
                    </button>
                 </div>
            </div>
        )}

        {/* Colors Palette */}
        <div className={`flex gap-2 p-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 transition-opacity duration-300 ${currentTool === 'delete' || currentTool === 'drill' || currentTool === 'select' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setCurrentColor(color)}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${currentColor === color ? 'border-white scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>

        {/* Main Tools Control Panel */}
        <div className="flex gap-2 sm:gap-4 p-3 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 items-center overflow-x-auto shadow-2xl">
          
          {/* Select Tool */}
          <button
              onClick={() => selectTool('select')}
              className={`p-3 rounded-xl transition-all shrink-0 ${currentTool === 'select' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
              title="Select Tool"
          >
              <SelectIcon />
          </button>

          <div className="w-px h-8 bg-white/10 mx-1 shrink-0"></div>

          {/* Shape Toggle */}
          <div className="flex bg-white/10 rounded-lg p-1 shrink-0">
            <button
              onClick={() => { selectTool('build'); setCurrentType('cube'); }}
              className={`p-2 rounded-md transition-all ${currentTool === 'build' && currentType === 'cube' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
              title="Cube"
            >
              <CubeIcon />
            </button>
            <button
              onClick={() => { selectTool('build'); setCurrentType('triangle'); }}
              className={`p-2 rounded-md transition-all ${currentTool === 'build' && currentType === 'triangle' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
              title="Triangle Prism"
            >
              <TriangleIcon />
            </button>
          </div>

          <div className="w-px h-8 bg-white/10 mx-1 shrink-0"></div>

          {/* Rotation */}
          <button
            onClick={rotate}
            disabled={currentType !== 'triangle' || currentTool !== 'build'}
            className={`p-3 rounded-xl transition-all flex items-center gap-2 shrink-0 ${currentType === 'triangle' && currentTool === 'build' ? 'bg-white/10 hover:bg-white/20 text-white' : 'text-white/30 cursor-not-allowed'}`}
            title="Rotate Shape (R)"
          >
            <RotateIcon />
            {/* Visual indicator of rotation */}
            <div className="flex gap-0.5">
               {[0,1,2,3].map(i => (
                 <div key={i} className={`w-1 h-1 rounded-full ${i === currentRotation ? 'bg-blue-400' : 'bg-white/20'}`} />
               ))}
            </div>
          </button>

          <div className="w-px h-8 bg-white/10 mx-1 shrink-0"></div>

          {/* Delete Toggle */}
          <button
            onClick={() => selectTool(currentTool === 'delete' ? 'build' : 'delete')}
            className={`p-3 rounded-xl transition-all shrink-0 ${currentTool === 'delete' ? 'bg-red-500/80 text-white ring-2 ring-red-400' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            title="Delete Mode"
          >
            <TrashIcon />
          </button>
          
          {/* Advanced Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-3 rounded-xl hover:bg-purple-500/20 text-purple-400 transition-all ml-2 shrink-0 ${showAdvanced ? 'bg-purple-500/20 ring-2 ring-purple-500/50' : ''}`}
            title="Advanced Features"
          >
            <AdvancedIcon />
          </button>
        </div>
      </div>

      {/* Info Overlay */}
      <div className="absolute top-4 left-4 text-white/50 text-xs pointer-events-none">
        <h1 className="text-white/90 text-sm font-bold mb-1">Voxel Builder 3D</h1>
        <p>Tool: <span className="text-blue-400 uppercase font-bold">{currentTool}</span></p>
        <p>Left Click: Action</p>
        <p>Right Drag: Rotate | Middle: Pan</p>
        <p>ESC: Cancel/Clear Selection</p>
        <p>Space: Toggle Camera Lock</p>
        <p>Enter: Extend Pattern</p>
        <p>Ctrl+A: Select All</p>
        <p>Ctrl+Arrow Up/Down: Move Selection</p>
        <p className="mt-2">Ctrl+Z: Undo | Ctrl+Shift+Z: Redo</p>
      </div>
    </div>
  );
}
