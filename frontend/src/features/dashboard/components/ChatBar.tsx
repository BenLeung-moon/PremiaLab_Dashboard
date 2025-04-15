import React, { useState } from 'react';
import { useLanguage } from '../../../shared/i18n/LanguageContext';

const ChatBar: React.FC = () => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ content: string; isUser: boolean }[]>([
    { content: '有关于此投资组合的问题吗？我可以帮助您分析它的表现、风险和潜在改进。', isUser: false }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 添加用户消息
    setMessages(prev => [...prev, { content: input, isUser: true }]);
    
    // 模拟AI响应
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { 
          content: `这是关于您问题"${input}"的模拟回复。在实际应用中，这里会调用AI API获取真实回答。`, 
          isUser: false 
        }
      ]);
    }, 1000);
    
    setInput('');
  };

  return (
    <div className="bg-white rounded-lg shadow-md flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium">{t('chat.aiAssistant')}</h2>
        <p className="text-sm text-gray-500">可以询问此投资组合的表现、风险或优化建议</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.isUser 
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="输入您的问题..."
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            发送
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBar; 