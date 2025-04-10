import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ChatHomePage } from './features/chat'
import { LanguageProvider } from './shared/i18n/LanguageContext'

const queryClient = new QueryClient()

function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* 首页路由 - 显示聊天界面 */}
            <Route path="/" element={<ChatHomePage />} />
            
            {/* 重定向其他未匹配路径到首页 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </LanguageProvider>
  )
}

export default App 