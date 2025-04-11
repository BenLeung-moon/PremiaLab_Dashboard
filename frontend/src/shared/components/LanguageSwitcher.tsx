import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <button
      onClick={handleLanguageChange}
      className="px-3 py-1 rounded text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition duration-200"
    >
      {language === 'en' ? '中文' : 'English'}
    </button>
  );
};

export default LanguageSwitcher; 