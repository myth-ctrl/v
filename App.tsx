
import React, { useState, useEffect, useRef } from 'react';
import { GeminiService } from './services/geminiService';
import { BackgroundType, AppState, GenerationStatus } from './types';
import Confetti from './components/Confetti';

// --- Icons ---
const HeartIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003c-5.482-2.619-10.138-6.609-10.138-11.907 0-3.327 2.673-6 6-6 1.838 0 3.493.821 4.5 2.106 1.007-1.285 2.662-2.106 4.5-2.106 3.327 0 6 2.673 6 6 0 5.298-4.656 9.288-10.138 11.907l-.007.003-.002.001-.002-.001-.001-.001z" /></svg>
);
const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
);
const VideoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
);
const ShareIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
);

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const hash = window.location.hash.slice(1);
      if (hash && hash.length > 5) {
        return JSON.parse(atob(hash));
      }
    } catch (e) {
      console.warn("Could not hydrate state from hash", e);
    }
    return {
      recipient: "My Love",
      message: "You make every day feel like Valentine's Day. Happy Valentine's Day, my dear! 💖",
      bgUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=1200",
      bgType: 'image',
      theme: 'dark'
    };
  });

  const [status, setStatus] = useState<GenerationStatus>({ isGenerating: false, progress: '' });
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'background'>('content');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    try {
      const hash = btoa(JSON.stringify(state));
      window.history.replaceState(null, '', `#${hash}`);
    } catch (e) {}
  }, [state]);

  const handleGenerateMessage = async (mood: string) => {
    setErrorMessage(null);
    setStatus({ isGenerating: true, progress: 'Searching for the perfect words...' });
    try {
      const msg = await GeminiService.generateMessage(state.recipient, mood);
      setState(prev => ({ ...prev, message: msg }));
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to generate message");
    } finally {
      setStatus({ isGenerating: false, progress: '' });
    }
  };

  const handleGenerateImage = async (prompt: string) => {
    if (!prompt.trim()) return setErrorMessage("Please describe a scene first.");
    setErrorMessage(null);
    setStatus({ isGenerating: true, progress: 'AI is painting your romantic atmosphere...' });
    try {
      const url = await GeminiService.generateImage(prompt);
      setState(prev => ({ ...prev, bgUrl: url, bgType: 'image' }));
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to generate image");
    } finally {
      setStatus({ isGenerating: false, progress: '' });
    }
  };

  const handleGenerateVideo = async (prompt: string) => {
    if (!prompt.trim()) return setErrorMessage("Please describe a scene first.");
    setErrorMessage(null);

    // Mandatorily check for Veo key selection before proceeding
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await aistudio.openSelectKey();
        // Proceeding assuming success as per guidelines to avoid race conditions
      }
    }

    setStatus({ isGenerating: true, progress: 'Initializing cinematic generation...' });
    try {
      const url = await GeminiService.generateVideo(prompt, (msg) => {
        setStatus(prev => ({ ...prev, progress: msg }));
      });
      setState(prev => ({ ...prev, bgUrl: url, bgType: 'video' }));
    } catch (e: any) {
      setErrorMessage(e.message || "Video generation failed. Ensure you have a paid API key selected.");
    } finally {
      setStatus({ isGenerating: false, progress: '' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setState(prev => ({ ...prev, bgUrl: url, bgType: file.type.startsWith('video/') ? 'video' : 'image' }));
    }
  };

  const triggerCelebrate = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden relative bg-[#050505] text-white selection:bg-rose-500/40">
      <Confetti active={showConfetti} />

      {/* Main Preview Area */}
      <main className="flex-1 relative flex items-center justify-center p-6 z-0 h-screen md:h-auto">
        <div className="absolute inset-0 z-[-1]">
          {state.bgType === 'video' ? (
            <video key={state.bgUrl} autoPlay muted loop playsInline className="w-full h-full object-cover shadow-inner">
              <source src={state.bgUrl} />
            </video>
          ) : (
            <img src={state.bgUrl} alt="Card Background" className="w-full h-full object-cover shadow-inner" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 backdrop-blur-[1px]" />
        </div>

        {/* Card Canvas */}
        <div className="max-w-md w-full aspect-[3/4] bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[3rem] shadow-[0_32px_64px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center text-center p-10 md:p-14 relative group transition-all duration-700 hover:scale-[1.01] hover:border-rose-500/30">
          <div className="absolute -top-10 transition-transform duration-1000 group-hover:scale-110">
            <div className="w-20 h-20 text-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.7)] animate-pulse">
              <HeartIcon />
            </div>
          </div>
          
          <div className="space-y-8">
            <h2 className="text-white/40 uppercase tracking-[0.4em] text-[10px] font-bold">To Someone Special</h2>
            <h1 className="text-5xl md:text-6xl text-white font-romantic drop-shadow-2xl leading-tight select-none">
              {state.recipient}
            </h1>
            <div className="w-12 h-px bg-white/20 mx-auto" />
            <p className="text-xl md:text-2xl text-white/95 font-serif-elegant italic leading-relaxed px-2">
              "{state.message}"
            </p>
            <div className="pt-6">
               <p className="text-rose-400/60 text-[10px] tracking-[0.3em] font-bold uppercase">Valentine's Day 2025</p>
            </div>
          </div>

          <button 
            onClick={triggerCelebrate}
            className="absolute bottom-10 px-8 py-3 bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/50 rounded-full text-white/70 hover:text-rose-200 text-xs font-bold tracking-widest uppercase transition-all backdrop-blur-xl active:scale-95"
          >
            Express Love
          </button>
        </div>
      </main>

      {/* Editor Sidebar */}
      <aside className={`fixed md:relative right-0 top-0 h-full bg-[#0d0d0d]/95 backdrop-blur-xl border-l border-white/10 transition-all duration-500 z-50 flex flex-col ${isSidebarOpen ? 'w-full md:w-[420px] translate-x-0' : 'w-0 translate-x-full md:w-0'}`}>
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <h2 className="text-lg font-bold flex items-center gap-3">
            <span className="text-rose-500 scale-125"><HeartIcon /></span>
            Valentine AI Studio
          </h2>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-white/30 hover:text-white transition-colors">✕</button>
        </div>

        {/* Tab Selection */}
        <div className="flex px-4 pt-4 border-b border-white/5">
          {['content', 'background'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'text-rose-500 border-b-2 border-rose-500' : 'text-white/30 hover:text-white/60'}`}
            >
              {tab === 'content' ? 'The Message' : 'The Atmosphere'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {errorMessage && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs leading-relaxed animate-in fade-in slide-in-from-top-2">
              <span className="font-bold uppercase tracking-tighter mr-2">Error:</span> {errorMessage}
            </div>
          )}

          {activeTab === 'content' ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Their Name</label>
                <input 
                  type="text" 
                  value={state.recipient}
                  onChange={(e) => setState(prev => ({ ...prev, recipient: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500/50 transition-all placeholder:text-white/10"
                  placeholder="Who is this for?"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">The Message</label>
                <textarea 
                  value={state.message}
                  onChange={(e) => setState(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500/50 transition-all resize-none placeholder:text-white/10"
                  placeholder="Type your heart out..."
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">AI Inspiration <SparklesIcon /></label>
                <div className="grid grid-cols-2 gap-2">
                  {['Romantic', 'Funny', 'Poetic', 'Minimal'].map((mood) => (
                    <button 
                      key={mood}
                      onClick={() => handleGenerateMessage(mood.toLowerCase())}
                      className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold transition-all active:scale-95"
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Generate Scene</label>
                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                  <input 
                    id="ai-prompt-input"
                    type="text" 
                    placeholder="E.g. Bokeh hearts with soft candlelight..."
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-rose-500/50"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleGenerateImage((document.getElementById('ai-prompt-input') as HTMLInputElement).value)}
                      className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-900/20"
                    >
                      AI Image
                    </button>
                    <button 
                      onClick={() => handleGenerateVideo((document.getElementById('ai-prompt-input') as HTMLInputElement).value)}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-900/20"
                    >
                      AI Video
                    </button>
                  </div>
                  <p className="text-[9px] text-white/20 italic text-center">Video generation requires a paid Google AI Studio API key.</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Upload Your Own</label>
                <label className="w-full h-32 flex flex-col items-center justify-center bg-white/5 border-2 border-dashed border-white/10 rounded-2xl hover:border-white/20 transition-all cursor-pointer group">
                  <span className="text-white/20 group-hover:text-white/40 transition-colors"><VideoIcon /></span>
                  <span className="text-[10px] mt-2 text-white/20 font-bold uppercase tracking-widest">Drop Image or Video</span>
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-6 bg-black/80 border-t border-white/10 space-y-4">
          <button 
            onClick={() => {
              const url = window.location.href;
              navigator.clipboard.writeText(url);
              alert("Card link copied! Send it to your Valentine. ❤️");
            }}
            className="w-full py-4 bg-white text-black font-bold text-sm rounded-2xl flex items-center justify-center gap-3 hover:bg-rose-50 transition-all active:scale-[0.98]"
          >
            <ShareIcon /> Create Shareable Link
          </button>
          
          <div className="flex gap-2">
             <button 
              onClick={() => {
                window.location.hash = '';
                window.location.reload();
              }}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              Reset Card
            </button>
            <button 
              onClick={() => (window as any).aistudio?.openSelectKey()}
              className="flex-1 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              Config AI Key
            </button>
          </div>
        </div>
      </aside>

      {/* Floating Toggle (Mobile) */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-rose-600 text-white rounded-full shadow-2xl flex items-center justify-center z-[60] hover:scale-110 active:scale-90 transition-all md:hidden"
        >
          <HeartIcon />
        </button>
      )}

      {/* Loading Modal */}
      {status.isGenerating && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-10 text-center">
          <div className="relative mb-12">
            <div className="w-32 h-32 border-4 border-rose-500/10 border-t-rose-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]">
               <div className="scale-150"><HeartIcon /></div>
            </div>
          </div>
          <h3 className="text-3xl font-romantic text-white mb-4 animate-pulse">Creating Magic...</h3>
          <p className="text-white/50 text-sm max-w-sm leading-relaxed tracking-wide font-light">{status.progress}</p>
          <div className="mt-12 flex gap-1">
             {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 bg-rose-500/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
