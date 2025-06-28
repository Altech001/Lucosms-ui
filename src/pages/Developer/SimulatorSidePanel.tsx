import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaperPlaneIcon } from '../../icons';
import { X, LoaderCircle } from 'lucide-react';

interface SimulatorSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  recipient: string;
  setRecipient: (recipient: string) => void;
  message: string;
  setMessage: (message: string) => void;
  handleSimulate: () => void;
  isSending: boolean;
}

const SimulatorSidePanel: React.FC<SimulatorSidePanelProps> = ({
  isOpen,
  onClose,
  apiKey,
  setApiKey,
  recipient,
  setRecipient,
  message,
  setMessage,
  handleSimulate,
  isSending,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-800 shadow-lg z-100 flex flex-col border-l border-gray-200 dark:border-gray-700"
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold">Lucosms API Controls</h2>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="w-6 h-6" />            </button>
          </div>
          <div className="p-6 flex-grow overflow-y-auto">
            <div className="space-y-6">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
                <input type="password" id="apiKey" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipient</label>
                <input type="text" id="recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="+1234567890" className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <button onClick={handleSimulate} disabled={isSending} className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed">
              {isSending ? (
                <><LoaderCircle className="w-5 h-5 mr-3 animate-spin" /> Sending...</>
              ) : (
                <><PaperPlaneIcon className="w-5 h-5 mr-3" /> Simulate Send</>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SimulatorSidePanel;
