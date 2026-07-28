import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const { token, isAuthenticated } = useAuth();
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!isAuthenticated || !token) return;

        const socket = io(import.meta.env.VITE_API_URL, {
            auth: { token }
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            setConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
            setConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
        });

        socketRef.current = socket;

        // Heartbeat to keep presence alive, matching the server's 30s TTL
        const heartbeatInterval = setInterval(() => {
            socket.emit('heartbeat');
        }, 15000);

        return () => {
            clearInterval(heartbeatInterval);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [isAuthenticated, token]);

    return (
        <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
        {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}
