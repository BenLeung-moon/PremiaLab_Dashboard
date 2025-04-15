import React from 'react';
import { useLanguage } from '../../../shared/i18n/LanguageContext';

export type ChatMode = 'ai' | 'manual';

interface ChatModeSwitcherProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

const ChatModeSwitcher: React.FC<ChatModeSwitcherProps> = ({ currentMode, onModeChange }) => {
  const { t } = useLanguage();

  return (
    <div className="flex border border-gray-300 rounded-md overflow-hidden">
      <button
        className={`px-4 py-2 text-sm font-medium ${
          currentMode === 'ai'
            ? 'bg-blue-500 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        } transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
        onClick={() => onModeChange('ai')}
      >
        {t('chat.aiAssistant')}
      </button>
      <button
        className={`px-4 py-2 text-sm font-medium ${
          currentMode === 'manual'
            ? 'bg-blue-500 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        } transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
        onClick={() => onModeChange('manual')}
      >
        {t('chat.manualInput')}
      </button>
    </div>
  );
};

export default ChatModeSwitcher; 