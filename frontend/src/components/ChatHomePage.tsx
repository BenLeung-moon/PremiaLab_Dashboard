import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { submitPortfolio } from '../services/portfolioService';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

interface Portfolio {
  name: string;
  tickers: {
    symbol: string;
    weight: number;
  }[];
}

const ChatHomePage = () => {
  const { t, language } = useLanguage(); // 使用语言上下文
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant' | 'system'; content: string }[]>([
    { role: 'system', content: t('chat.welcome') }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('perplexity_api_key') || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [extractedPortfolio, setExtractedPortfolio] = useState<Portfolio | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 示例问题
  const exampleQuestions = [
    t('chat.examples.tech'),
    t('chat.examples.createPortfolio'),
    t('chat.examples.techAllocation'),
    t('chat.examples.lowRisk')
  ];

  // 当语言改变时更新欢迎消息
  useEffect(() => {
    setMessages(prev => [
      { role: 'system', content: t('chat.welcome') },
      ...prev.slice(1)
    ]);
  }, [language, t]);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 保存API密钥
  const handleSaveApiKey = () => {
    localStorage.setItem('perplexity_api_key', apiKey);
    setIsSettingsOpen(false);
  };

  // 处理消息提交
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;

    // 添加用户消息
    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!apiKey) {
        // API密钥未设置，打开设置面板
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: t('chat.apiKeyRequired')
          }]);
          setIsSettingsOpen(true);
          setIsLoading(false);
        }, 500);
        return;
      }

      // 调用Perplexity API，使用当前语言控制系统提示
      const systemPrompt = language === 'zh' 
        ? `你是一个投资组合分析助手。如果用户想要创建或提到特定的投资组合（包含股票代码和权重），
            提取这些信息并格式化为JSON。总是将权重归一化为小数（总和为1）。
            
            用户请求示例：
            "帮我创建一个投资组合：40% AAPL，30% MSFT，20% GOOGL，10% AMZN"
            
            你应该返回：
            {
              "response": "我已为您创建了一个科技股投资组合，包括苹果、微软、谷歌和亚马逊。这是一个比较集中的投资组合，专注于大型科技公司。您可以点击"发送到仪表板"按钮查看详细分析。",
              "portfolio": {
                "name": "科技股投资组合",
                "tickers": [
                  {"symbol": "AAPL", "weight": 0.4},
                  {"symbol": "MSFT", "weight": 0.3},
                  {"symbol": "GOOGL", "weight": 0.2},
                  {"symbol": "AMZN", "weight": 0.1}
                ]
              }
            }
            
            如果用户没有提供明确的投资组合信息，只返回普通回答，不包含portfolio字段：
            {
              "response": "您的回答..."
            }`
        : `You are a portfolio analysis assistant. If the user wants to create or mentions a specific portfolio (including stock symbols and weights),
            extract this information and format it as JSON. Always normalize weights as decimals (sum to 1).
            
            Example user request:
            "Help me create a portfolio: 40% AAPL, 30% MSFT, 20% GOOGL, 10% AMZN"
            
            You should return:
            {
              "response": "I've created a tech stock portfolio for you, including Apple, Microsoft, Google, and Amazon. This is a concentrated portfolio focused on large tech companies. You can click the 'Send to Dashboard' button to see a detailed analysis.",
              "portfolio": {
                "name": "Tech Stock Portfolio",
                "tickers": [
                  {"symbol": "AAPL", "weight": 0.4},
                  {"symbol": "MSFT", "weight": 0.3},
                  {"symbol": "GOOGL", "weight": 0.2},
                  {"symbol": "AMZN", "weight": 0.1}
                ]
              }
            }
            
            If the user does not provide clear portfolio information, only return a regular answer without the portfolio field:
            {
              "response": "Your answer..."
            }`;

      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'sonar-small-chat',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: input }
          ],
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // 解析响应
      const aiMessage = response.data.choices[0].message.content;
      let parsedResponse;
      
      try {
        parsedResponse = JSON.parse(aiMessage);
        
        // 显示助手回复
        setMessages(prev => [...prev, { role: 'assistant', content: parsedResponse.response }]);
        
        // 提取投资组合信息
        if (parsedResponse.portfolio) {
          setExtractedPortfolio(parsedResponse.portfolio);
        } else {
          setExtractedPortfolio(null);
        }
      } catch (parseError) {
        // 如果解析失败，直接显示原始回复
        setMessages(prev => [...prev, { role: 'assistant', content: aiMessage }]);
        setExtractedPortfolio(null);
      }
    } catch (error) {
      console.error('API调用失败:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: t('chat.apiCallFailed')
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理示例问题点击
  const handleExampleClick = (question: string) => {
    setInput(question);
  };

  // 发送投资组合到后端
  const sendPortfolioToBackend = async () => {
    if (!extractedPortfolio) return;
    
    try {
      const response = await submitPortfolio(extractedPortfolio);
      
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: `${t('chat.portfolioSent')}\n${t('chat.responseId')}: ${response.id || '未提供'}\n${t('chat.createdAt')}: ${response.created_at || '未提供'}` 
      }]);
      
      // 清除已提取的投资组合
      setExtractedPortfolio(null);
    } catch (error) {
      console.error('发送到后端失败:', error);
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: t('chat.backendError')
      }]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">{t('appTitle')}</h1>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            title={t('settings.title')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
          <Link 
            to="/dashboard" 
            className="px-4 py-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            {t('navigation.toDashboard')}
          </Link>
        </div>
      </header>

      {/* API密钥设置面板 */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">{t('settings.title')}</h2>
            <p className="text-sm text-gray-600 mb-4">
              {t('settings.description')}
              <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                {t('settings.apiLinkText')}
              </a>
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder={t('settings.placeholder')}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
              >
                {t('settings.cancel')}
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                {t('settings.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-3xl rounded-lg px-4 py-2 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : message.role === 'system'
                    ? 'bg-gray-200 text-gray-700 w-full text-center'
                    : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-3xl rounded-lg px-4 py-2 bg-white border border-gray-200">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '600ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* 提取的投资组合 */}
        {extractedPortfolio && (
          <div className="flex justify-center">
            <div className="max-w-3xl rounded-lg p-4 bg-blue-50 border border-blue-200 w-full">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-blue-800">{extractedPortfolio.name}</h3>
                <button
                  onClick={sendPortfolioToBackend}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  {t('portfolio.sendToDashboard')}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {extractedPortfolio.tickers.map((ticker, idx) => (
                  <div key={idx} className="flex justify-between bg-white p-2 rounded border border-blue-100">
                    <span className="font-medium">{ticker.symbol}</span>
                    <span>{(ticker.weight * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 初始为空时显示示例问题 */}
      {messages.length === 1 && !isLoading && (
        <div className="px-4 py-6">
          <h2 className="text-lg font-medium text-center text-gray-700 mb-4">{t('chat.examplesTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {exampleQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(question)}
                className="p-3 bg-white rounded-lg border border-gray-300 text-left hover:bg-gray-50 transition"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('chat.inputPlaceholder')}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-md ${
                !input.trim() || isLoading ? 'text-gray-400' : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </form>
        <p className="text-xs text-center text-gray-500 mt-2">
          {t('chat.disclaimer')}
        </p>
      </div>
    </div>
  );
};

export default ChatHomePage; 