import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, UploadCloud, Download, Settings, LoaderCircle } from 'lucide-react';

// Re-usable ToggleSwitch component (inspired by Sidepanel.tsx)
interface ToggleSwitchProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: React.ElementType;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, label, checked, onChange, icon: Icon }) => (
  <div className="flex items-center justify-between py-2">
    <label htmlFor={id} className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
      <Icon size={16} className="mr-3 text-gray-500" />
      {label}
    </label>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`${checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
    >
      <span
        aria-hidden="true"
        className={`${checked ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  </div>
);


type GeneratingType = 'prompt' | 'billing' | 'sms' | null;

interface LucoflowSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateFromPrompt: (prompt: string) => void;
  onGenerateFromData: (type: 'billing' | 'sms') => void;
  generatingType: GeneratingType;
}

const LucoflowSidebar: React.FC<LucoflowSidebarProps> = ({ 
  isOpen, 
  onClose, 
  onGenerateFromPrompt, 
  onGenerateFromData,
  generatingType 
}) => {
  const [prompt, setPrompt] = useState('');
  const [autoLayout, setAutoLayout] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

    const handleGenerateClick = () => {
    if (prompt.trim()) {
      onGenerateFromPrompt(prompt);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-800/95 dark:backdrop-blur-sm border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Bot size={20} className="mr-3 text-blue-500" />
              AI Flow Generator
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-grow p-6 overflow-y-auto space-y-8">
            {/* AI Prompt Section */}
            <div>
              <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describe your flow
              </label>
              <textarea
                id="ai-prompt"
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A user authentication flow with registration, login, and password reset."
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={handleGenerateClick}
                disabled={!!generatingType || !prompt.trim()}
                className="mt-4 w-full px-4 py-3 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {generatingType === 'prompt' ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  "Generate Flow"
                )}
              </button>
            </div>

            {/* Settings Section */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mb-2 flex items-center">
                <Settings size={16} className="mr-2" />
                Settings
              </h3>
              <ToggleSwitch
                id="auto-layout"
                label="Auto-layout nodes"
                checked={autoLayout}
                onChange={setAutoLayout}
                icon={Settings} // Placeholder icon
              />
            </div>

            {/* Automated Flows Section */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mb-2 flex items-center">
                <Bot size={16} className="mr-2" />
                Automated Flows
              </h3>
              <div className="space-y-3 mt-2">
                <button
                  type="button"
                  onClick={() => onGenerateFromData('billing')}
                  disabled={!!generatingType}
                  className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingType === 'billing' ? (
                    <LoaderCircle size={16} className="animate-spin mr-2" />
                  ) : (
                    <Download size={16} className="mr-2" /> // Placeholder icon
                  )}
                  Visualize Billing
                </button>
                <button
                  type="button"
                  onClick={() => onGenerateFromData('sms')}
                  disabled={!!generatingType}
                  className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingType === 'sms' ? (
                    <LoaderCircle size={16} className="animate-spin mr-2" />
                  ) : (
                    <UploadCloud size={16} className="mr-2" /> // Placeholder icon
                  )}
                  Visualize SMS Journey
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LucoflowSidebar;
