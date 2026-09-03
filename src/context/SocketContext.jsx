import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getLocalToken, getLocalUser } from '../services/auth';

// Check if socket connection is feasible (avoid Mixed Content or serverless proxy failures on HTTPS)
const getSocketUrl = () => {
    // If on localhost / development, connect to local backend
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return process.env.REACT_APP_SOCKET_URL || 'http://5.189.144.230:9000';
    }
    // If a secure wss/https socket URL is explicitly provided in env
    if (process.env.REACT_APP_SOCKET_URL && process.env.REACT_APP_SOCKET_URL.startsWith('https://')) {
        return process.env.REACT_APP_SOCKET_URL;
    }
    return null;
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
            const targetUrl = getSocketUrl();

            // Do not attempt connection if no token or if no valid socket server available for this protocol
            if (!token || !targetUrl) {
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
                socketInstance = io(targetUrl, {
                    transports: ['websocket', 'polling'],
                    auth: {
                        token: token,
                        user_uuid: userUuid || '',
                    },
                    query: {
                        token: token,
                        user_uuid: userUuid || '',
                    },
                    reconnection: true,
                    reconnectionAttempts: 3,
                    reconnectionDelay: 3000,
                    timeout: 8000,
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

