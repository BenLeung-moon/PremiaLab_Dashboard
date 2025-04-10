import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { submitPortfolio, getAvailableStocksWithNames, stockNameMapping } from '../services/portfolioService';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import Dashboard from './Dashboard';
import ManualPortfolioBuilder from './ManualPortfolioBuilder';
import ChatModeSwitcher, { ChatMode } from './ChatModeSwitcher';

// 添加测试模式的模拟响应
const TEST_MODE = true; // 开启测试模式
const mockResponses: { [key: string]: string } = {
  "default": "我是测试模式下的AI助手，我会根据您的输入提供模拟响应。",
  "portfolio": JSON.stringify({
    "response": "我已为您创建了一个科技股投资组合，这是一个测试响应。",
    "portfolio": {
      "name": "测试投资组合",
      "tickers": [
        {"symbol": "AAPL", "weight": 0.4},
        {"symbol": "MSFT", "weight": 0.3},
        {"symbol": "GOOGL", "weight": 0.2},
        {"symbol": "AMZN", "weight": 0.1}
      ]
    }
  })
};

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
  const [dashboardActive, setDashboardActive] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('performance');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // 添加手动输入股票的相关状态
  const [isManualInputActive, setIsManualInputActive] = useState(false);
  const [manualStocks, setManualStocks] = useState<{symbol: string, weight: number}[]>([
    {symbol: '', weight: 100}
  ]);
  const [portfolioName, setPortfolioName] = useState("我的投资组合");

  // 添加股票代码联想功能的状态
  const [availableStocks, setAvailableStocks] = useState<{symbol: string, name: string}[]>([]);
  const [stockSuggestions, setStockSuggestions] = useState<{symbol: string, name: string}[]>([]);
  const [focusedSymbolIndex, setFocusedSymbolIndex] = useState<number>(-1);
  const [conversations, setConversations] = useState<{id: string, title: string}[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('default');

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
  }>({
    default: [{ role: 'system', content: t('chat.welcome') }]
  });

  const [chatMode, setChatMode] = useState<ChatMode>('ai'); // 默认为AI对话模式
  const [showManualBuilder, setShowManualBuilder] = useState(false); // 控制手动构建器的显示

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
    localStorage.setItem('perplexity_api_key', apiKey);
    setIsSettingsOpen(false);
  };

  // 处理消息提交
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;

    // 重置仪表板状态
    setDashboardActive(false);
    
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
      if (TEST_MODE) {
        // 测试模式下的模拟响应
        await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟网络延迟
        
        // 根据输入内容选择不同的模拟响应
        let mockResponse;
        if (input.toLowerCase().includes('portfolio') || 
            input.toLowerCase().includes('投资') || 
            input.toLowerCase().includes('股票')) {
          mockResponse = mockResponses.portfolio;
        } else {
          mockResponse = mockResponses.default;
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
        // 原有的API调用逻辑
        if (!apiKey) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: t('chat.apiKeyRequired')
          }]);
          setIsSettingsOpen(true);
          setIsLoading(false);
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
      const errorMessage = { role: 'assistant' as const, content: t('chat.apiCallFailed') };
      
      // 更新当前显示的消息
      setMessages(prev => [...prev, errorMessage]);
      
      // 同时更新存储的对话消息
      setConversationMessages(prev => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), errorMessage]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // 处理示例问题点击
  const handleExampleClick = (question: string) => {
    setInput(question);
  };

  // 发送投资组合到后端并显示仪表板
  const sendPortfolioToBackend = async () => {
    if (!extractedPortfolio) return;
    
    try {
      const response = await submitPortfolio(extractedPortfolio);
      
      // 保存投资组合信息
      setSavedPortfolios(prev => [
        {
          id: response.id,
          name: extractedPortfolio.name,
          created_at: response.created_at
        },
        ...prev
      ]);
      
      // 记录最后发送的投资组合ID
      setLastPortfolioId(response.id);
      
      // 成功消息
      const successMessage = { role: 'system' as const, content: `投资组合已成功发送到仪表板！\n组合ID: ${response.id}\n创建时间: ${new Date(response.created_at).toLocaleString()}` };
      
      // 更新当前显示的消息
      setMessages(prev => [...prev, successMessage]);
      
      // 同时更新存储的对话消息
      setConversationMessages(prev => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), successMessage]
      }));

      // 激活仪表板视图
      setDashboardActive(true);
      
      // 清除已提取的投资组合
      setExtractedPortfolio(null);
    } catch (error) {
      console.error('发送到后端失败:', error);
      
      const errorMessage = { role: 'system' as const, content: `发送失败：${error instanceof Error ? error.message : '未知错误'}\n请稍后重试。` };
      
      // 更新当前显示的消息
      setMessages(prev => [...prev, errorMessage]);
      
      // 同时更新存储的对话消息
      setConversationMessages(prev => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), errorMessage]
      }));
    }
  };

  // 处理手动输入相关函数
  const handleToggleManualInput = () => {
    setIsManualInputActive(!isManualInputActive);
    if (!isManualInputActive) {
      // 设置初始股票，权重为100%
      const initialStock = {symbol: '', weight: 100};
      setManualStocks([initialStock]);
      setPortfolioName("我的投资组合");
    }
  };

  const addStock = () => {
    // 重新计算平均权重
    const newCount = manualStocks.length + 1;
    const newWeight = parseFloat((100 / newCount).toFixed(2));
    
    // 更新所有现有股票的权重为平均值
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
    const newWeight = parseFloat((100 / newStocks.length).toFixed(2));
    setManualStocks(newStocks.map(stock => ({...stock, weight: newWeight})));
  };

  const updateStock = (index: number, field: 'symbol' | 'weight', value: string | number) => {
    const newStocks = [...manualStocks];
    
    if (field === 'weight') {
      // 限制权重为数字并保留2位小数
      let numValue = typeof value === 'string' ? parseFloat(value) : value;
      
      // 确保权重不为负数且不超过100
      numValue = Math.max(0, Math.min(100, numValue));
      
      // 保留2位小数
      numValue = parseFloat(numValue.toFixed(2));
      
      newStocks[index] = { ...newStocks[index], weight: numValue };
    } else {
      newStocks[index] = { ...newStocks[index], [field]: value as string };
    }
    
    setManualStocks(newStocks);
  };

  const submitManualPortfolio = () => {
    // 添加验证逻辑
    if (!portfolioName.trim()) {
      alert(t('portfolio.nameRequired'));
      return;
    }
    
    if (manualStocks.some(stock => !stock.symbol.trim())) {
      alert(t('portfolio.symbolRequired'));
      return;
    }
    
    // 检查权重总和是否接近100
    const totalWeight = manualStocks.reduce((sum, stock) => sum + stock.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.5) {
      alert(t('portfolio.weightSumError', { totalWeight }));
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
    const systemMessage = { 
      role: 'system' as const, 
      content: t('portfolio.created', { name: portfolioName, count: manualStocks.length }) 
    };
    
    // 更新当前显示的消息
    setMessages(prev => [...prev, systemMessage]);
    
    // 同时更新存储的对话消息
    setConversationMessages(prev => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), systemMessage]
    }));

    // 重置表单和状态
    setIsManualInputActive(false);
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
    setDashboardActive(false);
    setIsManualInputActive(false);
    
    // 将新对话添加到列表中
    setConversations(prev => [{id: newId, title: '新对话'}, ...prev]);
    setActiveConversationId(newId);
  };

  // 保存对话并自动生成标题
  const saveConversation = (content: string) => {
    if (TEST_MODE) {
      // 测试模式下直接使用用户输入作为标题
      const title = content.length > 20 ? content.substring(0, 20) + '...' : content;
      
      setConversations(prev => {
        const newConversations = prev.map(conv => 
          conv.id === activeConversationId 
            ? {...conv, title} 
            : conv
        );
        
        // 如果是第一条消息且不存在该对话，则添加
        if (messages.length === 1 && !prev.find(conv => conv.id === activeConversationId)) {
          newConversations.unshift({id: activeConversationId, title});
        }
        
        return newConversations;
      });
    } else {
      // 实际环境中调用 AI API 生成摘要标题
      // 此处暂时使用用户输入的前20个字符作为标题
      // TODO: 实现 AI 摘要功能
      const title = content.length > 20 ? content.substring(0, 20) + '...' : content;
      
      setConversations(prev => {
        const newConversations = prev.map(conv => 
          conv.id === activeConversationId 
            ? {...conv, title} 
            : conv
        );
        
        if (messages.length === 1 && !prev.find(conv => conv.id === activeConversationId)) {
          newConversations.unshift({id: activeConversationId, title});
        }
        
        return newConversations;
      });
    }
  };

  // 处理手动创建的投资组合
  const handleManualPortfolio = (portfolio: Portfolio) => {
    setExtractedPortfolio(portfolio);
    setShowManualBuilder(false);
    
    // 显示创建成功消息
    const stockCount = portfolio.tickers.length;
    const successMessage = t('portfolio.created', { 
      name: portfolio.name, 
      count: stockCount 
    });
    
    setMessages(prev => [...prev, { 
      role: 'system', 
      content: successMessage
    }]);
  };

  // 切换聊天模式
  const handleChatModeChange = (mode: ChatMode) => {
    setChatMode(mode);
    
    if (mode === 'manual') {
      setShowManualBuilder(true);
    } else {
      setShowManualBuilder(false);
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

      {/* 对话/手动模式切换 */}
      <div className="bg-gray-100 py-3 px-4 border-b border-gray-200">
        <div className="max-w-3xl mx-auto flex justify-center">
          <ChatModeSwitcher
            currentMode={chatMode}
            onModeChange={handleChatModeChange}
          />
        </div>
      </div>

      {/* API密钥设置面板 */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
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

      {/* 手动投资组合构建器 */}
      {showManualBuilder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="max-w-2xl w-full mx-4">
            <ManualPortfolioBuilder
              onCancel={() => {
                setShowManualBuilder(false);
                setChatMode('ai');
              }}
              onSubmit={handleManualPortfolio}
              availableStocks={[
                {symbol: "AAPL", name: "Apple Inc."},
                {symbol: "MSFT", name: "Microsoft Corporation"},
                {symbol: "GOOGL", name: "Alphabet Inc."},
                {symbol: "AMZN", name: "Amazon.com Inc."},
                {symbol: "TSLA", name: "Tesla, Inc."},
                {symbol: "META", name: "Meta Platforms, Inc."},
                {symbol: "NVDA", name: "NVIDIA Corporation"},
                {symbol: "JPM", name: "JPMorgan Chase & Co."},
                {symbol: "V", name: "Visa Inc."},
                {symbol: "JNJ", name: "Johnson & Johnson"}
              ]}
            />
          </div>
        </div>
      )}

      {/* 初始为空时显示示例问题 */}
      {!showManualBuilder && messages.length === 1 && !isLoading && (
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

      {/* 输入区域 - 只在AI模式下显示 */}
      {!showManualBuilder && (
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
      )}
    </div>
  );
};

export default ChatHomePage; 