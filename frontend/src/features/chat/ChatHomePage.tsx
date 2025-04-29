import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { submitPortfolio, getAvailableStocksWithNames, stockNameMapping, getPortfolio } from '../../shared/services/portfolioService';
import { useLanguage } from '../../shared/i18n/LanguageContext';
import { encryptData, decryptData } from '../../shared/utils/encryption';
import { StockSearch } from '../../shared/components/StockSearch';
import { StockInfo } from '../../shared/hooks/useStockSearch';

// 生成UUID函数
const generateUUID = () => {
  return 'conv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10);
};

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
  }[];
}

const ChatHomePage = () => {
  const { t, language, setLanguage } = useLanguage(); // Use language context
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant' | 'system'; content: string }[]>([
    { role: 'system', content: t('chat.welcome') }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 添加新状态，控制是否已选择对话
  const [hasSelectedConversation, setHasSelectedConversation] = useState(false);
  
  // Get stored API key using encryption
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      console.log('[Init] 尝试从localStorage加载API密钥');
      const encryptedKey = localStorage.getItem('perplexity_api_key');
      if (encryptedKey) {
        try {
          const decryptedKey = decryptData(encryptedKey);
          console.log('[Init] API密钥已从localStorage解密完成');
          console.log(`[Init] API密钥格式检查: 长度=${decryptedKey.length}, 前缀=${decryptedKey.substring(0, 5)}...`);
          return decryptedKey;
        } catch (error) {
          console.error('[Init] 解密API密钥失败:', error);
          return '';
        }
      } else {
        console.log('[Init] localStorage中没有找到API密钥');
      }
    } catch (error) {
      console.error('[Init] 加载API密钥过程中出错:', error);
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
  const [manualStocks, setManualStocks] = useState<{symbol: string, weight: number, info?: StockInfo | null}[]>([
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
    
    // 更新当前显示的消息，但仅在已选择对话时
    if (hasSelectedConversation && conversationMessages[activeConversationId]) {
      setMessages(conversationMessages[activeConversationId]);
    }
  }, [language, t, activeConversationId, hasSelectedConversation]);

  // 当组件首次加载时，检查是否有对话
  useEffect(() => {
    if (conversations.length > 0) {
      // 如果已经有对话，则设置最新的一个为活动对话
      // 而不是每次都强制使用最新的，这会导致从仪表板返回时总是回到最新对话
      // 只有在 activeConversationId 为 default 或无效时才设置为最新对话
      const currentConvExists = conversations.some(conv => conv.id === activeConversationId);
      
      if (!currentConvExists || activeConversationId === 'default') {
        // 当前活跃ID无效或是default，设置为最新对话
        const latestConversation = conversations[0]; // 第一个是最新的
        setActiveConversationId(latestConversation.id);
        if (conversationMessages[latestConversation.id]) {
          setMessages(conversationMessages[latestConversation.id]);
        }
      } else {
        // 当前活跃ID有效，直接加载对应消息
        if (conversationMessages[activeConversationId]) {
          setMessages(conversationMessages[activeConversationId]);
        }
      }
      
      // 无论哪种情况，都标记为已选择对话，这样就不会显示欢迎页
      setHasSelectedConversation(true);
    } else {
      // 如果没有对话，则设置欢迎消息在界面上显示，但不创建对话记录
      setActiveConversationId('default');
      setMessages([{ role: 'assistant', content: t('chat.welcome') }]);
      setHasSelectedConversation(false);
    }
  }, []); // 仅在组件首次加载时运行
  
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
    
    console.log('[ApiKey] 尝试保存API密钥');
    
    // 基本格式验证
    if (apiKey.length < 32) {
      console.warn('[ApiKey] API密钥格式可能不正确，长度低于32个字符');
    }
    
    // 尝试进行简单验证
    validateApiKey(apiKey).then(isValid => {
      console.log(`[ApiKey] API密钥格式验证结果: ${isValid ? '有效' : '无效'}`);
      setIsApiKeyValid(isValid);
    });
    
    // 加密存储API密钥
    localStorage.setItem('perplexity_api_key', encryptData(apiKey));
    console.log('[ApiKey] API密钥已加密并保存到本地存储');
    
    // 保存会话时间
    const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24小时过期
    localStorage.setItem('api_key_session_expiry', sessionExpiry.toString());
    console.log('[ApiKey] API密钥会话过期时间已设置');
    
    setIsApiKeyValid(null); // 重置验证状态
    setIsSettingsOpen(false);
    
    console.log('[ApiKey] 密钥保存完成，已关闭设置面板');
  };
  
  // 验证API密钥
  const validateApiKey = async (key: string): Promise<boolean> => {
    try {
      console.log('[ApiKey] 开始验证API密钥');
      // 简单验证，检查密钥格式
      if (!key) {
        console.warn('[ApiKey] API密钥为空');
        return false;
      }
      
      if (key.length < 32) {
        console.warn('[ApiKey] API密钥长度不足32字符');
        return false;
      }
      
      console.log('[ApiKey] API密钥格式检查通过，长度符合要求');
      
      // 检查密钥格式 (perplexity密钥通常是pplx-开头)
      if (!key.startsWith('pplx-')) {
        console.warn('[ApiKey] API密钥格式可能不正确，未以pplx-开头');
      } else {
        console.log('[ApiKey] API密钥前缀检查通过 (pplx-)');
      }
      
      // 由于Perplexity API可能会有请求限制，这里仅做基本格式验证
      // 真正的验证会在第一次实际调用API时进行
      console.log('[ApiKey] 验证完成，返回基于格式的验证结果');
      return key.length >= 32;
      
      // 注释掉实际API调用测试，避免额外消耗API配额
      /*
      console.log('[ApiKey] 尝试进行实际API调用测试...');
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
      
      const isValid = response.status === 200;
      console.log(`[ApiKey] API调用测试结果: ${isValid ? '成功' : '失败'}, 状态码: ${response.status}`);
      return isValid;
      */
    } catch (error) {
      console.error('[ApiKey] API密钥验证失败:', error);
      if (axios.isAxiosError(error)) {
        console.error('[ApiKey] 详细错误信息:');
        console.error('  状态码:', error.response?.status);
        console.error('  响应数据:', error.response?.data);
        console.error('  错误消息:', error.message);
      }
      return false;
    }
  };
  
  // 检查API密钥会话是否过期
  useEffect(() => {
    const checkSession = () => {
      console.log('[Session] 检查API密钥会话状态');
      const sessionExpiry = localStorage.getItem('api_key_session_expiry');
      if (sessionExpiry) {
        const expiryTime = parseInt(sessionExpiry, 10);
        const now = Date.now();
        console.log(`[Session] 会话过期时间: ${new Date(expiryTime).toLocaleString()}, 当前时间: ${new Date(now).toLocaleString()}`);
        
        if (now > expiryTime) {
          // 会话过期，清除API密钥
          console.log('[Session] API密钥会话已过期，正在清除');
          localStorage.removeItem('perplexity_api_key');
          localStorage.removeItem('api_key_session_expiry');
          setApiKey('');
          setIsApiKeyValid(false);
        } else {
          console.log('[Session] API密钥会话有效');
        }
      } else {
        console.log('[Session] 未找到会话过期时间信息');
      }
    };
    
    checkSession();
  }, []);
  
  // 验证API密钥
  useEffect(() => {
    if (apiKey && isApiKeyValid === null) {
      console.log('[Init] 开始验证API密钥');
      const validate = async () => {
        const isValid = await validateApiKey(apiKey);
        console.log(`[Init] API密钥验证结果: ${isValid ? '有效' : '无效'}`);
        setIsApiKeyValid(isValid);
        
        if (!isValid) {
          console.warn('[Init] API密钥无效，考虑提示用户');
        }
        
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
    } else if (!apiKey) {
      console.log('[Init] 无API密钥，跳过验证');
    }
  }, [apiKey, isApiKeyValid, t]);

  // 创建新对话 (Modify createNewConversation to return the new ID)
  const createNewConversation = (): string => { // Add return type
    const newId = generateUUID();

    // 创建新的对话 (Create new conversation)
    const newConversation = {
      id: newId,
      title: t('chat.newChatTitle', { number: conversations.length + 1 })
    };

    // 更新对话列表 (Update conversation list)
    setConversations(prev => [newConversation, ...prev]);

    // 设置新的活跃对话ID (Set new active conversation ID)
    setActiveConversationId(newId);

    // 为新对话创建初始消息 (Create initial messages for new conversation)
    const initialMessages = [{ role: 'system' as const, content: t('chat.welcome') }];
    setConversationMessages(prev => ({
      ...prev,
      [newId]: initialMessages
    }));

    // 清空已提取的投资组合和输入 (Clear extracted portfolio and input)
    setExtractedPortfolio(null);
    setInput('');

    // 设置为已选择对话 (Set as conversation selected)
    setHasSelectedConversation(true);

    // 设置新对话的消息 (Set messages for the new conversation)
    // Use initialMessages directly to avoid potential state update delays
    setMessages(initialMessages);

    return newId; // Return the newly created ID
  };

  // 处理示例问题点击 (恢复此函数)
  const handleExampleClick = (question: string) => {
    setInput(question);
    // 如果希望点击示例后立即提交，可以取消下面这行的注释，但需要确保事件对象处理正确
    // handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  // 处理消息提交 (Handle message submission)
  const handleSubmit = async (event: React.FormEvent) => {
    console.log('[Debug] handleSubmit 函数被调用，有表单事件触发');
    // ... (日志和 preventDefault)
    event.preventDefault();
    console.log('[Debug] 已调用 event.preventDefault()');

    if (!input.trim() || isLoading) {
      console.log(`[Debug] 提交被阻止 - 输入为空:${!input.trim()} 或正在加载:${isLoading}`);
      return;
    }

    // ... (日志 API 密钥)

    let currentActiveId = activeConversationId;
    let isNewConversation = false;

    if (!currentActiveId || currentActiveId === 'default' || !conversations.some(conv => conv.id === currentActiveId)) {
      const newId = createNewConversation();
      console.log(`[ChatSubmit] 创建新对话，ID: ${newId}`);
      currentActiveId = newId;
      isNewConversation = true;
    } else {
      console.log(`[ChatSubmit] 使用现有对话，ID: ${currentActiveId}`);
    }

    setExtractedPortfolio(null);

    const userMessage = { role: 'user' as const, content: input };
    let updatedMessagesForStorage: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];

    // 更新UI
    if (isNewConversation) {
        setMessages(prev => [...prev, userMessage]);
    } else {
        setMessages(prev => [...prev, userMessage]);
    }

    // 更新持久存储并捕获结果
    setConversationMessages(prev => {
        const existingMessages = prev[currentActiveId] || [];
        const messagesToAdd = existingMessages.length === 1 && existingMessages[0].role === 'system'
                               ? [existingMessages[0], userMessage]
                               : [...existingMessages, userMessage];
        updatedMessagesForStorage = messagesToAdd; // 捕获意图更新的状态
        console.log('[ChatSubmit] 更新后用于存储的消息列表预览:', updatedMessagesForStorage);
        return {
            ...prev,
            [currentActiveId]: messagesToAdd
        };
    });


    // If it's the first user message in this *new* conversation, save the title
    // Check length > 1 because the first message is the system welcome message
    if (isNewConversation) {
        saveConversation(input, currentActiveId); // Use the new ID
    }

    const messageToSend = input; // Store input before clearing
    setInput(''); // Clear input field
    setIsLoading(true); // Set loading state

    try {
      // 1. Check if the current conversation has an associated portfolio
      const currentPortfolioId = conversationPortfolios[currentActiveId];
      console.log(`[ChatSubmit] 当前对话关联的投资组合ID: ${currentPortfolioId || '无'}`);
      let portfolioContextData: Portfolio | null = null;

      if (currentPortfolioId) {
        try {
          console.log(`[ChatSubmit] 尝试加载投资组合 ID: ${currentPortfolioId}`);
          portfolioContextData = await getPortfolio(currentPortfolioId);
          console.log(`[ChatSubmit] 成功加载投资组合: ${portfolioContextData?.name}`);
        } catch (error) {
          console.error(`[ChatSubmit] 加载投资组合 ${currentPortfolioId} 失败:`, error);
          portfolioContextData = null;
          // Optional: Add system message about loading failure
        }
      }

      // 2. Build the dynamic system prompt
      const buildSystemPrompt = (portfolio: Portfolio | null): string => {
        // 原有函数内容保持不变
        // ...
        const basePromptZh = `你是一个投资组合分析助手。
你必须始终返回一个只包含两个键的JSON对象：'response' 和 'portfolio'。
1.  'response': 一个字符串，包含你对用户问题的文本分析、解释或回答。这个文本将直接显示给用户。
2.  'portfolio': 一个代表所讨论或建议的投资组合的对象，或者在没有创建或修改特定投资组合时为 null。
    - 如果包含投资组合，它必须有一个 'name' (字符串) 和 'tickers' (对象数组)。
    - 'tickers' 数组中的每个对象必须有 'symbol' (字符串) 和 'weight' (数字，代表小数比例，例如 0.2 代表 20%)。
    - 关键指令：如果你在 'portfolio.tickers' 数组中包含了具体的股票代码 (ticker)，那么每一个代码都必须是标普500指数 (S&P 500 Index) 的成分股。不要推荐任何标普500指数之外的股票代码。

有效响应结构示例：
{
  "response": "根据您的风险承受能力，这里有一个建议的投资组合，侧重于标普500指数内的防御性板块。",
  "portfolio": {
    "name": "防御型标普500投资组合",
    "tickers": [
      {"symbol": "JNJ", "weight": 0.25},
      {"symbol": "PG", "weight": 0.25},
      {"symbol": "NEE", "weight": 0.20},
      {"symbol": "PEP", "weight": 0.15},
      {"symbol": "MRK", "weight": 0.15}
    ]
  }
}

无投资组合生成时的示例：
{
  "response": "要更好地理解关税风险，应考虑公司的国际销售敞口和供应链地域等因素。",
  "portfolio": null
}

永远只返回纯JSON对象，不要在JSON对象前后添加任何额外的文本、注释或markdown格式。`;
        const basePromptEn = `You are a portfolio analysis assistant.
You MUST ALWAYS return a response formatted as a single JSON object containing exactly two keys: 'response' and 'portfolio'.
1.  'response': A string containing your textual analysis, explanations, or answers to the user's query. This text will be displayed directly to the user.
2.  'portfolio': An object representing the investment portfolio discussed or proposed, OR null if no specific portfolio is being created or modified.
    - If a portfolio is included, it MUST have a 'name' (string) and 'tickers' (array of objects).
    - Each object in the 'tickers' array MUST have 'symbol' (string) and 'weight' (number, representing the fraction e.g., 0.2 for 20%).
    - CRITICAL: If you include specific stock symbols (tickers) in the 'portfolio.tickers' array, EVERY symbol MUST be a constituent of the S&P 500 Index. Do not recommend any stock ticker outside of the S&P 500.

Example of a valid response structure:
{
  "response": "Based on your risk tolerance, here is a suggested portfolio focusing on defensive sectors within the S&P 500.",
  "portfolio": {
    "name": "Defensive S&P 500 Portfolio",
    "tickers": [
      {"symbol": "JNJ", "weight": 0.25},
      {"symbol": "PG", "weight": 0.25},
      {"symbol": "NEE", "weight": 0.20},
      {"symbol": "PEP", "weight": 0.15},
      {"symbol": "MRK", "weight": 0.15}
    ]
  }
}

Example if no portfolio is generated:
{
  "response": "To understand tariff risks better, consider factors like a company's international sales exposure and supply chain geography.",
  "portfolio": null
}

Return ONLY the JSON object, with no additional text, comments, or markdown formatting before or after it.`;

        const portfolioContextZh = portfolio
          ? `\n\n当前对话涉及以下投资组合，请基于此进行分析回答：
             名称: ${portfolio.name}
             包含股票: ${portfolio.tickers.map(t => `${t.symbol} (${(t.weight * 100).toFixed(1)}%)`).join(', ')}`
          : '';
        const portfolioContextEn = portfolio
          ? `\n\nThe current conversation involves the following portfolio, please base your analysis on it:
             Name: ${portfolio.name}
             Tickers: ${portfolio.tickers.map(t => `${t.symbol} (${(t.weight * 100).toFixed(1)}%)`).join(', ')}`
          : '';

        return language === 'zh'
          ? basePromptZh + portfolioContextZh
          : basePromptEn + portfolioContextEn;
      };
      
      const systemPrompt = buildSystemPrompt(portfolioContextData);
      console.log(`[ChatSubmit] 生成系统提示，长度: ${systemPrompt.length}`);

      // 修改：重新构建消息数组，确保严格交替角色
      const conversationHistory = conversationMessages[currentActiveId] || [];
      
      // 过滤掉系统消息，只保留用户和助手消息
      let userAssistantMessages = conversationHistory.filter(m => m.role === 'user' || m.role === 'assistant');
      
      // 确保最后一条消息是当前用户输入，处理可能尚未更新到state的情况
      const lastMessage = userAssistantMessages[userAssistantMessages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user' || lastMessage.content !== input) {
        // 如果最后一条不是当前用户输入，添加它
        userAssistantMessages.push({ role: 'user' as const, content: input });
      }
      
      // 验证并修复角色交替
      const validatedMessages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];
      let lastRole: string | null = null;
      
      for (const message of userAssistantMessages) {
        if (message.role === lastRole) {
          console.log(`[ChatSubmit] 检测到角色重复 (${message.role})，跳过消息: ${message.content.substring(0, 30)}...`);
          continue; // 跳过重复角色的消息
        }
        
        validatedMessages.push(message);
        lastRole = message.role;
      }
      
      console.log(`[ChatSubmit] 验证后的消息数量: ${validatedMessages.length}, 原始数量: ${userAssistantMessages.length}`);
      
      // 确保角色严格交替：user -> assistant -> user -> ...
      let messagesForApi = validatedMessages;
      
      // 如果第一条不是user，调整序列
      if (messagesForApi.length > 0 && messagesForApi[0].role !== 'user') {
        console.log('[ChatSubmit] 第一条消息不是用户消息，调整序列');
        messagesForApi = messagesForApi.slice(1); // 移除第一条assistant消息
      }
      
      // 构建最终请求数据，系统提示放在最前面
      const finalMessages = [
        { role: 'system', content: systemPrompt },
        ...messagesForApi
      ];
      
      console.log(`[ChatSubmit] 最终消息数组长度: ${finalMessages.length}`);
      console.log('[ChatSubmit] 消息角色序列:', finalMessages.map(m => m.role).join(' -> '));

      if (!apiKey) {
        console.log('[ChatSubmit] 没有API密钥，使用测试模式或提示设置');
        if (TEST_MODE) {
          console.log('[ChatSubmit] 测试模式已启用，使用模拟响应');
          // 现有的测试模式处理
          const mockResponses = getMockResponses(t);
          
          // 模拟处理时间
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // 返回默认响应或包含投资组合的响应
          const keyword = input.toLowerCase();
          let aiResponse;
          
          if (keyword.includes('portfolio') || keyword.includes('投资组合')) {
            console.log('[ChatSubmit] 测试模式：返回投资组合响应');
            aiResponse = mockResponses.portfolio;
          } else {
            console.log('[ChatSubmit] 测试模式：返回默认响应');
            aiResponse = mockResponses.default;
          }
          
          try {
            const parsedResponse = JSON.parse(aiResponse);
            console.log('[ChatSubmit] 模拟响应解析成功:', parsedResponse);
            
            // 添加AI回复到消息列表
            const assistantMessage = { 
              role: 'assistant' as const, 
              content: filterThinkingChain(parsedResponse.response) 
            };
            
            // 更新UI
            setMessages(prev => [...prev, assistantMessage]);
            // 更新历史记录 (正确角色)
            setConversationMessages(prev => ({
              ...prev,
              [currentActiveId]: [...(prev[currentActiveId] || []), assistantMessage]
            }));
            
            // 如果有投资组合，则提取
            if (parsedResponse.portfolio) {
              setExtractedPortfolio(parsedResponse.portfolio);
            }
          } catch (error) {
            console.error('[ChatSubmit] 解析模拟响应失败:', error);
            
            // 添加错误消息
            const errorMessage = { 
              role: 'system' as const, // 系统错误消息
              content: t('chat.apiCallFailed')
            };
            
            // 只更新UI
            setMessages(prev => [...prev, errorMessage]);
          }
        } else {
          console.log('[ChatSubmit] 未设置API密钥，提示用户设置');
          const apiKeyMessage = { 
            role: 'system' as const, // 系统提示消息
            content: t('chat.apiKeyMissing')
          };
          
          // 只更新UI
          setMessages(prev => [...prev, apiKeyMessage]); 
          setIsSettingsOpen(true);
        }
      } else {
        // --- Call Perplexity API ---
        console.log(`[ChatSubmit] 发送API请求，当前对话ID: ${currentActiveId}, 消息数量: ${finalMessages.length}`);
        
        try {
          console.log('[ChatSubmit] API请求开始...');
          console.log(`[ChatSubmit] 使用的模型: sonar-pro`);
          console.log(`[ChatSubmit] 系统提示长度: ${systemPrompt.length}`);
          console.log(`[ChatSubmit] 对话消息数量: ${finalMessages.length}`);
          
          // 构造请求数据
          const requestData = {
            model: 'sonar-pro',
            messages: finalMessages, // 使用最终处理后的消息列表
            temperature: 0.7,
            max_tokens: 1000
          };
          
          console.log('[ChatSubmit] API请求参数:', JSON.stringify(requestData, null, 2));
          
          const requestHeaders = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          };
          
          console.log('[ChatSubmit] API请求头部:', JSON.stringify({
            Authorization: `Bearer ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`, // 安全起见只显示部分API密钥
            'Content-Type': 'application/json'
          }, null, 2));
          
          const response = await axios.post(
            'https://api.perplexity.ai/chat/completions',
            requestData,
            {
              headers: requestHeaders,
              timeout: 60000,
              maxContentLength: 5 * 1024 * 1024
            }
          );
          
          console.log('[ChatSubmit] API请求成功，状态码:', response.status);
          console.log('[ChatSubmit] API响应头部:', response.headers);
          
          // --- Process response ---
          const aiMessageContent = response.data.choices[0].message.content;
          console.log('[ChatSubmit] API原始响应内容长度:', aiMessageContent.length);
          console.log('[ChatSubmit] API原始响应内容:', aiMessageContent.substring(0, 500) + (aiMessageContent.length > 500 ? '...' : ''));
          
          const filteredAiMessage = filterThinkingChain(aiMessageContent);
          console.log('[ChatSubmit] 过滤后的响应内容长度:', filteredAiMessage.length);
          
          let parsedResponse: { response: string; portfolio?: Portfolio | null } = { response: '', portfolio: null };
          let assistantMessage: { role: 'assistant'; content: string; };
          let portfolioFromApi: Portfolio | null = null;

          try {
            console.log('[ChatSubmit] 尝试解析JSON响应...');
            parsedResponse = JSON.parse(filteredAiMessage);
            console.log('[ChatSubmit] JSON响应解析成功', parsedResponse);

            // Validate the structure
            if (typeof parsedResponse.response !== 'string' || typeof parsedResponse.portfolio === 'undefined') {
              console.error('[ChatSubmit] API响应格式不符合预期 (缺少 response 或 portfolio):', parsedResponse);
              // Fallback: Use the entire filtered message as response, assume no portfolio
              parsedResponse = { response: filteredAiMessage, portfolio: null };
            }

            // Validate portfolio format if it exists
            if (parsedResponse.portfolio) {
              if (!parsedResponse.portfolio.name || !Array.isArray(parsedResponse.portfolio.tickers)) {
                console.warn('[ChatSubmit] API返回的portfolio格式不正确，将忽略:', parsedResponse.portfolio);
                portfolioFromApi = null; // Ignore invalid portfolio
              } else {
                console.log('[ChatSubmit] API响应中包含有效portfolio结构:', parsedResponse.portfolio);
                portfolioFromApi = parsedResponse.portfolio;
              }
            } else {
              portfolioFromApi = null; // Explicitly null if not present
            }

            assistantMessage = { role: 'assistant' as const, content: filterThinkingChain(parsedResponse.response) }; // Use only the 'response' part for the chat bubble

          } catch (parseError) {
            console.error('[ChatSubmit] 解析API响应失败 (尝试作为纯文本):', parseError);
            console.log('[ChatSubmit] 无法解析的原始响应内容:', aiMessageContent);
            // Fallback: Use the entire filtered message as response, assume no portfolio
            parsedResponse = { response: filteredAiMessage, portfolio: null };
            portfolioFromApi = null;
            assistantMessage = { role: 'assistant' as const, content: filterThinkingChain(parsedResponse.response) };
          }

          // Update UI with the text response first, using the correct ID
          setMessages(prev => [...prev, assistantMessage]);
          // Update persistent storage with the assistant message, using the correct ID
          setConversationMessages(prev => ({
            ...prev,
            [currentActiveId]: [...(prev[currentActiveId] || []), assistantMessage]
          }));

          // If a valid portfolio was received, send it to the backend immediately
          if (portfolioFromApi) {
            console.log('[ChatSubmit] 自动发送API返回的投资组合到后端...');
            // Pass the correct activeConversationId to ensure association
            await sendPortfolioToBackend(portfolioFromApi, currentActiveId);
          }
        } catch (error) {
          console.error('[ChatSubmit] API请求失败:', error);
          let errorContent = t('chat.apiCallFailed'); // Default error message
          // 更详细地记录错误信息
          if (axios.isAxiosError(error)) {
            console.error('[ChatSubmit] Axios错误详情:');
            console.error('  错误状态码:', error.response?.status);
            console.error('  错误响应数据:', error.response?.data);
            console.error('  错误请求配置:', {
              url: error.config?.url,
              method: error.config?.method,
              headers: error.config?.headers,
              timeout: error.config?.timeout
            });
            console.error('  错误消息:', error.message);
            
            // 根据状态码设置更具体的错误消息
            if (error.response?.status === 401 || error.response?.status === 403) {
              setIsApiKeyValid(false);
              errorContent = t('chat.apiKeyInvalid');
              setIsSettingsOpen(true);
              console.error('[ChatSubmit] API密钥无效或未授权, 状态码:', error.response?.status);
            } else if (error.response?.status === 429) {
              errorContent = t('chat.apiRateLimited');
              console.error('[ChatSubmit] API请求频率限制, 状态码: 429');
            } else if (error.response?.status === 400) {
              // 尝试解析 400 错误的具体原因
              const errorData = error.response?.data as any;
              if (errorData?.detail?.message) {
                 errorContent = `${t('chat.apiBadRequest') || 'Bad request'}: ${errorData.detail.message}`;
              } else {
                errorContent = t('chat.apiBadRequest') || 'Bad request to API.';
              }
              console.error('[ChatSubmit] API请求格式错误 (400):', error.response?.data);
            } else if (!error.response) { // 请求未发出或网络错误
               errorContent = t('chat.networkError');
               console.error('[ChatSubmit] 网络错误或请求无法发出:', error.message);
            }
            // ... 可以添加其他状态码的处理
            
          } else {
            console.error('[ChatSubmit] 非Axios错误:', error);
            // 对于非 Axios 错误，也显示通用网络错误或自定义错误
             errorContent = t('chat.networkError') || 'An unexpected network error occurred.';
          }

          // 创建最终的错误消息对象
          const errorMessage = { role: 'system' as const, content: errorContent };
          // 只更新UI，不更新历史记录
          setMessages(prev => [...prev, errorMessage]); 
        }
      }
    } catch (error) {
      // 这个 catch 处理 handleSubmit 内部更早的错误 (比如 getPortfolio 失败)
      console.error('[ChatSubmit] 操作失败 (外层 try-catch):', error);
      const genericErrorMessage = { 
        role: 'system' as const, 
        content: t('chat.generalError') || 'An unexpected error occurred.' // 添加一个默认的通用错误消息
      };
       // 只更新UI
       setMessages(prev => [...prev, genericErrorMessage]);
    } finally {
      setIsLoading(false);
      console.log('[ChatSubmit] 请求处理完成');
    }
  };

  // 修改 sendPortfolioToBackend，使其只更新UI的系统消息
  const sendPortfolioToBackend = async (portfolioToSend?: Portfolio | null, convId?: string) => {
    const targetConversationId = convId || activeConversationId; // Use provided ID or fallback to current active
    const portfolioData = portfolioToSend || extractedPortfolio;
    if (!portfolioData) return;

    try {
      setIsLoading(true);

      // ... (rest of validation and normalization logic remains the same) ...
       if (!portfolioData.name || !Array.isArray(portfolioData.tickers) || portfolioData.tickers.length === 0) {
        console.error('Incomplete portfolio data:', portfolioData);
        throw new Error('Portfolio data is incomplete. Check name and stock list.');
      }

      // Ensure all stocks have weight and sum is close to 1
      const tickers = portfolioData.tickers;
      const totalWeight = tickers.reduce((sum, ticker) => sum + ticker.weight, 0);

      // Normalize weights if necessary
      if (Math.abs(totalWeight - 1) > 0.01) {
        console.log('Normalizing portfolio weights, current total:', totalWeight);
        if (Math.abs(totalWeight - 100) < 1) {
          // Convert from percentage if total weight is near 100
          portfolioData.tickers = tickers.map(ticker => ({
            ...ticker,
            weight: ticker.weight / 100
          }));
        } else if (totalWeight > 0) {
          // Normalize if total weight is positive but not 1
          portfolioData.tickers = tickers.map(ticker => ({
            ...ticker,
            weight: ticker.weight / totalWeight
          }));
        } else {
          throw new Error('Abnormal portfolio weight sum. Check stock weights.');
        }
      }

      console.log('Sending portfolio data to backend:', portfolioData);

      // Use service to submit portfolio, passing the current language
      const response = await submitPortfolio(portfolioData, language);
      const portfolioId = response.id || 'test-' + Date.now(); // Maintain possibility of test- ID format

      // Add a system message indicating the portfolio was sent
      const systemMessage = {
        role: 'system' as const,
        content: t('portfolio.sentToDashboard')
      };

      // Update the currently displayed messages
      // Check if the targetConversationId matches the currently displayed one before updating UI
      if (targetConversationId === activeConversationId) {
          setMessages(prev => [...prev, systemMessage]);
      }

      // Update the stored conversation messages for the correct conversation
      setConversationMessages(prev => ({
        ...prev,
        [targetConversationId]: [...(prev[targetConversationId] || []), systemMessage]
      }));

      // Store the portfolio ID associated with the correct conversation
      setConversationPortfolios(prev => ({
        ...prev,
        [targetConversationId]: portfolioId
      }));

      // Set the last used portfolio ID
      setLastPortfolioId(portfolioId);

      // Save to recent portfolios list (if needed, maybe associate with conv name?)
      // Check if extractedPortfolio is not null before accessing its name
      if (extractedPortfolio) {
          setSavedPortfolios(prev => [
            { id: portfolioId, name: extractedPortfolio.name, created_at: new Date().toISOString() },
            ...prev.filter(p => p.id !== portfolioId)
          ]);
      } else if (portfolioToSend) {
           setSavedPortfolios(prev => [
            { id: portfolioId, name: portfolioToSend.name, created_at: new Date().toISOString() },
            ...prev.filter(p => p.id !== portfolioId)
          ]);
      }


      setExtractedPortfolio(null); // Clear the displayed portfolio card

    } catch (error) {
      console.error('Failed to send portfolio:', error);
      // ... (rest of error handling remains the same, ensure it uses targetConversationId) ...
      let errorContent = t('portfolio.error');
      if (error instanceof Error) {
        errorContent = `${t('portfolio.error')} - ${error.message}`;
      }

      // Add error message
      const errorMessage = {
        role: 'system' as const,
        content: errorContent
      };
      // Update UI only if the error belongs to the active conversation
       if (targetConversationId === activeConversationId) {
          setMessages(prev => [...prev, errorMessage]);
       }
      // Update persistent storage for the correct conversation
      setConversationMessages(prev => ({
        ...prev,
        [targetConversationId]: [...(prev[targetConversationId] || []), errorMessage]
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
    setManualStocks([...updatedStocks, {symbol: '', weight: newWeight, info: null}]);
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
    setManualStocks([{symbol: '', weight: 0, info: null}]);
    setPortfolioName('');
    
    // 立即发送到后端获取仪表板
    try {
      setIsLoading(true);
      
      // 使用服务发送投资组合，传递当前语言
      const response = await submitPortfolio(portfolio, language);
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

  // 保存对话并自动生成标题
  const saveConversation = (content: string, conversationId: string) => {
    // 使用用户输入作为标题
    const title = content.length > 20 ? content.substring(0, 20) + '...' : content;
    
    setConversations(prev => {
      const existingConv = prev.find(conv => conv.id === conversationId);
      if (existingConv) {
          // 只更新标题
          return prev.map(conv =>
              conv.id === conversationId ? { ...conv, title } : conv
          );
      } else {
          // 如果对话不存在（理论上不应该在这里发生，因为 handleSubmit 开始时会创建）
          // 但作为保险，可以添加新对话
          console.warn(`尝试为不存在的对话 ${conversationId} 保存标题`);
          return prev;
      }
    });
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
      newStocks[index] = { 
        ...newStocks[index], 
        symbol: stock.symbol,
        info: stock
      };
      setManualStocks(newStocks);
    }
  };

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
                      className={`flex items-center justify-between px-3 py-2 mb-2 rounded-md hover:bg-gray-100 cursor-pointer relative ${activeConversationId === conv.id && hasSelectedConversation ? 'bg-gray-100' : 'bg-white'}`}
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
                          // 设置为已选择对话
                          setHasSelectedConversation(true);
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
                {/* 未选择对话或只有欢迎消息时显示欢迎界面 */}
                {(!hasSelectedConversation || (hasSelectedConversation && messages.length === 1)) && (
                  <div className="text-center mb-4">
                    <h1 className="text-3xl font-bold mb-2">
                      {t('chat.welcomeTitle')}
                    </h1>
                    <p className="text-gray-600 mb-4">
                      {t('chat.welcomeDescription')}
                    </p>
                    
                    {/* 输入框 */}
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
                    
                    {/* 示例问题或手动输入区域 */}
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
                            <label className="block text-sm font-medium mb-1">{t('portfolio.name')}</label>
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
                                  <div className="flex-1">
                                    <StockSearch
                                      value={stock.info}
                                      onChange={(selectedStock) => handleStockSelect(index, selectedStock)}
                                      placeholder={t('portfolio.stockCode')}
                                      label=""
                                    />
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
                
                {/* 已选择对话且有聊天消息时显示聊天内容 */}
                {hasSelectedConversation && messages.length > 1 && (
                  <>
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
                          {filterThinkingChain(message.content)}
                        </div>
                      </div>
                    ))}
                  </>
                )}
                
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
            
            {/* 输入区域 - 只在已有消息且已选择对话时显示 */}
            {hasSelectedConversation && messages.length > 1 && (
              <div className="border-t border-gray-100 bg-white p-4">
                {/* 投资组合卡片 */}
                {extractedPortfolio && (
                  <div className="mb-4 rounded-lg p-4 bg-blue-50 border border-blue-200">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-blue-800">{extractedPortfolio.name}</h3>
                      <button
                        onClick={() => sendPortfolioToBackend()} // Wrap in arrow function
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
                      onClick={(e) => {
                        // 检查ID是否是test-开头，如果是则转换格式
                        if (currentConversationPortfolioId.startsWith('test-')) {
                          e.preventDefault();
                          const newId = 'port-' + currentConversationPortfolioId.split('-')[1];
                          
                          // 更新转换后的ID
                          setConversationPortfolios(prev => ({
                            ...prev,
                            [activeConversationId]: newId
                          }));
                          
                          // 重定向到新格式的ID
                          window.location.href = `/dashboard/${newId}`;
                        }
                      }}
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
                                <div className="flex-1">
                                  <StockSearch
                                    value={stock.info}
                                    onChange={(selectedStock) => handleStockSelect(index, selectedStock)}
                                    placeholder={t('portfolio.stockCode')}
                                    label=""
                                  />
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