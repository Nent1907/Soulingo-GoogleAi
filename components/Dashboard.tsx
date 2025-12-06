import React from 'react';
import { CEFRLevel } from '../types';
import { Play, TrendingUp, Star } from 'lucide-react';

interface DashboardProps {
  onSelectLevel: (level: CEFRLevel) => void;
  levels: CEFRLevel[];
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectLevel, levels }) => {
  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      <header className="flex justify-between items-center py-4">
        <div>
          <h1 className="text-3xl font-bold brand-font text-slate-900">Merhaba! 👋</h1>
          <p className="text-slate-500">Bugün pratik yapmaya hazır mısın?</p>
        </div>
        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
           <div className="flex items-center gap-2 px-2">
             <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600">
               <TrendingUp size={20} />
             </div>
             <div>
               <p className="text-xs text-slate-400 font-semibold uppercase">Seri</p>
               <p className="text-sm font-bold">3 Gün</p>
             </div>
           </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2 brand-font">Haftalık Rapor</h2>
          <div className="flex gap-8 mt-4">
             <div>
               <p className="text-purple-200 text-sm">Pratikler</p>
               <p className="text-3xl font-bold">12</p>
             </div>
             <div>
               <p className="text-purple-200 text-sm">Ort. Puan</p>
               <p className="text-3xl font-bold">84</p>
             </div>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-4 translate-y-4">
           <Star size={120} />
        </div>
      </div>

      {/* Levels Grid */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-4">Seviyeni Seç</h3>
        <div className="grid grid-cols-2 gap-4">
          {levels.map((level, idx) => (
            <button
              key={level}
              onClick={() => onSelectLevel(level)}
              className="group bg-white p-4 rounded-2xl border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-4xl font-black">{level}</span>
              </div>
              <div className="relative z-10">
                 <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold mb-2 
                   ${idx === 0 ? 'bg-green-100 text-green-700' : 
                     idx === 1 ? 'bg-blue-100 text-blue-700' : 
                     idx === 2 ? 'bg-yellow-100 text-yellow-700' :
                     'bg-purple-100 text-purple-700'
                   }`}>
                   {idx < 2 ? 'Başlangıç' : idx < 4 ? 'Orta' : 'İleri'}
                 </span>
                 <h4 className="text-lg font-bold text-slate-900">{level} Seviyesi</h4>
                 <div className="flex items-center gap-2 mt-3 text-sm text-slate-500 group-hover:text-purple-600">
                    <Play size={16} className="fill-current" />
                    <span>Başla</span>
                 </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;