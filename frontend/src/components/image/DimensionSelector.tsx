import { useState } from 'react';

const PRESETS = [
    { label: '768x1152 (2:3 Portrait)', value: '768x1152' },
    { label: '1152x768 (3:2 Landscape)', value: '1152x768' },
    { label: '1024x1536 (2:3 Portrait HD)', value: '1024x1536' },
    { label: '1536x1024 (3:2 Landscape HD)', value: '1536x1024' },
    { label: '1024x1024 (1:1 Square)', value: '1024x1024' },
    { label: '768x768 (1:1 Small)', value: '768x768' },
    { label: '1920x1080 (16:9 Full HD)', value: '1920x1080' },
    { label: '1080x1920 (9:16 Vertical)', value: '1080x1920' },
    { label: '1280x720 (16:9 HD)', value: '1280x720' },
    { label: '720x1280 (9:16 HD Vertical)', value: '720x1280' },
];

interface DimensionSelectorProps {
    dimensions: string;
    setDimensions: (v: string) => void;
}

export const DimensionSelector = ({ dimensions, setDimensions }: DimensionSelectorProps) => {
    const isCustom = !PRESETS.some(p => p.value === dimensions);
    const [showCustom, setShowCustom] = useState(isCustom);
    const [customW, setCustomW] = useState(() => {
        const [w] = dimensions.split('x').map(Number);
        return w || 1024;
    });
    const [customH, setCustomH] = useState(() => {
        const [, h] = dimensions.split('x').map(Number);
        return h || 1536;
    });

    const handlePresetChange = (val: string) => {
        if (val === 'custom') {
            setShowCustom(true);
        } else {
            setShowCustom(false);
            setDimensions(val);
        }
    };

    const applyCustom = (w: number, h: number) => {
        // Snap to multiples of 8 (required for latent space)
        const snappedW = Math.round(w / 8) * 8;
        const snappedH = Math.round(h / 8) * 8;
        setCustomW(snappedW);
        setCustomH(snappedH);
        setDimensions(`${snappedW}x${snappedH}`);
    };

    const [w, h] = dimensions.split('x').map(Number);
    const megapixels = ((w * h) / 1_000_000).toFixed(1);

    return (
        <div>
            <label className="block text-xs text-slate-400 mb-2">
                Dimensions: {dimensions} ({megapixels}MP)
            </label>
            <select
                value={showCustom ? 'custom' : dimensions}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-white/20"
            >
                {PRESETS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                ))}
                <option value="custom">Custom...</option>
            </select>

            {showCustom && (
                <div className="mt-3 flex items-center gap-2">
                    <input
                        type="number"
                        value={customW}
                        min={256}
                        max={4096}
                        step={8}
                        onChange={(e) => {
                            const v = parseInt(e.target.value) || 1024;
                            setCustomW(v);
                        }}
                        onBlur={() => applyCustom(customW, customH)}
                        className="w-24 bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-white/20 text-center"
                    />
                    <span className="text-slate-500 text-xs">x</span>
                    <input
                        type="number"
                        value={customH}
                        min={256}
                        max={4096}
                        step={8}
                        onChange={(e) => {
                            const v = parseInt(e.target.value) || 1536;
                            setCustomH(v);
                        }}
                        onBlur={() => applyCustom(customW, customH)}
                        className="w-24 bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-white/20 text-center"
                    />
                    <button
                        onClick={() => applyCustom(customW, customH)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white transition-colors"
                    >
                        Apply
                    </button>
                </div>
            )}
        </div>
    );
};
