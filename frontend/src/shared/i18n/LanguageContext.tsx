import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import enTranslations from './translations/en';
import zhTranslations from './translations/zh';

// 定义支持的语言
type Language = 'en' | 'zh';

// 定义翻译类型
type Translations = typeof enTranslations;

// 翻译映射
const translations: Record<Language, Translations> = {
  en: enTranslations,
  zh: zhTranslations,
};

// 定义上下文类型
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // 从localStorage获取保存的语言设置，或使用浏览器语言
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    
    // 如果已有保存的语言设置且有效，则使用它
    if (savedLanguage && ['en', 'zh'].includes(savedLanguage)) {
      console.log('Using saved language setting:', savedLanguage);
      return savedLanguage;
    }
    
    // 否则尝试获取浏览器语言
    const browserLang = navigator.language.toLowerCase();
    console.log('Detected browser language:', browserLang);
    
    // 检查浏览器语言是否为中文
    if (browserLang.startsWith('zh')) {
      console.log('Setting default language to Chinese based on browser language');
      return 'zh';
    }
    
    // 默认使用英文
    console.log('Setting default language to English');
    return 'en';
  });
  
  // 语言变化时保存到localStorage
  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  // 翻译函数
  const t = (key: string, params?: Record<string, any>): string => {
    if (!key) return '';
    
    const keys = key.split('.');
    let value: any = translations[language];
    
    // 按照层级访问对象
    for (const k of keys) {
      if (!value || typeof value !== 'object') {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
      value = value[k];
    }
    
    if (value === undefined || value === null) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    
    // 如果值不是字符串，可能是结构错误
    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string for key: ${key}`);
      return key;
    }
    
    // 如果传入了参数，进行字符串替换
    if (params) {
      return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
        return str.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
      }, value);
    }
    
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 