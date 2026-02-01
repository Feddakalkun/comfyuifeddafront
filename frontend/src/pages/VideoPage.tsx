// Video Generation Page
import { Video } from 'lucide-react';

interface VideoPageProps {
    modelId: string;
    modelLabel: string;
}

export const VideoPage = ({ modelId, modelLabel }: VideoPageProps) => {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-32 h-32 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-500/20">
                <Video className="w-16 h-16 text-purple-400" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">{modelLabel} Engine</h3>
            <p className="text-slate-400 max-w-md mx-auto">
                Video generation pipeline for {modelLabel}. Workflow integration coming soon.
            </p>
            <div className="mt-8 text-xs text-slate-600">
                <p>Model ID: {modelId}</p>
            </div>
        </div>
    );
};
