import React, { useState, useRef } from 'react';
import { Wand2, Video, Loader2, Upload, Save, Plus, Trash2, Volume2 } from 'lucide-react';
import { generateAvatarImage, generateAvatarVideo } from '../services/geminiService';
import { AvatarState } from '../types';

interface AvatarStudioProps {
  onAvatarReady: (avatar: AvatarState) => void;
  onSaveAvatar: (avatar: AvatarState) => void;
  onDeleteAvatar: (id: string) => void;
  currentAvatar: AvatarState;
  savedAvatars: AvatarState[];
}

const VOICES = [
  { id: 'Kore', name: 'Kore', desc: 'Sakin & Kadın (Varsayılan)' },
  { id: 'Puck', name: 'Puck', desc: 'Enerjik & Erkek' },
  { id: 'Charon', name: 'Charon', desc: 'Derin & Otoriter' },
  { id: 'Fenrir', name: 'Fenrir', desc: 'Güçlü & Hızlı' },
  { id: 'Zephyr', name: 'Zephyr', desc: 'Yumuşak & Nazik' },
];

const AvatarStudio: React.FC<AvatarStudioProps> = ({ 
  onAvatarReady, 
  onSaveAvatar,
  onDeleteAvatar,
  currentAvatar,
  savedAvatars 
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Cyberpunk temalı, neon ışıklar');
  const [tempName, setTempName] = useState(currentAvatar.name);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        onAvatarReady({ 
          ...currentAvatar, 
          originalImage: base64, 
          generatedImage: null, 
          generatedVideo: null 
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateImage = async () => {
    if (!currentAvatar.originalImage) return;
    setLoading('Avatar oluşturuluyor... (Gemini 2.5)');
    
    try {
      const result = await generateAvatarImage(currentAvatar.originalImage, prompt);
      if (result) {
        onAvatarReady({ ...currentAvatar, generatedImage: result, generatedVideo: null });
      }
    } catch (e) {
      alert("Hata oluştu.");
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateVideo = async () => {
    if (!currentAvatar.generatedImage && !currentAvatar.originalImage) return;
    setLoading('Video oluşturuluyor... (Veo 3.1) - Bu işlem 1-2 dakika sürebilir.');
    
    const sourceImage = currentAvatar.generatedImage || currentAvatar.originalImage;
    if (!sourceImage) return;

    try {
      const videoUrl = await generateAvatarVideo(sourceImage);
      if (videoUrl) {
        onAvatarReady({ ...currentAvatar, generatedVideo: videoUrl });
      }
    } catch (e) {
      alert("Video oluşturulamadı.");
    } finally {
      setLoading(null);
    }
  };

  const handleSave = () => {
    const newAvatar = { 
      ...currentAvatar, 
      id: Date.now().toString(),
      name: tempName || `Avatar ${savedAvatars.length + 1}`
    };
    onSaveAvatar(newAvatar);
    alert("Avatar kaydedildi!");
  };

  const handleVoiceChange = (voiceId: string) => {
    onAvatarReady({ ...currentAvatar, voice: voiceId });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8 pb-20">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold brand-font text-purple-600">Avatar Stüdyosu</h2>
        <p className="text-slate-600">Kendi karakterini yarat, sesini seç ve canlandır!</p>
      </div>

      {/* Editor Section */}
      <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Left: Image/Video Preview */}
          <div className="w-full md:w-1/2 flex flex-col items-center">
             <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-square border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden bg-slate-50 relative"
            >
              {currentAvatar.generatedVideo ? (
                 <video src={currentAvatar.generatedVideo} autoPlay loop muted className="w-full h-full object-cover" />
              ) : currentAvatar.generatedImage ? (
                 <img src={`data:image/jpeg;base64,${currentAvatar.generatedImage}`} className="w-full h-full object-cover" alt="Gen" />
              ) : currentAvatar.originalImage ? (
                 <img src={`data:image/jpeg;base64,${currentAvatar.originalImage}`} className="w-full h-full object-cover" alt="Org" />
              ) : (
                <>
                  <Upload className="w-10 h-10 text-slate-400 mb-2" />
                  <span className="text-slate-500 font-medium">Fotoğraf Yükle</span>
                </>
              )}
              
              {loading && (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center text-purple-600 font-bold z-10 p-4 text-center">
                   <Loader2 className="animate-spin w-8 h-8 mb-2" />
                   {loading}
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>

          {/* Right: Controls */}
          <div className="w-full md:w-1/2 space-y-4">
             <div>
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avatar İsmi</label>
               <input 
                 type="text" 
                 value={tempName}
                 onChange={(e) => setTempName(e.target.value)}
                 className="w-full p-2 border-b-2 border-slate-200 focus:border-purple-500 outline-none font-bold text-lg bg-transparent"
                 placeholder="Örn: Cyber Ahmet"
               />
             </div>

             <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Ses Karakteri</label>
                <div className="grid grid-cols-1 gap-2">
                   {VOICES.map(v => (
                     <button
                       key={v.id}
                       onClick={() => handleVoiceChange(v.id)}
                       className={`flex items-center gap-2 p-2 rounded-lg border text-sm text-left transition-all
                         ${currentAvatar.voice === v.id ? 'border-purple-500 bg-purple-50 text-purple-700 font-semibold shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}
                     >
                        <Volume2 size={16} className={currentAvatar.voice === v.id ? 'fill-current' : 'text-slate-400'} />
                        <div>
                          <div className="font-medium">{v.name}</div>
                          <div className="text-xs opacity-75">{v.desc}</div>
                        </div>
                     </button>
                   ))}
                </div>
             </div>

             <div>
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dönüşüm Stili</label>
               <textarea
                 value={prompt}
                 onChange={(e) => setPrompt(e.target.value)}
                 className="w-full p-2 mt-1 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                 rows={2}
               />
             </div>

             <div className="grid grid-cols-2 gap-2">
               <button 
                onClick={handleGenerateImage} 
                disabled={!currentAvatar.originalImage || !!loading}
                className="flex items-center justify-center gap-2 p-2 bg-purple-100 text-purple-700 rounded-xl font-bold text-sm hover:bg-purple-200 disabled:opacity-50"
               >
                 <Wand2 size={16} /> Fotoğrafı Dönüştür
               </button>
               <button 
                onClick={handleGenerateVideo}
                disabled={!currentAvatar.generatedImage && !currentAvatar.originalImage || !!loading}
                className="flex items-center justify-center gap-2 p-2 bg-pink-100 text-pink-700 rounded-xl font-bold text-sm hover:bg-pink-200 disabled:opacity-50"
               >
                 <Video size={16} /> Canlandır (Veo)
               </button>
             </div>

             <button 
               onClick={handleSave}
               className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 shadow-md"
             >
               <Save size={18} /> Avatarı Koleksiyona Kaydet
             </button>
          </div>
        </div>
      </div>

      {/* Saved Avatars Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <UserIcon className="text-purple-600" /> Koleksiyonum
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => {
              fileInputRef.current?.click();
              setTempName("");
              onAvatarReady({ id: 'new', name: '', originalImage: null, generatedImage: null, generatedVideo: null, prompt: '', voice: 'Kore' });
            }}
            className="aspect-square border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:bg-white hover:border-purple-400 hover:text-purple-600 transition-all"
          >
             <Plus size={32} />
             <span className="font-bold text-sm">Yeni Oluştur</span>
          </button>

          {savedAvatars.map((av) => (
            <div 
              key={av.id} 
              className={`relative group rounded-2xl overflow-hidden border-2 transition-all cursor-pointer bg-white
                ${currentAvatar.id === av.id ? 'border-purple-600 ring-2 ring-purple-100 shadow-lg scale-105' : 'border-transparent shadow-sm hover:shadow-md'}`}
              onClick={() => {
                onAvatarReady(av);
                setTempName(av.name);
              }}
            >
              <img 
                src={`data:image/jpeg;base64,${av.generatedImage || av.originalImage}`} 
                className="w-full aspect-square object-cover" 
                alt={av.name} 
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                 <p className="text-white font-bold text-sm truncate">{av.name}</p>
                 <p className="text-white/70 text-xs flex items-center gap-1">
                   <Volume2 size={10} /> {av.voice}
                 </p>
              </div>
              {/* Delete Button (visible on hover) */}
              {savedAvatars.length > 1 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm("Silmek istediğine emin misin?")) onDeleteAvatar(av.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper icon
const UserIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`w-6 h-6 ${className}`}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default AvatarStudio;