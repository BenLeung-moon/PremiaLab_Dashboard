import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { submitPortfolio, getAvailableStocksWithNames, stockNameMapping } from '../../shared/services/portfolioService';
import { useLanguage } from '../../shared/i18n/LanguageContext';
import LanguageSwitcher from '../../shared/components/LanguageSwitcher';
import Dashboard from '../dashboard/Dashboard';

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
    {symbol: '', weight: 0}
  ]);
  const [portfolioName, setPortfolioName] = useState('');

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

  // 修改状态：为每个对话存储对应的投资组合ID
  const [conversationPortfolios, setConversationPortfolios] = useState<{[key: string]: string | null}>({});

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
      
      // 激活仪表板
      setDashboardActive(true);
      
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

  const submitManualPortfolio = () => {
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

  // 修改切换到仪表板的部分
  // ...在显示仪表板入口按钮的条件中使用当前对话的投资组合ID
  const currentConversationPortfolioId = conversationPortfolios[activeConversationId] || null;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-medium text-gray-800">
                PremiaLab AI
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <Link 
                to="/dashboard" 
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
              >
                {t('navigation.toDashboard')}
              </Link>
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
              开启新对话
            </button>
            
            <h3 className="text-gray-500 text-sm mb-2">最近对话</h3>
            <div className="space-y-1">
              {conversations.map(conv => (
                <div 
                  key={conv.id}
                  className={`px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer ${activeConversationId === conv.id ? 'bg-gray-100' : ''}`}
                  onClick={() => setActiveConversationId(conv.id)}
                >
                  {conv.title}
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="px-3 py-2 text-gray-400 text-sm">
                  暂无对话记录
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col">
          {dashboardActive ? (
            /* 仪表板视图 */
            <div className="flex-1 bg-gray-50 overflow-auto">
              <Dashboard portfolioId={currentConversationPortfolioId || ''} />
              
              {/* 返回聊天按钮 */}
              <div className="container mx-auto max-w-4xl px-6 pb-6">
                <button 
                  onClick={() => setDashboardActive(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                  </svg>
                  返回聊天
                </button>
              </div>
            </div>
          ) : (
            /* 聊天区域 - 完全重新布局 */
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-auto">
                <div className={`container mx-auto ${isManualInputActive ? 'max-w-3xl' : 'max-w-2xl'} px-4 py-6`}>
                  {/* 只在新对话（消息数为1，即只有系统欢迎消息）时显示欢迎语 */}
                  {messages.length === 1 && (
                    <div className="text-center mb-4">
                      <h1 className="text-3xl font-bold mb-2">
                        我是 PremiaLab AI, 很高兴见到你!
                      </h1>
                      <p className="text-gray-600 mb-4">
                        我可以帮你分析投资组合、提供市场洞察，并回答投资相关问题。
                      </p>
                      
                      {/* 输入框移到这里 - 在欢迎语下方 */}
                      <div className="mt-2 mb-4">
                        <form onSubmit={handleSubmit} className="mx-auto max-w-xl">
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
                            <input
                              type="text"
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-gray-800 placeholder-gray-400"
                              placeholder="输入您的问题..."
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
                        </form>
                      </div>
                      
                      {/* 示例问题区 - 更新样式 */}
                      <div className="text-sm text-gray-500 mb-2">你可以试着问:</div>
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
                  <div className={`container mx-auto ${isManualInputActive ? 'max-w-3xl' : 'max-w-2xl'}`}>
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
                    {currentConversationPortfolioId && !dashboardActive && (
                      <div className="mb-4">
                        <button
                          onClick={() => setDashboardActive(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                          </svg>
                          打开投资组合仪表盘
                        </button>
                      </div>
                    )}
                    
                    {/* 输入框 */}
                    <form onSubmit={handleSubmit}>
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-white rounded-full border border-gray-200 hover:bg-gray-50"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            联网搜索
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
                            手动输入
                          </button>
                        </div>
                        
                        {!isManualInputActive ? (
                          <>
                            <input
                              type="text"
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-gray-800 placeholder-gray-400"
                              placeholder="给 PremiaLab AI 发送消息..."
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
                          </>
                        ) : (
                          <div className="flex-1 mt-4 w-full">
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">投资组合名称</label>
                              <input
                                type="text"
                                value={portfolioName}
                                onChange={(e) => setPortfolioName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="输入投资组合名称"
                              />
                            </div>
                            
                            <div className="mb-4">
                              <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-medium">股票列表</h3>
                                <button
                                  type="button"
                                  onClick={addStock}
                                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                  添加股票
                                </button>
                              </div>
                              
                              <div className="space-y-3">
                                {manualStocks.map((stock, index) => (
                                  <div key={index} className="flex space-x-3">
                                    <div className="flex-1 relative">
                                      <input
                                        type="text"
                                        value={stock.symbol}
                                        onChange={(e) => handleStockSymbolChange(index, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="股票代码 (例如: AAPL)"
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
                                    <div className="flex-1">
                                      <div className="relative">
                                        <input
                                          type="number"
                                          value={stock.weight}
                                          onChange={(e) => updateStock(index, 'weight', parseFloat(e.target.value) || 0)}
                                          step="0.0001"
                                          min="0"
                                          max="100"
                                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                          placeholder="权重"
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
                                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                      >
                                        删除
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
                                取消
                              </button>
                              <button
                                type="button"
                                onClick={submitManualPortfolio}
                                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                              >
                                提交投资组合
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </form>

                    <p className="text-xs text-center text-gray-400 mt-4">
                      ChatGPT 也可能会犯错。请检查重要信息。
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
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
    </div>
  );
};

export default ChatHomePage; 