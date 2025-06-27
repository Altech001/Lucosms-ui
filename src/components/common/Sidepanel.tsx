import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from '@mui/icons-material';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const SidePanel: React.FC<SidePanelProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-800 shadow-lg z-50 border-l border-gray-200 dark:border-gray-700"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              {title && (
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {title}
                </h2>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-80px)]">
              {children}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SidePanel;