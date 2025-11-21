import React, { useState } from 'react';
import { Character } from '../types';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';

interface GameControlsProps {
  secretCharacter: Character | undefined;
  remainingCount: number;
  totalCount: number;
  onReset: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  secretCharacter,
  remainingCount,
  totalCount,
  onReset
}) => {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="bg-slate-800/50 border-l border-slate-700 p-6 flex flex-col h-full min-w-[300px] max-w-[300px] overflow-y-auto sticky top-0">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="bg-indigo-500 w-2 h-6 rounded-full"/>
        Game Status
      </h2>

      {/* Stats Card */}
      <div className="bg-slate-700/30 rounded-xl p-4 mb-6 border border-slate-600">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-400 text-sm">Remaining</span>
          <span className="text-2xl font-bold text-indigo-400">{remainingCount}</span>
        </div>
        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-500 h-full transition-all duration-500" 
            style={{ width: `${(remainingCount / totalCount) * 100}%` }}
          />
        </div>
        <p className="text-right text-xs text-slate-500 mt-1">{totalCount - remainingCount} Eliminated</p>
      </div>

      {/* Secret Character Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-slate-200 font-semibold">Your Secret</h3>
          <button 
            onClick={() => setRevealed(!revealed)}
            className="text-slate-400 hover:text-indigo-400 transition-colors"
          >
            {revealed ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className={`
          relative rounded-xl overflow-hidden border-2 transition-all duration-300
          ${revealed ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'border-slate-700 border-dashed bg-slate-800/50'}
        `}>
          {secretCharacter && (
            <>
              <div className={`aspect-[3/4] ${revealed ? '' : 'blur-xl opacity-20'}`}>
                <img 
                  src={secretCharacter.imageUrl} 
                  alt="Secret" 
                  className="w-full h-full object-cover"
                />
              </div>
              {!revealed && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-slate-500 font-medium">Hidden</span>
                </div>
              )}
            </>
          )}
        </div>
        
        {secretCharacter && revealed && (
           <div className="mt-3 text-center">
             <p className="font-bold text-white text-lg">{secretCharacter.name}</p>
           </div>
        )}
      </div>

      {/* Reset Button */}
      <button 
        onClick={onReset}
        className="mt-auto w-full py-3 px-4 border border-slate-600 hover:border-red-400 text-slate-400 hover:text-red-400 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
      >
        <RotateCcw size={16} />
        New Game
      </button>
    </div>
  );
};

export default GameControls;
