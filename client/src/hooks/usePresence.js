import { useState, useEffect } from 'react';
import api from '../api';

const POLL_INTERVAL = 10000; // check every 10s

export function usePresence(userId) {
    const [online, setOnline] = useState(false);

    useEffect(() => {
        if (!userId) return;

        let cancelled = false;

        const check = async () => {
            try {
                const res = await api.get(`/presence/${userId}`);
                if (!cancelled) setOnline(res.data.online);
            } catch (err) {
                console.error('Presence check failed:', err);
            }
        };

        check(); // check immediately on mount
        const interval = setInterval(check, POLL_INTERVAL);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [userId]);

    return online;
}
