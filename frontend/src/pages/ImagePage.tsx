// Image Generation Page
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { comfyService } from '../services/comfyService';

interface ImagePageProps {
    modelId: string;
    modelLabel: string;
}

export const ImagePage = ({ modelId, modelLabel }: ImagePageProps) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        try {
            // TODO: Load actual workflow from assets/workflows/
            // For now, this is a placeholder
            const workflow = {
                // Workflow structure will be loaded from JSON files
            };

            const result = await comfyService.queuePrompt(workflow);
            console.log('Queued prompt:', result);

            // TODO: Listen for completion via WebSocket
            // TODO: Fetch generated image from history
        } catch (error) {
            console.error('Generation failed:', error);
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
                        className="w-full h-40 bg-[#0a0a0f] border border-white/10 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none transition-all"
                        placeholder={`Describe what you want to create with ${modelLabel}...`}
                    />

                    <div className="mt-6">
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full"
                            isLoading={isGenerating}
                            onClick={handleGenerate}
                            disabled={!prompt.trim()}
                        >
                            {isGenerating ? 'Generating...' : 'Generate'}
                        </Button>
                    </div>
                </div>

                {/* Advanced Settings (Collapsed by default) */}
                <div className="bg-[#121218] border border-white/5 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-sm font-medium text-slate-300 mb-4">Advanced Settings</h3>
                    <div className="space-y-4 text-xs text-slate-500">
                        <p>• Model: {modelLabel}</p>
                        <p>• Steps: Auto</p>
                        <p>• CFG Scale: Auto</p>
                        <p>• Dimensions: Auto</p>
                    </div>
                </div>
            </div>

            {/* Right: Gallery / Preview */}
            <div className="lg:col-span-2 bg-[#121218] border border-white/5 rounded-2xl p-1 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

                {generatedImages.length === 0 ? (
                    <div className="text-center">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500">
                            <Sparkles className="w-10 h-10 text-slate-600" />
                        </div>
                        <p className="text-slate-500 font-medium">No images generated yet</p>
                        <p className="text-xs text-slate-600 mt-1">Enter a prompt to see magic happen</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 p-4">
                        {generatedImages.map((img, idx) => (
                            <img
                                key={idx}
                                src={img}
                                alt={`Generated ${idx}`}
                                className="rounded-lg border border-white/10"
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
