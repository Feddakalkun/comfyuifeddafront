// ComfyUI API Service
import { COMFY_API } from '../config/api';
import type { ComfyPrompt, ComfyQueueItem, ComfyHistoryItem } from '../types/comfy';

class ComfyUIService {
    private clientId: string;
    private ws: WebSocket | null = null;

    constructor() {
        this.clientId = this.generateClientId();
    }

    private generateClientId(): string {
        return `comfyfront_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Check if ComfyUI is running
     */
    async isAlive(): Promise<boolean> {
        try {
            const response = await fetch(`${COMFY_API.BASE_URL}/system_stats`, {
                method: 'GET',
            });
            return response.ok;
        } catch (error) {
            console.error('ComfyUI connection failed:', error);
            return false;
        }
    }

    /**
     * Queue a prompt for generation
     */
    async queuePrompt(workflow: any): Promise<{ prompt_id: string }> {
        const payload: ComfyPrompt = {
            prompt: workflow,
            client_id: this.clientId,
        };

        const response = await fetch(`${COMFY_API.BASE_URL}${COMFY_API.ENDPOINTS.PROMPT}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Failed to queue prompt: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Get current queue status
     */
    async getQueue(): Promise<{ queue_running: ComfyQueueItem[]; queue_pending: ComfyQueueItem[] }> {
        const response = await fetch(`${COMFY_API.BASE_URL}${COMFY_API.ENDPOINTS.QUEUE}`);

        if (!response.ok) {
            throw new Error('Failed to fetch queue');
        }

        return await response.json();
    }

    /**
     * Get history of generated images
     */
    async getHistory(promptId?: string): Promise<Record<string, ComfyHistoryItem>> {
        const url = promptId
            ? `${COMFY_API.BASE_URL}${COMFY_API.ENDPOINTS.HISTORY}/${promptId}`
            : `${COMFY_API.BASE_URL}${COMFY_API.ENDPOINTS.HISTORY}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to fetch history');
        }

        return await response.json();
    }

    /**
     * Get URL for viewing an image
     */
    getImageUrl(filename: string, subfolder: string = '', type: string = 'output'): string {
        const params = new URLSearchParams({
            filename,
            subfolder,
            type,
        });

        return `${COMFY_API.BASE_URL}${COMFY_API.ENDPOINTS.VIEW}?${params}`;
    }

    /**
     * Upload an image to ComfyUI
     */
    async uploadImage(file: File): Promise<{ name: string; subfolder: string }> {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${COMFY_API.BASE_URL}${COMFY_API.ENDPOINTS.UPLOAD_IMAGE}`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload image');
        }

        return await response.json();
    }

    /**
     * Get available LoRAs from ComfyUI
     */
    async getLoras(): Promise<string[]> {
        try {
            // Fetch object info for LoraLoader to get the list of files
            const response = await fetch(`${COMFY_API.BASE_URL}/object_info/LoraLoader`);
            if (!response.ok) throw new Error('Failed to fetch LoRAs');

            const data = await response.json();
            // LoraLoader.input.required.lora_name returns [list_of_loras]
            // The structure is { "LoraLoader": { "input": { "required": { "lora_name": [ ["lora1.safetensors", "lora2.safetensors"] ] } } } }
            // Actually it's simpler, usually inputs -> required -> lora_name -> [0] is the list

            // Let's safe guard access
            const loraList = data.LoraLoader?.input?.required?.lora_name?.[0] || [];
            return loraList;
        } catch (error) {
            console.error('Failed to load LoRAs:', error);
            // Fallback: Return empty list
            return [];
        }
    }

    /**
     * Get available styles from 'Load Styles CSV' node
     */
    async getStyles(): Promise<string[]> {
        try {
            const response = await fetch(`${COMFY_API.BASE_URL}/object_info/Load Styles CSV`);
            if (!response.ok) throw new Error('Failed to fetch styles');

            const data = await response.json();
            // Load Styles CSV node structure: input -> required -> styles -> [0]
            const styleList = data['Load Styles CSV']?.input?.required?.styles?.[0] || [];
            return styleList;
        } catch (error) {
            console.error('Failed to load styles:', error);
            // Return defaults if failed
            return ['No Style', 'Photographic', 'Cinematic', 'Anime', 'Digital Art'];
        }
    }
    /**
     * Connect to WebSocket for real-time updates and return a listener cleanup function
     */
    connectWebSocket(callbacks: {
        onStatus?: (data: any) => void;
        onProgress?: (node: string, value: number, max: number) => void;
        onExecuting?: (nodeId: string | null) => void;
        onCompleted?: (promptId: string) => void;
    }): () => void {
        this.ws = new WebSocket(`${COMFY_API.WS_URL}?clientId=${this.clientId}`);

        this.ws.onopen = () => console.log('✅ WebSocket connected to ComfyUI');

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                switch (data.type) {
                    case 'status':
                        callbacks.onStatus?.(data.data);
                        break;
                    case 'progress':
                        callbacks.onProgress?.(data.data.node, data.data.value, data.data.max);
                        break;
                    case 'executing':
                        callbacks.onExecuting?.(data.data.node);
                        break;
                    case 'executed':
                        if (data.data.prompt_id) {
                            callbacks.onCompleted?.(data.data.prompt_id);
                        }
                        break;
                }
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        this.ws.onerror = (error) => console.error('WebSocket error:', error);

        return () => {
            if (this.ws) {
                this.ws.close();
                this.ws = null;
            }
        };
    }
}

export const comfyService = new ComfyUIService();
