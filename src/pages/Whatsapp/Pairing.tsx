import React, { useState, useEffect } from 'react';
import { whatsappService } from '../../services/whatsappService';
import { QrCode, Settings, Link, Unlink, LoaderCircle } from 'lucide-react';
import PageMeta from '@/utils/common/PageMeta';
import PageBreadcrumb from '@/utils/common/PageBreadCrumb';

interface Status {
  isConnected: boolean;
  qrCode: string | null;
  qrCodeDataUrl: string | null;
  user: { name: string } | null;
  lastMessage: {
    to: string;
    text: string;
    timestamp: string;
  } | null;
}

interface Log {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'status' | 'success';
}

const Pairing: React.FC = () => {
  const [status, setStatus] = useState<Status>({
    isConnected: false,
    qrCode: null,
    qrCodeDataUrl: null,
    user: null,
    lastMessage: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'settings'>('qr');
  const [logs, setLogs] = useState<Log[]>([]);

  const addLog = (message: string, type: Log['type'] = 'info') => {
    setLogs(prev => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        message,
        type
      }
    ]);
  };

  useEffect(() => {
    // Check connection status
    const checkStatus = async () => {
      try {
        const status = await whatsappService.getStatus();
        setStatus(status);
        
        const log: Log = {
          timestamp: new Date().toLocaleTimeString(),
          type: 'status',
          message: `Connection status updated: ${status.isConnected ? 'Connected' : 'Disconnected'}`
        };
        setLogs(prev => [log, ...prev]);
      } catch (error) {
        console.error('Error checking status:', error);
        const log: Log = {
          timestamp: new Date().toLocaleTimeString(),
          type: 'error',
          message: `Error checking status: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
        setLogs(prev => [log, ...prev]);
      }
    };
    checkStatus();
  }, []);

  const handleConnect = async () => {
    try {
      addLog('Connecting to WhatsApp...');
      await whatsappService.connect();
      
      const status = await whatsappService.getStatus();
      setStatus(status);
      
      if (status.isConnected) {
        addLog(`Connected successfully as ${status.user?.name}`);
      } else {
        addLog('Connection failed');
      }
    } catch (error) {
      console.error('Error connecting:', error);
      setStatus(prev => ({ ...prev, isConnected: false }));
      addLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      await whatsappService.disconnect();
      
      setStatus({
        isConnected: false,
        qrCode: null,
        qrCodeDataUrl: null,
        user: null,
        lastMessage: null
      });
      setRecipient('');
      setMessage('');
      setMessageStatus('');
      setLogs([]);
      window.location.reload();
    } catch (error) {
      console.error('Error disconnecting:', error);
      addLog(`Error disconnecting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusIndicator = () => {
    if (status.isConnected) {
      return 'bg-green-500';
    }
    if (status.qrCode) {
      return 'bg-yellow-500';
    }
    return 'bg-red-500';
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
              <span className={`w-2.5 h-2.5 rounded-full ${getStatusIndicator()}`}>
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{status.isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>

          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex gap-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('qr')}
                className={`shrink-0 border-b-2 px-1 pb-4 text-sm font-medium flex items-center gap-2 ${
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
                {status.isConnected ? (
                  <div className="text-center text-green-500">
                    <Link size={60} className="mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold">Device Connected</h3>
                    <p className="text-gray-500 dark:text-gray-400">You can now send messages.</p>
                  </div>
                ) : status.qrCodeDataUrl ? (
                  <div className="w-64 h-64 bg-white rounded-lg flex items-center justify-center p-2 border border-gray-300 dark:border-gray-600">
                    <img src={status.qrCodeDataUrl} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="text-center">
                    <LoaderCircle className="animate-spin text-gray-400 dark:text-gray-500 mx-auto" size={60} />
                    <p className="text-gray-500 dark:text-gray-400 mt-4">Connecting to WhatsApp...</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">Connection Settings</h3>
                <button
                  onClick={handleConnect}
                  disabled={status.isConnected || isLoading}
                  className="w-full max-w-xs flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-500/50 disabled:cursor-not-allowed transition-colors mb-4"
                >
                  {isLoading ? <LoaderCircle className="animate-spin" /> : <Link />}
                  <span>Connect Device</span>
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={!status.isConnected || isLoading}
                  className="w-full max-w-xs flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-red-500/50 disabled:cursor-not-allowed transition-colors"
                >
                  <Unlink />
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