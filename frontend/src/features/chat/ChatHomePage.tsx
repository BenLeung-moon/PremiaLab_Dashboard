import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { submitPortfolio } from '../../services/portfolioService';
import { getAvailableStocksWithNames, stockNameMapping } from '../../shared/services/portfolioService';
import { useLanguage } from '../../shared/i18n/LanguageContext';
import LanguageSwitcher from '../../shared/components/LanguageSwitcher';
import { encryptData, decryptData } from '../../shared/utils/encryption';

// 添加内联样式
const styles = {
  customScrollbar: `
    /* 直接定义全局滚动条样式 */
    ::-webkit-scrollbar {
      width: 8px !important;
      height: 8px !important;
    }
    ::-webkit-scrollbar-track {
      background: #f1f1f1 !important;
      border-radius: 10px !important;
    }
    ::-webkit-scrollbar-thumb {
      background-color: #888 !important;
      border-radius: 10px !important;
      border: 2px solid #f1f1f1 !important;
    }
    ::-webkit-scrollbar-thumb:hover {
      background-color: #555 !important;
    }
    
    /* 为特定类添加更强的选择器 */
    .custom-scrollbar::-webkit-scrollbar {
      display: block !important;
      width: 10px !important;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f1f1 !important;
      border-radius: 10px !important;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #888 !important;
      border-radius: 10px !important;
      border: 2px solid #f1f1f1 !important;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: #555 !important;
    }
  `
};

// Add mock responses for test mode
const TEST_MODE = false; // Test mode enabled
const getMockResponses = (t: (key: string) => string) => ({
  "default": t('chat.defaultMockResponse'),
  "portfolio": JSON.stringify({
    "response": t('chat.mockPortfolioResponse'),
    "portfolio": {
      "name": t('chat.mockPortfolioName'),
      "tickers": [
        {"symbol": "AAPL", "weight": 0.4},
        {"symbol": "MSFT", "weight": 0.3},
        {"symbol": "GOOGL", "weight": 0.2},
        {"symbol": "AMZN", "weight": 0.1}
      ]
    }
  })
});

interface Portfolio {
  name: string;
  tickers: {
    symbol: string;
    weight: number;
  }[];
}

