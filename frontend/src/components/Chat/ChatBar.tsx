import { useState } from 'react';

const ChatBar = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ sender: string; message: string; timestamp: string }[]>([
    { sender: 'System', message: '欢迎使用分析助手，请输入您的问题', timestamp: new Date().toLocaleTimeString() }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // 添加用户消息到历史记录
    const userMessage = {
      sender: '用户',
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setChatHistory([...chatHistory, userMessage]);
    
    // 模拟自动回复
    setTimeout(() => {
      const response = {
        sender: '系统',
        message: `已收到您的问题："${message}"。我们正在分析中...`,
        timestamp: new Date().toLocaleTimeString()
      };
      setChatHistory(prev => [...prev, response]);
    }, 1000);
    
    setMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">分析助手</h2>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        {chatHistory.map((chat, index) => (
          <div 
            key={index} 
            className={`mb-4 ${chat.sender === '用户' ? 'text-right' : 'text-left'}`}
          >
            <div 
              className={`inline-block p-3 rounded-lg ${
                chat.sender === '用户' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {chat.message}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {chat.sender} · {chat.timestamp}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="输入您的问题..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            发送
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBar; 