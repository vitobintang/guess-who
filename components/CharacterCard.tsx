import React from 'react';
import { Character } from '../types';
import { CheckCircle, XCircle } from 'lucide-react';

interface CharacterCardProps {
  character: Character;
  onClick: (id: string) => void;
  selectable?: boolean;
  isSelected?: boolean;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ 
  character, 
  onClick, 
  selectable = false, 
  isSelected = false 
}) => {
  return (
    <div 
      onClick={() => onClick(character.id)}
      className={`
        relative group cursor-pointer transition-all duration-300 ease-out transform
        ${selectable ? 'hover:scale-105' : ''}
        ${isSelected ? 'ring-4 ring-indigo-500 scale-105 z-10' : ''}
        ${character.isEliminated ? 'opacity-50 grayscale' : 'opacity-100 hover:-translate-y-1'}
      `}
    >
      <div className={`
        relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg bg-slate-800 border-2
        ${character.isEliminated ? 'border-slate-700' : 'border-indigo-500/30'}
        ${isSelected ? 'border-indigo-500' : ''}
      `}>
        <img 
          src={character.imageUrl} 
          alt={character.name}
          className="w-full h-full object-cover"
        />
        
        {/* Overlay gradient for text */}
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
        
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-white text-sm font-bold truncate text-center drop-shadow-md">
            {character.name}
          </p>
        </div>

        {/* Eliminated Overlay */}
        {character.isEliminated && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
            <XCircle className="w-16 h-16 text-red-500 opacity-80 drop-shadow-lg" />
          </div>
        )}

        {/* Selection Checkmark */}
        {isSelected && (
           <div className="absolute top-2 right-2 bg-white rounded-full p-1">
             <CheckCircle className="w-5 h-5 text-indigo-600" />
           </div>
        )}
      </div>
    </div>
  );
};

export default CharacterCard;