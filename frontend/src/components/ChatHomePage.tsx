import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ChatHomePage = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant' | 'system'; content: string }[]>([
    { role: 'system', content: '欢迎使用投资组合分析助手。我可以帮助您分析投资组合、提供市场洞察和解答投资相关问题。' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 示例问题
  const exampleQuestions = [
    "分析科技股投资组合的表现",
    "如何降低投资组合的波动率？",
    "市场现在处于什么周期？",
    "AAPL和MSFT哪个更适合长期持有？"
  ];

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 处理消息提交
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;

    // 添加用户消息
    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // 模拟API响应延迟
    setTimeout(() => {
      // 根据用户输入生成简单回复
      let response = "我理解您的问题。作为投资组合分析助手，我需要更多信息来提供准确分析。您可以提供具体的股票代码、投资目标或风险偏好吗？";
      
      if (input.toLowerCase().includes('科技股') || input.toLowerCase().includes('tech')) {
        response = "科技股投资组合在过去几年表现良好，但也面临波动性风险。建议关注盈利能力强、有竞争优势的公司，如AAPL、MSFT、GOOGL等。多元化配置可以降低个股风险。";
      } else if (input.toLowerCase().includes('波动') || input.toLowerCase().includes('风险')) {
        response = "降低投资组合波动率的策略包括：1) 资产多元化配置，2) 增加低相关性资产，3) 加入固定收益类资产，4) 考虑对冲策略，5) 定期再平衡投资组合。";
      } else if (input.toLowerCase().includes('市场周期') || input.toLowerCase().includes('market cycle')) {
        response = "基于当前数据，市场可能处于扩张阶段后期。通胀压力依然存在，央行政策转向可能影响市场。建议关注优质成长股与价值股的均衡配置，并适当增加防御性资产。";
      } else if (input.toLowerCase().includes('aapl') || input.toLowerCase().includes('msft') || input.toLowerCase().includes('apple') || input.toLowerCase().includes('microsoft')) {
        response = "AAPL和MSFT都是优质科技公司，适合长期投资。AAPL产品生态系统强大，用户粘性高；MSFT云服务业务增长迅速，企业软件领域优势明显。从多元化角度，可以两者都适当配置，但具体权重应结合您的整体投资策略决定。";
      } else if (input.toLowerCase().includes('投资组合') || input.toLowerCase().includes('portfolio')) {
        response = "我可以提供投资组合分析帮助。如果您想查看详细的投资组合分析工具，请点击右上角的"切换到仪表板"按钮，在那里您可以创建、分析和管理您的投资组合。";
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsLoading(false);
    }, 1500);
  };

  // 处理示例问题点击
  const handleExampleClick = (question: string) => {
    setInput(question);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">投资组合分析助手</h1>
        <Link 
          to="/dashboard" 
          className="px-4 py-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
          切换到仪表板
        </Link>
      </header>

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
        <div ref={messagesEndRef} />
      </div>

      {/* 初始为空时显示示例问题 */}
      {messages.length === 1 && !isLoading && (
        <div className="px-4 py-6">
          <h2 className="text-lg font-medium text-center text-gray-700 mb-4">您可以提问的示例：</h2>
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
              placeholder="输入您的投资相关问题..."
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
          投资助手可以提供分析和建议，但不构成投资建议。投资决策请咨询专业人士。
        </p>
      </div>
    </div>
  );
};

export default ChatHomePage; 