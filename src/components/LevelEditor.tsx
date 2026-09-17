import React, { useState, useRef } from 'react';
import { LevelConfig } from '../types';
import { Save, X, MousePointer2, Scissors, Settings2, Trash2 } from 'lucide-react';

interface LevelEditorProps {
  onSave: (level: LevelConfig) => void;
  onCancel: () => void;
}

type Tool = 'azuro' | 'cheese' | 'hornet' | 'rope' | 'eraser';

export default function LevelEditor({ onSave, onCancel }: LevelEditorProps) {
  const [name, setName] = useState('Nuovo Livello');
  const [isChallenge, setIsChallenge] = useState(false);
  const [azuroPos, setAzuroPos] = useState({ x: 400, y: 550 });
  const [cheesePos, setCheesePos] = useState({ x: 400, y: 150 });
  const [hornets, setHornets] = useState<{ x: number, y: number }[]>([]);
  const [ropes, setRopes] = useState<{ x: number, y: number, length: number }[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>('azuro');

  const svgRef = useRef<SVGSVGElement>(null);

  const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursorPt = pt.matrixTransform(svgRef.current.getScreenCTM()!.inverse());
    const x = Math.round(cursorPt.x);
    const y = Math.round(cursorPt.y);

    if (activeTool === 'azuro') {
      setAzuroPos({ x, y });
    } else if (activeTool === 'cheese') {
      setCheesePos({ x, y });
      // Recalculate rope lengths
      setRopes(ropes.map(r => ({
        ...r,
        length: getDistance(r.x, r.y, x, y)
      })));
    } else if (activeTool === 'hornet') {
      setHornets([...hornets, { x, y }]);
    } else if (activeTool === 'rope') {
      setRopes([...ropes, { x, y, length: getDistance(x, y, cheesePos.x, cheesePos.y) }]);
    } else if (activeTool === 'eraser') {
      // Find closest item to erase (exclude azuro and cheese)
      const threshold = 30;
      let removed = false;
      
      const newHornets = hornets.filter(h => {
        if (!removed && getDistance(x, y, h.x, h.y) < threshold) {
          removed = true;
          return false;
        }
        return true;
      });
      if (removed) {
        setHornets(newHornets);
        return;
      }

      const newRopes = ropes.filter(r => {
        if (!removed && getDistance(x, y, r.x, r.y) < threshold) {
          removed = true;
          return false;
        }
        return true;
      });
      if (removed) {
        setRopes(newRopes);
      }
    }
  };

  const handleSave = () => {
    if (ropes.length === 0) {
      alert("Aggiungi almeno una corda!");
      return;
    }
    const newLevel: LevelConfig = {
      id: Date.now(), // Generate unique ID
      name,
      isChallenge,
      gravityY: isChallenge ? -1 : 1,
      azuroPos,
      cheesePos,
      ropes,
      hornets
    };
    onSave(newLevel);
  };

  return (
    <div className="w-full max-w-5xl flex flex-col items-center space-y-4 animate-in fade-in duration-300">
      <div className="w-full flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex items-center space-x-4">
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-bold w-64 focus:outline-none focus:border-blue-500"
            placeholder="Nome Livello"
          />
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={isChallenge} 
              onChange={(e) => setIsChallenge(e.target.checked)} 
              className="w-5 h-5 accent-purple-500 rounded"
            />
            <span className="text-purple-300 font-bold">Fisica Inversa</span>
          </label>
        </div>
        <div className="flex space-x-2">
          <button onClick={onCancel} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center space-x-2">
            <X className="w-5 h-5" />
            <span className="hidden md:inline">Annulla</span>
          </button>
          <button onClick={handleSave} className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center space-x-2 font-bold">
            <Save className="w-5 h-5" />
            <span className="hidden md:inline">Salva Livello</span>
          </button>
        </div>
      </div>

      <div className="flex w-full gap-4">
        {/* Toolbar */}
        <div className="flex flex-col space-y-2 bg-slate-800 p-4 rounded-xl border border-slate-700">
          <h3 className="text-sm text-slate-400 font-bold uppercase mb-2 tracking-wider">Strumenti</h3>
          
          <ToolButton active={activeTool === 'azuro'} onClick={() => setActiveTool('azuro')} icon={<MousePointer2 className="w-5 h-5 text-blue-400"/>} label="Azuro" />
          <ToolButton active={activeTool === 'cheese'} onClick={() => setActiveTool('cheese')} icon={<div className="text-xl">🧀</div>} label="Formaggio" />
          <ToolButton active={activeTool === 'rope'} onClick={() => setActiveTool('rope')} icon={<Settings2 className="w-5 h-5 text-amber-600" />} label="Corda (Ancora)" />
          <ToolButton active={activeTool === 'hornet'} onClick={() => setActiveTool('hornet')} icon={<div className="text-xl">🐝</div>} label="Calabrone" />
          <div className="my-2 border-b border-slate-700"></div>
          <ToolButton active={activeTool === 'eraser'} onClick={() => setActiveTool('eraser')} icon={<Trash2 className="w-5 h-5 text-rose-400" />} label="Gomma (Cancella)" />
        </div>

        {/* Editor Canvas */}
        <div className="flex-1 bg-slate-900 rounded-2xl overflow-hidden border-4 border-slate-700 shadow-2xl relative" style={{ aspectRatio: '800/600' }}>
          <svg 
            ref={svgRef}
            viewBox="0 0 800 600" 
            className="w-full h-full cursor-crosshair"
            style={{ backgroundColor: isChallenge ? '#1a1a2e' : '#2b3a4a' }}
            onClick={handleSvgClick}
          >
            {/* Draw Ropes */}
            {ropes.map((r, i) => (
              <g key={`rope-${i}`}>
                <line x1={r.x} y1={r.y} x2={cheesePos.x} y2={cheesePos.y} stroke="#8B4513" strokeWidth="4" />
                <circle cx={r.x} cy={r.y} r="8" fill="#555" />
              </g>
            ))}

            {/* Draw Azuro Placeholder */}
            <g transform={`translate(${azuroPos.x}, ${azuroPos.y}) ${isChallenge ? 'scale(1, -1)' : ''}`}>
              <circle cx={0} cy={0} r={40} fill="#3b82f6" />
              <rect x={-40} y={-10} width={80} height={5} fill="#333" />
              <circle cx={-15} cy={-10} r={15} fill="#fff" stroke="#000" strokeWidth="3" />
              <circle cx={15} cy={-10} r={15} fill="#fff" stroke="#000" strokeWidth="3" />
              <circle cx={-15} cy={-10} r={4} fill="#000" />
              <circle cx={15} cy={-10} r={4} fill="#000" />
            </g>

            {/* Draw Cheese */}
            <text x={cheesePos.x} y={cheesePos.y} fontSize="40" textAnchor="middle" dominantBaseline="central">🧀</text>

            {/* Draw Hornets Placeholder */}
            {hornets.map((h, i) => (
              <text key={`hornet-${i}`} x={h.x} y={h.y} fontSize="30" textAnchor="middle" dominantBaseline="central">🐝</text>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

function ToolButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`p-3 rounded-lg flex items-center space-x-3 transition-colors ${active ? 'bg-blue-600/30 border border-blue-500' : 'bg-slate-900 border border-slate-700 hover:bg-slate-700'}`}
    >
      <div className="w-6 flex justify-center">{icon}</div>
      <span className={`font-medium ${active ? 'text-blue-300' : 'text-slate-300'}`}>{label}</span>
    </button>
  );
}
