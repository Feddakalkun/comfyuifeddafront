// Hook for checking ComfyUI connection status
import { useState, useEffect } from 'react';
import { comfyService } from '../services/comfyService';

export const useComfyStatus = (pollInterval: number = 3000) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const checkStatus = async () => {
            try {
                const alive = await comfyService.isAlive();
                setIsConnected(alive);
            } catch (error) {
                setIsConnected(false);
            } finally {
                setIsLoading(false);
            }
        };

        // Check immediately
        checkStatus();

        // Then poll at interval
        intervalId = setInterval(checkStatus, pollInterval);

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [pollInterval]);

    return { isConnected, isLoading };
};
