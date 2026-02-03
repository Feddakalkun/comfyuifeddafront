import { useState, useEffect, useRef } from 'react';
import { comfyService } from '../services/comfyService';
import { Loader2, Play, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
    onEnter: () => void;
}

export const LandingPage = ({ onEnter }: LandingPageProps) => {
    const [isComfyReady, setIsComfyReady] = useState(false);
    const [videoSrc, setVideoSrc] = useState('/loading/bg.mp4');
    const videoRef = useRef<HTMLVideoElement>(null);

    // Poll for ComfyUI status
    useEffect(() => {
        let isMounted = true;
        const checkStatus = async () => {
            const alive = await comfyService.isAlive();
            if (alive && !isComfyReady) {
                if (isMounted) {
                    setIsComfyReady(true);
                    setVideoSrc('/loading/done-loading.mp4');
                }
            }
        };

        const interval = setInterval(checkStatus, 3000);
        checkStatus(); // Initial check

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [isComfyReady]);

    // Handle video transition
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.load();
            videoRef.current.play().catch(e => console.log("Autoplay prevented:", e));
        }
    }, [videoSrc]);

    return (
        <div className="fixed inset-0 z-[100] bg-black overflow-hidden flex items-center justify-center font-sans">
            {/* Background Video */}
            <video
                ref={videoRef}
                key={videoSrc}
                autoPlay
                muted
                loop={videoSrc.includes('bg.mp4')} // Loop bg, play done once? Or loop both?
                className="absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity duration-1000"
                onEnded={() => {
                    // If done-loading finished, maybe loop it or stay at end
                    if (videoSrc.includes('done-loading')) {
                        // Keep it as the final state background
                    }
                }}
            >
                <source src={videoSrc} type="video/mp4" />
            </video>

            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col items-center text-center px-6">
                <div className="mb-8 animate-in fade-in zoom-in duration-1000">
                    <h1 className="text-7xl font-black text-white tracking-[0.2em] uppercase mb-2 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                        FEDDA
                    </h1>
                    <div className="h-1 w-24 bg-white mx-auto rounded-full mb-4 shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                    <p className="text-slate-400 text-sm tracking-[0.3em] uppercase font-light">
                        Premium ComfyUI Interface
                    </p>
                </div>

                <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700 delay-300">
                    {/* Status Indicator */}
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-500 ${isComfyReady
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-slate-500'
                        }`}>
                        {isComfyReady ? (
                            <CheckCircle2 className="w-4 h-4 animate-pulse" />
                        ) : (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        <span className="text-xs font-bold tracking-widest uppercase">
                            {isComfyReady ? 'ComfyUI Online' : 'Connecting to Backend...'}
                        </span>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={onEnter}
                        className="group relative px-12 py-5 bg-white text-black font-black text-xl uppercase tracking-widest rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] active:scale-95"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            Enter System <Play className="w-5 h-5 fill-current" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </button>

                    <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">
                        v0.1.0 • Built for Speed
                    </p>
                </div>
            </div>

            {/* Decoration */}
            <div className="absolute bottom-12 left-12 flex gap-4 animate-in slide-in-from-left-8 duration-1000">
                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Node Connection Active</span>
            </div>

            <div className="absolute top-12 right-12 text-right animate-in slide-in-from-right-8 duration-1000">
                <span className="text-[10px] text-white/30 uppercase tracking-[0.5em] block mb-1 font-bold">Location Status</span>
                <span className="text-xs text-white/80 font-mono">127.0.0.1:8188</span>
            </div>
        </div>
    );
};
