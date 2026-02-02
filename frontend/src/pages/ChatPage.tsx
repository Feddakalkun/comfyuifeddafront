import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Image as ImageIcon, Loader2, Type, Mic, Square, Volume2, VolumeX } from 'lucide-react';
import { assistantService } from '../services/assistantService';
import { comfyService } from '../services/comfyService';
import { ollamaService } from '../services/ollamaService';
import ReactMarkdown from 'react-markdown';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    type?: 'text' | 'image-generation-request' | 'image-result';
    timestamp: number;
    metadata?: any;
}

// System prompt to guide the Agent
const AGENT_SYSTEM_PROMPT = `You are "Fedda Agent", a helpful creative AI assistant for a ComfyUI platform.
Your goal is to help the user with conversation and image generation when requested.

BEHAVIOR:
1. You are a conversational partner FIRST. Answer questions, discuss topics, and be helpful.
2. ONLY trigger image generation if the user EXPLICITLY uses phrases like:
   - "generate an image of..."
   - "create a picture of..."
   - "make an image showing..."
   - "show me a picture of..."
3. If the user just says "hello", "hi", or has casual conversation, respond normally WITHOUT generating images.
4. If the user describes a scene but doesn't ask for an image, just discuss it with them.
5. When you DO generate, use this format:

   <<GENERATE>>
   [Standard Stable Diffusion Prompt: Subject, Action, Context, Style, Lighting, Artist, Tech Specs]
   <</GENERATE>>

   (You can add conversational text before or after the block).

IMPORTANT: DO NOT trigger generation on greeting messages or casual conversation!`;

