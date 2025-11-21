import React, { useState, useEffect } from 'react';
import { Character, GamePhase, GameState } from './types';
import SetupPhase from './components/SetupPhase';
import CharacterCard from './components/CharacterCard';
import GameControls from './components/GameControls';

const App: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [gameState, setGameState] = useState<GamePhase>(GamePhase.SETUP);
  const [secretId, setSecretId] = useState<string | null>(null);

  // Sync characters state changes (like elimination) without mutating original setup too much if we wanted to reset
  // But for simplicity, we modify the `characters` array directly in state.

  const handleCharacterClick = (id: string) => {
    if (gameState === GamePhase.SELECT_SECRET) {
      setSecretId(id);
    } else if (gameState === GamePhase.PLAYING) {
      setCharacters(prev => prev.map(c => 
        c.id === id ? { ...c, isEliminated: !c.isEliminated } : c
      ));
    }
  };

  const confirmSecret = () => {
    if (secretId) {
      setGameState(GamePhase.PLAYING);
    }
  };

  const resetGame = () => {
    if (confirm("Are you sure you want to reset the game?")) {
      setGameState(GamePhase.SETUP);
      setCharacters([]);
      setSecretId(null);
    }
  };

  const softReset = () => {
     // Keeps the board, resets elimination
     setCharacters(prev => prev.map(c => ({...c, isEliminated: false})));
     setGameState(GamePhase.SELECT_SECRET);
     setSecretId(null);
  };

  // ---------------------
  // RENDER: SETUP
  // ---------------------
  if (gameState === GamePhase.SETUP) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
        <SetupPhase 
          characters={characters} 
          setCharacters={setCharacters} 
          onComplete={() => setGameState(GamePhase.SELECT_SECRET)} 
        />
      </div>
    );
  }

  // ---------------------
  // RENDER: SELECTION & PLAYING (Grid View)
  // ---------------------
  
  const isSelectionPhase = gameState === GamePhase.SELECT_SECRET;
  const remainingCount = characters.filter(c => !c.isEliminated).length;
  const secretChar = characters.find(c => c.id === secretId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-200">
      
      {/* Main Game Area */}
      <main className="flex-1 h-full overflow-y-auto p-4 md:p-8 relative">
        
        {/* Header for Selection Phase */}
        {isSelectionPhase && (
           <div className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800 p-4 mb-6 flex justify-between items-center rounded-xl shadow-xl">
             <div>
                <h2 className="text-2xl font-bold text-white">Pick Your Character</h2>
                <p className="text-slate-400 text-sm">Your opponent will try to guess this person.</p>
             </div>
             <button 
               disabled={!secretId}
               onClick={confirmSecret}
               className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-6 rounded-lg font-bold transition-all shadow-lg shadow-indigo-500/20"
             >
               Confirm Selection
             </button>
           </div>
        )}

        {/* The Grid */}
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-20">
            {characters.map((char) => (
                <CharacterCard
                    key={char.id}
                    character={char}
                    onClick={handleCharacterClick}
                    selectable={isSelectionPhase}
                    isSelected={isSelectionPhase && secretId === char.id}
                />
            ))}
            </div>
        </div>
      </main>

      {/* Sidebar Controls (Only visible during playing phase) */}
      {!isSelectionPhase && (
        <GameControls 
          secretCharacter={secretChar}
          remainingCount={remainingCount}
          totalCount={characters.length}
          onReset={softReset}
        />
      )}

    </div>
  );
};

export default App;