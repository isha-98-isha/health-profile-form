import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getLocalToken, getLocalUser } from '../services/auth';

// When running on HTTPS (such as Vercel), connect to the same origin to route through Vercel's proxy rewrite over HTTPS
const getSocketUrl = () => {
    if (process.env.REACT_APP_SOCKET_URL && !window.location.origin.startsWith('https://')) {
        return process.env.REACT_APP_SOCKET_URL;
    }
    // On HTTPS, use same origin so requests/polling go through HTTPS rewrite /socket.io without Mixed Content error
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
        return window.location.origin;
    }
    return process.env.REACT_APP_SOCKET_URL || 'http://5.189.144.230:9000';
};

const SocketContext = createContext({
    socket: null,
    isConnected: false,
    refreshKey: 0,
});

let socketInstance = null;

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(socketInstance);
    const [isConnected, setIsConnected] = useState(socketInstance?.connected || false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const initializeSocket = () => {
            const token = getLocalToken();
            const user = getLocalUser();
            const userUuid = user?.uuid || user?.id || user?.user_uuid;

            if (!token) {
                if (socketInstance) {
                    socketInstance.disconnect();
                    socketInstance = null;
                    setSocket(null);
                    setIsConnected(false);
                }
                return;
            }

            // Reuse existing connected socket instance across route changes and StrictMode.
            if (!socketInstance) {
                const targetUrl = getSocketUrl();
                socketInstance = io(targetUrl, {
                    path: '/socket.io/',
                    transports: ['polling', 'websocket'],
                    auth: {
                        token: token,
                        user_uuid: userUuid || '',
                    },
                    query: {
                        token: token,
                        user_uuid: userUuid || '',
                    },
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 2000,
                    timeout: 10000,
                });

                socketInstance.on('connect', () => {
                    console.log('Connected to Socket.IO. Socket ID:', socketInstance.id);
                    setIsConnected(true);
                });

                socketInstance.on('disconnect', (reason) => {
                    console.log('Disconnected from Socket.IO:', reason);
                    setIsConnected(false);
                });

                socketInstance.on('connect_error', (error) => {
                    console.warn('Socket.IO Connection Notice:', error.message);
                });

                // Any server event may change a dashboard record; refetch from the API.
                socketInstance.onAny((eventName) => {
                    console.log('Socket event received:', eventName);
                    setRefreshKey((currentKey) => currentKey + 1);
                });
            }

            setSocket(socketInstance);
            setIsConnected(socketInstance.connected);
        };

        initializeSocket();
        window.addEventListener('vyonic-auth-changed', initializeSocket);
        return () => window.removeEventListener('vyonic-auth-changed', initializeSocket);
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected, refreshKey }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    return context;
};

export default SocketContext;

