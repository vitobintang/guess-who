import React, { useRef, useState, useEffect } from 'react';
import { Character } from '../types';
import { UploadCloud, UserPlus, Trash2, Play, Save, FolderOpen, Loader2, X } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface SetupPhaseProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  onComplete: () => void;
}

interface Preset {
  id: string;
  name: string;
  created_at: string;
}

const SetupPhase: React.FC<SetupPhaseProps> = ({ characters, setCharacters, onComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // File Upload & Naming State
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [currentNameInput, setCurrentNameInput] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Preset State
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);

  useEffect(() => {
    if (pendingFiles.length > 0 && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [pendingFiles]);

  // Handle Global Paste Events
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.items) {
        const items = Array.from(e.clipboardData.items);
        const files: File[] = [];
        
        for (const item of items) {
          if (item.type.startsWith('image')) {
            const file = item.getAsFile();
            if (file) files.push(file);
          }
        }

        if (files.length > 0) {
          e.preventDefault();
          
          // If we are starting a new batch (no pending files currently), clear the name input
          if (pendingFiles.length === 0) {
            setCurrentNameInput('');
          }
          
          setPendingFiles(prev => [...prev, ...files]);
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [pendingFiles]); // Depend on pendingFiles to correctly check length

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPendingFiles(Array.from(e.target.files));
      setCurrentNameInput(''); 
    }
  };

  const handleNameSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentNameInput.trim() || pendingFiles.length === 0) return;

    const file = pendingFiles[0];
    const newChar: Character = {
      id: `char-${Date.now()}-${Math.random()}`,
      name: currentNameInput.trim(),
      imageUrl: URL.createObjectURL(file),
      isEliminated: false,
    };

    setCharacters(prev => [...prev, newChar].slice(0, 24));
    
    // Move to next file
    setPendingFiles(prev => prev.slice(1));
    setCurrentNameInput('');
  };

  const fillWithPlaceholders = () => {
    const needed = 24 - characters.length;
    if (needed <= 0) return;

    const newChars: Character[] = Array.from({ length: needed }).map((_, i) => ({
      id: `default-${Date.now()}-${i}`,
      name: `Person ${characters.length + i + 1}`,
      imageUrl: `https://picsum.photos/seed/${Date.now() + i}/300/400`,
      isEliminated: false,
    }));
    setCharacters((prev) => [...prev, ...newChars]);
  };
  
  const removeCharacter = (id: string) => {
    setCharacters(prev => prev.filter(c => c.id !== id));
  };

  // --- SUPABASE INTEGRATION ---

  const fetchPresets = async () => {
    setIsLoadingPresets(true);
    const { data, error } = await supabase
      .from('presets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching presets:', error);
    else setPresets(data || []);
    setIsLoadingPresets(false);
  };

  const loadPreset = async (presetId: string) => {
    setIsLoadingPresets(true);
    const { data, error } = await supabase
      .from('saved_characters')
      .select('*')
      .eq('preset_id', presetId);

    if (error) {
      console.error("Error loading characters:", error);
    } else if (data) {
      const loadedChars: Character[] = data.map(d => ({
        id: d.id,
        name: d.name,
        imageUrl: d.image_url,
        isEliminated: false
      }));
      setCharacters(loadedChars);
      setShowLoadModal(false);
    }
    setIsLoadingPresets(false);
  };

  const saveCurrentBoard = async () => {
    if (!presetName.trim() || characters.length === 0) return;
    setIsSaving(true);

    try {
      // 1. Create Preset Record
      const { data: presetData, error: presetError } = await supabase
        .from('presets')
        .insert([{ name: presetName }])
        .select()
        .single();

      if (presetError || !presetData) throw new Error('Failed to create preset');

      // 2. Process and Upload Images
      const charPromises = characters.map(async (char) => {
        let finalUrl = char.imageUrl;

        // If it's a local blob, upload it
        if (char.imageUrl.startsWith('blob:')) {
          try {
            const response = await fetch(char.imageUrl);
            const blob = await response.blob();
            const fileName = `${presetData.id}/${char.id}.${blob.type.split('/')[1]}`;
            
            const { error: uploadError } = await supabase.storage
              .from('board-images')
              .upload(fileName, blob);

            if (!uploadError) {
              const { data: publicData } = supabase.storage
                .from('board-images')
                .getPublicUrl(fileName);
              finalUrl = publicData.publicUrl;
            }
          } catch (e) {
            console.error("Failed to upload image for char", char.name, e);
          }
        }

        return {
          preset_id: presetData.id,
          name: char.name,
          image_url: finalUrl
        };
      });

      const charsToSave = await Promise.all(charPromises);

      // 3. Save Character Records
      const { error: charsError } = await supabase
        .from('saved_characters')
        .insert(charsToSave);

      if (charsError) throw charsError;

      setShowSaveModal(false);
      setPresetName('');
      alert('Board saved successfully!');

    } catch (error) {
      console.error('Error saving board:', error);
      alert('Failed to save board.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- RENDER HELPERS ---

  const renderNameModal = () => {
    if (pendingFiles.length === 0) return null;
    const currentFile = pendingFiles[0];
    const previewUrl = URL.createObjectURL(currentFile);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-4">Who is this?</h3>
          <div className="flex flex-col gap-4 items-center">
            <div className="w-48 h-64 rounded-lg overflow-hidden border-2 border-slate-700 bg-slate-800">
               <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
            </div>
            <div className="w-full">
                <p className="text-xs text-slate-400 mb-1">Processing {pendingFiles.length} files...</p>
                <form onSubmit={handleNameSubmit} className="flex gap-2">
                    <input
                        ref={nameInputRef}
                        type="text"
                        value={currentNameInput}
                        onChange={(e) => setCurrentNameInput(e.target.value)}
                        placeholder="Enter Name..."
                        className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button 
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium"
                    >
                        Next
                    </button>
                </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {renderNameModal()}

      {/* SAVE MODAL */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
             <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 w-full max-w-sm">
                 <h3 className="text-lg font-bold text-white mb-4">Save Board Preset</h3>
                 <input 
                    type="text" 
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Board Name (e.g., My Friends)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white mb-4"
                 />
                 <div className="flex justify-end gap-2">
                     <button onClick={() => setShowSaveModal(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                     <button 
                        onClick={saveCurrentBoard}
                        disabled={isSaving || !presetName}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                     >
                        {isSaving && <Loader2 className="animate-spin" size={16} />}
                        Save
                     </button>
                 </div>
             </div>
        </div>
      )}

      {/* LOAD MODAL */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
             <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 w-full max-w-2xl h-[80vh] flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Load Saved Board</h3>
                    <button onClick={() => setShowLoadModal(false)}><X className="text-slate-400" /></button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {isLoadingPresets ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-400" /></div>
                    ) : presets.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No saved boards found.</p>
                    ) : (
                        presets.map(preset => (
                            <div key={preset.id} className="flex items-center justify-between bg-slate-700/50 p-4 rounded-lg hover:bg-slate-700 transition-colors">
                                <div>
                                    <p className="font-bold text-white">{preset.name}</p>
                                    <p className="text-xs text-slate-400">{new Date(preset.created_at).toLocaleDateString()}</p>
                                </div>
                                <button 
                                    onClick={() => loadPreset(preset.id)}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-sm"
                                >
                                    Load
                                </button>
                            </div>
                        ))
                    )}
                 </div>
             </div>
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-4">
          Setup Your Board
        </h1>
        <p className="text-slate-400">Upload 24 photos to create your custom game.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Actions Panel */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Upload Box */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-600 hover:border-indigo-500 hover:bg-slate-800/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group"
          >
            <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-indigo-400 mb-3" />
            <span className="text-slate-300 font-medium">Upload Photos</span>
            <span className="text-slate-500 text-sm mt-1">Supported: JPG, PNG or Paste (Ctrl+V)</span>
            <input 
              type="file" 
              multiple 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload}
              accept="image/*"
            />
          </div>

          {/* Presets */}
          <div className="grid grid-cols-2 gap-3">
             <button 
                onClick={() => { fetchPresets(); setShowLoadModal(true); }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-700"
             >
                <FolderOpen size={18} />
                Load Board
             </button>
             <button 
                disabled={characters.length === 0}
                onClick={() => setShowSaveModal(true)}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-700"
             >
                <Save size={18} />
                Save Board
             </button>
          </div>

          {/* Defaults Button */}
          <button 
            onClick={fillWithPlaceholders}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-colors border border-slate-700"
          >
            <UserPlus size={20} />
            Fill with Random Photos
          </button>

        </div>

        {/* Grid Preview */}
        <div className="lg:col-span-2 bg-slate-900/50 rounded-xl border border-slate-800 p-6 min-h-[400px]">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-slate-300 font-medium">Board Preview ({characters.length}/24)</h3>
             {characters.length > 0 && (
                 <button onClick={() => setCharacters([])} className="text-red-400 text-xs hover:underline">Clear All</button>
             )}
          </div>
          
          {characters.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <div className="w-16 h-16 border-4 border-slate-700 rounded-full flex items-center justify-center mb-4">0</div>
                <p>No characters added yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {characters.map((char) => (
                <div key={char.id} className="relative group aspect-[3/4]">
                   <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover rounded-lg border border-slate-700" />
                   <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1 truncate text-[10px] text-center text-white">
                       {char.name}
                   </div>
                   <button 
                     onClick={() => removeCharacter(char.id)}
                     className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <Trash2 size={12} />
                   </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <button 
          disabled={characters.length === 0}
          onClick={onComplete}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold py-4 px-12 rounded-full shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 flex items-center gap-3"
        >
          Start Game Setup <Play fill="currentColor" size={20} />
        </button>
      </div>
    </div>
  );
};

export default SetupPhase;