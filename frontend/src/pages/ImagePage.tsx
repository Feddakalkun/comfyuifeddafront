// Image Generation Page
import { useState, useEffect } from 'react';
import { Sparkles, ChevronRight, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { comfyService } from '../services/comfyService';

interface ImagePageProps {
    modelId: string;
    modelLabel: string;
}

export const ImagePage = ({ modelId }: ImagePageProps) => {
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, distorted, bad anatomy, flat lighting');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);

    // Advanced settings state
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [steps, setSteps] = useState(9);
    const [cfg, setCfg] = useState(1);
    const [dimensions, setDimensions] = useState('1504x1504');
    const [lora, setLora] = useState('');
    const [loraStrength, setLoraStrength] = useState(1.0);
    const [style, setStyle] = useState('No Style');
    const [seed, setSeed] = useState(-1);

    // LoRA & Styles search state
    const [availableLoras, setAvailableLoras] = useState<string[]>([]);
    const [availableStyles, setAvailableStyles] = useState<string[]>(['No Style', 'FEDDA Ultra Real', 'FEDDA Portrait Master', 'Photographic', 'Cinematic', 'Anime']);
    const [showLoraList, setShowLoraList] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [loras, styles] = await Promise.all([
                    comfyService.getLoras(),
                    comfyService.getStyles()
                ]);
                setAvailableLoras(loras);
                if (styles && styles.length > 0) {
                    setAvailableStyles(styles);
                }
            } catch (err) {
                console.error("Failed to load initial data", err);
            }
        };

        loadInitialData();
    }, []);

    const filteredLoras = availableLoras.filter(l =>
        l.toLowerCase().includes(lora.toLowerCase())
    );

    // Generation status state
    const [executionStatus, setExecutionStatus] = useState<string>('');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Connect to WebSocket for real-time updates
        const disconnect = comfyService.connectWebSocket({
            onExecuting: (nodeId) => {
                console.log('⚡ ComfyUI Executing Node:', nodeId);

                if (!nodeId) {
                    // node: null means the entire prompt is FINISHED
                    console.log('✨ Prompt finished! Fetching results...');
                    setExecutionStatus('Finalizing...');

                    // Give the backend a moment to write to disk/history
                    setTimeout(async () => {
                        const currentPromptId = localStorage.getItem('last_prompt_id');
                        if (currentPromptId) {
                            await fetchResults(currentPromptId);
                        }
                    }, 800);
                    return;
                }

                // Map known node IDs to human readable status
                const statusMap: Record<string, string> = {
                    '22': 'Downloading Models (this may take a while)...',
                    '3': 'Generating Image (Sampling)...',
                    '126': 'Loading LoRAs...',
                    '10': 'Saving Image...',
                    '15': 'Applying Flux Guidance...'
                };

                setExecutionStatus(statusMap[nodeId] || `Processing (Node ${nodeId})...`);
            },
            onProgress: (_node, value, max) => {
                setProgress(Math.round((value / max) * 100));
            },
            onCompleted: (promptId) => {
                // Store the latest prompt ID so we can fetch it when node:null is received
                localStorage.setItem('last_prompt_id', promptId);
            }
        });

        const fetchResults = async (promptId: string) => {
            try {
                const history = await comfyService.getHistory(promptId);
                const results = history[promptId];

                if (results?.outputs) {
                    const images: string[] = [];
                    Object.values(results.outputs).forEach((nodeOutputAny: any) => {
                        if (nodeOutputAny.images) {
                            nodeOutputAny.images.forEach((img: any) => {
                                images.push(comfyService.getImageUrl(img.filename, img.subfolder, img.type));
                            });
                        }
                    });

                    if (images.length > 0) {
                        console.log('🖼️ Found images:', images);
                        setGeneratedImages(images);
                        setExecutionStatus('Generation Complete!');
                        setProgress(100);
                    } else {
                        console.warn('⚠️ No images found in prompt output history.');
                    }
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
    }, []);


    // Helper to generate random seed
    const generateSeed = () => Math.floor(Math.random() * 1000000000000000);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setGeneratedImages([]);
        setExecutionStatus('Starting...');
        setProgress(0);

        try {
            // 1. Load Workflow Template
            const response = await fetch('/workflows/z-image.json');
            if (!response.ok) throw new Error('Failed to load workflow template');
            const workflow = await response.json();

            // 2. Modify Workflow Parameters
            const activeSeed = seed === -1 ? generateSeed() : seed;

            console.log('🚀 Preparing Generation:', {
                model: modelId,
                prompt: prompt,
                style: style,
                seed: activeSeed,
                lora: lora
            });

            // Node 3: KSampler (Seed, Steps, CFG)
            if (workflow["3"]) {
                workflow["3"].inputs.seed = activeSeed;
                workflow["3"].inputs.steps = steps;
                workflow["3"].inputs.cfg = cfg;
            }

            // Node 33: Positive Prompt (Our Text Input)
            if (workflow["33"]) {
                workflow["33"].inputs.string = prompt;
            }

            // Node 34: Negative Prompt
            if (workflow["34"]) {
                workflow["34"].inputs.string = negativePrompt;
            }

            // Node 30: Dimensions
            if (workflow["30"]) {
                const [w, h] = dimensions.split('x').map(Number);
                workflow["30"].inputs.width = w;
                workflow["30"].inputs.height = h;
            }

            // Node 31: Style (CSV Loader)
            if (workflow["31"]) {
                workflow["31"].inputs.styles = style;
                workflow["31"].inputs.csv_file_path = "styles.csv";
            }

            // Node 126: LoRA (Power Lora Loader)
            if (workflow["126"]) {
                if (lora.trim()) {
                    workflow["126"].inputs.lora_1 = {
                        on: true,
                        lora: lora,
                        strength: loraStrength
                    };
                } else {
                    workflow["126"].inputs.lora_1 = { on: false, lora: "", strength: 1.0 };
                }
            }

            console.log('📝 Modified Workflow sent to ComfyUI:', workflow);

            // 3. Queue Prompt
            const result = await comfyService.queuePrompt(workflow);
            console.log('✅ Queued:', result);

            // TODO: Real WebSocket handling will come next.
            // For now, check the Console Logs tab or ComfyUI window to see progress.

        } catch (error) {
            console.error('❌ Generation failed:', error);
            alert('Generation failed! Check console for details.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            {/* Left: Controls */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-[#121218] border border-white/5 rounded-2xl p-6 shadow-xl">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                        Prompt
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full h-40 bg-[#0a0a0f] border border-white/10 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none transition-all"
                        placeholder={`Describe what you want to create...`}
                    />

                    <div className="mt-6">
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full bg-pink-600 hover:bg-pink-500 text-white border-none shadow-[0_0_20px_rgba(216,27,96,0.3)] transition-all duration-300 rounded-xl font-semibold"
                            isLoading={isGenerating}
                            onClick={handleGenerate}
                            disabled={!prompt.trim()}
                        >
                            {isGenerating ? 'Generating...' : 'Generate'}
                        </Button>
                    </div>
                </div>

                {/* Advanced Settings (Collapsible) */}
                <div className="bg-[#121218] border border-white/5 rounded-2xl p-6 shadow-xl">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full flex items-center justify-between text-sm font-medium text-slate-300 hover:text-white transition-colors"
                    >
                        <span>Advanced Settings</span>
                        <ChevronRight
                            className={`w-4 h-4 transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''
                                }`}
                        />
                    </button>

                    {showAdvanced && (
                        <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                            {/* Negative Prompt */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">
                                    Negative Prompt
                                </label>
                                <textarea
                                    value={negativePrompt}
                                    onChange={(e) => setNegativePrompt(e.target.value)}
                                    className="w-full h-24 bg-[#0a0a0f] border border-white/10 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none transition-all"
                                    placeholder="Things to avoid... (e.g. blurry, low quality)"
                                />
                            </div>

                            {/* Steps */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-2">
                                    Steps: {steps}
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={steps}
                                    onChange={(e) => setSteps(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                />
                            </div>

                            {/* CFG Scale */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-2">
                                    CFG Scale: {cfg}
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    step="0.5"
                                    value={cfg}
                                    onChange={(e) => setCfg(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                />
                            </div>

                            {/* Dimensions */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-2">
                                    Dimensions
                                </label>
                                <select
                                    value={dimensions}
                                    onChange={(e) => setDimensions(e.target.value)}
                                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                                >
                                    <option value="1504x1504">1504x1504 (1:1)</option>
                                    <option value="1920x1080">1920x1080 (16:9)</option>
                                    <option value="1080x1920">1080x1920 (9:16)</option>
                                    <option value="1024x1024">1024x1024 (1:1)</option>
                                </select>
                            </div>

                            {/* LoRA Selection */}
                            <div className="relative">
                                <label className="block text-xs text-slate-400 mb-2">
                                    LoRA
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={lora}
                                        onChange={(e) => {
                                            setLora(e.target.value);
                                            setShowLoraList(true);
                                        }}
                                        onFocus={() => setShowLoraList(true)}
                                        onBlur={() => setTimeout(() => setShowLoraList(false), 200)}
                                        placeholder="Search LoRAs..."
                                        className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                </div>

                                {showLoraList && filteredLoras.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden custom-scrollbar">
                                        {filteredLoras.map((l, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setLora(l);
                                                    setShowLoraList(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-pink-500/20 hover:text-white transition-colors border-b border-white/5 last:border-0"
                                            >
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* LoRA Strength */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-2">
                                    LoRA Strength: {loraStrength}
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.1"
                                    value={loraStrength}
                                    onChange={(e) => setLoraStrength(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                />
                            </div>

                            {/* Style */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-2">
                                    Style
                                </label>
                                <select
                                    value={style}
                                    onChange={(e) => setStyle(e.target.value)}
                                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                                >
                                    {availableStyles.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Seed */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-2">
                                    Seed (-1 for random)
                                </label>
                                <input
                                    type="number"
                                    value={seed}
                                    onChange={(e) => setSeed(parseInt(e.target.value))}
                                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Gallery / Preview */}
            <div className="lg:col-span-2 bg-[#121218] border border-white/5 rounded-2xl p-1 flex flex-col items-center justify-center relative overflow-hidden group min-h-[600px]">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

                {isGenerating || executionStatus ? (
                    <div className="z-10 w-full max-w-md p-8 text-center space-y-6">
                        <div className="relative w-24 h-24 mx-auto">
                            <div className="absolute inset-0 border-4 border-pink-500/20 rounded-full animate-pulse"></div>
                            <div className="absolute inset-0 border-t-4 border-pink-500 rounded-full animate-spin"></div>
                            <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-pink-400 animate-bounce" />
                        </div>

                        <div className="space-y-2">
                            <p className="text-white font-medium text-lg tracking-tight">{executionStatus || 'Initializing...'}</p>
                            {progress > 0 && <p className="text-pink-400 font-bold text-2xl">{progress}%</p>}
                        </div>

                        {progress > 0 && (
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-pink-600 to-pink-400 transition-all duration-300 shadow-[0_0_10px_rgba(216,27,96,0.5)]"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        )}

                        <p className="text-slate-500 text-sm animate-pulse">Processing your vision...</p>
                    </div>
                ) : generatedImages.length === 0 ? (
                    <div className="text-center">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500">
                            <Sparkles className="w-10 h-10 text-slate-600" />
                        </div>
                        <p className="text-slate-500 font-medium">Ready for input</p>
                        <p className="text-xs text-slate-600 mt-1">Generate a masterpiece</p>
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center p-4">
                        <div className="grid grid-cols-1 gap-4 max-w-full max-h-full overflow-auto custom-scrollbar">
                            {generatedImages.map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img}
                                    alt={`Generated ${idx}`}
                                    className="rounded-xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500"
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
