import { useState, useEffect } from 'react';
import { QrCode, Settings, Link, Unlink, LoaderCircle } from 'lucide-react';
import PageMeta from '@/utils/common/PageMeta';
import PageBreadcrumb from '@/utils/common/PageBreadCrumb';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:8001';

const Pairing = () => {
    const [connectionStatus, setConnectionStatus] = useState('Initializing...');
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'qr' | 'settings'>('qr');

    useEffect(() => {
        const socket = io(SOCKET_SERVER_URL, {
            reconnectionAttempts: 5,
            reconnectionDelay: 5000,
            transports: ['websocket'], // Force WebSocket transport for reliability
        });

        socket.on('connect', () => {
            console.log('Socket.IO connected:', socket.id);
            setConnectionStatus('Waiting for Status...');
            // Fetch initial status from REST API to sync with backend
            fetch(`${SOCKET_SERVER_URL}/api/status`)
                .then(res => res.json())
                .then(data => {
                    console.log('Initial status from API:', data);
                    if (data.status === 'CONNECTED') {
                        setConnectionStatus('Connected');
                        setQrCodeUrl(null);
                    } else if (data.status === 'DISCONNECTED' || data.status === 'AUTHENTICATION_FAILURE') {
                        setConnectionStatus('Disconnected');
                    } else {
                        setConnectionStatus('Awaiting QR Code...');
                    }
                })
                .catch(err => {
                    console.error('Failed to fetch initial status:', err);
                    setConnectionStatus('Server Unavailable');
                });
        });

        socket.on('qr', (url: string) => {
            console.log('Received QR code:', url);
            setQrCodeUrl(url);
            setConnectionStatus('QR Code Ready');
            setActiveTab('qr');
        });

        socket.on('status', (status: string) => {
            console.log('Received status:', status);
            setConnectionStatus(status);
            if (status === 'Connected') {
                setQrCodeUrl(null);
            }
        });

        socket.on('disconnect', () => {
            console.log('Socket.IO disconnected');
            setConnectionStatus('Server Disconnected');
        });

        socket.on('connect_error', (err) => {
            console.error('Socket.IO connect error:', err.message);
            setConnectionStatus('Server Unavailable');
        });

        socket.on('reconnect_attempt', (attempt) => {
            console.log(`Reconnect attempt ${attempt}`);
            setConnectionStatus('Reconnecting...');
        });

        socket.on('reconnect_failed', () => {
            console.error('Socket.IO reconnect failed');
            setConnectionStatus('Server Unavailable');
        });

        return () => {
            console.log('Disconnecting Socket.IO');
            socket.disconnect();
        };
    }, []);

    const handleDisconnect = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${SOCKET_SERVER_URL}/api/disconnect`, { method: 'POST' });
            if (!response.ok) {
                throw new Error(`Disconnect failed: ${response.statusText}`);
            }
            setConnectionStatus('Disconnecting...');
        } catch (error) {
            console.error('Failed to disconnect:', error);
            setConnectionStatus('Error');
        } finally {
            setIsLoading(false);
        }
    };

    // const HandleReconnect = () => {
    //     window.location.reload();
    // };

    const isConnected = connectionStatus === 'Connected';

    const getStatusIndicator = () => {
        switch (connectionStatus) {
            case 'Connected':
                return 'bg-green-500';
            case 'Server Unavailable':
            case 'Error':
            case 'Server Disconnected':
                return 'bg-red-500';
            default:
                return 'bg-yellow-500';
        }
    };

    return (
        <>
            <PageMeta title="Lucosms - WhatsApp Connection" description={'WhatsApp Connection'} />
            <PageBreadcrumb pageTitle="WhatsApp Connection" />
            <div className="max-w-4xl">
                <div className="p-6 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">WhatsApp Connection</h2>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700/50">
                            <span className={`w-2.5 h-2.5 rounded-full ${getStatusIndicator()}`}></span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{connectionStatus}</span>
                        </div>
                    </div>

                    <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex gap-6" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('qr')}
                                className={`shrink-0 border.b-2 px-1 pb-4 text-sm font-medium flex items-center gap-2 ${
                                    activeTab === 'qr'
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            >
                                <QrCode size={18} />
                                <span>QR Code</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`shrink-0 border-b-2 px-1 pb-4 text-sm font-medium flex items-center gap-2 ${
                                    activeTab === 'settings'
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            >
                                <Settings size={18} />
                                <span>Settings</span>
                            </button>
                        </nav>
                    </div>

                    <div className="min-h-[320px]">
                        {activeTab === 'qr' && (
                            <div className="text-center flex flex-col items-center justify-center p-4 border-dashed border-2 border-gray-200 dark:border-gray-700 rounded-lg h-full">
                                {isConnected ? (
                                    <div className="text-center text-green-500">
                                        <Link size={60} className="mx-auto mb-4" />
                                        <h3 className="text-2xl font-semibold">Device Connected</h3>
                                        <p className="text-gray-500 dark:text-gray-400">You can now send messages.</p>
                                    </div>
                                ) : qrCodeUrl ? (
                                    <div className="w-64 h-64 bg-white rounded-lg flex items-center justify-center p-2 border border-gray-300 dark:border-gray-600">
                                        <img src={qrCodeUrl} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
                                    </div>
                                ) : connectionStatus === 'Server Unavailable' || connectionStatus === 'Server Disconnected' ? (
                                    <div className="text-center text-red-500">
                                        <Unlink size={60} className="mx-auto mb-4" />
                                        <h3 className="text-2xl font-semibold">Connection Lost</h3>
                                        <p className="text-gray-500 dark:text-gray-400 mb-6">Could not connect to the server.</p>
                                        <button
                                            // onClick={handleReconnect}
                                            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Try to Reconnect
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <LoaderCircle className="animate-spin text-gray-400 dark:text-gray-500 mx-auto" size={60} />
                                        <p className="text-gray-500 dark:text-gray-400 mt-4">{connectionStatus}...</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'settings' && (
                            <div className="p-4">
                                <h3 className="text-lg font-semibold mb-4">Connection Settings</h3>
                                <button
                                    onClick={handleDisconnect}
                                    disabled={!isConnected || isLoading}
                                    className="w-full max-w-xs flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-red-500/50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isLoading ? <LoaderCircle className="animate-spin" /> : <Unlink />}
                                    <span>Disconnect Device</span>
                                </button>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    This will log out the current WhatsApp session.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Pairing;