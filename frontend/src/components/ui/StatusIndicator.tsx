// Status Indicator Component
import { useComfyStatus } from '../../hooks/useComfyStatus';
import { Activity, AlertCircle, Loader2 } from 'lucide-react';

export const StatusIndicator = () => {
    const { isConnected, isLoading } = useComfyStatus();

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                <div className="text-xs">
                    <div className="text-slate-400">Checking connection...</div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${isConnected
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
        >
            {isConnected ? (
                <>
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <div className="text-xs">
                        <div className="text-emerald-400 font-medium">ComfyUI Online</div>
                        <div className="text-emerald-600 text-[10px]">127.0.0.1:8188</div>
                    </div>
                </>
            ) : (
                <>
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <div className="text-xs">
                        <div className="text-red-400 font-medium">ComfyUI Offline</div>
                        <div className="text-red-600 text-[10px]">Check backend</div>
                    </div>
                </>
            )}
        </div>
    );
};
