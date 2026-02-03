import { useState, useEffect } from 'react';
import { comfyService } from '../services/comfyService';
import { Loader2, Play, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
    onEnter: () => void;
}

export const LandingPage = ({ onEnter }: LandingPageProps) => {
    const [activeVideo, setActiveVideo] = useState<'bg' | 'grok'>('bg');
    const [showDoneVideo, setShowDoneVideo] = useState(false);

    // 1. Poll for ComfyUI status
    useEffect(() => {
        let isMounted = true;
        const checkStatus = async () => {
            const alive = await comfyService.isAlive();
            if (alive && isMounted && !showDoneVideo) {
                setShowDoneVideo(true);
            }
        };

        const interval = setInterval(checkStatus, 3000);
        checkStatus();

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [showDoneVideo]);

    // 2. Cross-fade logic for loading videos (Using high-quality ping-pong loops)
    useEffect(() => {
        if (showDoneVideo) return;

        const fadeInterval = setInterval(() => {
            setActiveVideo(prev => prev === 'bg' ? 'grok' : 'bg');
        }, 8000);

        return () => clearInterval(fadeInterval);
    }, [showDoneVideo]);

    return (
        <div className="fixed inset-0 z-[100] bg-black overflow-hidden flex items-center justify-center font-sans">

            {/* --- LOADING VIDEOS (PING-PONG LOOPS) --- */}
            {!showDoneVideo && (
                <>
                    {/* Video A: bg.mp4 (Ping-Ponged) */}
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[3000ms] ${activeVideo === 'bg' ? 'opacity-60' : 'opacity-0'
                            }`}
                    >
                        <source src="/loading/pingpong/bg.mp4" type="video/mp4" />
                    </video>

                    {/* Video B: grok.mp4 (Ping-Ponged) */}
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[3000ms] ${activeVideo === 'grok' ? 'opacity-60' : 'opacity-0'
                            }`}
                    >
                        <source src="/loading/pingpong/grok.mp4" type="video/mp4" />
                    </video>
                </>
            )}

            {/* --- READY VIDEO (Ping-Ponged) --- */}
            <video
                autoPlay
                muted
                loop
                playsInline
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ${showDoneVideo ? 'opacity-80' : 'opacity-0 pointer-events-none'
                    }`}
            >
                <source src="/loading/pingpong/done.mp4" type="video/mp4" />
            </video>


            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col items-center text-center px-6">
                <div className="mb-8 animate-in fade-in zoom-in duration-1000">
                    <h1 className="text-7xl font-black text-white tracking-[0.2em] uppercase mb-2 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                        FEDDA
                    </h1>
                    <div className="h-1 w-24 bg-white mx-auto rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                </div>

                <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700 delay-300">
                    {/* Status Indicator */}
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-500 ${showDoneVideo
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-slate-500'
                        }`}>
                        {showDoneVideo ? (
                            <CheckCircle2 className="w-4 h-4 animate-pulse" />
                        ) : (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        <span className="text-xs font-bold tracking-widest uppercase">
                            {showDoneVideo ? 'ComfyUI Online' : 'Connecting to Backend...'}
                        </span>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={onEnter}
                        className="group relative px-12 py-5 bg-white text-black font-black text-xl uppercase tracking-widest rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            Enter System <Play className="w-5 h-5 fill-current" />
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};
