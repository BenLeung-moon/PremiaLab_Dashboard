import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * 语言切换组件
 * 提供切换应用语言的功能
 */
const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="language-buttons">
      <button 
        onClick={() => setLanguage('zh')} 
        className={`language-button ${language === 'zh' ? 'active' : ''}`}
      >
        中文
      </button>
      <button 
        onClick={() => setLanguage('en')} 
        className={`language-button ${language === 'en' ? 'active' : ''}`}
      >
        English
      </button>
    </div>
  );
};

export default LanguageSwitcher; 