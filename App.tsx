
import React, { useState, useRef, useEffect } from 'react';
import { Header, Footer } from './components/Layout';
import { analyzeThesisText } from './geminiService';
import { ThesisAnalysis, AnalysisMode } from './types';
import DiffViewer from './components/DiffViewer';

declare const mammoth: any;

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'guide'>('dashboard');
  const [inputText, setInputText] = useState<string>('');
  const [analysis, setAnalysis] = useState<ThesisAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<AnalysisMode>(AnalysisMode.GENERAL);
  const [error, setError] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState<boolean>(false);
  const [history, setHistory] = useState<ThesisAnalysis[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedUtils = localStorage.getItem('thesis_history');
    if (savedUtils) {
      try {
        setHistory(JSON.parse(savedUtils));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveToHistory = (newAnalysis: ThesisAnalysis) => {
    const updated = [newAnalysis, ...history].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('thesis_history', JSON.stringify(updated));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.docx')) {
      setError("Hanya mendukung file format .docx saat ini.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      try {
        setIsLoading(true);
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        setInputText(result.value);
        setError(null);
      } catch (err) {
        setError("Gagal membaca file .docx.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFormat = async () => {
    if (!inputText.trim()) {
      setError("Masukkan teks terlebih dahulu.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeThesisText(inputText, mode);
      setAnalysis(result);
      saveToHistory(result);
    } catch (err: any) {
      setError(err.message || "Gagal memproses.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item: ThesisAnalysis) => {
    setAnalysis(item);
    // Optionally restore input text if we stored it, but analysis doesn't currently track original text input separately unless we add it to ThesisAnalysis type.
    // For now, we assume the user just wants to see the result.
  };

  const renderDashboard = () => (
    <div className="pt-24 space-y-10 animate-in fade-in duration-700">
      {/* Hero Section */}
      {!analysis && (
        <div className="flex flex-col items-center text-center space-y-4 py-12">
          <div className="flex items-baseline space-x-2">
            <h2 className="text-7xl font-light text-slate-400">Jan</h2>
            <h2 className="text-7xl font-bold text-slate-900 tracking-tighter">2025</h2>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Minimalism style Typography</p>
          <div className="mt-8 relative">
            <div className="w-32 h-32 bg-pink-300 rounded-full blur-3xl opacity-30 absolute -top-4 -left-4"></div>
            <div className="w-32 h-32 bg-orange-200 rounded-full blur-3xl opacity-30 absolute -bottom-4 -right-4"></div>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed italic">
              "Tingkatkan kualitas skripsi Anda dengan sentuhan estetik dan presisi akademik."
              <br />
              <span className="text-[10px] text-rose-400 not-italic font-bold tracking-widest block mt-4">
                dibuat untuk Puttt <i className="fas fa-heart ml-1"></i>
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Input Panel */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="glass rounded-[2.5rem] p-8 min-h-[450px] flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Input</h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border border-slate-200 rounded-full px-3 py-1 hover:bg-white transition"
              >
                Upload .docx
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".docx" onChange={handleFileUpload} />
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tempel naskah Anda di sini..."
              className="flex-grow bg-transparent outline-none resize-none academic-font text-lg leading-relaxed text-slate-700 placeholder:text-slate-300"
            />

            <div className="mt-6 flex items-center justify-between border-t border-slate-100/50 pt-4">
              <div className="flex space-x-2">
                {Object.values(AnalysisMode).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`text-[9px] font-bold uppercase tracking-tighter px-2 py-1 rounded-md transition ${mode === m ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <button
                onClick={handleFormat}
                disabled={isLoading}
                className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition active:scale-90"
              >
                {isLoading ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className="fas fa-arrow-right text-xs"></i>}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-6 py-3 glass rounded-2xl text-[11px] font-bold text-rose-500 uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          {/* History Section */}
          {history.length > 0 && (
            <div className="glass rounded-[2rem] p-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent History</h4>
              <div className="space-y-2">
                {history.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => loadFromHistory(item)}
                    className="p-3 glass-dark rounded-xl cursor-pointer hover:bg-white/50 transition flex justify-between items-center group"
                  >
                    <span className="text-xs font-medium text-slate-700 truncate max-w-[200px]">{item.formattedText.substring(0, 30)}...</span>
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-500">{item.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          {analysis ? (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              {/* Score Summary */}
              <div className="glass-dark rounded-[2.5rem] p-8 flex justify-between items-end">
                <div>
                  <h4 className="text-4xl font-light opacity-50">Score</h4>
                  <p className="text-7xl font-bold tracking-tighter">{analysis.score}</p>
                </div>
                <div className="text-right space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Academic Index</p>
                  <div className="flex items-center space-x-2 justify-end">
                    <span className="text-[10px] uppercase font-bold text-slate-400 mr-2">View Mode:</span>
                    <button
                      onClick={() => setShowDiff(false)}
                      className={`text-[10px] font-bold rounded-full px-4 py-1 transition ${!showDiff ? 'bg-slate-900 text-white' : 'glass border'}`}
                    >
                      Clean
                    </button>
                    <button
                      onClick={() => setShowDiff(true)}
                      className={`text-[10px] font-bold rounded-full px-4 py-1 transition ${showDiff ? 'bg-slate-900 text-white' : 'glass border'}`}
                    >
                      Compare
                    </button>
                  </div>
                </div>
              </div>

              {/* Formatted Text / Diff Viewer */}
              <div className="glass rounded-[2.5rem] p-10 relative overflow-hidden group">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    {showDiff ? 'Changes Preview' : 'Refined Text'}
                  </h3>
                  {!showDiff && (
                    <button
                      onClick={() => navigator.clipboard.writeText(analysis.formattedText)}
                      className="w-12 h-12 glass border-slate-200 rounded-full flex items-center justify-center text-slate-900 hover:scale-110 transition shadow-sm"
                    >
                      <i className="far fa-copy"></i>
                    </button>
                  )}
                </div>

                {showDiff ? (
                  <DiffViewer original={inputText} modified={analysis.formattedText} />
                ) : (
                  <div className="academic-font text-lg leading-[1.8] text-slate-700 max-h-[500px] overflow-y-auto pr-4 whitespace-pre-wrap">
                    {analysis.formattedText}
                  </div>
                )}

                {/* Decorative Pink Sphere */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-300 rounded-full opacity-30 blur-2xl pointer-events-none transition-transform group-hover:scale-150"></div>
              </div>

              {/* Suggestions Chips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.suggestions.slice(0, 4).map((s, i) => (
                  <div key={i} className="glass rounded-3xl p-5 border-l-4 border-slate-900">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">{s.category}</p>
                    <p className="text-sm font-bold text-slate-800 line-clamp-1 italic">"{s.suggestion}"</p>
                    <p className="text-[10px] text-slate-500 mt-1">{s.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[550px] space-y-6">
              <div className="w-64 h-64 glass rounded-[3rem] border-dashed border-2 border-slate-200 flex items-center justify-center text-slate-200 relative overflow-hidden group">
                <i className="fas fa-sparkles text-6xl group-hover:scale-125 transition duration-700"></i>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-100/20 to-transparent"></div>
              </div>
              <div className="text-center">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em]">Waiting for Input</p>
                <p className="text-xs text-slate-300 mt-2">Naskah Anda akan tampil elegan di sini.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderGuide = () => (
    <div className="pt-24 max-w-4xl mx-auto space-y-12 pb-20 animate-in slide-in-from-bottom duration-700">
      <div className="text-center space-y-2">
        <h2 className="text-6xl font-extrabold text-slate-900 tracking-tighter">Guidelines</h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.5em]">Standardization protocol</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { icon: 'fa-expand', title: 'Layout', desc: 'Margin 4-4-3-3, Kertas A4 80gr, Spasi 2.0.' },
          { icon: 'fa-italic', title: 'Typography', desc: 'Times New Roman 12pt, Judul Bab Bold 14pt.' },
          { icon: 'fa-book-open', title: 'Chapters', desc: 'Struktur I-V dari Pendahuluan hingga Penutup.' },
          { icon: 'fa-quote-right', title: 'Citations', desc: 'APA 7th Edition, In-text (Nama, Tahun).' }
        ].map((item, idx) => (
          <div key={idx} className="glass rounded-[2rem] p-8 flex items-start space-x-6 hover:translate-y-[-5px] transition-transform duration-300">
            <div className="w-14 h-14 glass-dark rounded-2xl flex items-center justify-center flex-shrink-0">
              <i className={`fas ${item.icon} text-lg`}></i>
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h4>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-[3rem] p-12 relative overflow-hidden group">
        <div className="relative z-10 space-y-6">
          <h3 className="text-3xl font-bold text-slate-900 tracking-tight">PUEBI & Tata Bahasa</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Principles</span>
              <p className="text-sm text-slate-600 leading-relaxed italic">
                "Gunakan kalimat pasif, pertahankan objektivitas, dan hindari kata ganti orang pertama (Saya/Kami) untuk menjaga wibawa akademik."
              </p>
            </div>
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase text-rose-400 tracking-widest">Formatting Notes</span>
              <p className="text-sm text-slate-600 leading-relaxed">
                Nomor halaman i, ii diletakkan di bawah tengah. Halaman bab isi diletakkan di bawah tengah, sisanya di kanan atas.
              </p>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-rose-100 rounded-full blur-3xl opacity-40 group-hover:scale-125 transition duration-1000"></div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setCurrentView('dashboard')}
          className="glass-dark rounded-full px-12 py-4 font-bold tracking-widest uppercase text-[11px] flex items-center space-x-4 hover:scale-105 transition shadow-2xl"
        >
          <span>Back to workspace</span>
          <i className="fas fa-arrow-left"></i>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Dynamic Background Spheres */}
      <div className="fixed top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-pink-200/20 rounded-full blur-[100px] floating"></div>
      <div className="fixed bottom-[-10%] right-[-5%] w-[35vw] h-[35vw] bg-orange-100/20 rounded-full blur-[100px] floating" style={{ animationDelay: '1s' }}></div>

      <Header currentView={currentView} setView={setCurrentView} />

      <main className="flex-grow max-w-7xl mx-auto px-6 lg:px-8 w-full relative z-10">
        {currentView === 'dashboard' ? renderDashboard() : renderGuide()}
      </main>

      <Footer />
    </div>
  );
};

export default App;
