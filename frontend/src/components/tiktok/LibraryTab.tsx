import { useState, useEffect } from 'react';
import { FolderOpen, Play, ArrowLeft, Scissors, RefreshCw } from 'lucide-react';
import { BACKEND_API } from '../../config/api';
import { useToast } from '../ui/Toast';

interface Profile {
    name: string;
    video_count: number;
    total_size_mb: number;
}

interface VideoFile {
    filename: string;
    path: string;
    size_mb: number;
    thumbnail_url: string | null;
}

interface LibraryTabProps {
    onExtractFrames: (videoPath: string, videoName: string) => void;
}

export const LibraryTab = ({ onExtractFrames }: LibraryTabProps) => {
    const { toast } = useToast();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
    const [videos, setVideos] = useState<VideoFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [previewVideo, setPreviewVideo] = useState<string | null>(null);
    const [loadingProfiles, setLoadingProfiles] = useState(false);

    const loadProfiles = async () => {
        setLoadingProfiles(true);
        try {
            const res = await fetch(`${BACKEND_API.BASE_URL}/api/tiktok/profiles`);
            if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);
            const data = await res.json();
            setProfiles(data.profiles || []);
        } catch (err) {
            toast(`Failed to load profiles: ${err instanceof Error ? err.message : String(err)}`, 'error');
        } finally {
            setLoadingProfiles(false);
        }
    };

    useEffect(() => { loadProfiles(); }, []);

    const loadVideos = async (profile: string) => {
        setLoading(true);
        setSelectedProfile(profile);
        try {
            const res = await fetch(`${BACKEND_API.BASE_URL}/api/tiktok/videos/${encodeURIComponent(profile)}`);
            if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);
            const data = await res.json();
            setVideos(data.videos || []);
            if ((data.videos || []).length === 0) {
                toast('No videos found in this profile folder', 'info');
            }
        } catch (err) {
            toast(`Failed to load videos: ${err instanceof Error ? err.message : String(err)}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        setSelectedProfile(null);
        setVideos([]);
        setPreviewVideo(null);
        loadProfiles();
    };

    // Profile list view
    if (!selectedProfile) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Profiles</div>
                    <button
                        onClick={loadProfiles}
                        disabled={loadingProfiles}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingProfiles ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                {profiles.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No downloads yet</p>
                        <p className="text-xs mt-1">Download a profile to see it here</p>
                    </div>
                ) : (
                    profiles.map(p => (
                        <button
                            key={p.name}
                            onClick={() => loadVideos(p.name)}
                            className="w-full bg-[#121218] border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:border-white/10 transition-colors text-left group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                <FolderOpen className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-white">{p.name}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                    {p.video_count} video{p.video_count !== 1 ? 's' : ''} &middot; {p.total_size_mb.toFixed(1)} MB
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        );
    }

    // Video list view
    return (
        <div className="space-y-3">
            <button
                onClick={goBack}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-2"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to profiles
            </button>

            <div className="text-sm font-semibold text-white mb-3">{selectedProfile}</div>

            {/* Video preview */}
            {previewVideo && (
                <div className="bg-black rounded-xl overflow-hidden mb-3">
                    <video
                        src={`${BACKEND_API.BASE_URL}/api/tiktok/serve/${encodeURIComponent(previewVideo)}`}
                        className="w-full max-h-[300px] object-contain"
                        controls
                        autoPlay
                    />
                </div>
            )}

            {loading ? (
                <div className="text-center py-8 text-slate-500 text-sm">Loading...</div>
            ) : videos.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No videos found</div>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    {videos.map(v => (
                        <div
                            key={v.filename}
                            className="bg-[#121218] border border-white/5 rounded-xl overflow-hidden group hover:border-white/10 transition-colors"
                        >
                            {/* Thumbnail / click to preview */}
                            <button
                                onClick={() => setPreviewVideo(v.path)}
                                className="w-full aspect-video bg-black/50 flex items-center justify-center relative"
                            >
                                {v.thumbnail_url ? (
                                    <img
                                        src={`${BACKEND_API.BASE_URL}/api/tiktok/serve/${encodeURIComponent(v.thumbnail_url)}`}
                                        className="w-full h-full object-cover"
                                        alt=""
                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                ) : (
                                    <Play className="w-6 h-6 text-slate-600" />
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                    <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
                                </div>
                            </button>

                            {/* Info + Extract button */}
                            <div className="p-2">
                                <div className="text-[10px] text-slate-400 truncate">{v.filename}</div>
                                <div className="flex items-center justify-between mt-1.5">
                                    <span className="text-[9px] text-slate-600">{v.size_mb.toFixed(1)} MB</span>
                                    <button
                                        onClick={() => {
                                            onExtractFrames(v.path, v.filename);
                                            toast(`Extracting frames from ${v.filename}`, 'info');
                                        }}
                                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                                        title="Extract frames"
                                    >
                                        <Scissors className="w-3 h-3" />
                                        Frames
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
