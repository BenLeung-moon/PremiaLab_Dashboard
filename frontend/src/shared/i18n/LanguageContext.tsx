import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// 语言数据
const translations = {
  en: {
    title: 'Portfolio Analyzer',
    welcomeMessage: 'Welcome to PremiaLab Portfolio Analyzer',
    language: {
      switchTo: 'Switch to Chinese'
    },
    chat: {
      welcome: 'Welcome to PremiaLab AI Portfolio Analyzer. How can I help you today?',
      welcomeTitle: 'PremiaLab AI Portfolio Analyzer',
      welcomeDescription: 'Ask about portfolio analysis or enter stock symbols',
      inputPlaceholder: 'Ask about portfolio analysis or enter stock symbols...',
      sendMessage: 'Send a message...',
      send: 'Send',
      startNew: 'Start New Chat',
      userMessage: 'You',
      aiMessage: 'AI Assistant',
      portfolioSent: 'Portfolio successfully sent to dashboard!',
      manualInput: 'Manual Input',
      networkSearch: 'Network Search',
      examplesTitle: 'Try these examples',
      examples: {
        tech: 'Create a tech portfolio',
        createPortfolio: 'Help me create a diversified portfolio',
        techAllocation: 'What is a good allocation for tech stocks?',
        lowRisk: 'Build a low-risk portfolio'
      },
      newChatTitle: 'New Chat',
      delete: 'Delete conversation',
      deleteConfirm: 'Are you sure you want to delete this conversation?',
      options: 'Conversation options',
      noChats: 'No conversations yet',
      newChat: 'New Chat',
      recentChats: 'Recent Chats',
      aiDisclaimer: 'AI-generated responses may contain inaccuracies. Verify important information.',
      apiKeyRequired: 'Please set your API key in settings to use this feature.',
      apiKeyInvalid: 'The API key appears to be invalid. Please check and update it in settings.',
      apiRateLimited: 'You have made too many requests. Please wait a moment and try again.',
      networkError: 'Network error. Please check your connection and try again.',
      apiCallFailed: 'Failed to communicate with the AI service. Please try again later.',
      defaultMockResponse: 'This is a test response from the AI assistant.',
      mockPortfolioResponse: "I've created a tech stock portfolio for you, including Apple, Microsoft, Google and Amazon.",
      mockPortfolioName: "Tech Stock Portfolio"
    },
    settings: {
      title: 'Settings',
      language: 'Language',
      apiTitle: 'API Key',
      description: 'Enter your Perplexity API key to enable AI features.',
      apiLinkText: 'Get an API key',
      placeholder: 'Enter your API key',
      saveApi: 'Save API Key',
      close: 'Close',
      emptyApiKeyError: 'API key cannot be empty'
    },
    portfolio: {
      title: 'Portfolio',
      createManually: 'Create Portfolio Manually',
      name: 'Portfolio Name',
      enterName: 'Enter portfolio name',
      stockList: 'Stocks',
      addStock: 'Add Stock',
      stockCode: 'Stock Symbol',
      weight: 'Weight',
      delete: 'Delete',
      cancel: 'Cancel',
      submit: 'Submit',
      sentToDashboard: 'Portfolio has been sent to the dashboard!',
      error: 'Failed to send portfolio. Please try again.',
      totalWeight: 'Total Weight'
    },
    navigation: {
      toDashboard: 'View Portfolio Dashboard',
      viewDashboard: 'View Dashboard'
    }
  },
  zh: {
    title: '投资组合分析器',
    welcomeMessage: '欢迎使用PremiaLab投资组合分析器',
    language: {
      switchTo: '切换到英文'
    },
    chat: {
      welcome: '欢迎使用PremiaLab AI投资组合分析器。我能为您做些什么？',
      welcomeTitle: 'PremiaLab AI 投资组合分析器',
      welcomeDescription: '询问有关投资组合分析或输入股票代码',
      inputPlaceholder: '询问有关投资组合分析或输入股票代码...',
      sendMessage: '发送消息...',
      send: '发送',
      startNew: '开始新对话',
      userMessage: '您',
      aiMessage: 'AI助手',
      portfolioSent: '投资组合已成功发送到仪表板！',
      manualInput: '手动输入',
      networkSearch: '网络搜索',
      examplesTitle: '尝试这些示例',
      examples: {
        tech: '创建一个科技股投资组合',
        createPortfolio: '帮我创建一个多元化的投资组合',
        techAllocation: '科技股的良好配置是什么？',
        lowRisk: '构建一个低风险投资组合'
      },
      newChatTitle: '新对话',
      delete: '删除对话',
      deleteConfirm: '确定要删除这个对话吗？',
      options: '对话选项',
      noChats: '暂无对话记录',
      newChat: '新建对话',
      recentChats: '最近对话',
      aiDisclaimer: 'AI生成的回答可能包含不准确信息，请验证重要信息。',
      apiKeyRequired: '请在设置中设置您的API密钥以使用此功能。',
      apiKeyInvalid: 'API密钥似乎无效，请在设置中检查并更新。',
      apiRateLimited: '您的请求过多，请稍后再试。',
      networkError: '网络错误，请检查您的连接并重试。',
      apiCallFailed: '无法与AI服务通信，请稍后再试。',
      defaultMockResponse: '这是来自AI助手的测试回复。',
      mockPortfolioResponse: "我已为您创建了一个科技股投资组合，包括苹果、微软、谷歌和亚马逊。",
      mockPortfolioName: "科技股投资组合"
    },
    settings: {
      title: '设置',
      language: '语言',
      apiTitle: 'API密钥',
      description: '输入您的Perplexity API密钥以启用AI功能。',
      apiLinkText: '获取API密钥',
      placeholder: '输入您的API密钥',
      saveApi: '保存API密钥',
      close: '关闭',
      emptyApiKeyError: 'API密钥不能为空'
    },
    portfolio: {
      title: '投资组合',
      createManually: '手动创建投资组合',
      name: '投资组合名称',
      enterName: '输入投资组合名称',
      stockList: '股票列表',
      addStock: '添加股票',
      stockCode: '股票代码',
      weight: '权重',
      delete: '删除',
      cancel: '取消',
      submit: '提交',
      sentToDashboard: '投资组合已发送到仪表板！',
      error: '发送投资组合失败，请重试。',
      totalWeight: '总权重'
    },
    navigation: {
      toDashboard: '查看投资组合仪表板',
      viewDashboard: '查看仪表板'
    }
  }
};

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
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

  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (!value || value[k] === undefined) {
        return key;
      }
      value = value[k];
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