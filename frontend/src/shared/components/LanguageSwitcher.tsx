import React, { useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  // 组件挂载时记录当前语言设置
  useEffect(() => {
    console.log('LanguageSwitcher - Current language:', language);
  }, [language]);

  const handleLanguageChange = () => {
    const newLanguage = language === 'en' ? 'zh' : 'en';
    console.log(`Switching language from ${language} to ${newLanguage}`);
    setLanguage(newLanguage);
  };

  return (
    <button
      onClick={handleLanguageChange}
      className="px-3 py-1 rounded text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition duration-200"
      title={language === 'en' ? '切换到中文' : 'Switch to English'}
    >
      {language === 'en' ? '中文' : 'English'}
    </button>
  );
};

export default LanguageSwitcher; 