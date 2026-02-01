// Hook for WebSocket connection to ComfyUI
import { useEffect, useRef } from 'react';
import { comfyService } from '../services/comfyService';

export const useComfyWebSocket = (
    onMessage: (data: any) => void,
    enabled: boolean = true
) => {
    const messageHandler = useRef(onMessage);

    useEffect(() => {
        messageHandler.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        if (!enabled) return;

        comfyService.connectWebSocket((data) => {
            messageHandler.current(data);
        });

        return () => {
            comfyService.disconnectWebSocket();
        };
    }, [enabled]);
};
