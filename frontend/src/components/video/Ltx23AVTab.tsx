// LTX 2.3 Audio-Driven Video Tab
// Uses ltx23-5in1-api.json — takes an image + audio file and generates
// a video where the visuals are driven by the supplied audio.
import { useState } from 'react';
import { ImageIcon, Music, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import { useComfyExecution } from '../../contexts/ComfyExecutionContext';
import { comfyService } from '../../services/comfyService';
import { GalleryModal } from '../GalleryModal';
import { useToast } from '../ui/Toast';
import { usePersistentState } from '../../hooks/usePersistentState';

export const Ltx23AVTab = () => {
    const { queueWorkflow } = useComfyExecution();
    const { toast } = useToast();

    // Image
    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [sourceImageName, setSourceImageName] = useState<string | null>(null);
    const [showGalleryModal, setShowGalleryModal] = useState(false);

    // Audio
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioName, setAudioName] = useState<string | null>(null);

    // Params
    const [prompt, setPrompt] = usePersistentState('ltx23av_prompt', 'woman singing, natural expressive performance');
    const [negativePrompt] = usePersistentState('ltx23av_negative', 'blurry, low quality, still frame, frames, watermark, overlay, titles, has blurbox, has subtitles');
    const [seed, setSeed] = usePersistentState('ltx23av_seed', -1);
    const [videoWidth, setVideoWidth] = usePersistentState('ltx23av_width', 720);
    const [duration, setDuration] = usePersistentState('ltx23av_duration', 15);
    const [isGenerating, setIsGenerating] = useState(false);

    const activeSeed = seed === -1 ? Math.floor(Math.random() * 999999999999) : seed;

    const handleGenerate = async () => {
        if (!sourceImage || !sourceImageName) {
            toast('Please select a source image', 'error');
            return;
        }
        if (!audioFile) {
            toast('Please upload an audio file', 'error');
            return;
        }

        setIsGenerating(true);
        try {
            // 1. Upload image to ComfyUI
            let imageFilename = sourceImageName;
            try {
                const blob = await fetch(sourceImage).then((r) => {
                    if (!r.ok) throw new Error('Failed to fetch source image');
                    return r.blob();
                });
                const file = new File([blob], imageFilename, { type: blob.type });
                const uploadRes = await comfyService.uploadImage(file);
                imageFilename = uploadRes.name;
            } catch (err) {
                throw new Error(`Image upload failed: ${err}`);
            }

            // 2. Upload audio to ComfyUI
            let audioFilename = audioFile.name;
            try {
                const uploadRes = await comfyService.uploadAudio(audioFile);
                audioFilename = uploadRes.name;
            } catch (err) {
                throw new Error(`Audio upload failed: ${err}`);
            }

            // 3. Load workflow
            const response = await fetch(`/workflows/ltx23-5in1-api.json?v=${Date.now()}`);
            if (!response.ok) throw new Error('Failed to load LTX 2.3 AV workflow');
            const workflow = await response.json();

            // 4. Remove model-download and show-text utility nodes
            ['5266', '5267', '5270', '5271'].forEach((id) => delete workflow[id]);

            // 5. Inject parameters
            // Node 5310: LoadImage — source image
            if (workflow['5310']) workflow['5310'].inputs.image = imageFilename;

            // Node 5311: ResizeImageMaskNode — set video width
            if (workflow['5311']) workflow['5311'].inputs['resize_type.width'] = videoWidth;

            // Node 5299: VHS_LoadAudioUpload — audio file + duration
            if (workflow['5299']) {
                workflow['5299'].inputs.audio = audioFilename;
                workflow['5299'].inputs.duration = duration;
            }

            // Node 5283: CLIPTextEncode — positive prompt
            if (workflow['5283']) workflow['5283'].inputs.text = prompt;

            // Node 5282: CLIPTextEncode — negative prompt
            if (workflow['5282']) workflow['5282'].inputs.text = negativePrompt;

            // Node 5293: RandomNoise — seed
            if (workflow['5293']) workflow['5293'].inputs.noise_seed = activeSeed;

            // Node 5296: VHS_VideoCombine — output prefix
            const runTag = Date.now();
            if (workflow['5296']) workflow['5296'].inputs.filename_prefix = `VIDEO/LTX23/AV_${runTag}`;

            await queueWorkflow(workflow);
        } catch (err: any) {
            console.error('LTX 2.3 AV generation error:', err);
            toast(err?.message || 'Generation failed. Check that ComfyUI is running.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleImageFile = (file: File) => {
        const url = URL.createObjectURL(file);
        setSourceImage(url);
        setSourceImageName(file.name);
    };

    const handleAudioFile = (file: File) => {
        setAudioFile(file);
        setAudioName(file.name);
    };

    return (
        <div className="flex flex-col gap-4 p-4">

            {/* Header */}
            <div>
                <h2 className="text-sm font-semibold text-slate-200">LTX 2.3 — Audio-Driven Video</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                    Give it an image + audio file. It generates a video where the visuals match the sound.
                </p>
            </div>

            {/* Image + Audio row */}
            <div className="grid grid-cols-2 gap-3">

                {/* Source image */}
                <div>
                    <p className="text-[11px] text-slate-400 mb-1">Source image</p>
                    <div
                        className="relative border border-dashed border-slate-600 rounded-lg overflow-hidden bg-slate-800/50 cursor-pointer hover:border-slate-400 transition-colors"
                        style={{ aspectRatio: '1/1' }}
                        onClick={() => setShowGalleryModal(true)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files[0];
                            if (file && file.type.startsWith('image/')) handleImageFile(file);
                        }}
                    >
                        {sourceImage ? (
                            <img src={sourceImage} alt="source" className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                                <ImageIcon className="w-6 h-6 text-slate-500" />
                                <p className="text-[10px] text-slate-500">Drop or click</p>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleImageFile(f);
                            }}
                        />
                    </div>
                </div>

                {/* Audio upload */}
                <div>
                    <p className="text-[11px] text-slate-400 mb-1">Audio file</p>
                    <div
                        className="relative border border-dashed border-slate-600 rounded-lg bg-slate-800/50 cursor-pointer hover:border-slate-400 transition-colors flex flex-col items-center justify-center gap-2"
                        style={{ aspectRatio: '1/1' }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files[0];
                            if (file) handleAudioFile(file);
                        }}
                    >
                        <Music className="w-6 h-6 text-slate-500" />
                        {audioName ? (
                            <p className="text-[10px] text-green-400 text-center px-2 break-all">{audioName}</p>
                        ) : (
                            <p className="text-[10px] text-slate-500 text-center">Drop MP3/WAV or click</p>
                        )}
                        <input
                            type="file"
                            accept="audio/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleAudioFile(f);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Prompt */}
            <div>
                <p className="text-[11px] text-slate-400 mb-1">Prompt</p>
                <textarea
                    className="w-full bg-slate-800 border border-slate-600 rounded-md text-xs text-slate-200 p-2 resize-none focus:outline-none focus:border-slate-400"
                    rows={3}
                    placeholder="Describe what's happening in the video…"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
            </div>

            {/* Settings row */}
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <p className="text-[11px] text-slate-400 mb-1">Width (px)</p>
                    <input
                        type="number"
                        className="w-full bg-slate-800 border border-slate-600 rounded-md text-xs text-slate-200 p-2 focus:outline-none focus:border-slate-400"
                        min={256} max={1920} step={32}
                        value={videoWidth}
                        onChange={(e) => setVideoWidth(Number(e.target.value))}
                    />
                </div>
                <div>
                    <p className="text-[11px] text-slate-400 mb-1">Duration (s)</p>
                    <input
                        type="number"
                        className="w-full bg-slate-800 border border-slate-600 rounded-md text-xs text-slate-200 p-2 focus:outline-none focus:border-slate-400"
                        min={1} max={60} step={1}
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                    />
                </div>
                <div>
                    <p className="text-[11px] text-slate-400 mb-1">Seed (-1 = random)</p>
                    <input
                        type="number"
                        className="w-full bg-slate-800 border border-slate-600 rounded-md text-xs text-slate-200 p-2 focus:outline-none focus:border-slate-400"
                        value={seed}
                        onChange={(e) => setSeed(Number(e.target.value))}
                    />
                </div>
            </div>

            {/* Generate */}
            <Button
                onClick={handleGenerate}
                disabled={isGenerating || !sourceImage || !audioFile}
                className="w-full"
            >
                {isGenerating ? (
                    <span className="flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating…
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Generate Video
                    </span>
                )}
            </Button>

            <GalleryModal
                isOpen={showGalleryModal}
                onClose={() => setShowGalleryModal(false)}
                onSelect={(url, name) => {
                    setSourceImage(url);
                    setSourceImageName(name || 'source.png');
                    setShowGalleryModal(false);
                }}
            />
        </div>
    );
};