const ChatHomePage = () => {
  const { t, language, setLanguage } = useLanguage(); // Use language context
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant' | 'system'; content: string }[]>([
    { role: 'system', content: t('chat.welcome') }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Get stored API key using encryption
  const [apiKey, setApiKey] = useState<string>(() => {
    const encryptedKey = localStorage.getItem('perplexity_api_key');
    if (encryptedKey) {
      try {
        return decryptData(encryptedKey);
      } catch (error) {
        console.error('Failed to decrypt API key:', error);
        return '';
      }
    }
    return '';
  });
  
  // Add API key validation status
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean | null>(null);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [extractedPortfolio, setExtractedPortfolio] = useState<Portfolio | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // 添加手动输入股票的相关状态
  const [isManualInputActive, setIsManualInputActive] = useState(false);
  const [manualStocks, setManualStocks] = useState<{symbol: string, weight: number}[]>([
    {symbol: '', weight: 0}
  ]);
  const [portfolioName, setPortfolioName] = useState('');

  // 添加股票代码联想功能的状态
  const [availableStocks, setAvailableStocks] = useState<{symbol: string, name: string}[]>([]);
  const [stockSuggestions, setStockSuggestions] = useState<{symbol: string, name: string}[]>([]);
  const [focusedSymbolIndex, setFocusedSymbolIndex] = useState<number>(-1);
  
  // 获取已保存的对话列表
  const [conversations, setConversations] = useState<{id: string, title: string}[]>(() => {
    try {
      const savedConversations = localStorage.getItem('conversations');
      if (savedConversations) {
        return JSON.parse(savedConversations);
      }
    } catch (error) {
      console.error('无法加载对话列表:', error);
    }
    return [];
  });
  
  // 获取当前活跃对话ID
  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    try {
      const savedActiveId = localStorage.getItem('activeConversationId');
      if (savedActiveId) {
        return savedActiveId;
      }
    } catch (error) {
      console.error('无法加载当前对话ID:', error);
    }
    return 'default';
  });

  // 示例问题
  const exampleQuestions = [
    t('chat.examples.tech'),
    t('chat.examples.createPortfolio'),
    t('chat.examples.techAllocation'),
    t('chat.examples.lowRisk')
  ];

  // 添加保存的投资组合状态
  const [savedPortfolios, setSavedPortfolios] = useState<{id: string, name: string, created_at: string}[]>([]);
  const [lastPortfolioId, setLastPortfolioId] = useState<string | null>(null);

  // 添加聊天消息存储结构
  const [conversationMessages, setConversationMessages] = useState<{
    [key: string]: { role: 'user' | 'assistant' | 'system'; content: string }[]
  }>(() => {
    // 从localStorage中获取保存的聊天记录
    try {
      const savedMessages = localStorage.getItem('conversationMessages');
      if (savedMessages) {
        return JSON.parse(savedMessages);
      }
    } catch (error) {
      console.error('无法加载聊天记录:', error);
    }
    return {
      default: [{ role: 'system', content: t('chat.welcome') }]
    };
  });

  // 修改状态：为每个对话存储对应的投资组合ID
  const [conversationPortfolios, setConversationPortfolios] = useState<{[key: string]: string | null}>(() => {
    // 从localStorage中获取保存的投资组合ID映射
    try {
      const savedPortfolios = localStorage.getItem('conversationPortfolios');
      if (savedPortfolios) {
        return JSON.parse(savedPortfolios);
      }
    } catch (error) {
      console.error('无法加载投资组合映射:', error);
    }
    return {};
  });

  // 保存聊天记录、投资组合映射和当前活跃对话ID到localStorage
  useEffect(() => {
    try {
      localStorage.setItem('conversationMessages', JSON.stringify(conversationMessages));
      localStorage.setItem('conversationPortfolios', JSON.stringify(conversationPortfolios));
      localStorage.setItem('activeConversationId', activeConversationId);
    } catch (error) {
      console.error('无法保存聊天记录:', error);
    }
  }, [conversationMessages, conversationPortfolios, activeConversationId]);

  // 保存对话列表到localStorage
  useEffect(() => {
    try {
      localStorage.setItem('conversations', JSON.stringify(conversations));
    } catch (error) {
      console.error('无法保存对话列表:', error);
    }
  }, [conversations]);

  // 当语言改变时更新欢迎消息
  useEffect(() => {
    setConversationMessages(prev => {
      const newMessages = {...prev};
      Object.keys(newMessages).forEach(key => {
        if (newMessages[key].length > 0 && newMessages[key][0].role === 'system') {
          newMessages[key] = [
            { role: 'system', content: t('chat.welcome') },
            ...newMessages[key].slice(1)
          ];
        }
      });
      return newMessages;
    });
    
    // 更新当前显示的消息
    if (conversationMessages[activeConversationId]) {
      setMessages(conversationMessages[activeConversationId]);
    }
  }, [language, t, activeConversationId]);

  // 当组件首次加载时，创建一个新的聊天
  useEffect(() => {
    // Only create a new chat when the component first loads
    createNewConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount
  
  // 当切换对话时加载对应消息
  useEffect(() => {
    if (conversationMessages[activeConversationId]) {
      setMessages(conversationMessages[activeConversationId]);
    } else {
      // 如果不存在该对话的消息，创建新的欢迎消息
      const newMessages = [{ role: 'system' as const, content: t('chat.welcome') }];
      setMessages(newMessages);
      setConversationMessages(prev => ({
        ...prev,
        [activeConversationId]: newMessages
      }));
    }
    
    // 重置其他状态
    setExtractedPortfolio(null);
    setIsManualInputActive(false);
  }, [activeConversationId, t]);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 保存API密钥
  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      alert(t('settings.emptyApiKeyError'));
      return;
    }
    
    // 加密存储API密钥
    localStorage.setItem('perplexity_api_key', encryptData(apiKey));
    
    // 保存会话时间
    const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24小时过期
    localStorage.setItem('api_key_session_expiry', sessionExpiry.toString());
    
    setIsApiKeyValid(null); // 重置验证状态
    setIsSettingsOpen(false);
  };
  
  // 验证API密钥
  const validateApiKey = async (key: string): Promise<boolean> => {
    try {
      // 简单验证，检查密钥格式
      if (!key || key.length < 32) return false;
      
      // 由于Perplexity API可能会有请求限制，这里仅做基本格式验证
      // 真正的验证会在第一次实际调用API时进行
      return key.length >= 32;
      
      // 注释掉实际API调用测试，避免额外消耗API配额
      /*
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'sonar-small-chat',
          messages: [
            { role: 'user', content: 'Test API key' }
          ],
          max_tokens: 10
        },
        {
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.status === 200;
      */
    } catch (error) {
      console.error('API密钥验证失败:', error);
      return false;
    }
  };
  
  // 检查API密钥会话是否过期
  useEffect(() => {
    const checkSession = () => {
      const sessionExpiry = localStorage.getItem('api_key_session_expiry');
      if (sessionExpiry) {
        const expiryTime = parseInt(sessionExpiry, 10);
        if (Date.now() > expiryTime) {
          // 会话过期，清除API密钥
          localStorage.removeItem('perplexity_api_key');
          localStorage.removeItem('api_key_session_expiry');
          setApiKey('');
          setIsApiKeyValid(false);
        }
      }
    };
    
    checkSession();
  }, []);
  
  // 验证API密钥
  useEffect(() => {
    if (apiKey && isApiKeyValid === null) {
      const validate = async () => {
        const isValid = await validateApiKey(apiKey);
        setIsApiKeyValid(isValid);
        
        // 移除无效密钥提示，让用户有机会实际使用密钥
        // 真正的验证将在首次API调用时进行
        /*
        if (!isValid) {
          // 如果无效，提醒用户
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: t('chat.apiKeyInvalid')
          }]);
        }
        */
      };
      
      validate();
    }
  }, [apiKey, isApiKeyValid, t]);

  // 处理消息提交
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;

    // 重置仪表板状态
    setExtractedPortfolio(null);
    
    const userMessage = { role: 'user' as const, content: input };
    // 更新当前显示的消息
    setMessages(prev => [...prev, userMessage]);
    
    // 同时更新存储的对话消息
    setConversationMessages(prev => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), userMessage]
    }));
    
    // 保存对话并生成标题
    saveConversation(input);
    
    setInput('');
    setIsLoading(true);

    try {
      // 优先检查API密钥，只有在没有密钥的情况下才使用测试模式
      if (!apiKey) {
        if (TEST_MODE) {
          // 测试模式下的模拟响应
          await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟网络延迟
          
          // 根据输入内容选择不同的模拟响应
          let mockResponse;
          if (input.toLowerCase().includes('portfolio') || 
              input.toLowerCase().includes(t('portfolio.title').toLowerCase())) {
            mockResponse = getMockResponses(t).portfolio;
          } else {
            mockResponse = getMockResponses(t).default;
          }

          // 解析响应
          try {
            const parsedResponse = JSON.parse(mockResponse);
            const assistantMessage = { role: 'assistant' as const, content: parsedResponse.response };
            
            // 更新当前显示的消息
            setMessages(prev => [...prev, assistantMessage]);
            
            // 同时更新存储的对话消息
            setConversationMessages(prev => ({
              ...prev,
              [activeConversationId]: [...(prev[activeConversationId] || []), assistantMessage]
            }));
            
            if (parsedResponse.portfolio) {
              setExtractedPortfolio(parsedResponse.portfolio);
            }
          } catch {
            const assistantMessage = { role: 'assistant' as const, content: mockResponse };
            
            // 更新当前显示的消息
            setMessages(prev => [...prev, assistantMessage]);
            
            // 同时更新存储的对话消息
            setConversationMessages(prev => ({
              ...prev,
              [activeConversationId]: [...(prev[activeConversationId] || []), assistantMessage]
            }));
          }
        } else {
          // 如果没有API密钥且不是测试模式，提示用户设置API密钥
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: t('chat.apiKeyRequired')
          }]);
          setIsSettingsOpen(true);
          setIsLoading(false);
          return;
        }
      } else {
        // 如果API密钥验证状态为无效，先尝试使用，不要立即提醒用户
        // 只有在实际API调用返回401/403时才提示密钥无效
        /*
        if (isApiKeyValid === false) {
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: t('chat.apiKeyInvalid')
          }]);
          setIsSettingsOpen(true);
          setIsLoading(false);
          return;
        }
        */

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
        let parsedResponse: { response: string; portfolio?: Portfolio | null } = { response: '' };
        
        try {
          parsedResponse = JSON.parse(aiMessage);
          
          const assistantMessage = { role: 'assistant' as const, content: parsedResponse.response };
          
          // 更新当前显示的消息
          setMessages(prev => [...prev, assistantMessage]);
          
          // 同时更新存储的对话消息
          setConversationMessages(prev => ({
            ...prev,
            [activeConversationId]: [...(prev[activeConversationId] || []), assistantMessage]
          }));
          
          // 提取投资组合信息
          if (parsedResponse.portfolio) {
            setExtractedPortfolio(parsedResponse.portfolio);
          } else {
            setExtractedPortfolio(null);
          }
        } catch (parseError) {
          // 如果解析失败，直接显示原始回复
          const assistantMessage = { role: 'assistant' as const, content: aiMessage };
          
          // 更新当前显示的消息
          setMessages(prev => [...prev, assistantMessage]);
          
          // 同时更新存储的对话消息
          setConversationMessages(prev => ({
            ...prev,
            [activeConversationId]: [...(prev[activeConversationId] || []), assistantMessage]
          }));
          
          setExtractedPortfolio(null);
        }
      }
    } catch (error) {
      console.error('操作失败:', error);
      // 检查是否是API密钥错误
      const axiosError = error as any;
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        // API密钥无效
        setIsApiKeyValid(false);
        setMessages(prev => [...prev, { 
          role: 'system', 
          content: t('chat.apiKeyInvalid')
        }]);
        setIsSettingsOpen(true);
      } else if (axiosError.response?.status === 429) {
        // 请求过多
        const errorMessage = { role: 'system' as const, content: t('chat.apiRateLimited') };
        setMessages(prev => [...prev, errorMessage]);
        setConversationMessages(prev => ({
          ...prev,
          [activeConversationId]: [...(prev[activeConversationId] || []), errorMessage]
        }));
      } else if (axiosError.code === 'ECONNABORTED' || !axiosError.response) {
        // 网络错误或超时
        const errorMessage = { role: 'system' as const, content: t('chat.networkError') };
        setMessages(prev => [...prev, errorMessage]);
        setConversationMessages(prev => ({
          ...prev,
          [activeConversationId]: [...(prev[activeConversationId] || []), errorMessage]
        }));
      } else {
        // 其他错误
        const errorMessage = { role: 'system' as const, content: t('chat.apiCallFailed') };
        setMessages(prev => [...prev, errorMessage]);
        setConversationMessages(prev => ({
          ...prev,
          [activeConversationId]: [...(prev[activeConversationId] || []), errorMessage]
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 处理示例问题点击
  const handleExampleClick = (question: string) => {
    setInput(question);
  };

  // 修改sendPortfolioToBackend函数
  const sendPortfolioToBackend = async () => {
    if (!extractedPortfolio) return;
    
    try {
      setIsLoading(true);
      
      // 使用服务发送投资组合
      const response = await submitPortfolio(extractedPortfolio);
      const portfolioId = response.id || 'test-123';
      
      // 添加一个系统消息表示投资组合已发送到仪表板
      const systemMessage = { 
        role: 'system' as const, 
        content: t('portfolio.sentToDashboard') 
      };
      
      // 更新当前显示的消息
      setMessages(prev => [...prev, systemMessage]);
      
      // 同时更新存储的对话消息
      setConversationMessages(prev => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), systemMessage]
      }));
      
      // 存储当前对话对应的投资组合ID
      setConversationPortfolios(prev => ({
        ...prev,
        [activeConversationId]: portfolioId
      }));
      
      // 设置最后使用的投资组合ID
      setLastPortfolioId(portfolioId);
      
      // 保存到最近的投资组合列表
      setSavedPortfolios(prev => [
        { id: portfolioId, name: extractedPortfolio.name, created_at: new Date().toISOString() },
        ...prev.filter(p => p.id !== portfolioId)
      ]);
      
      setExtractedPortfolio(null);
    } catch (error) {
      console.error('发送投资组合失败:', error);
      // 添加错误消息
      const errorMessage = { 
        role: 'system' as const, 
        content: t('portfolio.error')
      };
      setMessages(prev => [...prev, errorMessage]);
      setConversationMessages(prev => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), errorMessage]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // 添加处理手动输入的函数
  const handleToggleManualInput = () => {
    setIsManualInputActive(!isManualInputActive);
    if (!isManualInputActive) {
      // 设置初始股票，权重平均分配
      const initialStock = {symbol: '', weight: 100};
      setManualStocks([initialStock]);
      setPortfolioName('');
    }
  };

  const addStock = () => {
    // 重新计算平均权重
    const newCount = manualStocks.length + 1;
    const newWeight = parseFloat((100 / newCount).toFixed(4));
    
    // 更新所有现有股票的权重
    const updatedStocks = manualStocks.map(stock => ({
      ...stock, 
      weight: newWeight
    }));
    
    // 添加新股票
    setManualStocks([...updatedStocks, {symbol: '', weight: newWeight}]);
  };

  const removeStock = (index: number) => {
    if (manualStocks.length <= 1) return;
    
    const newStocks = [...manualStocks];
    newStocks.splice(index, 1);
    
    // 重新计算平均权重
    const newWeight = parseFloat((100 / newStocks.length).toFixed(4));
    setManualStocks(newStocks.map(stock => ({...stock, weight: newWeight})));
  };

  const updateStock = (index: number, field: 'symbol' | 'weight', value: string | number) => {
    const newStocks = [...manualStocks];
    
    if (field === 'weight') {
      // 限制权重为数字并保留4位小数
      let numValue = typeof value === 'string' ? parseFloat(value) : value;
      
      // 确保权重不为负数且不超过100
      numValue = Math.max(0, Math.min(100, numValue));
      
      // 保留4位小数
      numValue = parseFloat(numValue.toFixed(4));
      
      newStocks[index] = { ...newStocks[index], weight: numValue };
    } else {
      newStocks[index] = { ...newStocks[index], [field]: value as string };
    }
    
    setManualStocks(newStocks);
  };

  const submitManualPortfolio = async () => {
    // 添加验证逻辑
    if (!portfolioName.trim()) {
      alert("请输入投资组合名称");
      return;
    }
    
    if (manualStocks.some(stock => !stock.symbol.trim())) {
      alert("请输入所有股票的代码");
      return;
    }
    
    if (manualStocks.some(stock => stock.weight <= 0)) {
      alert("所有股票的权重必须大于0");
      return;
    }
    
    // 计算总权重，确保接近100%
    const totalWeight = manualStocks.reduce((sum, stock) => sum + stock.weight, 0);
    if (Math.abs(totalWeight - 100) > 1) {
      alert(`股票总权重应为100%，当前为${totalWeight.toFixed(2)}%`);
      return;
    }
    
    // 创建投资组合对象
    const portfolio: Portfolio = {
      name: portfolioName,
      tickers: manualStocks.map(stock => ({
        symbol: stock.symbol.toUpperCase(),
        weight: stock.weight / 100 // 转换为小数
      }))
    };

    // 设置投资组合数据
    setExtractedPortfolio(portfolio);
    
    // 添加系统消息
    const systemMessage = { role: 'system' as const, content: `已创建投资组合: ${portfolioName}，包含 ${manualStocks.length} 只股票` };
    
    // 更新当前显示的消息
    setMessages(prev => [...prev, systemMessage]);
    
    // 同时更新存储的对话消息
    setConversationMessages(prev => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), systemMessage]
    }));

    // 重置表单和状态
    setIsManualInputActive(false);
    setManualStocks([{symbol: '', weight: 0}]);
    setPortfolioName('');
    
    // 立即发送到后端获取仪表板
    try {
      setIsLoading(true);
      
      // 使用服务发送投资组合
      const response = await submitPortfolio(portfolio);
      const portfolioId = response.id || 'portfolio-' + Date.now();
      
      // 添加一个系统消息表示投资组合已发送到仪表板
      const dashboardMessage = { 
        role: 'system' as const, 
        content: t('portfolio.sentToDashboard') 
      };
      
      // 更新当前显示的消息
      setMessages(prev => [...prev, dashboardMessage]);
      
      // 同时更新存储的对话消息
      setConversationMessages(prev => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), dashboardMessage]
      }));
      
      // 存储当前对话对应的投资组合ID
      setConversationPortfolios(prev => ({
        ...prev,
        [activeConversationId]: portfolioId
      }));
      
      // 设置最后使用的投资组合ID
      setLastPortfolioId(portfolioId);
      
      // 保存到最近的投资组合列表
      setSavedPortfolios(prev => [
        { id: portfolioId, name: portfolio.name, created_at: new Date().toISOString() },
        ...prev.filter(p => p.id !== portfolioId)
      ]);
    } catch (error) {
      console.error('发送投资组合失败:', error);
      // 添加错误消息
      const errorMessage = { 
        role: 'system' as const, 
        content: t('portfolio.error')
      };
      setMessages(prev => [...prev, errorMessage]);
      setConversationMessages(prev => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), errorMessage]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // 加载可用股票代码
  useEffect(() => {
    const loadStocks = async () => {
      try {
        const stocks = await getAvailableStocksWithNames();
        setAvailableStocks(stocks);
      } catch (error) {
        console.error('加载股票代码失败:', error);
      }
    };
    
    loadStocks();
  }, []);

  // 处理股票代码联想
  const handleStockSymbolChange = (index: number, value: string) => {
    updateStock(index, 'symbol', value);
    
    if (value.trim()) {
      const suggestions = availableStocks
        .filter(stock => 
          stock.symbol.toLowerCase().includes(value.toLowerCase()) || 
          (stock.name && stock.name.toLowerCase().includes(value.toLowerCase()))
        )
        .slice(0, 8); // 限制建议数量
      
      setStockSuggestions(suggestions);
    } else {
      setStockSuggestions([]);
    }
  };

  // 选择股票建议
  const selectStockSuggestion = (index: number, stock: {symbol: string, name: string}) => {
    updateStock(index, 'symbol', stock.symbol);
    setStockSuggestions([]);
    setFocusedSymbolIndex(-1);
  };

  // 创建新对话
  const createNewConversation = () => {
    const newId = `conv-${Date.now()}`;
    
    // 创建新对话的欢迎消息
    const welcomeMessage = [{ role: 'system' as const, content: t('chat.welcome') }];
    
    // 设置当前显示消息
    setMessages(welcomeMessage);
    
    // 更新存储的对话消息
    setConversationMessages(prev => ({
      ...prev,
      [newId]: welcomeMessage
    }));
    
    // 重置状态
    setExtractedPortfolio(null);
    
    // 将新对话添加到列表中，使用翻译函数获取标题
    setConversations(prev => [{id: newId, title: t('chat.newChatTitle')}, ...prev]);
    setActiveConversationId(newId);
  };

  // 保存对话并自动生成标题
  const saveConversation = (content: string) => {
    // 使用用户输入作为标题
    const title = content.length > 20 ? content.substring(0, 20) + '...' : content;
    
    setConversations(prev => {
      const newConversations = prev.map(conv => 
        conv.id === activeConversationId 
          ? {...conv, title} 
          : conv
      );
      
      // 如果是第一条消息且不存在该对话，则添加
      if (messages.length === 1 && !prev.find(conv => conv.id === activeConversationId)) {
        newConversations.unshift({id: activeConversationId, title: t('chat.newChatTitle')});
      }
      
      return newConversations;
    });
  };

  // 修改切换到仪表板的部分
  // ...在显示仪表板入口按钮的条件中使用当前对话的投资组合ID
  const currentConversationPortfolioId = conversationPortfolios[activeConversationId] || null;

  // 添加删除对话函数
  const deleteConversation = (id: string) => {
    if (window.confirm(t('chat.deleteConfirm'))) {
      // 更新对话列表
      setConversations(prev => prev.filter(conv => conv.id !== id));
      
      // 从消息存储中移除
      setConversationMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[id];
        return newMessages;
      });
      
      // 从投资组合映射中移除
      setConversationPortfolios(prev => {
        const newPortfolios = { ...prev };
        delete newPortfolios[id];
        return newPortfolios;
      });
      
      // 如果删除的是当前激活的对话，则创建新对话
      if (id === activeConversationId) {
        createNewConversation();
      }
    }
  };

  // 添加菜单打开状态
  const [menuOpenConversationId, setMenuOpenConversationId] = useState<string | null>(null);

  // 切换菜单显示状态
  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenConversationId(menuOpenConversationId === id ? null : id);
  };

  // 关闭菜单
  const closeMenu = () => {
    setMenuOpenConversationId(null);
  };

  // 添加点击外部关闭菜单的处理
  useEffect(() => {
    const handleClickOutside = () => {
      closeMenu();
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 添加内联样式标签，使用更明确的滚动条样式 */}
      <style>
        {`
          /* 原生滚动样式 - 确保有效 */
          .chat-list-scroll {
            height: 300px !important; 
            overflow-y: scroll !important;
            scrollbar-width: thin !important;
            scrollbar-color: #888 #f1f1f1 !important;
            display: block !important;
            margin-right: 2px !important;
            padding-right: 2px !important;
          }
          
          .chat-list-scroll::-webkit-scrollbar {
            width: 8px !important;
            display: block !important;
          }
          
          .chat-list-scroll::-webkit-scrollbar-track {
            background-color: #f1f1f1 !important;
            border-radius: 10px !important;
          }
          
          .chat-list-scroll::-webkit-scrollbar-thumb {
            background-color: #888 !important;
            border-radius: 10px !important;
            border: 2px solid #f1f1f1 !important;
          }
          
          .chat-list-scroll::-webkit-scrollbar-thumb:hover {
            background-color: #555 !important;
          }
          
          /* Chrome使用原生滚动条行为 */
          * {
            overflow-behavior: auto;
            -ms-overflow-style: auto;
          }
        `}
      </style>
      
      {/* 添加内联样式标签，使用常规滚动条样式 */}
      <style>
        {`
          .force-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #888 #f1f1f1;
            overflow-y: scroll !important;
          }
          .force-scrollbar::-webkit-scrollbar {
            width: 10px !important;
          }
          .force-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1 !important;
          }
          .force-scrollbar::-webkit-scrollbar-thumb {
            background-color: #888 !important;
            border-radius: 8px !important;
          }
        `}
      </style>
      
      {/* 添加内联样式标签 */}
      <style>{styles.customScrollbar}</style>
      
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-medium text-gray-800">
                PremiaLab AI
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
                title={t('settings.title')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 内容区域 - 完全重构布局 */}
      <div className="flex-1 flex">
        {/* 侧边栏 */}
        <div className="w-64 border-r border-gray-100 hidden md:block">
          <div className="p-4 sticky top-[73px]">
            <button 
              onClick={createNewConversation}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-6 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
              </svg>
              {t('chat.newChat')}
            </button>
            
            <h3 className="text-gray-500 text-sm mb-2">{t('chat.recentChats')}</h3>
            
            {/* 使用最基本的结构和样式 */}
            <div 
              className="border border-gray-200 rounded bg-gray-50" 
              style={{ 
                height: '500px', 
                overflowY: 'scroll',
                position: 'relative' 
              }}
            >
              <div style={{ padding: '8px' }}>
                {conversations.map(conv => {
                  // 检查该对话是否有关联的投资组合
                  const hasPortfolio = conversationPortfolios[conv.id] ? true : false;
                  
                  return (
                    <div 
                      key={conv.id}
                      className={`flex items-center justify-between px-3 py-2 mb-2 rounded-md hover:bg-gray-100 cursor-pointer relative ${activeConversationId === conv.id ? 'bg-gray-100' : 'bg-white'}`}
                      style={{ marginBottom: '8px' }}
                    >
                      <div 
                        className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
                        onClick={() => {
                          setActiveConversationId(conv.id);
                          // 切换对话时重置仪表板状态
                          setExtractedPortfolio(null);
                          // 加载对应的消息
                          if (conversationMessages[conv.id]) {
                            setMessages(conversationMessages[conv.id]);
                          }
                        }}
                      >
                        {conv.title}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {hasPortfolio && (
                          <Link 
                            to={`/dashboard/${conversationPortfolios[conv.id]}`}
                            className="p-1 text-green-600 hover:bg-green-50 rounded-md"
                            title={t('navigation.viewDashboard')}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                            </svg>
                          </Link>
                        )}
                        
                        {/* 添加菜单按钮 */}
                        <button
                          onClick={(e) => toggleMenu(conv.id, e)}
                          className="p-1 text-gray-500 hover:bg-gray-200 rounded-md"
                          title={t('chat.options')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                          </svg>
                        </button>
                        
                        {/* 菜单下拉框 */}
                        {menuOpenConversationId === conv.id && (
                          <div className="absolute right-0 top-9 z-10 mt-1 w-48 bg-white rounded-md shadow-lg py-1 text-sm overflow-hidden border border-gray-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conv.id);
                              }}
                              className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                              </svg>
                              {t('chat.delete')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {conversations.length === 0 && (
                  <div className="px-3 py-2 text-gray-400 text-sm">
                    {t('chat.noChats')}
                  </div>
                )}
              
              </div>
            </div>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col">
          {/* 聊天区域 - 完全重新布局 */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-auto">
              <div className={`container mx-auto max-w-2xl px-4 py-6`}>
                {/* 只在新对话（消息数为1，即只有系统欢迎消息）时显示欢迎语 */}
                {messages.length === 1 && (
                  <div className="text-center mb-4">
                    <h1 className="text-3xl font-bold mb-2">
                      {t('chat.welcomeTitle')}
                    </h1>
                    <p className="text-gray-600 mb-4">
                      {t('chat.welcomeDescription')}
                    </p>
                    
                    {/* 输入框移到这里 - 在欢迎语下方 */}
                    <div className="mt-2 mb-4">
                      <form onSubmit={handleSubmit} className="mx-auto max-w-xl">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
                            <input
                              type="text"
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-gray-800 placeholder-gray-400"
                              placeholder={t('chat.inputPlaceholder')}
                              disabled={isLoading}
                            />
                            
                            <button
                              type="submit"
                              disabled={!input.trim() || isLoading}
                              className={`p-2 rounded-md ${
                                !input.trim() || isLoading ? 'text-gray-400' : 'text-blue-600 hover:bg-blue-50'
                              }`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* 添加选项按钮区域 */}
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={handleToggleManualInput}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              {t('chat.manualInput')}
                            </button>
                            
                            <button
                              type="button"
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                              {t('chat.networkSearch')}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                    
                    {/* 示例问题区 - 更新样式 */}
                    {!isManualInputActive ? (
                      <>
                        <div className="text-sm text-gray-500 mb-2">{t('chat.examplesTitle')}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-xl mx-auto">
                          {exampleQuestions.map((question, index) => (
                            <button
                              key={index}
                              onClick={() => handleExampleClick(question)}
                              className="text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors border-b border-gray-100 rounded"
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="mt-4 mx-auto max-w-xl">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <h3 className="text-lg font-medium mb-4">{t('portfolio.createManually')}</h3>
                          
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('portfolio.name')}</label>
                            <input
                              type="text"
                              value={portfolioName}
                              onChange={(e) => setPortfolioName(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder={t('portfolio.enterName')}
                            />
                          </div>
                          
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="text-md font-medium">{t('portfolio.stockList')}</h3>
                              <button
                                type="button"
                                onClick={addStock}
                                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                              >
                                {t('portfolio.addStock')}
                              </button>
                            </div>
                            
                            <div className="space-y-3">
                              {manualStocks.map((stock, index) => (
                                <div key={index} className="flex flex-row gap-2 items-center">
                                  <div className="flex-1 relative">
                                    <input
                                      type="text"
                                      value={stock.symbol}
                                      onChange={(e) => handleStockSymbolChange(index, e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                      placeholder={t('portfolio.stockCode')}
                                      onFocus={() => setFocusedSymbolIndex(index)}
                                      onBlur={() => setTimeout(() => setStockSuggestions([]), 200)}
                                    />
                                    {stock.symbol && stockNameMapping[stock.symbol.toUpperCase()] && (
                                      <div className="mt-1 text-xs text-gray-500">
                                        {stockNameMapping[stock.symbol.toUpperCase()]}
                                      </div>
                                    )}
                                    {stockSuggestions.length > 0 && focusedSymbolIndex === index && (
                                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                                        {stockSuggestions.map((suggestion, i) => (
                                          <div
                                            key={i}
                                            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
                                            onClick={() => selectStockSuggestion(index, suggestion)}
                                          >
                                            <div className="flex items-center">
                                              <span className="font-medium">{suggestion.symbol}</span>
                                              {suggestion.name && (
                                                <span className="text-gray-500 ml-2 text-sm">
                                                  {suggestion.name}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="w-24 flex-shrink-0">
                                    <div className="relative">
                                      <input
                                        type="number"
                                        value={stock.weight}
                                        onChange={(e) => updateStock(index, 'weight', parseFloat(e.target.value) || 0)}
                                        step="0.0001"
                                        min="0"
                                        max="100"
                                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder={t('portfolio.weight')}
                                      />
                                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <span className="text-gray-500">%</span>
                                      </div>
                                    </div>
                                  </div>
                                  {manualStocks.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeStock(index)}
                                      className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex-shrink-0"
                                    >
                                      {t('portfolio.delete')}
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex justify-end mt-4">
                            <button
                              type="button"
                              onClick={() => setIsManualInputActive(false)}
                              className="px-4 py-2 mr-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              {t('portfolio.cancel')}
                            </button>
                            <button
                              type="button"
                              onClick={submitManualPortfolio}
                              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                            >
                              {t('portfolio.submit')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 聊天消息 */}
                {messages.slice(1).map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : message.role === 'system'
                            ? 'bg-gray-100 text-gray-700 text-center mx-auto' 
                            : 'bg-gray-100 text-gray-800'
                      } ${message.content.includes('投资组合分析') ? 'whitespace-pre-line' : ''}`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                
                {/* 加载指示器 */}
                {isLoading && (
                  <div className="flex justify-start mb-6">
                    <div className="rounded-lg px-4 py-3 bg-gray-100">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '600ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 空白元素用于自动滚动 */}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* 输入区域 - 只在已有消息时显示 */}
            {messages.length > 1 && (
              <div className="p-4">
                <div className={`container mx-auto max-w-2xl`}>
                  {/* 投资组合卡片 */}
                  {extractedPortfolio && (
                    <div className="mb-4 rounded-lg p-4 bg-blue-50 border border-blue-200">
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
                            <div className="flex flex-col">
                              <span className="font-medium">{ticker.symbol}</span>
                              {stockNameMapping[ticker.symbol] && (
                                <span className="text-xs text-gray-500">{stockNameMapping[ticker.symbol]}</span>
                              )}
                            </div>
                            <span>{(ticker.weight * 100).toFixed(4)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 显示最近投资组合仪表盘入口，确保使用当前对话的投资组合ID */}
                  {currentConversationPortfolioId && !extractedPortfolio && (
                    <div className="mb-4">
                      <Link
                        to={`/dashboard/${currentConversationPortfolioId}`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                          <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                        </svg>
                        {t('navigation.toDashboard')}
                      </Link>
                    </div>
                  )}
                  
                  {/* 输入框 */}
                  <form onSubmit={handleSubmit}>
                    <div className="flex flex-col bg-gray-50 rounded-lg p-2 border border-gray-200">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <button
                          type="button"
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-white rounded-full border border-gray-200 hover:bg-gray-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          {t('chat.networkSearch')}
                        </button>
                        <button
                          type="button"
                          onClick={handleToggleManualInput}
                          className={`flex items-center gap-1 px-3 py-1.5 text-sm ${
                            isManualInputActive 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-white text-gray-600'
                          } rounded-full border border-gray-200 hover:bg-gray-50`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          {t('chat.manualInput')}
                        </button>
                      </div>
                      
                      {!isManualInputActive ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-gray-800 placeholder-gray-400"
                            placeholder={t('chat.sendMessage')}
                            disabled={isLoading}
                          />
                          
                          <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className={`p-2 rounded-md ${
                              !input.trim() || isLoading ? 'text-gray-400' : 'text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 w-full">
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('portfolio.name')}</label>
                            <input
                              type="text"
                              value={portfolioName}
                              onChange={(e) => setPortfolioName(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder={t('portfolio.enterName')}
                            />
                          </div>
                          
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="text-lg font-medium">{t('portfolio.stockList')}</h3>
                              <button
                                type="button"
                                onClick={addStock}
                                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                              >
                                {t('portfolio.addStock')}
                              </button>
                            </div>
                            
                            <div className="space-y-3">
                              {manualStocks.map((stock, index) => (
                                <div key={index} className="flex flex-row gap-2 items-center">
                                  <div className="flex-1 relative">
                                    <input
                                      type="text"
                                      value={stock.symbol}
                                      onChange={(e) => handleStockSymbolChange(index, e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                      placeholder={t('portfolio.stockCode')}
                                      onFocus={() => setFocusedSymbolIndex(index)}
                                      onBlur={() => setTimeout(() => setStockSuggestions([]), 200)}
                                    />
                                    {stock.symbol && stockNameMapping[stock.symbol.toUpperCase()] && (
                                      <div className="mt-1 text-xs text-gray-500">
                                        {stockNameMapping[stock.symbol.toUpperCase()]}
                                      </div>
                                    )}
                                    {stockSuggestions.length > 0 && focusedSymbolIndex === index && (
                                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                                        {stockSuggestions.map((suggestion, i) => (
                                          <div
                                            key={i}
                                            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
                                            onClick={() => selectStockSuggestion(index, suggestion)}
                                          >
                                            <div className="flex items-center">
                                              <span className="font-medium">{suggestion.symbol}</span>
                                              {suggestion.name && (
                                                <span className="text-gray-500 ml-2 text-sm">
                                                  {suggestion.name}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="w-24 flex-shrink-0">
                                    <div className="relative">
                                      <input
                                        type="number"
                                        value={stock.weight}
                                        onChange={(e) => updateStock(index, 'weight', parseFloat(e.target.value) || 0)}
                                        step="0.0001"
                                        min="0"
                                        max="100"
                                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder={t('portfolio.weight')}
                                      />
                                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <span className="text-gray-500">%</span>
                                      </div>
                                    </div>
                                  </div>
                                  {manualStocks.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeStock(index)}
                                      className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex-shrink-0"
                                    >
                                      {t('portfolio.delete')}
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex justify-end mt-4">
                            <button
                              type="button"
                              onClick={() => setIsManualInputActive(false)}
                              className="px-4 py-2 mr-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              {t('portfolio.cancel')}
                            </button>
                            <button
                              type="button"
                              onClick={submitManualPortfolio}
                              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                            >
                              {t('portfolio.submit')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </form>

                  <p className="text-xs text-center text-gray-400 mt-4">
                    {t('chat.aiDisclaimer')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* API密钥设置面板 */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">{t('settings.title')}</h2>

            {/* 语言设置选项 */}
            <div className="mb-6 border-b pb-6">
              <h3 className="text-md font-medium mb-3">{t('settings.language')}</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setLanguage('zh')}
                  className={`px-4 py-2 rounded-md border ${language === 'zh' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700'}`}
                >
                  中文
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-4 py-2 rounded-md border ${language === 'en' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700'}`}
                >
                  English
                </button>
              </div>
            </div>

            {/* API密钥设置 */}
            <div className="mb-6">
              <h3 className="text-md font-medium mb-3">{t('settings.apiTitle')}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {t('settings.description')}
                <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                  {t('settings.apiLinkText')}
                </a>
              </p>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('settings.placeholder')}
                  />
                </div>
                <button
                  onClick={handleSaveApiKey}
                  className="px-4 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
                >
                  {t('settings.saveApi')}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
              >
                {t('settings.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHomePage; 