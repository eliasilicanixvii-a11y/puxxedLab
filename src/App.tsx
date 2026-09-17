import React, { useState, useEffect, useRef } from 'react';
import { GameStatus, LevelConfig } from './types';
import { levels as officialLevels } from './levels';
import GameCanvas from './components/GameCanvas';
import LevelEditor from './components/LevelEditor';
import { Play, RotateCcw, Menu, ShieldAlert, Volume2, VolumeX, Beaker, PlusCircle, Trash2 } from 'lucide-react';

export default function App() {
  const [status, setStatus] = useState<GameStatus>('LANDING');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [restartKey, setRestartKey] = useState(0);
  const [customLevels, setCustomLevels] = useState<LevelConfig[]>([]);
  
  // Audio state
  const menuAudioRef = useRef<HTMLAudioElement | null>(null);
  const gameAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('puxxed_custom_levels');
    if (saved) {
      try {
        setCustomLevels(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse custom levels", e);
      }
    }
  }, []);

  const saveCustomLevel = (level: LevelConfig) => {
    const newLevels = [...customLevels, level];
    setCustomLevels(newLevels);
    localStorage.setItem('puxxed_custom_levels', JSON.stringify(newLevels));
    setStatus('MENU');
  };

  const deleteCustomLevel = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const newLevels = customLevels.filter(l => l.id !== id);
    setCustomLevels(newLevels);
    localStorage.setItem('puxxed_custom_levels', JSON.stringify(newLevels));
  };

  const allLevels = [...officialLevels, ...customLevels];
  const currentLevel = allLevels.find(l => l.id === currentLevelId) || officialLevels[0];

  useEffect(() => {
    menuAudioRef.current = new Audio('https://nu.vgmtreasurechest.com/soundtracks/cut-the-rope-experiments-android-mobile-gamerip-2011/zpconxyy/03.%20Main%20Menu.mp3');
    menuAudioRef.current.loop = true;
    menuAudioRef.current.volume = 0.4;

    gameAudioRef.current = new Audio('https://nu.vgmtreasurechest.com/soundtracks/cut-the-rope-experiments-android-mobile-gamerip-2011/znrttnkj/01.%20Bath%20Time.mp3');
    gameAudioRef.current.loop = true;
    gameAudioRef.current.volume = 0.4;

    return () => {
      menuAudioRef.current?.pause();
      gameAudioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (status === 'LANDING') return;

    if (isMuted) {
      menuAudioRef.current?.pause();
      gameAudioRef.current?.pause();
      return;
    }

    const playAudio = async () => {
      try {
        if (status === 'MENU') {
          gameAudioRef.current?.pause();
          await menuAudioRef.current?.play();
        } else if (status === 'PLAYING' || status === 'WIN' || status === 'GAME_OVER') {
          menuAudioRef.current?.pause();
          await gameAudioRef.current?.play();
        }
      } catch (err) {
        console.warn("Audio autoplay blocked:", err);
      }
    };
    playAudio();
  }, [status, isMuted]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleStartGame = () => {
    setStatus('MENU');
    // Calling play here directly inside the user gesture handler 
    // guarantees the browser unlocks audio context
    if (!isMuted) {
       menuAudioRef.current?.play().catch(e => console.warn(e));
    }
  };

  const handleLevelSelect = (id: number) => {
    setCurrentLevelId(id);
    setRestartKey(prev => prev + 1);
    setStatus('PLAYING');
  };

  const handleNextLevel = () => {
    const currentIndex = allLevels.findIndex(l => l.id === currentLevelId);
    if (currentIndex !== -1 && currentIndex < allLevels.length - 1) {
      setCurrentLevelId(allLevels[currentIndex + 1].id);
      setRestartKey(prev => prev + 1);
      setStatus('PLAYING');
    } else {
      setStatus('MENU'); // Finished all levels
    }
  };

  const handleRestart = () => {
    setRestartKey(prev => prev + 1);
    setStatus('PLAYING');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col items-center justify-center p-4">
      {/* Audio Toggle */}
      {status !== 'LANDING' && (
        <button 
          onClick={toggleMute}
          className="absolute top-4 right-4 z-50 p-3 bg-slate-800 rounded-full hover:bg-slate-700 border border-slate-600 transition-colors"
        >
          {isMuted ? <VolumeX className="w-6 h-6 text-slate-400" /> : <Volume2 className="w-6 h-6 text-emerald-400" />}
        </button>
      )}

      {status === 'LANDING' && (
        <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 rounded-full"></div>
            <Beaker className="w-32 h-32 text-blue-400 relative z-10 animate-bounce" />
          </div>
          <div className="text-center space-y-4">
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-teal-300 to-emerald-400 tracking-tight">
              Puxxed Lab
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-lg mx-auto">
              Esperimenti gravitazionali e formaggio spaziale.
            </p>
          </div>
          
          <button 
            onClick={handleStartGame}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-bold text-2xl rounded-2xl shadow-xl shadow-blue-900/50 hover:shadow-2xl hover:shadow-blue-900/70 transition-all hover:scale-105 active:scale-95 flex items-center space-x-3"
          >
            <Play className="w-8 h-8 fill-current group-hover:animate-pulse" />
            <span>Avvia Puxxed Lab</span>
          </button>
        </div>
      )}

      {status === 'MENU' && (
        <div className="max-w-4xl w-full flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-4">
            <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Puxxed Lab
            </h1>
            <p className="text-xl text-slate-400">Taglia le corde, nutri Azuro, evita i calabroni!</p>
          </div>

          <div className="w-full flex justify-end">
             <button 
                onClick={() => setStatus('EDITOR')}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center space-x-2 transition-all shadow-lg hover:shadow-purple-500/30"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Creatore di Livelli</span>
             </button>
          </div>

          <div className="w-full space-y-6">
            <h2 className="text-2xl font-bold text-slate-300 border-b border-slate-700 pb-2">Livelli Ufficiali</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {officialLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => handleLevelSelect(level.id)}
                  className={`p-6 rounded-2xl flex flex-col items-center text-center transition-all hover:scale-105 active:scale-95 border-2 ${
                    level.isChallenge 
                      ? 'bg-purple-900/50 border-purple-500 hover:bg-purple-800/80' 
                      : 'bg-slate-800 border-slate-600 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    {level.isChallenge && <ShieldAlert className="w-6 h-6 text-purple-400" />}
                    <h3 className="text-xl font-bold text-white">{level.name}</h3>
                  </div>
                  <p className="text-slate-300 text-sm">
                    {level.isChallenge ? 'Fisica Inversa!' : 'Livello Normale'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {customLevels.length > 0 && (
            <div className="w-full space-y-6">
              <h2 className="text-2xl font-bold text-slate-300 border-b border-slate-700 pb-2">I Tuoi Livelli</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {customLevels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => handleLevelSelect(level.id)}
                    className="relative group p-6 rounded-2xl flex flex-col items-center text-center transition-all hover:scale-105 active:scale-95 border-2 bg-slate-800 border-blue-500/50 hover:border-blue-400"
                  >
                    <div 
                      onClick={(e) => deleteCustomLevel(e, level.id)}
                      className="absolute top-2 right-2 p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      {level.isChallenge && <ShieldAlert className="w-6 h-6 text-purple-400" />}
                      <h3 className="text-xl font-bold text-blue-100">{level.name}</h3>
                    </div>
                    <p className="text-blue-300/70 text-sm">
                      {level.ropes.length} corde • {level.hornets.length} calabroni
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {status === 'EDITOR' && (
        <LevelEditor 
          onSave={saveCustomLevel} 
          onCancel={() => setStatus('MENU')} 
        />
      )}

      {status === 'PLAYING' && (
        <div className="w-full max-w-4xl flex flex-col items-center space-y-4 animate-in fade-in duration-300">
          <div className="w-full flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
            <h2 className="text-2xl font-bold text-emerald-400">{currentLevel.name}</h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => setStatus('MENU')}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Menu className="w-5 h-5" />
                <span className="hidden md:inline">Menu</span>
              </button>
              <button 
                onClick={handleRestart}
                className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center space-x-2"
              >
                <RotateCcw className="w-5 h-5" />
                <span className="hidden md:inline">Riavvia</span>
              </button>
            </div>
          </div>
          
          <GameCanvas 
            key={`${currentLevelId}-${restartKey}`}
            level={currentLevel} 
            onWin={() => setStatus('WIN')} 
            onGameOver={() => setStatus('GAME_OVER')} 
          />
        </div>
      )}

      {status === 'WIN' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm animate-in fade-in zoom-in">
          <div className="bg-slate-800 p-8 rounded-3xl border border-emerald-500 shadow-2xl flex flex-col items-center text-center space-y-6 max-w-md w-full mx-4">
            <div className="text-6xl">🧀</div>
            <h2 className="text-4xl font-extrabold text-emerald-400">Gnam Gnam!</h2>
            <p className="text-lg text-slate-300">Azuro ha mangiato il formaggio!</p>
            
            <div className="flex flex-col w-full space-y-3">
              <button 
                onClick={handleNextLevel}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl flex justify-center items-center space-x-2 transition-all active:scale-95"
              >
                <Play className="w-6 h-6" fill="currentColor" />
                <span>Prossimo Livello</span>
              </button>
              <button 
                onClick={() => setStatus('MENU')}
                className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all active:scale-95"
              >
                Torna al Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {status === 'GAME_OVER' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm animate-in fade-in zoom-in">
          <div className="bg-slate-800 p-8 rounded-3xl border border-rose-500 shadow-2xl flex flex-col items-center text-center space-y-6 max-w-md w-full mx-4">
            <div className="text-rose-500">
              <ShieldAlert className="w-20 h-20 mx-auto" />
            </div>
            <h2 className="text-4xl font-extrabold text-rose-400">Game Over!</h2>
            <p className="text-lg text-slate-300">Il formaggio è andato perso o i calabroni l'hanno rubato!</p>
            
            <div className="flex flex-col w-full space-y-3">
              <button 
                onClick={handleRestart}
                className="w-full py-4 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl flex justify-center items-center space-x-2 transition-all active:scale-95"
              >
                <RotateCcw className="w-6 h-6" />
                <span>Riprova</span>
              </button>
              <button 
                onClick={() => setStatus('MENU')}
                className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all active:scale-95"
              >
                Torna al Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
