import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import enTranslations from './en.json';
import zhTranslations from './zh.json';

// 定义支持的语言
export type Language = 'en' | 'zh';

// 定义翻译类型
export type Translations = typeof enTranslations;

// 定义上下文类型
interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

// 创建上下文
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 翻译映射
const translations: Record<Language, Translations> = {
  en: enTranslations,
  zh: zhTranslations,
};

// 提供者组件
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // 尝试从localStorage获取语言设置，默认为英文
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    return savedLanguage && ['en', 'zh'].includes(savedLanguage) ? savedLanguage : 'en';
  });

  // 当语言变化时保存到localStorage
  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  // 翻译函数
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value === undefined) return key;
      value = value[k];
    }
    
    return value !== undefined ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// 自定义Hook，方便使用语言上下文
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 