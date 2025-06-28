import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, UploadCloud, Download, Settings, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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


import { FileText, UserCircle, SlidersHorizontal } from 'lucide-react';

type GeneratingType = 'prompt' | 'billing' | 'sms' | 'template' | 'user' | null;

interface LucoflowSettings {
  animateEdges: boolean;
  showEdgeLabels: boolean;
  snapToGrid: boolean;
}

interface LucoflowSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateFromPrompt: (prompt: string) => void;
  onGenerateFromData: (type: 'billing' | 'sms' | 'template' | 'user') => void;
  generatingType: GeneratingType;
  settings: LucoflowSettings;
  onSettingsChange: (settings: LucoflowSettings) => void;
}

const LucoflowSidebar: React.FC<LucoflowSidebarProps> = ({ 
  isOpen, 
  onClose, 
  onGenerateFromPrompt, 
  onGenerateFromData,
  generatingType,
  settings,
  onSettingsChange
}) => {
  const [prompt, setPrompt] = useState('');
    const handleSettingChange = <K extends keyof LucoflowSettings>(key: K, value: LucoflowSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };
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
          className="fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-800/95 dark:backdrop-blur-sm border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col z-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Bot size={20} className="mr-3 text-blue-500" />
              Luco AI Flow Generator
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
              <Button
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
              </Button>
            </div>

            {/* Settings Section */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mb-2 flex items-center">
                <Settings size={16} className="mr-2" />
                Settings
              </h3>
              <ToggleSwitch
                id="animate-edges"
                label="Animate Edges"
                checked={settings.animateEdges}
                onChange={(val) => handleSettingChange('animateEdges', val)}
                icon={SlidersHorizontal}
              />
               <ToggleSwitch
                id="show-labels"
                label="Show Edge Labels"
                checked={settings.showEdgeLabels}
                onChange={(val) => handleSettingChange('showEdgeLabels', val)}
                icon={SlidersHorizontal}
              />
               <ToggleSwitch
                id="snap-grid"
                label="Snap to Grid"
                checked={settings.snapToGrid}
                onChange={(val) => handleSettingChange('snapToGrid', val)}
                icon={SlidersHorizontal}
              />
            </div>

            {/* Automated Flows Section */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mb-2 flex items-center">
                <Bot size={16} className="mr-2" />
                Automated Flows
              </h3>
              <div className="space-y-3 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onGenerateFromData('billing')}
                  disabled={!!generatingType}
                  className="w-full px-4 py-2 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingType === 'billing' ? (
                    <LoaderCircle size={16} className="animate-spin mr-2" />
                  ) : (
                    <Download size={16} className="mr-2" />
                  )}
                  Visualize Billing
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onGenerateFromData('sms')}
                  disabled={!!generatingType}
                  className="w-full px-4 py-2 rounded-lg text-sm font-semibold dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingType === 'sms' ? (
                    <LoaderCircle size={16} className="animate-spin mr-2" />
                  ) : (
                    <UploadCloud size={16} className="mr-2" />
                  )}
                  Visualize SMS Journey
                </Button>
                 <Button
                  type="button"
                  variant="outline"
                  onClick={() => onGenerateFromData('template')}
                  disabled={!!generatingType}
                  className="w-full px-4 py-2 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingType === 'template' ? (
                    <LoaderCircle size={16} className="animate-spin mr-2" />
                  ) : (
                    <FileText size={16} className="mr-2" />
                  )}
                  Visualize Templates
                </Button>
                 <Button
                  type="button"
                  variant="outline"
                  onClick={() => onGenerateFromData('user')}
                  disabled={!!generatingType}
                  className="w-full px-4 py-2  rounded-lg text-sm font-semibold dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingType === 'user' ? (
                    <LoaderCircle size={16} className="animate-spin mr-2" />
                  ) : (
                    <UserCircle size={16} className="mr-2" />
                  )}
                  Visualize User Profile
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LucoflowSidebar;
