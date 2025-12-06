import React, { useState } from 'react';
import { Home, Mic, User, ArrowRight } from 'lucide-react';
import { AppView, CEFRLevel, Lesson, AvatarState } from './types';
import { LEVELS, LESSON_DATA } from './constants';
import Dashboard from './components/Dashboard';
import PracticeView from './components/PracticeView';
import AvatarStudio from './components/AvatarStudio';

const DEFAULT_AVATAR: AvatarState = {
  id: 'aria-default',
  name: 'Aria',
  originalImage: null,
  generatedImage: null,
  generatedVideo: null,
  prompt: '',
  voice: 'Kore'
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [currentLevel, setCurrentLevel] = useState<CEFRLevel | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  
  // Avatar State
  const [currentAvatar, setCurrentAvatar] = useState<AvatarState>(DEFAULT_AVATAR);
  const [savedAvatars, setSavedAvatars] = useState<AvatarState[]>([DEFAULT_AVATAR]);

  const handleLevelSelect = (level: CEFRLevel) => {
    setCurrentLevel(level);
    setCurrentLessonIndex(0);
    setCurrentView(AppView.PRACTICE);
  };

  const handleNextLesson = () => {
    if (!currentLevel) return;
    const lessons = LESSON_DATA[currentLevel];
    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(prev => prev + 1);
    } else {
      alert("Seviye Tamamlandı! 🎉");
      setCurrentView(AppView.DASHBOARD);
    }
  };

  const handlePreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(prev => prev - 1);
    }
  };

  const getCurrentLesson = (): Lesson | null => {
    if (!currentLevel) return null;
    return LESSON_DATA[currentLevel][currentLessonIndex];
  };

  // Avatar Handlers
  const handleSaveAvatar = (newAvatar: AvatarState) => {
    // Check if updating existing or creating new
    const existingIndex = savedAvatars.findIndex(a => a.id === newAvatar.id);
    let updatedList;
    
    if (existingIndex >= 0) {
      updatedList = [...savedAvatars];
      updatedList[existingIndex] = newAvatar;
    } else {
      updatedList = [...savedAvatars, newAvatar];
    }
    
    setSavedAvatars(updatedList);
    setCurrentAvatar(newAvatar);
  };

  const handleDeleteAvatar = (id: string) => {
    const updated = savedAvatars.filter(a => a.id !== id);
    setSavedAvatars(updated);
    if (currentAvatar.id === id) {
      setCurrentAvatar(updated[0] || DEFAULT_AVATAR);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24">
        {currentView === AppView.DASHBOARD && (
          <Dashboard levels={LEVELS} onSelectLevel={handleLevelSelect} />
        )}
        
        {currentView === AppView.PRACTICE && (
          !currentLevel ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6 pt-20">
                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 shadow-sm animate-bounce-slow">
                    <Mic size={40} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 brand-font mb-2">Pratik Yapmaya Başla</h2>
                  <p className="text-slate-500 max-w-xs mx-auto">Başlamak için lütfen ana sayfadan seviyeni seç.</p>
                </div>
                <button 
                    onClick={() => setCurrentView(AppView.DASHBOARD)}
                    className="px-8 py-4 bg-purple-600 text-white rounded-2xl font-bold shadow-lg hover:bg-purple-700 transition-all transform hover:scale-105 flex items-center gap-2"
                >
                    Seviye Seç <ArrowRight size={20} />
                </button>
            </div>
          ) : (
            getCurrentLesson() && (
              <PracticeView 
                lesson={getCurrentLesson()!} 
                onNext={handleNextLesson}
                onPrevious={handlePreviousLesson}
                hasPrevious={currentLessonIndex > 0}
                avatar={currentAvatar}
              />
            )
          )
        )}

        {currentView === AppView.AVATAR_STUDIO && (
          <AvatarStudio 
            currentAvatar={currentAvatar} 
            savedAvatars={savedAvatars}
            onAvatarReady={setCurrentAvatar} 
            onSaveAvatar={handleSaveAvatar}
            onDeleteAvatar={handleDeleteAvatar}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center z-50 safe-area-bottom">
        <button 
          onClick={() => setCurrentView(AppView.DASHBOARD)}
          className={`flex flex-col items-center gap-1 transition-colors ${currentView === AppView.DASHBOARD ? 'text-purple-600' : 'text-slate-400'}`}
        >
          <Home size={24} />
          <span className="text-xs font-medium">Ana Sayfa</span>
        </button>

        <button 
          onClick={() => setCurrentView(AppView.PRACTICE)}
          className={`relative -top-8 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-transform hover:scale-105
            ${currentView === AppView.PRACTICE ? 'ring-4 ring-purple-100' : ''}`}
        >
          <Mic size={28} />
        </button>

        <button 
          onClick={() => setCurrentView(AppView.AVATAR_STUDIO)}
          className={`flex flex-col items-center gap-1 transition-colors ${currentView === AppView.AVATAR_STUDIO ? 'text-purple-600' : 'text-slate-400'}`}
        >
          <User size={24} />
          <span className="text-xs font-medium">Avatar</span>
        </button>
      </nav>
    </div>
  );
};

export default App;