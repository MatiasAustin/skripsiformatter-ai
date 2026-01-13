
import React from 'react';

interface HeaderProps {
  currentView: 'dashboard' | 'guide';
  setView: (view: 'dashboard' | 'guide') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setView }) => (
  <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl">
    <div className="glass rounded-full px-8 py-3 flex justify-between items-center">
      <div 
        className="flex items-center space-x-2 cursor-pointer group" 
        onClick={() => setView('dashboard')}
      >
        <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white transition-transform group-hover:rotate-12">
          <i className="fas fa-feather-pointed text-xs"></i>
        </div>
        <span className="font-extrabold text-slate-900 tracking-tighter text-lg">Skripsi.style</span>
      </div>
      
      <nav className="flex space-x-8">
        <button 
          onClick={() => setView('dashboard')}
          className={`text-sm font-semibold transition-all ${currentView === 'dashboard' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Dashboard
        </button>
        <button 
          onClick={() => setView('guide')}
          className={`text-sm font-semibold transition-all ${currentView === 'guide' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Panduan
        </button>
      </nav>
      
      <div className="hidden md:block">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Minimalism v2.5</span>
      </div>
    </div>
  </header>
);

export const Footer: React.FC = () => (
  <footer className="py-12 px-4 text-center">
    <p className="text-slate-400 text-[11px] font-medium tracking-widest uppercase">
      Crafted for Academic Excellence &bull; Created for Puttt
    </p>
  </footer>
);
