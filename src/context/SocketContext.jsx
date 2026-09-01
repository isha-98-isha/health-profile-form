import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getLocalToken, getLocalUser } from '../services/auth';

// Use the current host or socket server URL
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || (window.location.protocol === 'https:' ? 'https://api.dalveco.com' : 'http://5.189.144.230:9000');

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
                socketInstance = io(SOCKET_URL, {
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
                    reconnectionAttempts: 5,
                    reconnectionDelay: 2000,
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

