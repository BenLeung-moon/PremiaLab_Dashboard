import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { submitPortfolio, getAvailableStocksWithNames, stockNameMapping, getPortfolio } from '../../shared/services/portfolioService';
import { useLanguage } from '../../shared/i18n/LanguageContext';
import LanguageSwitcher from '../../shared/components/LanguageSwitcher';
import { encryptData, decryptData } from '../../shared/utils/encryption';
import { StockSearch } from '../../shared/components/StockSearch';
import { StockInfo } from '../../shared/hooks/useStockSearch';
import DashboardIcon from '../../features/common/components/DashboardIcon';
import './ChatHomePage.css';

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
    info?: StockInfo | null;
    name?: string;
  }[];
}

// 对界面布局进行大幅改造，使其符合新的设计图
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
  const [manualStocks, setManualStocks] = useState<{symbol: string, weight: number, info?: StockInfo | null, name?: string, tempSymbol?: string}[]>([
    {symbol: '', weight: 0, info: null}
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

  // 当组件首次加载时，始终显示欢迎界面
  useEffect(() => {
    if (conversations.length > 0) {
      // 如果已经有对话，则设置最新的一个为活动对话，但仍然显示欢迎界面
      const latestConversation = conversations[0];
      setActiveConversationId(latestConversation.id);
      // 设置为系统欢迎消息，以触发欢迎界面显示
      setMessages([{ role: 'system', content: t('chat.welcome') }]);
    } else {
      // 如果没有对话，则设置欢迎消息在界面上显示，但不创建对话记录
      setActiveConversationId('default');
      setMessages([{ role: 'system', content: t('chat.welcome') }]);
    }
  }, []);
  
  // 当切换对话时，仍然显示欢迎界面
  useEffect(() => {
    // 移除设置欢迎消息的代码
    
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

  // 添加一个临时状态来标记新对话模式
  const [isNewChatMode, setIsNewChatMode] = useState(false);

  // 处理消息提交
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // 如果没有输入，不处理
    if (!input.trim() || isLoading) return;
    
    // 如果是临时新对话，先创建一个真实的新对话
    if (activeConversationId === 'temp-new-chat' || activeConversationId === 'default') {
      // 使用createNewConversation而不是手动创建
      createNewConversation();
      // 短暂延迟确保状态更新
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // 创建新的消息对象
    const userMessage = { role: 'user' as const, content: input };
    const tempMessages = [...messages, userMessage];
    setMessages(tempMessages);
    
    // 更新对话记录
    const updatedConversationMessages = {
      ...conversationMessages,
      [activeConversationId]: [...tempMessages]
    };
    setConversationMessages(updatedConversationMessages);
    
    // 如果是第一条用户消息，以用户输入作为对话标题
    if (messages.length <= 1) {
      // 创建标题（最多20个字符，超过则截断）
      const title = input.length > 20 ? input.substring(0, 20) + '...' : input;
      
      // 更新对话标题
      setConversations(prev => 
        prev.map(conv => 
          conv.id === activeConversationId 
            ? {...conv, title} 
            : conv
        )
      );
    }
    
    // 清空输入框
    setInput('');
    // 设置加载状态
    setIsLoading(true);
    
    // 自动滚动到底部
    scrollToBottom();
    
    let aiResponse = '';
    
    try {
      // 检查是否在测试模式
      if (TEST_MODE) {
        // 使用模拟响应
        const mockResponses = getMockResponses(t);
        
        // 等待一些时间模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 检查是否是关于投资组合的查询
        if (input.toLowerCase().includes('portfolio') || 
            input.toLowerCase().includes('invest') ||
            input.toLowerCase().includes('股票') || 
            input.toLowerCase().includes('投资')) {
          aiResponse = mockResponses.portfolio;
        } else {
          // 返回默认响应
          aiResponse = mockResponses.default;
        }
      } else {
        // 实际API调用
        if (!apiKey) {
          // 没有API密钥，显示错误消息
          aiResponse = t('chat.apiKeyMissing');
        } else {
          // 发送请求到Perplexity API
          const response = await axios.post('https://api.perplexity.ai/chat/completions', {
            model: 'llama-3-sonar-small-32k-online',
            messages: [
              {
                role: 'system',
                content: t('chat.systemPrompt')
              },
              ...messages.filter(msg => msg.role !== 'system'), // 过滤掉系统消息
              userMessage
            ],
            context: { message_type: "task"},
            // temperature: 0.7,
            max_tokens: 4000
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            }
          });
          
          // 获取API响应
          aiResponse = response.data.choices[0].message.content;
        }
      }
      
      // 处理可能的JSON响应（例如投资组合数据）
      let parsedResponse: { response: string; portfolio: Portfolio | null } = {
        response: aiResponse,
        portfolio: null
      };
      
      // 尝试提取JSON数据
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const jsonMatch = aiResponse.match(jsonRegex);
      
      if (jsonMatch && jsonMatch[1]) {
        try {
          const extractedJson = JSON.parse(jsonMatch[1]);
          
          // 更新解析后的响应
          parsedResponse.response = extractedJson.response;
          
          if (extractedJson.portfolio) {
            // 确保投资组合数据格式正确
            // 验证每个股票权重总和是否接近1
            parsedResponse.portfolio = extractedJson.portfolio;
          }
        } catch (parseError) {
          console.error('JSON解析错误:', parseError);
          // 如果JSON解析失败，使用原始响应
        }
      }
      
      // 更新消息列表，添加AI响应
      const assistantMessage = { role: 'assistant' as const, content: parsedResponse.response };
      const finalMessages = [...tempMessages, assistantMessage];
      setMessages(finalMessages);
      
      // 更新对话记录
      setConversationMessages({
        ...updatedConversationMessages,
        [activeConversationId]: finalMessages
      });
      
      // 提取投资组合数据
      if (parsedResponse.portfolio) {
        setExtractedPortfolio(parsedResponse.portfolio);
      }
      
      // 自动滚动到底部
      scrollToBottom();
    } catch (error) {
      console.error('API调用错误:', error);
      
      // 显示错误消息
      const errorMessage = { 
        role: 'assistant' as const, 
        content: t('chat.apiError') 
      };
      
      const errorMessages = [...tempMessages, errorMessage];
      setMessages(errorMessages);
      
      // 更新对话记录
      setConversationMessages({
        ...updatedConversationMessages,
        [activeConversationId]: errorMessages
      });
    } finally {
      // 完成后清除加载状态
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
      
      // 添加对投资组合数据的验证
      if (!extractedPortfolio.name || !Array.isArray(extractedPortfolio.tickers) || extractedPortfolio.tickers.length === 0) {
        console.error('投资组合数据不完整:', extractedPortfolio);
        throw new Error('投资组合数据不完整，请检查名称和股票列表');
      }
      
      // 创建tickers的副本，避免修改原始数据
      const normalizedTickers = [...extractedPortfolio.tickers];
      
      // 确保所有股票都有权重，且权重总和接近1
      const totalWeight = normalizedTickers.reduce((sum, ticker) => sum + ticker.weight, 0);
      
      // 如果总权重远离1，进行归一化
      if (Math.abs(totalWeight - 1) > 0.01) {
        console.log('正在归一化投资组合权重，当前总权重:', totalWeight);
        if (Math.abs(totalWeight - 100) < 1) {
          // 如果总权重接近100，可能是百分比格式，转换为小数
          normalizedTickers.forEach(ticker => {
            ticker.weight = ticker.weight / 100;
          });
        } else if (totalWeight > 0) {
          // 如果总权重不接近100但大于0，则归一化
          normalizedTickers.forEach(ticker => {
            ticker.weight = ticker.weight / totalWeight;
          });
        } else {
          throw new Error('投资组合权重总和异常，请检查股票权重');
        }
      }
      
      // 定义获取股票信息的函数
      const fetchStockInfo = async (symbol: string): Promise<string | null> => {
        try {
          // 尝试从后端API获取股票信息
          console.log(`尝试从API获取股票 ${symbol} 的信息`);
          const response = await axios.get(`/api/stocks/info/${symbol}`);
          if (response.data && response.data.name) {
            console.log(`成功获取股票 ${symbol} 的名称: ${response.data.name}`);
            return response.data.name;
          }
          return null;
        } catch (error) {
          console.error(`获取股票 ${symbol} 信息失败:`, error);
          return null;
        }
      };
      
      // 确保每个股票都有名称信息 - 增强版（包含API查询）
      const enrichedTickers = await Promise.all(normalizedTickers.map(async ticker => {
        // 创建一个新对象，避免修改原始数据
        const enrichedTicker = { ...ticker };
        
        // 1. 如果已有名称且不为空，保留它
        if (enrichedTicker.name && enrichedTicker.name.trim() !== '') {
          return enrichedTicker;
        }
        
        // 2. 如果有info对象，尝试从中获取名称
        if (enrichedTicker.info) {
          const stockInfo = enrichedTicker.info;
          if (stockInfo.englishName) {
            enrichedTicker.name = stockInfo.englishName;
            return enrichedTicker;
          }
          if (stockInfo.name) {
            enrichedTicker.name = stockInfo.name;
            return enrichedTicker;
          }
          if (stockInfo.chineseName) {
            enrichedTicker.name = stockInfo.chineseName;
            return enrichedTicker;
          }
        }
        
        // 3. 尝试从后端API获取股票名称
        const apiStockName = await fetchStockInfo(enrichedTicker.symbol);
        if (apiStockName) {
          enrichedTicker.name = apiStockName;
          return enrichedTicker;
        }
        
        // 4. 从stockNameMapping获取名称
        if (stockNameMapping[enrichedTicker.symbol]) {
          // 只取英文部分（在第一个'/'前的部分）
          const fullName = stockNameMapping[enrichedTicker.symbol];
          const englishName = fullName.split(' / ')[0];
          enrichedTicker.name = englishName;
          return enrichedTicker;
        }
        
        // 5. 最后使用股票代码作为名称（避免名称为空）
        enrichedTicker.name = enrichedTicker.symbol;
        return enrichedTicker;
      }));
      
      // 创建最终的投资组合对象
      const portfolioToSubmit = {
        name: extractedPortfolio.name,
        tickers: enrichedTickers
      };
      
      console.log('发送到后端的投资组合数据:', portfolioToSubmit);
      
      // 使用服务发送投资组合，传递当前语言
      const response = await submitPortfolio(portfolioToSubmit, language);
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
      
      // 错误消息处理，提供更具体的错误信息
      let errorContent = t('portfolio.error');
      if (error instanceof Error) {
        errorContent = `${t('portfolio.error')} - ${error.message}`;
      }
      
      // 添加错误消息
      const errorMessage = { 
        role: 'system' as const, 
        content: errorContent
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
    setManualStocks([...updatedStocks, {symbol: '', weight: newWeight, info: null, tempSymbol: undefined, name: ''}]);
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
      // 处理权重的逻辑保持不变
      // 限制权重为数字并保留2位小数
      let numValue = typeof value === 'string' ? parseFloat(value) : value;
      numValue = Math.max(0, Math.min(100, numValue || 0));
      newStocks[index] = { ...newStocks[index], weight: numValue };
      setManualStocks(newStocks);
    } else if (field === 'symbol') {
      // 对于symbol，只更新输入值用于显示和搜索，但不立即更新stock对象
      // 真正的stock对象更新在selectStockSuggestion函数中进行
      // 这里只设置临时显示值
      newStocks[index] = { ...newStocks[index], tempSymbol: value as string };
      setManualStocks(newStocks);
    }
  };

  const submitManualPortfolio = async () => {
    // 首先检查是否有未完成选择的股票
    const hasInvalidStocks = manualStocks.some(stock => 
      !stock.symbol || stock.symbol.trim() === '' || stock.tempSymbol !== undefined
    );

    if (hasInvalidStocks) {
      alert(t('portfolio.pleaseSelectFromSuggestions'));
      return;
    }
    
    // 检查投资组合名称
    if (!portfolioName.trim()) {
      alert(t('portfolio.nameRequired'));
      return;
    }
    
    // 验证权重总和是否接近100
    const totalWeight = manualStocks.reduce((sum, stock) => sum + stock.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.5) {
      alert(`${t('portfolio.weightSumError')} ${totalWeight.toFixed(2)}%`);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // 定义获取股票信息的函数
      const fetchStockInfo = async (symbol: string): Promise<string | null> => {
        try {
          // 尝试从后端API获取股票信息
          console.log(`尝试从API获取股票 ${symbol} 的信息`);
          const response = await axios.get(`/api/stocks/info/${symbol}`);
          if (response.data && response.data.name) {
            console.log(`成功获取股票 ${symbol} 的名称: ${response.data.name}`);
            return response.data.name;
          }
          return null;
        } catch (error) {
          console.error(`获取股票 ${symbol} 信息失败:`, error);
          return null;
        }
      };
      
      // 增强版本 - 确保所有股票都有名称信息（包含API查询）
      const enrichedTickers = await Promise.all(manualStocks.map(async stock => {
        // 创建一个新对象，避免修改原始数据
        const result = { 
          symbol: stock.symbol.toUpperCase(),
          weight: stock.weight / 100 // 转换为小数形式
        };
        
        // 确定股票名称 - 按优先级处理
        let stockName = '';
        
        // 1. 如果有name属性且不为空，直接使用
        if (stock.name && stock.name.trim() !== '') {
          stockName = stock.name;
        }
        // 2. 首先尝试从info对象获取名称
        else if (stock.info) {
          if (stock.info.englishName && stock.info.englishName.trim() !== '') {
            stockName = stock.info.englishName;
          } else if (stock.info.name && stock.info.name.trim() !== '') {
            stockName = stock.info.name;
          } else if (stock.info.chineseName && stock.info.chineseName.trim() !== '') {
            stockName = stock.info.chineseName;
          }
        }
        
        // 3. 尝试从后端API获取股票名称
        if (!stockName) {
          const apiStockName = await fetchStockInfo(stock.symbol);
          if (apiStockName) {
            stockName = apiStockName;
          }
        }
        
        // 4. 如果info和API没有提供名称，尝试从本地映射获取
        if (!stockName && stockNameMapping[stock.symbol]) {
          // 只取英文部分（在第一个'/'前的部分）
          const fullName = stockNameMapping[stock.symbol];
          stockName = fullName.split(' / ')[0];
        }
        
        // 5. 如果仍然没有名称，使用股票代码作为名称
        if (!stockName) {
          stockName = stock.symbol;
        }
        
        // 设置名称
        return {
          ...result,
          name: stockName
        };
      }));
      
      // 创建投资组合对象
      const portfolio: Portfolio = {
        name: portfolioName,
        tickers: enrichedTickers
      };
      
      // 创建投资组合卡片，而不直接发送到后端
      setExtractedPortfolio(portfolio);
      
      // 添加一个系统消息表示投资组合已创建
      const message = {
        role: 'system' as const,
        content: t('portfolio.readyToSendToDashboard')
      };
      
      // 添加到消息列表
      setMessages(prev => [...prev, message]);
      
      // 同时更新存储的对话消息
      setConversationMessages(prev => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), message]
      }));
      
      // 重置手动输入状态
      setIsManualInputActive(false);
    } catch (error) {
      console.error('创建投资组合失败:', error);
      alert('创建投资组合失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 加载可用股票代码
  useEffect(() => {
    // 初始化手动股票列表
    setManualStocks([
      { symbol: '', weight: 100, tempSymbol: '', name: '' }
    ]);
    
    // 加载可用股票列表
    const loadStocks = async () => {
      console.log('[股票加载] 开始从API获取可用股票...');
      try {
        const stocks = await getAvailableStocksWithNames();
        console.log('[股票加载] 获取成功，股票数量:', stocks.length);
        console.log('[股票加载] 数据样例:', stocks.slice(0, 3));
        setAvailableStocks(stocks);
      } catch (error) {
        console.error('[股票加载] 加载股票代码失败:', error);
        console.log('[股票加载] 错误详情:', JSON.stringify(error));
      }
    };
    
    loadStocks();
  }, []);

  // 处理股票代码联想
  const handleStockSymbolChange = (index: number, value: string) => {
    // 不直接更新symbol，而是更新临时显示值
    updateStock(index, 'symbol', value);
    
    // 设置当前聚焦的股票输入框索引
    setFocusedSymbolIndex(index);
    
    console.log('[股票联想] 输入变化:', value);
    console.log('[股票联想] 可用股票总数:', availableStocks.length);
    
    if (value.trim()) {
      const suggestions = availableStocks
        .filter(stock => 
          stock.symbol.toLowerCase().includes(value.toLowerCase()) || 
          (stock.name && stock.name.toLowerCase().includes(value.toLowerCase()))
        )
        .slice(0, 8); // 限制建议数量
      
      console.log('[股票联想] 过滤后建议数量:', suggestions.length);
      console.log('[股票联想] 建议列表:', suggestions);
      setStockSuggestions(suggestions);
    } else {
      console.log('[股票联想] 输入为空，清空建议');
      setStockSuggestions([]);
    }
  };

  // 选择股票建议
  const selectStockSuggestion = (index: number, stock: {symbol: string, name: string}) => {
    console.log('[股票联想] 选择建议:', stock);
    
    // 更新真实的stock对象
    const newStocks = [...manualStocks];
    newStocks[index] = { 
      ...newStocks[index], 
      symbol: stock.symbol,
      name: stock.name,
      // 移除临时显示值
      tempSymbol: undefined
    };
    setManualStocks(newStocks);
    
    setStockSuggestions([]);
    setFocusedSymbolIndex(-1);
  };

  // 创建新对话
  const createNewConversation = () => {
    // 生成唯一的对话ID
    const uniqueId = `conv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // 设置当前显示消息为欢迎信息
    const welcomeMessage = [{ role: 'system' as const, content: t('chat.welcome') }];
    setMessages(welcomeMessage);
    
    // 重置状态
    setExtractedPortfolio(null);
    setIsManualInputActive(false);
    
    // 将欢迎消息存储到对话记录中
    setConversationMessages(prev => ({
      ...prev,
      [uniqueId]: welcomeMessage
    }));
    
    // 添加到对话列表
    setConversations(prev => [
      { id: uniqueId, title: t('chat.newChatTitle') },
      ...prev
    ]);
    
    // 设置为当前活跃对话
    setActiveConversationId(uniqueId);
    
    // 关闭新对话模式标记
    setIsNewChatMode(false);
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
  // 添加菜单位置状态
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // 添加编辑标题状态
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');

  // 切换菜单显示状态
  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡到聊天项
    
    // 如果点击的是当前打开的菜单，则关闭菜单
    if (menuOpenConversationId === id) {
      setMenuOpenConversationId(null);
      return;
    }
    
    // 获取目标元素的位置和尺寸
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // 定位在对话项的右侧中间位置
    setMenuPosition({
      top: rect.top + window.scrollY + 10, // 稍微向下偏移
      left: rect.right + window.scrollX - 10 // 稍微向左偏移，确保菜单挨着对话项
    });
    setMenuOpenConversationId(id);
  };

  // 关闭菜单
  const closeMenu = () => {
    setMenuOpenConversationId(null);
  };
  
  // 开始编辑标题
  const startEditTitle = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止点击事件冒泡
    closeMenu(); // 关闭菜单
    
    // 找到对应的聊天项
    const chatItem = document.querySelector(`.chat-item[data-id="${id}"]`);
    if (chatItem) {
      // 设置编辑状态
      setEditingTitleId(id);
      
      // 处理标题文本，去除省略号
      const titleText = currentTitle.replace(/\.{3,}$/, '');
      setEditingTitleValue(titleText);
      
      setIsEditingTitle(true);
      
      // 确保编辑的聊天项可见（可能需要滚动到视图）
      chatItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };
  
  // 保存编辑后的标题
  const saveEditedTitle = (e: React.FormEvent) => {
    e.preventDefault(); // 阻止表单默认提交行为
    
    if (editingTitleId && editingTitleValue.trim()) {
      // 标题最大长度控制，防止过长
      const maxLength = 30;
      let finalTitle = editingTitleValue.trim();
      
      if (finalTitle.length > maxLength) {
        finalTitle = finalTitle.substring(0, maxLength) + '...';
      }
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === editingTitleId 
            ? {...conv, title: finalTitle} 
            : conv
        )
      );
    }
    
    // 重置编辑状态
    setIsEditingTitle(false);
    setEditingTitleId(null);
    setEditingTitleValue('');
  };
  
  // 取消编辑标题
  const cancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditingTitleId(null);
    setEditingTitleValue('');
  };

  // 添加点击外部关闭菜单的处理
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // 我们不需要在这里检查点击位置，因为我们使用遮罩层处理点击外部事件
      // 当点击遮罩层时，会调用 closeMenu 函数
      
      // 如果编辑标题模式是激活的，并且点击不在编辑表单内，则关闭编辑模式
      if (isEditingTitle && editingTitleId) {
        const editForm = document.querySelector('.edit-title-form');
        if (editForm && !editForm.contains(e.target as Node)) {
          cancelEditTitle();
        }
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isEditingTitle, editingTitleId]);

  // 修改用于处理历史对话中的投资组合查看逻辑
  useEffect(() => {
    // 当切换对话时，如果当前对话有关联的投资组合ID，检查其有效性
    if (activeConversationId && conversationPortfolios[activeConversationId]) {
      // 记录投资组合ID供调试
      console.log(`当前对话关联的投资组合ID: ${conversationPortfolios[activeConversationId]}`);
      
      // 预先验证投资组合ID是否存在
      const validatePortfolioId = async () => {
        try {
          // 异步验证投资组合是否存在，但不做任何UI更新
          await getPortfolio(conversationPortfolios[activeConversationId] || '');
        } catch (error) {
          console.error('投资组合ID验证失败:', error);
          
          // 如果获取失败，可能是ID格式不对，尝试用mock数据的ID格式
          if (conversationPortfolios[activeConversationId]?.startsWith('test-')) {
            // 将test-xxx格式的ID转换为port-x格式
            const newId = 'port-' + conversationPortfolios[activeConversationId].split('-')[1];
            console.log(`尝试转换投资组合ID: ${conversationPortfolios[activeConversationId]} -> ${newId}`);
            
            // 更新ID映射
            setConversationPortfolios(prev => ({
              ...prev,
              [activeConversationId]: newId
            }));
          }
        }
      };
      
      validatePortfolioId();
    }
  }, [activeConversationId, conversationPortfolios]);

  // 过滤思考链函数 - 移除<think>...</think>标签中的内容
  const filterThinkingChain = (content: string): string => {
    // 使用正则表达式移除<think>...</think>之间的内容
    return content.replace(/<think>[\s\S]*?<\/think>/g, '');
  };

  // 添加处理股票选择的函数
  const handleStockSelect = (index: number, stock: StockInfo | null) => {
    if (stock) {
      const newStocks = [...manualStocks];
      
      // 确定最佳的股票名称
      let stockName = '';
      if (stock.englishName && stock.englishName.trim() !== '') {
        stockName = stock.englishName;
      } else if (stock.name && stock.name.trim() !== '') {
        stockName = stock.name;
      } else if (stock.chineseName && stock.chineseName.trim() !== '') {
        stockName = stock.chineseName;
      } else {
        stockName = stock.symbol;
      }
      
      newStocks[index] = { 
        ...newStocks[index], 
        symbol: stock.symbol,
        name: stockName,  // 直接存储名称
        info: stock       // 同时保存完整的StockInfo对象以备后用
      };
      
      setManualStocks(newStocks);
      
      // 关闭股票建议列表
      setStockSuggestions([]);
    }
  };

  // 添加回退编辑投资组合的函数
  const handleEditPortfolio = () => {
    if (!extractedPortfolio) return;
    
    // 设置投资组合名称
    setPortfolioName(extractedPortfolio.name);
    
    // 将提取的投资组合转换为手动股票列表
    const stocks = extractedPortfolio.tickers.map(ticker => ({
      symbol: ticker.symbol,
      weight: ticker.weight * 100, // 转换回百分比
      name: ticker.name || '',
      info: null
    }));
    
    setManualStocks(stocks);
    
    // 激活手动输入模式
    setIsManualInputActive(true);
  };

  // 添加处理点击外部关闭股票联想列表的逻辑
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (stockSuggestions.length > 0) {
        const target = e.target as HTMLElement;
        if (!target.closest('.stock-search-container')) {
          setStockSuggestions([]);
        }
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [stockSuggestions]);

  // 渲染函数改为使用新的样式结构
  return (
    <div className="app-container">
      {/* 顶部导航栏 */}
      <header className="header">
        <div className="logo-container">
          <img src="/assets/logo/premialab-logo.png" alt="PremiaLab" />
        </div>
        <button 
          className="settings-button"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          title={t('settings.title')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </header>
      
      {/* 设置面板 - 完善样式和结构 */}
      {isSettingsOpen && (
        <div className="settings-panel">
          <h3>{t('settings.title')}</h3>
          <div className="api-key-input">
            <label>{t('settings.apiTitle')}</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t('settings.placeholder')}
            />
            <button onClick={handleSaveApiKey}>
              {t('settings.saveApi')}
            </button>
            {isApiKeyValid === true && <span className="valid-key">{t('settings.apiKeyValid')}</span>}
            {isApiKeyValid === false && <span className="invalid-key">{t('settings.apiKeyInvalid')}</span>}
          </div>
          <div className="language-selector">
            <label>{t('settings.language')}</label>
            <LanguageSwitcher />
          </div>
        </div>
      )}

      {/* 主要内容区 */}
      <div className="main-content">
        {/* 左侧菜单 */}
        <aside className="sidebar">
          <div 
            className="new-chat-button"
            onClick={createNewConversation}
          >
            {t('chat.newChat')} +
          </div>
          
          <div className="chat-list">
            {conversations.map((conv) => (
              <div 
                key={conv.id}
                className={`chat-item ${activeConversationId === conv.id ? 'active' : ''}`}
                data-id={conv.id}
                onClick={() => {
                  setActiveConversationId(conv.id);
                  if (conversationMessages[conv.id]) {
                    setMessages(conversationMessages[conv.id]);
                  }
                }}
              >
                {editingTitleId === conv.id ? (
                  // 编辑标题表单
                  <form 
                    onSubmit={(e) => {
                      e.stopPropagation();
                      saveEditedTitle(e);
                    }} 
                    onClick={(e) => {
                      e.stopPropagation();
                    }} 
                    className="edit-title-form"
                  >
                    <input
                      type="text"
                      value={editingTitleValue}
                      onChange={(e) => setEditingTitleValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.stopPropagation();
                          cancelEditTitle();
                        }
                      }}
                      autoFocus
                      className="edit-title-input"
                      placeholder={t('chat.editTitlePlaceholder')}
                      maxLength={25} /* 限制输入长度，防止文字过长 */
                    />
                    <div className="edit-title-buttons">
                      <button 
                        type="submit" 
                        className="save-title-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </button>
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEditTitle();
                        }} 
                        className="cancel-edit-btn"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </form>
                ) : (
                  // 正常显示模式
                  <div className="chat-item-content">
                    <span className="chat-title">{conv.title || t('chat.newChatTitle')}</span>
                    
                    {/* 只有当该聊天是激活状态时才显示菜单按钮 */}
                    {activeConversationId === conv.id && (
                      <div className="chat-item-menu" onClick={e => toggleMenu(conv.id, e)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="1"></circle>
                          <circle cx="19" cy="12" r="1"></circle>
                          <circle cx="5" cy="12" r="1"></circle>
                        </svg>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
        
        {/* 右侧聊天区域 */}
        <main className="chat-area">
          {/* 投资组合卡片 - 如果存在的话 */}
          {extractedPortfolio && (
            <div className="portfolio-card">
              <div className="portfolio-card-header">
                <h4 className="portfolio-card-title">{extractedPortfolio.name}</h4>
                <div className="portfolio-actions-container">
                  <button 
                    className="edit-portfolio-button"
                    onClick={handleEditPortfolio}
                  >
                    {t('portfolio.editPortfolio')}
                  </button>
                  <button 
                    className="send-to-dashboard"
                    onClick={sendPortfolioToBackend}
                  >
                    {t('portfolio.sendToDashboard')}
                  </button>
                </div>
              </div>
              <div className="portfolio-stocks">
                {extractedPortfolio.tickers.map((ticker, index) => (
                  <div key={index} className="portfolio-stock-item">
                    <div className="stock-symbol-display">{ticker.symbol}</div>
                    <div className="stock-name-display">
                      {ticker.name || stockNameMapping[ticker.symbol] || ticker.symbol}
                    </div>
                    <div className="stock-weight-display">
                      {(ticker.weight * 100).toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 消息区域 */}
          <div className="chat-messages" ref={messagesEndRef}>
            {messages.length === 1 && messages[0].role === 'system' ? (
              // 欢迎界面
              <div className="welcome-container">
                <h2>{t('chat.welcomeTitle')}</h2>
                <p>{t('chat.welcomeMessage')}</p>
                
                <div className="example-questions">
                  {exampleQuestions.map((question, index) => (
                    <div 
                      key={index}
                      className="example-question"
                      onClick={() => handleExampleClick(question)}
                    >
                      {question}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // 聊天消息列表
              messages.map((message, index) => {
                // 对于系统消息，判断是否包含投资组合相关内容并添加按钮
                if (message.role === 'system') {
                  // 检查是否是投资组合发送完成的系统消息
                  const isPortfolioMessage = 
                    message.content.includes(t('portfolio.sentToDashboard')) || 
                    message.content.includes(t('portfolio.readyToSendToDashboard'));
                  
                  // 判断是否包含"仪表板已生成"的消息，只有这种情况才显示按钮
                  const isDashboardGenerated = message.content.includes(t('portfolio.sentToDashboard'));
                  
                  // 如果是与投资组合相关的系统消息且当前对话有关联的投资组合ID，则显示带按钮的消息
                  if (isPortfolioMessage) {
                    return (
                      <React.Fragment key={index}>
                        <div className="message system-message">
                          <div className="message-content">{message.content}</div>
                        </div>
                        {isDashboardGenerated && conversationPortfolios[activeConversationId] && (
                          <div className="dashboard-link-container">
                            <Link 
                              to={`/dashboard?portfolioId=${conversationPortfolios[activeConversationId]}`} 
                              className="dashboard-link-button"
                            >
                              <DashboardIcon />
                              <span>{t('portfolio.viewInDashboard')}</span>
                            </Link>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  }
                  
                  // 其他系统消息不显示
                  return null;
                }
                
                if (message.role === 'user') {
                  return (
                    <div key={index} className="message user-message">
                      {message.content}
                    </div>
                  );
                } else {
                  // AI消息可能包含投资组合相关内容
                  const hasPortfolioId = conversationPortfolios[activeConversationId];
                  
                  return (
                    <React.Fragment key={index}>
                      <div className="message ai-message">
                        <div className="message-content">{filterThinkingChain(message.content)}</div>
                      </div>
                      
                      {/* 如果是最后一条AI消息且当前对话有关联的投资组合ID，添加仪表板链接 */}
                      {hasPortfolioId && index === messages.length - 1 && !messages.some(m => 
                        m.role === 'system' && (
                          m.content.includes(t('portfolio.sentToDashboard'))
                        )
                      ) && (
                        <div className="dashboard-link-container">
                          <Link 
                            to={`/dashboard?portfolioId=${conversationPortfolios[activeConversationId]}`} 
                            className="dashboard-link-button"
                          >
                            <DashboardIcon />
                            <span>{t('portfolio.viewInDashboard')}</span>
                          </Link>
                        </div>
                      )}
                    </React.Fragment>
                  );
                }
              })
            )}
            
            {isLoading && (
              <div className="message ai-message loading">
                <span>{t('chat.thinking')}</span>
              </div>
            )}
          </div>
          
          {/* 输入区域 */}
          <form onSubmit={handleSubmit} className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat.inputPlaceholder')}
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="send-button"
              disabled={isLoading || !input.trim()}
            >
              {t('chat.send')}
            </button>
          </form>

          {/* 底部工具栏 */}
          <div className="tools-container">
            <button 
              className="tools-button"
              onClick={handleToggleManualInput}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {t('portfolio.createManually')}
            </button>
          </div>
        </main>
      </div>

      {/* 手动投资组合输入面板 - 完整实现 */}
      {isManualInputActive && (
        <div className="manual-input-overlay">
          <div className="manual-input-panel">
            <h3>{t('portfolio.manualInput')}</h3>
            
            <div className="portfolio-name-input">
              <label>{t('portfolio.name')}</label>
              <input
                type="text"
                className="stock-input"
                value={portfolioName}
                onChange={(e) => setPortfolioName(e.target.value)}
                placeholder={t('portfolio.enterName')}
              />
            </div>
            
            <div className="stocks-header">
              <h4>{t('portfolio.stockList')}</h4>
              <button
                type="button"
                className="add-stock-button"
                onClick={addStock}
              >
                {t('portfolio.addStock')}
              </button>
            </div>
            
            <div className="stocks-list">
              {manualStocks.map((stock, index) => (
                <div key={index} className="stock-item">
                  <div className="stock-symbol">
                    <div className="stock-search-container">
                      <input
                        type="text"
                        className="stock-input"
                        value={stock.tempSymbol !== undefined ? stock.tempSymbol : stock.symbol}
                        onChange={(e) => handleStockSymbolChange(index, e.target.value)}
                        placeholder={t('portfolio.stockCode')}
                      />
                      
                      {/* 股票代码联想建议 - 修改条件，只在当前输入框索引与聚焦索引匹配时显示 */}
                      {stockSuggestions.length > 0 && focusedSymbolIndex === index && (
                        <div className="stock-suggestions">
                          {stockSuggestions.map((suggestion, suggIndex) => (
                            <div
                              key={suggIndex}
                              className="stock-suggestion-item"
                              onClick={() => selectStockSuggestion(index, suggestion)}
                            >
                              {suggestion.symbol} - {suggestion.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="stock-weight">
                    <input
                      type="number"
                      className="stock-input"
                      value={stock.weight}
                      onChange={(e) => updateStock(index, 'weight', parseFloat(e.target.value) || 0)}
                      step="0.01"
                      min="0"
                      max="100"
                    />
                    <span className="weight-unit">%</span>
                  </div>
                  
                  {manualStocks.length > 1 && (
                    <button
                      type="button"
                      className="remove-stock-button"
                      onClick={() => removeStock(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="portfolio-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setIsManualInputActive(false)}
              >
                {t('portfolio.cancel')}
              </button>
              <button
                type="button"
                className="submit-button"
                onClick={submitManualPortfolio}
              >
                {t('portfolio.submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 聊天菜单遮罩层和选项 - 添加到组件底部，保证最高层级 */}
      {menuOpenConversationId && (
        <>
          {/* 遮罩层 - 点击关闭菜单 */}
          <div className="menu-overlay" onClick={closeMenu}></div>
          
          {/* 菜单选项 */}
          <div 
            className="chat-menu-options" 
            onClick={e => e.stopPropagation()}
            style={{ 
              top: `${menuPosition.top}px`, 
              left: `${menuPosition.left}px` 
            }}
          >
            {conversations.map(conv => 
              conv.id === menuOpenConversationId ? (
                <React.Fragment key={conv.id}>
                  <div 
                    className="menu-option" 
                    onClick={e => {
                      e.stopPropagation();
                      startEditTitle(conv.id, conv.title || t('chat.newChatTitle'), e);
                    }}
                  >
                    <span className="menu-option-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </span>
                    重命名
                  </div>
                  <div 
                    className="menu-option delete-option" 
                    onClick={e => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                  >
                    <span className="menu-option-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </span>
                    删除
                  </div>
                </React.Fragment>
              ) : null
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ChatHomePage; 