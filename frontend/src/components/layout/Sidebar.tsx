// Sidebar Navigation Component
import { useState } from 'react';
import {
    Image as ImageIcon,
    Video,
    Music,
    Settings,
    Terminal,
    ChevronRight,
} from 'lucide-react';
import { StatusIndicator } from '../ui/StatusIndicator';
import { APP_CONFIG, MODELS } from '../../config/api';

interface SidebarProps {
    activeTab: string;
    activeSubTab: string | null;
    onTabChange: (tab: string, subTab?: string) => void;
}

export const Sidebar = ({ activeTab, activeSubTab, onTabChange }: SidebarProps) => {
    const navigation = [
        {
            id: 'image',
            label: 'Image Generation',
            icon: ImageIcon,
            models: MODELS.IMAGE,
        },
        {
            id: 'video',
            label: 'Video/VFX',
            icon: Video,
            models: MODELS.VIDEO,
        },
        {
            id: 'audio',
            label: 'Audio/SFX',
            icon: Music,
            models: MODELS.AUDIO,
        },
        { id: 'logs', label: 'Console Logs', icon: Terminal },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <aside className="w-72 bg-[#0F0F16] border-r border-white/5 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-6 pb-8">
                <h1 className="text-2xl font-bold bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent tracking-tight">
                    {APP_CONFIG.NAME}<span className="text-purple-500">.</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium tracking-wider mt-1 uppercase">
                    {APP_CONFIG.DESCRIPTION}
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => (
                    <div key={item.id}>
                        <button
                            onClick={() => {
                                const firstModel = item.models?.[0]?.id;
                                onTabChange(item.id, firstModel);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.id
                                    ? 'bg-purple-600/10 text-white shadow-[0_0_20px_rgba(168,85,247,0.1)] border border-purple-500/10'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon
                                    className={`w-5 h-5 ${activeTab === item.id
                                            ? 'text-purple-400'
                                            : 'text-slate-500 group-hover:text-slate-300'
                                        } transition-colors`}
                                />
                                <span className="font-medium text-sm">{item.label}</span>
                            </div>
                            {item.models && (
                                <ChevronRight
                                    className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${activeTab === item.id ? 'rotate-90 text-purple-500' : ''
                                        }`}
                                />
                            )}
                        </button>

                        {/* Sub-menu */}
                        {activeTab === item.id && item.models && (
                            <div className="pl-12 pr-2 py-2 space-y-1 animate-in slide-in-from-top-2 fade-in duration-200">
                                {item.models.map((model) => (
                                    <button
                                        key={model.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onTabChange(item.id, model.id);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeSubTab === model.id
                                                ? 'bg-white/10 text-white'
                                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                            }`}
                                    >
                                        <span className="text-xs">●</span>
                                        <span>{model.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            {/* Status Footer */}
            <div className="p-4 border-t border-white/5">
                <StatusIndicator />
            </div>
        </aside>
    );
};
