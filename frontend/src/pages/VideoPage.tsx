// Video Generation Page
import { useState, useEffect } from 'react';
import { Video, ChevronRight, Play, Film, Upload, Music, Image as ImageIcon, Mic } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { comfyService } from '../services/comfyService';

interface VideoPageProps {
    modelId: string;
    modelLabel: string;
}

export const VideoPage = ({ }: VideoPageProps) => {
    const [mode, setMode] = useState<'text' | 'lipsync'>('text');
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, distorted, bad anatomy, shaky camera');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedVideos, setGeneratedVideos] = useState<string[]>([]);

    // LipSync Inputs
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [resolution, setResolution] = useState(512);

    // Advanced settings state
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [steps, setSteps] = useState(25);
    const [cfg, setCfg] = useState(7.5);
    const [frameCount, setFrameCount] = useState(25);
    const [seed, setSeed] = useState(-1);

    // Generation status state
    const [executionStatus, setExecutionStatus] = useState<string>('');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Connect to WebSocket for real-time updates (Only for Text-to-Video LTX-2)
        if (mode === 'text') {
            const disconnect = comfyService.connectWebSocket({
                onExecuting: (nodeId) => {
                    if (nodeId) setExecutionStatus(`Executing node: ${nodeId}`);
                },
                onProgress: (node, value, max) => {
                    const percent = Math.round((value / max) * 100);
                    setProgress(percent);
                    setExecutionStatus(`Processing ${node}...`);
                },
                onCompleted: (promptId) => {
                    console.log('✅ Video Generation Completed:', promptId);
                    fetchResults(promptId);
                    setIsGenerating(false);
                    setExecutionStatus('Completed!');
                    setProgress(100);
                }
            });

            const fetchResults = async (promptId: string) => {
                try {
                    const history = await comfyService.getHistory(promptId);
                    const results = history[promptId];
                    if (results?.outputs) {
                        const videos: string[] = [];
                        Object.values(results.outputs).forEach((nodeOutputAny: any) => {
                            if (nodeOutputAny.gifs) {
                                nodeOutputAny.gifs.forEach((v: any) => videos.push(comfyService.getImageUrl(v.filename, v.subfolder, v.type)));
                            }
                            if (nodeOutputAny.videos) {
                                nodeOutputAny.videos.forEach((v: any) => videos.push(comfyService.getImageUrl(v.filename, v.subfolder, v.type)));
                            }
                        });
                        if (videos.length > 0) setGeneratedVideos(videos);
                    }
                } catch (err) {
                    console.error("Failed to fetch results:", err);
                } finally {
                    setTimeout(() => {
                        setExecutionStatus('');
                        setProgress(0);
                    }, 3000);
                }
            };
            return () => disconnect();
        }
    }, [mode]);

    const generateSeed = () => Math.floor(Math.random() * 1000000000000000);

    const handleGenerate = async () => {
        if (mode === 'lipsync') {
            handleLipSyncGenerate();
            return;
        }

        if (!prompt.trim()) return;

        setIsGenerating(true);
        setGeneratedVideos([]);
        setExecutionStatus('Initializing Workflow...');
        setProgress(0);

        try {
            // 1. Load Workflow Template
            const response = await fetch('/workflows/ltx-2.json');
            if (!response.ok) throw new Error('Failed to load LTX-2 workflow');
            const workflow = await response.json();
            const activeSeed = seed === -1 ? generateSeed() : seed;

            console.log('🚀 Preparing LTX-2 Generation:', { prompt, activeSeed, steps, frameCount });

            // Set parameters
            if (workflow["2"]) workflow["2"].inputs.string = prompt;
            if (workflow["4"]) workflow["4"].inputs.string = negativePrompt;
            if (workflow["10"]) {
                workflow["10"].inputs.seed = activeSeed;
                workflow["10"].inputs.steps = steps;
                workflow["10"].inputs.cfg = cfg;
            }
            if (workflow["30"]) workflow["30"].inputs.length = frameCount;

            setExecutionStatus('Queuing in ComfyUI...');
            await comfyService.queuePrompt(workflow);

        } catch (error) {
            console.error('Generation Error:', error);
            setIsGenerating(false);
            setExecutionStatus('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleLipSyncGenerate = async () => {
        if (!imageFile || !audioFile) return;

        setIsGenerating(true);
        setGeneratedVideos([]);
        setExecutionStatus('Uploading & Processing on Backend (No Progress Bar)...');
        setProgress(5);

        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('audio', audioFile);
        formData.append('resolution', resolution.toString());
        formData.append('prompt', prompt || "woman talking"); // Optional
        formData.append('steps', '10'); // Faster dev preset

        try {
            const res = await fetch('http://localhost:8000/api/video/lipsync', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error("Backend processing failed");

            // Getting blob directly
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            setGeneratedVideos([url]);
            setExecutionStatus('Completed!');
            setProgress(100);

        } catch (error) {
            console.error('LipSync Error:', error);
            setExecutionStatus('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsGenerating(false);
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            {/* Left: Controls */}
            <div className="lg:col-span-1 space-y-6">

                {/* Mode Switcher */}
                <div className="flex bg-[#121218] border border-white/5 p-1 rounded-xl">
                    <button
                        onClick={() => setMode('text')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'text' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        Text to Video
                    </button>
                    <button
                        onClick={() => setMode('lipsync')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'lipsync' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        Lip Sync
                    </button>
                </div>

                <div className="bg-[#121218] border border-white/5 rounded-2xl p-6 shadow-xl">

                    {mode === 'text' ? (
                        <>
                            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                                Video Prompt
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full h-40 bg-[#0a0a0f] border border-white/10 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none transition-all"
                                placeholder="Describe the action..."
                            />
                        </>
                    ) : (
                        <div className="space-y-4">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Source Face (Image)</label>
                                <div className={`border-2 border-dashed ${imageFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-white/20'} rounded-xl p-4 transition-all text-center cursor-pointer relative`}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                    />
                                    {imageFile ? (
                                        <div className="flex items-center justify-center gap-2 text-emerald-400">
                                            <ImageIcon className="w-5 h-5" />
                                            <span className="text-sm truncate max-w-[200px]">{imageFile.name}</span>
                                        </div>
                                    ) : (
                                        <div className="text-slate-500 flex flex-col items-center">
                                            <Upload className="w-6 h-6 mb-2" />
                                            <span className="text-xs">Click to upload face</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Audio Upload */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Voice Audio</label>
                                <div className={`border-2 border-dashed ${audioFile ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/10 hover:border-white/20'} rounded-xl p-4 transition-all text-center cursor-pointer relative`}>
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                                    />
                                    {audioFile ? (
                                        <div className="flex items-center justify-center gap-2 text-purple-400">
                                            <Music className="w-5 h-5" />
                                            <span className="text-sm truncate max-w-[200px]">{audioFile.name}</span>
                                        </div>
                                    ) : (
                                        <div className="text-slate-500 flex flex-col items-center">
                                            <Mic className="w-6 h-6 mb-2" />
                                            <span className="text-xs">Click to upload voice</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Resolution Selector */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Resolution</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[256, 512, 768].map(res => (
                                        <button
                                            key={res}
                                            onClick={() => setResolution(res)}
                                            className={`py-2 text-xs rounded-lg border ${resolution === res ? 'bg-white text-black border-white' : 'bg-[#0a0a0f] text-slate-400 border-white/10'}`}
                                        >
                                            {res}px
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-6">
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full bg-white hover:bg-slate-200 text-black border-none shadow-lg transition-all duration-300 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            isLoading={isGenerating}
                            onClick={handleGenerate}
                            disabled={mode === 'text' ? !prompt.trim() : (!imageFile || !audioFile)}
                        >
                            <Video className="w-5 h-5" />
                            {isGenerating ? 'Generating...' : (mode === 'text' ? 'Generate Video' : 'Sync Lips')}
                        </Button>
                    </div>
                </div>

                {/* Advanced text settings only */}
                {mode === 'text' && (
                    <div className="bg-[#121218] border border-white/5 rounded-2xl p-6 shadow-xl">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full flex items-center justify-between text-sm font-medium text-slate-300 hover:text-white transition-colors"
                        >
                            <span>Advanced Options</span>
                            <ChevronRight
                                className={`w-4 h-4 transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`}
                            />
                        </button>

                        {showAdvanced && (
                            <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">
                                        Negative Guidance
                                    </label>
                                    <textarea
                                        value={negativePrompt}
                                        onChange={(e) => setNegativePrompt(e.target.value)}
                                        className="w-full h-20 bg-[#0a0a0f] border border-white/10 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none transition-all"
                                        placeholder="Avoid..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-2">Steps</label>
                                        <input
                                            type="number"
                                            value={steps}
                                            onChange={(e) => setSteps(parseInt(e.target.value))}
                                            className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-2">CFG</label>
                                        <input
                                            type="number"
                                            value={cfg}
                                            step="0.1"
                                            onChange={(e) => setCfg(parseFloat(e.target.value))}
                                            className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-slate-400 mb-2">Frames: {frameCount}</label>
                                    <input
                                        type="range"
                                        min="8"
                                        max="121"
                                        step="8"
                                        value={frameCount}
                                        onChange={(e) => setFrameCount(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-white"
                                    />
                                </div>

                                <label className="block text-xs text-slate-400 mb-2">
                                    Seed (-1 for random)
                                </label>
                                <input
                                    type="number"
                                    value={seed}
                                    onChange={(e) => setSeed(parseInt(e.target.value))}
                                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-white/20"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right: Preview */}
            <div className="lg:col-span-2 bg-[#121218] border border-white/5 rounded-2xl p-1 flex flex-col items-center justify-center relative overflow-hidden group min-h-[600px]">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

                {isGenerating || executionStatus ? (
                    <div className="z-10 w-full max-w-md p-8 text-center space-y-6">
                        <div className="relative w-24 h-24 mx-auto">
                            <div className="absolute inset-0 border-4 border-white/20 rounded-full animate-pulse"></div>
                            <div className="absolute inset-0 border-t-4 border-white rounded-full animate-spin"></div>
                            <Film className="absolute inset-0 m-auto w-8 h-8 text-white animate-pulse" />
                        </div>

                        <div className="space-y-2">
                            <p className="text-white font-medium text-lg tracking-tight">{executionStatus || 'Processing...'}</p>
                            {progress > 0 && <p className="text-white font-bold text-2xl">{progress}%</p>}
                        </div>

                        {progress > 0 && (
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        )}
                        <p className="text-slate-500 text-xs tracking-widest uppercase">Rendering Cinematic Sequence</p>
                    </div>
                ) : generatedVideos.length === 0 ? (
                    <div className="text-center">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500">
                            <Play className="w-10 h-10 text-slate-600" />
                        </div>
                        <p className="text-slate-500 font-medium">Video Engine Idle</p>
                        <p className="text-xs text-slate-600 mt-1">
                            {mode === 'text' ? 'Ready for LTX-2 Cinematic Input' : 'Ready for Wan2.1 Lip Sync'}
                        </p>
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center p-4">
                        <video
                            src={generatedVideos[0]}
                            controls
                            autoPlay
                            loop
                            className="max-w-full max-h-full rounded-xl border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.1)] animate-in zoom-in-95 duration-700"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