export const ChatPage = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hey! I'm your creative AI assistant. I can help you brainstorm ideas, answer questions, and generate images when you need them. How can I help you?",
            timestamp: Date.now(),
            type: 'text'
        }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [generatingMsgId, setGeneratingMsgId] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [executionStatus, setExecutionStatus] = useState('');
    const [progress, setProgress] = useState(0);
    const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [recordingMode, setRecordingMode] = useState<'hold' | 'toggle'>('hold');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimeoutRef = useRef<number | null>(null);

    // TTS State
    const [ttsEnabled, setTtsEnabled] = useState(false);
    const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
    const [generatingTtsId, setGeneratingTtsId] = useState<string | null>(null);
    const [voiceStyle, setVoiceStyle] = useState('female, clear voice');
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fontSizeClasses = {
        small: 'text-sm',
        medium: 'text-base',
        large: 'text-lg'
    };

    // Fetch Models on Mount
    useEffect(() => {
        const fetchModels = async () => {
            try {
                const models = await ollamaService.getModels();
                if (models.length > 0) {
                    // Heuristic to pick a good chat model: prefer 'qwen' or 'llama'
                    const preferred = models.find(m => m.name.toLowerCase().includes('qwen') || m.name.toLowerCase().includes('llama'));
                    const chosen = preferred ? preferred.name : models[0].name;
                    console.log('Chat Agent using model:', chosen);
                    setSelectedModel(chosen);
                } else {
                    console.warn('No Ollama models found.');
                    setMessages(prev => [...prev, {
                        id: 'no-model',
                        role: 'assistant',
                        content: "⚠️ I couldn't find any AI models installed in Ollama. Please install one (like llama3 or qwen) first!",
                        timestamp: Date.now(),
                        type: 'text'
                    }]);
                }
            } catch (error) {
                console.error('Failed to load models:', error);
                setMessages(prev => [...prev, {
                    id: 'model-error',
                    role: 'assistant',
                    content: "⚠️ I couldn't connect to Ollama. Make sure it's running!",
                    timestamp: Date.now(),
                    type: 'text'
                }]);
            }
        };
        fetchModels();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isThinking]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: Date.now(),
            type: 'text'
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);

        try {
            // Prepare history for Ollama
            // We filter out image-result types to keep context clean, or just map them to text
            const history = messages.map(m => ({
                role: m.role,
                content: m.content.replace(/<<GENERATE>>[\s\S]*?<<\/GENERATE>>/g, '[Image Prompt Generated]') // Simple cleanup if needed
            }));
            history.push({ role: 'user', content: userMsg.content });

            // Add system prompt at the start
            const fullHistory = [{ role: 'system', content: AGENT_SYSTEM_PROMPT }, ...history];

            // Use Ollama to chat
            // Use Ollama to chat with selected model
            const responseText = await assistantService.chat(selectedModel, fullHistory);

            // Parse response for <<GENERATE>>
            const genMatch = responseText.match(/<<GENERATE>>([\s\S]*?)<<\/GENERATE>>/);

            if (genMatch) {
                const textPart = responseText.replace(/<<GENERATE>>[\s\S]*?<<\/GENERATE>>/, '').trim();
                const promptPart = genMatch[1].trim();

                // Add the text part if it exists
                if (textPart) {
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: textPart,
                        timestamp: Date.now(),
                        type: 'text'
                    }]);
                }

                // Add the generation request card
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: promptPart,
                    timestamp: Date.now(),
                    type: 'image-generation-request'
                }]);

            } else {
                // Normal text response
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: responseText,
                    timestamp: Date.now(),
                    type: 'text'
                }]);
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Sorry, I had trouble connecting to the brain (Ollama). Is it running?",
                timestamp: Date.now(),
                type: 'text'
            }]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleGenerateImage = async (msgId: string, prompt: string) => {
        setGeneratingMsgId(msgId);

        try {
            // Free VRAM from Ollama before ComfyUI generation
            if (selectedModel) {
                await ollamaService.unloadModel(selectedModel);
            }

            // Load the same Z-Image workflow as ImagePage
            const response = await fetch('/workflows/z-image.json');
            if (!response.ok) throw new Error('Failed to load Z-Image workflow');
            const workflow = await response.json();

            // Generate random seed
            const seed = Math.floor(Math.random() * 1000000000);

            console.log('🤖 Agent generating image:', { prompt, seed });

            // Modify workflow parameters (same node IDs as ImagePage)
            if (workflow["3"]) {
                workflow["3"].inputs.seed = seed;
                workflow["3"].inputs.steps = 9;
                workflow["3"].inputs.cfg = 1;
            }

            // Node 33: Positive Prompt
            if (workflow["33"]) {
                workflow["33"].inputs.string = prompt;
            }

            // Node 34: Negative Prompt
            if (workflow["34"]) {
                workflow["34"].inputs.string = "text, watermark, blur, ugly";
            }

            // Node 30: Dimensions (1024x1024 default for chat)
            if (workflow["30"]) {
                workflow["30"].inputs.width = 1024;
                workflow["30"].inputs.height = 1024;
            }

            // 2. Queue the workflow and get prompt_id
            console.log('📤 Queueing workflow...');
            const { prompt_id } = await comfyService.queuePrompt(workflow);
            console.log('✅ Queued! Prompt ID:', prompt_id);

            // 3. Setup WebSocket for progress tracking
            const cleanup = comfyService.connectWebSocket({
                onExecuting: (nodeId) => {
                    if (!nodeId) {
                        setExecutionStatus('Finalizing...');
                        return;
                    }
                    const statusMap: Record<string, string> = {
                        '3': 'Generating Image (Sampling)...',
                        '126': 'Loading LoRAs...',
                        '9': 'Saving Image...',
                    };
                    setExecutionStatus(statusMap[nodeId] || `Processing Node ${nodeId}...`);
                },
                onProgress: (_node, value, max) => {
                    setProgress(Math.round((value / max) * 100));
                }
            });

            // 4. Poll for completion and fetch image
            let attempts = 0;
            const maxAttempts = 60; // Wait up to 120s (60 * 2s) for generation
            let imageUrl: string | null = null;

            while (attempts < maxAttempts && !imageUrl) {
                attempts++;
                await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds between attempts

                console.log(`📚 Fetching history (attempt ${attempts}/${maxAttempts})...`);

                try {
                    const history = await comfyService.getHistory(prompt_id);

                    if (history[prompt_id] && history[prompt_id].outputs) {
                        const outputs = history[prompt_id].outputs['9'];

                        if (outputs && outputs.images && outputs.images.length > 0) {
                            const img = outputs.images[0];
                            imageUrl = comfyService.getImageUrl(img.filename, img.subfolder, img.type);
                            console.log('✅ Image found!', imageUrl);
                        }
                    }
                } catch (err) {
                    console.warn(`⚠️ Attempt ${attempts} failed:`, err);
                }
            }

            cleanup();

            if (!imageUrl) {
                throw new Error('Failed to retrieve image after all attempts');
            }

            // 4. Add Image Result Message
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: prompt, // Keep prompt as content or reference
                type: 'image-result',
                timestamp: Date.now(),
                metadata: { imageUrl }
            }]);

        } catch (error) {
            console.error("Gen Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Something went wrong sending the image to ComfyUI.",
                timestamp: Date.now(),
                type: 'text'
            }]);
        } finally {
            setGeneratingMsgId(null);
            setExecutionStatus('');
            setProgress(0);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Voice Recording Functions
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Use webm/opus for best compatibility and smallest size
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                stream.getTracks().forEach(track => track.stop());
                await transcribeAudio(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);

            // Auto-stop after 30 seconds
            recordingTimeoutRef.current = setTimeout(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    stopRecording();
                }
            }, 30000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: '⚠️ Could not access microphone. Please check permissions.',
                timestamp: Date.now(),
                type: 'text'
            }]);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (recordingTimeoutRef.current) {
                clearTimeout(recordingTimeoutRef.current);
                recordingTimeoutRef.current = null;
            }
        }
    };

    const transcribeAudio = async (audioBlob: Blob) => {
        setIsTranscribing(true);
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const response = await fetch('/api/audio/transcribe', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Transcription failed');
            }

            const data = await response.json();
            const transcribedText = data.text || '';

            if (transcribedText.trim()) {
                // Option C from questions: both flows available
                // For now, set in input field so user can edit before sending
                setInput(prev => prev + (prev ? ' ' : '') + transcribedText);
            } else {
                throw new Error('No speech detected');
            }

        } catch (error) {
            console.error('Transcription error:', error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: '⚠️ Could not transcribe audio. Please try again.',
                timestamp: Date.now(),
                type: 'text'
            }]);
        } finally {
            setIsTranscribing(false);
        }
    };

    const handleMicMouseDown = () => {
        if (recordingMode === 'hold') {
            startRecording();
        }
    };

    const handleMicMouseUp = () => {
        if (recordingMode === 'hold' && isRecording) {
            stopRecording();
        }
    };

    const handleMicClick = () => {
        if (recordingMode === 'toggle') {
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        }
    };

    // TTS Functions
    const playTTS = async (messageId: string, text: string) => {
        try {
            setGeneratingTtsId(messageId);

            // Generate TTS
            const response = await fetch('/api/audio/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    voice_style: voiceStyle
                })
            });

            if (!response.ok) throw new Error('TTS generation failed');

            // Get audio blob
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            // Stop any currently playing audio
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
                audioPlayerRef.current = null;
            }

            // Create and play audio
            const audio = new Audio(audioUrl);
            audioPlayerRef.current = audio;
            setPlayingMsgId(messageId);
            setGeneratingTtsId(null);

            audio.onended = () => {
                setPlayingMsgId(null);
                URL.revokeObjectURL(audioUrl);
            };

            audio.onerror = () => {
                setPlayingMsgId(null);
                setGeneratingTtsId(null);
                URL.revokeObjectURL(audioUrl);
            };

            await audio.play();

        } catch (error) {
            console.error('TTS error:', error);
            setPlayingMsgId(null);
            setGeneratingTtsId(null);
        }
    };

    const stopTTS = () => {
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current = null;
        }
        setPlayingMsgId(null);
    };

    // Auto-play TTS for new assistant messages when enabled
    useEffect(() => {
        if (!ttsEnabled || messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'assistant' && lastMessage.type === 'text' && !playingMsgId && !generatingTtsId) {
            // Auto-play with a slight delay to feel natural
            setTimeout(() => {
                playTTS(lastMessage.id, lastMessage.content);
            }, 300);
        }
    }, [messages, ttsEnabled]);

    return (
        <div className="flex flex-col h-full max-w-7xl mx-auto w-full relative">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 z-10 bg-gradient-to-b from-[#050508] to-transparent">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 opacity-50 pointer-events-none">
                        <Bot className="w-5 h-5" />
                        <span className="text-sm font-medium tracking-wider uppercase">Fedda Agent</span>
                    </div>

                    {/* Font Size Control */}
                    <div className="flex items-center gap-2 pointer-events-auto">
                        <Type className="w-4 h-4 text-slate-500" />
                        <div className="flex gap-1 bg-[#121218] border border-white/10 rounded-lg p-1">
                            {(['small', 'medium', 'large'] as const).map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setFontSize(size)}
                                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${fontSize === size
                                        ? 'bg-white text-black'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
                                </button>
                            ))}
                        </div>

                        {/* TTS Controls */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setTtsEnabled(!ttsEnabled)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${ttsEnabled
                                    ? 'bg-white/10 text-white'
                                    : 'bg-white/5 text-slate-400 hover:text-white'
                                    }`}
                                title="Toggle AI voice responses"
                            >
                                {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                <span className="text-xs font-medium">Voice</span>
                            </button>

                            {/* Voice Style Selector */}
                            {ttsEnabled && (
                                <select
                                    value={voiceStyle}
                                    onChange={(e) => setVoiceStyle(e.target.value)}
                                    className="px-2 py-1 rounded-lg bg-[#121218] border border-white/10 text-xs text-white"
                                >
                                    <option value="female, clear voice">Female</option>
                                    <option value="man with low pitch tembre">Male Deep</option>
                                    <option value="cheerful woman">Cheerful</option>
                                    <option value="professional male narrator">Professional</option>
                                </select>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-20 space-y-8 custom-scrollbar">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1 shadow-inner">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                        )}

                        <div className={`max-w-[80%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

                            {/* Text Bubble */}
                            {msg.type === 'text' && (
                                <div className={`px-5 py-4 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                                    : 'bg-[#121218] border border-white/5 text-slate-200 shadow-xl'
                                    }`}>
                                    <div className={`prose prose-invert prose-sm max-w-none ${fontSizeClasses[fontSize]}`}>
                                        <ReactMarkdown>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            )}

                            {/* TTS Button for Assistant Messages */}
                            {msg.role === 'assistant' && msg.type === 'text' && (
                                <button
                                    onClick={() => {
                                        if (playingMsgId === msg.id) {
                                            stopTTS();
                                        } else {
                                            playTTS(msg.id, msg.content);
                                        }
                                    }}
                                    disabled={generatingTtsId === msg.id}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs text-white/50 hover:text-white/70 disabled:opacity-50"
                                    title={playingMsgId === msg.id ? "Stop" : "Play voice"}
                                >
                                    {generatingTtsId === msg.id ? (
                                        <>
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            <span>Generating...</span>
                                        </>
                                    ) : playingMsgId === msg.id ? (
                                        <>
                                            <VolumeX className="w-3 h-3" />
                                            <span>Stop</span>
                                        </>
                                    ) : (
                                        <>
                                            <Volume2 className="w-3 h-3" />
                                            <span>Play</span>
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Generation Request Card */}
                            {msg.type === 'image-generation-request' && (
                                <div className="bg-[#121218] border border-white/10 rounded-2xl p-5 shadow-2xl w-[400px] max-w-full animate-in zoom-in-95 duration-300">
                                    <div className="flex items-center gap-2 mb-3 text-white/50 text-xs font-bold tracking-wider uppercase">
                                        <Sparkles className="w-3 h-3" />
                                        <span>Ready to Generate</span>
                                    </div>
                                    <p className="text-sm text-slate-300 italic mb-4 border-l-2 border-white/20 pl-3 py-1">
                                        "{msg.content}"
                                    </p>

                                    {/* Progress Indicator */}
                                    {generatingMsgId === msg.id && executionStatus && (
                                        <div className="mb-4 space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400">{executionStatus}</span>
                                                <span className="text-white font-mono">{progress}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-white transition-all duration-300 ease-out"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleGenerateImage(msg.id, msg.content)}
                                        disabled={generatingMsgId !== null}
                                        className="w-full bg-white hover:bg-slate-200 text-black py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        {generatingMsgId === msg.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <ImageIcon className="w-4 h-4" />
                                                Generate Image
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Image Result Card */}
                            {msg.type === 'image-result' && (
                                <div className="bg-[#121218] border border-white/10 rounded-2xl p-2 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                                    <img
                                        src={msg.metadata?.imageUrl}
                                        alt="Generated"
                                        className="rounded-xl w-full h-auto object-cover max-h-[500px]"
                                    />
                                    <div className="p-3 flex items-center justify-between">
                                        <span className="text-xs text-slate-500 font-mono">Z-Image v1</span>
                                        <button className="text-xs text-white hover:underline">Download</button>
                                    </div>
                                </div>
                            )}

                        </div>

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                <User className="w-4 h-4 text-black" />
                            </div>
                        )}
                    </div>
                ))}

                {isThinking && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-[#121218] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 mb-4">
                <div className="relative max-w-4xl mx-auto">
                    {/* Mode Toggle Tooltip */}
                    {isRecording && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium animate-pulse">
                            Recording... ({recordingMode === 'hold' ? 'Release to stop' : 'Click to stop'})
                        </div>
                    )}

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message Fedda Agent..."
                        disabled={isRecording || isTranscribing}
                        className="w-full bg-[#121218] border border-white/10 rounded-2xl pl-6 pr-28 py-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none shadow-2xl custom-scrollbar disabled:opacity-50"
                        style={{ minHeight: '60px', maxHeight: '200px' }}
                    />

                    {/* Microphone Button */}
                    <button
                        onMouseDown={handleMicMouseDown}
                        onMouseUp={handleMicMouseUp}
                        onMouseLeave={handleMicMouseUp}
                        onClick={handleMicClick}
                        disabled={isTranscribing}
                        className={`absolute right-16 bottom-3 p-2 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isRecording
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-slate-700 text-white hover:bg-slate-600'
                            }`}
                        title={recordingMode === 'hold' ? 'Hold to record' : 'Click to start/stop'}
                    >
                        {isTranscribing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isRecording ? (
                            <Square className="w-4 h-4" />
                        ) : (
                            <Mic className="w-4 h-4" />
                        )}
                    </button>

                    {/* Mode Toggle (small button) */}
                    <button
                        onClick={() => setRecordingMode(mode => mode === 'hold' ? 'toggle' : 'hold')}
                        disabled={isRecording || isTranscribing}
                        className="absolute right-16 bottom-[-20px] text-[10px] text-slate-500 hover:text-white transition-all disabled:opacity-50"
                        title="Toggle recording mode"
                    >
                        {recordingMode === 'hold' ? '📌 Hold' : '🔘 Click'}
                    </button>

                    {/* Send Button */}
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isThinking || isRecording || isTranscribing}
                        className="absolute right-3 bottom-3 p-2 bg-white text-black rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
