import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { ImagePage } from './pages/ImagePage';
import { VideoPage } from './pages/VideoPage';
import { MODELS } from './config/api';

function App() {
  const [activeTab, setActiveTab] = useState('image');
  const [activeSubTab, setActiveSubTab] = useState<string | null>('z-image');

  const handleTabChange = (tab: string, subTab?: string) => {
    setActiveTab(tab);
    if (subTab) setActiveSubTab(subTab);
  };

  // Find current model info
  const getCurrentModel = () => {
    const allModels = [...MODELS.IMAGE, ...MODELS.VIDEO, ...MODELS.AUDIO];
    return allModels.find((m) => m.id === activeSubTab) || allModels[0];
  };

  const currentModel = getCurrentModel();

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden selection:bg-purple-500/30 font-sans">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        activeSubTab={activeSubTab}
        onTabChange={handleTabChange}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#050508]">
        {/* Ambient Background */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center px-8 z-10 justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              {currentModel.label}
              <span className="text-sm font-normal text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                {activeTab}
              </span>
            </h2>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8 relative z-0">
          {activeTab === 'image' && (
            <ImagePage
              modelId={currentModel.id}
              modelLabel={currentModel.label}
            />
          )}

          {activeTab === 'video' && (
            <VideoPage
              modelId={currentModel.id}
              modelLabel={currentModel.label}
            />
          )}

          {activeTab === 'audio' && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-slate-500">
                <p className="text-2xl mb-2">🎵</p>
                <p>Audio generation coming soon</p>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="bg-[#121218] border border-white/5 rounded-2xl p-6 h-full overflow-auto font-mono text-xs">
              <div className="text-slate-500">
                <p>[INFO] ComfyFront initialized</p>
                <p>[INFO] Connecting to ComfyUI backend...</p>
                <p className="text-emerald-400">[SUCCESS] Connected to 127.0.0.1:8188</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-slate-500">
                <p className="text-2xl mb-2">⚙️</p>
                <p>Settings panel coming soon</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
